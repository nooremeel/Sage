import { describe, it, expect } from 'vitest';
import {
  initiateUploadSchema,
  completeUploadSchema,
} from './media.js';

describe('Media Schemas & Validation', () => {
  it('validates a valid video upload initiation', () => {
    const input = {
      filename: 'lesson-intro.mp4',
      sizeBytes: 100 * 1024 * 1024, // 100 MB
      contentType: 'video/mp4',
    };

    const parsed = initiateUploadSchema.parse(input);
    expect(parsed.filename).toBe('lesson-intro.mp4');
    expect(parsed.sizeBytes).toBe(104857600);
    expect(parsed.contentType).toBe('video/mp4');
  });

  it('rejects unsupported mime types', () => {
    const input = {
      filename: 'document.pdf',
      sizeBytes: 5000,
      contentType: 'application/pdf',
    };

    expect(() => initiateUploadSchema.parse(input)).toThrow(
      'Unsupported file type. Allowed: MP4, MOV, WebM',
    );
  });

  it('rejects files larger than 2 GB limit', () => {
    const input = {
      filename: 'huge-video.mp4',
      sizeBytes: 3 * 1024 * 1024 * 1024, // 3 GB
      contentType: 'video/mp4',
    };

    expect(() => initiateUploadSchema.parse(input)).toThrow('Maximum file size is 2 GB');
  });

  it('validates complete multipart upload parts array', () => {
    const input = {
      uploadId: 's3-upload-id-9988',
      parts: [
        { partNumber: 1, etag: '"etag-part-1"' },
        { partNumber: 2, etag: '"etag-part-2"' },
      ],
    };

    const parsed = completeUploadSchema.parse(input);
    expect(parsed.uploadId).toBe('s3-upload-id-9988');
    expect(parsed.parts).toHaveLength(2);
  });

  it('rejects complete upload with empty parts', () => {
    const input = {
      uploadId: 's3-upload-id-9988',
      parts: [],
    };

    expect(() => completeUploadSchema.parse(input)).toThrow();
  });
});
