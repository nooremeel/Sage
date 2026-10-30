import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MediaService } from '../../src/modules/media/media.service.js';
import { TranscodeService } from '../../src/modules/media/transcode.service.js';

describe('Media Pipeline & Protected HLS Playback Suite', () => {
  let mediaService: MediaService;
  let mockDb: any;
  let mockConfig: any;
  let jwtService: JwtService;
  let mockTranscodeService: any;

  let assetsList: any[] = [];
  let lessonsList: any[] = [];
  let sectionsList: any[] = [];
  let coursesList: any[] = [];

  const secret = 'dev_playback_secret_long_enough_32_characters';

  beforeEach(() => {
    assetsList = [];
    lessonsList = [];
    sectionsList = [];
    coursesList = [];

    jwtService = new JwtService();

    mockConfig = {
      get: vi.fn((key: string, defaultVal?: unknown) => {
        if (key === 'JWT_PLAYBACK_SECRET') return secret;
        if (key === 'S3_BUCKET_NAME') return 'sage-media';
        if (key === 'S3_ENDPOINT') return 'http://localhost:8333';
        return defaultVal;
      }),
    } as unknown as ConfigService;

    mockTranscodeService = {
      transcodeAsset: vi.fn().mockImplementation(async (id: string) => {
        const a = assetsList.find((x) => x.id === id);
        if (a) {
          a.status = 'ready';
          a.renditions = [
            { resolution: '360p', width: 640, height: 360, bitrate: 800000, playlist: '360p.m3u8' },
            { resolution: '720p', width: 1280, height: 720, bitrate: 2000000, playlist: '720p.m3u8' },
          ];
        }
      }),
    };

    mockDb = {
      query: {
        mediaAssets: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || assetsList[0]?.id;
            return assetsList.find((a) => a.id === id) || null;
          },
        },
        lessons: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || lessonsList[0]?.id;
            return lessonsList.find((l) => l.id === id) || null;
          },
        },
        sections: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || sectionsList[0]?.id;
            return sectionsList.find((s) => s.id === id) || null;
          },
        },
        courses: {
          findFirst: async (opts: any) => {
            const id = opts?.where?.queryChunks?.[1]?.value || coursesList[0]?.id;
            return coursesList.find((c) => c.id === id) || null;
          },
        },
      },
      insert: () => ({
        values: (item: any) => ({
          returning: () => {
            assetsList.push(item);
            return [item];
          },
        }),
      }),
      update: () => ({
        set: (vals: any) => ({
          where: (clause: any) => {
            const id = clause?.queryChunks?.[1]?.value;
            const asset = assetsList.find((a) => a.id === id);
            if (asset) Object.assign(asset, vals);
            return Promise.resolve();
          },
        }),
      }),
    };

    mediaService = new MediaService(
      mockDb,
      mockConfig,
      jwtService,
      mockTranscodeService as TranscodeService,
    );
  });

  it('initiates resumable S3 multipart upload and generates presigned parts', async () => {
    const res = await mediaService.initiateUpload('instructor-1', {
      filename: 'lecture-1.mp4',
      sizeBytes: 15 * 1024 * 1024, // 15 MB -> 3 parts of 5 MB
      contentType: 'video/mp4',
    });

    expect(res.assetId).toBeDefined();
    expect(res.parts).toHaveLength(3);
    expect(res.uploadId).toBeDefined();
    expect(assetsList).toHaveLength(1);
    expect(assetsList[0].status).toBe('pending_upload');
  });

  it('completes multipart upload and triggers transcode pipeline', async () => {
    const initiated = await mediaService.initiateUpload('instructor-1', {
      filename: 'lecture-1.mp4',
      sizeBytes: 10 * 1024 * 1024,
      contentType: 'video/mp4',
    });

    const completed = await mediaService.completeUpload(
      initiated.assetId,
      'instructor-1',
      {
        uploadId: initiated.uploadId,
        parts: [
          { partNumber: 1, etag: '"etag-1"' },
          { partNumber: 2, etag: '"etag-2"' },
        ],
      },
    );

    expect(mockTranscodeService.transcodeAsset).toHaveBeenCalledWith(initiated.assetId);
    expect(completed.status).toBe('ready');
  });

  it('denies playback token to unenrolled student on paid lesson', async () => {
    coursesList.push({ id: 'course-1', instructorId: 'instructor-1' });
    sectionsList.push({ id: 'section-1', courseId: 'course-1' });
    lessonsList.push({
      id: 'lesson-paid',
      sectionId: 'section-1',
      isFreePreview: false,
      mediaAssetId: 'asset-1',
    });

    await expect(
      mediaService.getPlaybackToken('lesson-paid', 'student-unenrolled', 'student'),
    ).rejects.toThrow('You must be enrolled to watch this lesson');
  });

  it('grants playback token for free preview lessons even to guest / student', async () => {
    coursesList.push({ id: 'course-1', instructorId: 'instructor-1' });
    sectionsList.push({ id: 'section-1', courseId: 'course-1' });
    lessonsList.push({
      id: 'lesson-free',
      sectionId: 'section-1',
      isFreePreview: true,
      mediaAssetId: 'asset-1',
    });

    const res = await mediaService.getPlaybackToken('lesson-free', 'student-any', 'student');

    expect(res.token).toBeDefined();
    expect(res.manifestUrl).toContain('/api/media/asset-1/master.m3u8?token=');
    expect(res.expiresAt).toBeDefined();
  });

  it('grants playback token to course instructor and platform admin', async () => {
    coursesList.push({ id: 'course-1', instructorId: 'instructor-owner' });
    sectionsList.push({ id: 'section-1', courseId: 'course-1' });
    lessonsList.push({
      id: 'lesson-paid',
      sectionId: 'section-1',
      isFreePreview: false,
      mediaAssetId: 'asset-1',
    });

    const instructorRes = await mediaService.getPlaybackToken(
      'lesson-paid',
      'instructor-owner',
      'instructor',
    );
    expect(instructorRes.token).toBeDefined();

    const adminRes = await mediaService.getPlaybackToken(
      'lesson-paid',
      'admin-user',
      'admin',
    );
    expect(adminRes.token).toBeDefined();
  });

  it('serves HLS master and variant playlists when verified with signed token', async () => {
    assetsList.push({
      id: 'asset-1',
      ownerId: 'instructor-1',
      status: 'ready',
    });

    const token = await jwtService.signAsync(
      { sub: 'user-1', lessonId: 'lesson-1', assetId: 'asset-1' },
      { secret },
    );

    const masterPlaylist = await mediaService.getMasterPlaylist('asset-1', token);
    expect(masterPlaylist).toContain('#EXTM3U');
    expect(masterPlaylist).toContain('/api/media/asset-1/playlists/360p.m3u8?token=');
    expect(masterPlaylist).toContain('/api/media/asset-1/playlists/720p.m3u8?token=');

    const variantPlaylist = await mediaService.getVariantPlaylist('asset-1', '720p', token);
    expect(variantPlaylist).toContain('#EXTM3U');
    expect(variantPlaylist).toContain('/api/media/asset-1/segments/720p/segment-000.ts?token=');
  });

  it('rejects playlist or segment request if playback token is forged or expired', async () => {
    assetsList.push({
      id: 'asset-1',
      ownerId: 'instructor-1',
      status: 'ready',
    });

    const badToken = 'forged.jwt.token';

    await expect(mediaService.getMasterPlaylist('asset-1', badToken)).rejects.toThrow(
      'Invalid or expired playback token',
    );

    await expect(
      mediaService.getSegmentRedirectUrl('asset-1', '720p', 'segment-000.ts', badToken),
    ).rejects.toThrow('Invalid or expired playback token');
  });
});
