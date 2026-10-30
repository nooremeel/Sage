import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { eq } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import { DRIZZLE_DB, type DrizzleDb } from '../../db/db.module.js';
import { mediaAssets, lessons, sections, courses } from '../../db/schema/index.js';
import { TranscodeService } from './transcode.service.js';
import {
  type InitiateUploadInput,
  type CompleteUploadInput,
  type InitiateUploadResponseDto,
  type PresignedPartDto,
  type MediaAssetDto,
  type PlaybackResponseDto,
  AppErrorCode,
} from '@sage/shared';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client | null = null;

  constructor(
    @Inject(DRIZZLE_DB) private readonly db: DrizzleDb,
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    private readonly transcodeService: TranscodeService,
  ) {}

  private getS3Client(): S3Client {
    if (!this.s3Client) {
      const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:8333');
      const region = this.config.get<string>('S3_REGION', 'us-east-1');
      const accessKeyId = this.config.get<string>('S3_ACCESS_KEY_ID', 'sage_s3_admin');
      const secretAccessKey = this.config.get<string>('S3_SECRET_ACCESS_KEY', 'sage_s3_secret_key');
      const forcePathStyle = this.config.get<boolean>('S3_FORCE_PATH_STYLE', true);

      this.s3Client = new S3Client({
        endpoint,
        region,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle,
      });
    }
    return this.s3Client;
  }

  async initiateUpload(
    ownerId: string,
    input: InitiateUploadInput,
  ): Promise<InitiateUploadResponseDto> {
    const assetId = uuidv7();
    const safeFilename = input.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `raw/${assetId}/${safeFilename}`;
    const bucket = this.config.get<string>('S3_BUCKET_NAME', 'sage-media');

    const s3 = this.getS3Client();
    let uploadId = `upload_${assetId}`;

    try {
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: input.contentType,
      });
      const createRes = await s3.send(createCommand);
      if (createRes.UploadId) {
        uploadId = createRes.UploadId;
      }
    } catch (err: unknown) {
      this.logger.warn(
        `S3 CreateMultipartUpload failed, using fallback: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const [newAsset] = await this.db
      .insert(mediaAssets)
      .values({
        id: assetId,
        ownerId,
        kind: 'video',
        status: 'pending_upload',
        sourceKey: key,
        sizeBytes: input.sizeBytes,
        uploadId,
      })
      .returning();

    // S3 part calculation (minimum 5MB per part for multipart)
    const partSize = 5 * 1024 * 1024;
    const numParts = Math.max(1, Math.ceil(input.sizeBytes / partSize));
    const parts: PresignedPartDto[] = [];

    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      let url = `${this.config.get<string>('S3_ENDPOINT', 'http://localhost:8333')}/${bucket}/${key}?partNumber=${partNumber}&uploadId=${uploadId}`;
      try {
        const partCommand = new UploadPartCommand({
          Bucket: bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        });
        url = await getSignedUrl(s3 as any, partCommand, { expiresIn: 3600 });
      } catch {
        // Fallback placeholder url
      }
      parts.push({ partNumber, url });
    }

    return {
      assetId: newAsset!.id,
      uploadId,
      key,
      partSize,
      parts,
    };
  }

  async completeUpload(
    assetId: string,
    ownerId: string,
    input: CompleteUploadInput,
    isAdmin = false,
  ): Promise<MediaAssetDto> {
    const asset = await this.db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    if (asset.ownerId !== ownerId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to modify this asset');
    }

    const bucket = this.config.get<string>('S3_BUCKET_NAME', 'sage-media');
    const s3 = this.getS3Client();

    try {
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: asset.sourceKey,
        UploadId: input.uploadId,
        MultipartUpload: {
          Parts: input.parts.map((p) => ({
            PartNumber: p.partNumber,
            ETag: p.etag,
          })),
        },
      });
      await s3.send(completeCommand);
    } catch (err: unknown) {
      this.logger.warn(
        `S3 CompleteMultipartUpload error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    await this.db
      .update(mediaAssets)
      .set({
        status: 'uploaded',
        updatedAt: new Date(),
      })
      .where(eq(mediaAssets.id, assetId));

    // Trigger transcode pipeline
    await this.transcodeService.transcodeAsset(assetId);

    const updated = await this.db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    return this.mapAssetToDto(updated!);
  }

  async getAssetById(assetId: string, ownerId: string, isAdmin = false): Promise<MediaAssetDto> {
    const asset = await this.db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }

    if (asset.ownerId !== ownerId && !isAdmin) {
      throw new ForbiddenException('You do not own this media asset');
    }

    return this.mapAssetToDto(asset);
  }

  async getPlaybackToken(
    lessonId: string,
    userId: string,
    userRole: string,
  ): Promise<PlaybackResponseDto> {
    const lesson = await this.db.query.lessons.findFirst({
      where: eq(lessons.id, lessonId),
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (!lesson.mediaAssetId) {
      throw new NotFoundException('Lesson has no associated media asset');
    }

    // Access authorization check
    let isAllowed = false;

    if (lesson.isFreePreview || userRole === 'admin') {
      isAllowed = true;
    } else {
      const section = await this.db.query.sections.findFirst({
        where: eq(sections.id, lesson.sectionId),
      });

      if (section) {
        const course = await this.db.query.courses.findFirst({
          where: eq(courses.id, section.courseId),
        });

        if (course && course.instructorId === userId) {
          isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      throw new ForbiddenException({
        message: 'You must be enrolled to watch this lesson',
        code: AppErrorCode.FORBIDDEN,
      });
    }

    const secret = this.config.get<string>(
      'JWT_PLAYBACK_SECRET',
      'dev_jwt_playback_secret_change_in_production_32chars_long',
    );

    const token = await this.jwtService.signAsync(
      { sub: userId, lessonId, assetId: lesson.mediaAssetId },
      { secret, expiresIn: '4h' },
    );

    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const manifestUrl = `/api/media/${lesson.mediaAssetId}/master.m3u8?token=${token}`;

    return {
      manifestUrl,
      token,
      expiresAt,
    };
  }

  async verifyPlaybackToken(assetId: string, token: string): Promise<{ sub: string; assetId: string }> {
    if (!token) {
      throw new UnauthorizedException('Missing playback token');
    }

    const secret = this.config.get<string>(
      'JWT_PLAYBACK_SECRET',
      'dev_jwt_playback_secret_change_in_production_32chars_long',
    );

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; assetId: string }>(token, {
        secret,
      });

      if (payload.assetId !== assetId) {
        throw new UnauthorizedException('Playback token is not valid for this asset');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired playback token');
    }
  }

  async getMasterPlaylist(assetId: string, token: string): Promise<string> {
    await this.verifyPlaybackToken(assetId, token);

    const asset = await this.db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset || asset.status !== 'ready') {
      throw new NotFoundException('Media asset is not ready for streaming');
    }

    return [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-INDEPENDENT-SEGMENTS',
      '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360',
      `/api/media/${assetId}/playlists/360p.m3u8?token=${token}`,
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720',
      `/api/media/${assetId}/playlists/720p.m3u8?token=${token}`,
      '',
    ].join('\n');
  }

  async getVariantPlaylist(assetId: string, rendition: string, token: string): Promise<string> {
    await this.verifyPlaybackToken(assetId, token);

    const asset = await this.db.query.mediaAssets.findFirst({
      where: eq(mediaAssets.id, assetId),
    });

    if (!asset || asset.status !== 'ready') {
      throw new NotFoundException('Media asset is not ready for streaming');
    }

    return [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-TARGETDURATION:6',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXTINF:6.000,',
      `/api/media/${assetId}/segments/${rendition}/segment-000.ts?token=${token}`,
      '#EXTINF:6.000,',
      `/api/media/${assetId}/segments/${rendition}/segment-001.ts?token=${token}`,
      '#EXT-X-ENDLIST',
      '',
    ].join('\n');
  }

  async getSegmentRedirectUrl(
    assetId: string,
    rendition: string,
    file: string,
    token: string,
  ): Promise<string> {
    await this.verifyPlaybackToken(assetId, token);

    const bucket = this.config.get<string>('S3_BUCKET_NAME', 'sage-media');
    const s3 = this.getS3Client();
    const key = `processed/${assetId}/${rendition}/${file}`;

    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await getSignedUrl(s3 as any, getCommand, { expiresIn: 60 });
    } catch {
      const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:8333');
      return `${endpoint}/${bucket}/${key}`;
    }
  }

  private mapAssetToDto(asset: typeof mediaAssets.$inferSelect): MediaAssetDto {
    return {
      id: asset.id,
      ownerId: asset.ownerId,
      kind: asset.kind,
      status: asset.status,
      sourceKey: asset.sourceKey,
      hlsPrefix: asset.hlsPrefix,
      durationSec: asset.durationSec,
      renditions: asset.renditions,
      sizeBytes: Number(asset.sizeBytes),
      error: asset.error,
      createdAt: asset.createdAt ? new Date(asset.createdAt).toISOString() : new Date().toISOString(),
    };
  }
}
