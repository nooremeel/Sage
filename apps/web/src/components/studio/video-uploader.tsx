'use client';

import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { InitiateUploadResponseDto, MediaAssetDto } from '@sage/shared';

interface VideoUploaderProps {
  onUploadSuccess: (assetId: string) => void;
  title?: string;
}

export function VideoUploader({ onUploadSuccess, title }: VideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcoding' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      validateAndSetFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(mp4|mov|webm)$/i)) {
      setErrorMessage('Unsupported file format. Please upload MP4, MOV, or WebM.');
      return;
    }

    if (f.size > 2 * 1024 * 1024 * 1024) {
      setErrorMessage('File exceeds the 2 GB size limit.');
      return;
    }

    setErrorMessage(null);
    setFile(f);
  };

  const startUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      // 1. Initiate Multipart Upload
      const initRes = await apiClient<InitiateUploadResponseDto>('/media/uploads', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          sizeBytes: file.size,
          contentType: file.type || 'video/mp4',
        }),
      });

      const { assetId, uploadId, partSize, parts } = initRes;
      const completedParts: { partNumber: number; etag: string }[] = [];

      // 2. Upload each chunk to S3 presigned URLs
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!p) continue;

        const start = i * partSize;
        const end = Math.min(start + partSize, file.size);
        const chunk = file.slice(start, end);

        const putRes = await fetch(p.url, {
          method: 'PUT',
          body: chunk,
        });

        if (!putRes.ok) {
          throw new Error(`Failed to upload part ${p.partNumber}`);
        }

        const etag = putRes.headers.get('ETag') || `"${p.partNumber}_mock_etag"`;
        completedParts.push({ partNumber: p.partNumber, etag });

        const percent = Math.round(((i + 1) / parts.length) * 100);
        setUploadProgress(percent);
      }

      // 3. Complete Multipart Upload
      setStatus('transcoding');

      const completeRes = await apiClient<{ asset: MediaAssetDto }>(`/media/${assetId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          uploadId,
          parts: completedParts,
        }),
      });

      setStatus('ready');
      onUploadSuccess(completeRes.asset.id);
    } catch (err: unknown) {
      setStatus('error');
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check network connection.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-lg border border-border bg-card p-6 space-y-4">
      {title && (
        <h4 className="font-headline text-base font-semibold text-text text-start">
          {title}
        </h4>
      )}

      {/* Drop Area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
          file ? 'border-primary bg-primary/5' : 'border-border hover:border-text-muted hover:bg-bg-subtle'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-text-muted stroke-[1.5]" />
          <div className="text-sm font-medium text-text">
            {file ? file.name : 'Click or drag a lecture video here'}
          </div>
          <p className="text-xs text-text-muted">
            Supported: MP4, MOV, WebM (up to 2 GB)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-danger bg-danger/10 rounded-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress & Status */}
      {status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Uploading chunks to storage...</span>
            <span className="font-mono font-semibold">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'transcoding' && (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Processing & generating multi-rendition HLS (360p & 720p)...</span>
        </div>
      )}

      {status === 'ready' && (
        <div className="flex items-center gap-2 p-3 text-xs text-success bg-success/10 rounded-md">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Video processed and ready for protected HLS streaming.</span>
        </div>
      )}

      {/* Actions */}
      {file && status !== 'uploading' && status !== 'transcoding' && status !== 'ready' && (
        <button
          onClick={startUpload}
          className="w-full py-2.5 rounded-md bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors focus-ring"
        >
          Upload & Transcode Video
        </button>
      )}
    </div>
  );
}
