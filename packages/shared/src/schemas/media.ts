import { z } from 'zod';

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const;

export const MEDIA_ASSET_STATUS = [
  'pending_upload',
  'uploaded',
  'processing',
  'ready',
  'failed',
] as const;

export const MEDIA_ASSET_KINDS = ['video', 'attachment', 'image'] as const;

export type MediaAssetStatus = (typeof MEDIA_ASSET_STATUS)[number];
export type MediaAssetKind = (typeof MEDIA_ASSET_KINDS)[number];

export const initiateUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive().max(2 * 1024 * 1024 * 1024, 'Maximum file size is 2 GB'),
  contentType: z.enum(ALLOWED_VIDEO_MIME_TYPES, {
    errorMap: () => ({ message: 'Unsupported file type. Allowed: MP4, MOV, WebM' }),
  }),
});

export type InitiateUploadInput = z.infer<typeof initiateUploadSchema>;

export const uploadPartSchema = z.object({
  partNumber: z.number().int().min(1).max(10000),
  etag: z.string().min(1),
});

export const completeUploadSchema = z.object({
  uploadId: z.string().min(1),
  parts: z.array(uploadPartSchema).min(1),
});

export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;

export interface PresignedPartDto {
  partNumber: number;
  url: string;
}

export interface InitiateUploadResponseDto {
  assetId: string;
  uploadId: string;
  key: string;
  partSize: number;
  parts: PresignedPartDto[];
}

export interface MediaRendition {
  resolution: '360p' | '720p' | '1080p';
  width: number;
  height: number;
  bitrate: number;
  playlist: string;
}

export interface MediaAssetDto {
  id: string;
  ownerId: string;
  kind: MediaAssetKind;
  status: MediaAssetStatus;
  sourceKey: string;
  hlsPrefix: string | null;
  durationSec: number;
  renditions: MediaRendition[] | null;
  sizeBytes: number;
  error?: string | null;
  createdAt: string;
}

export interface PlaybackResponseDto {
  manifestUrl: string;
  token: string;
  expiresAt: string;
}
