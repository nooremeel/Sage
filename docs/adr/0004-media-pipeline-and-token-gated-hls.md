# ADR 0004: Resumable S3 Multipart Uploads & Token-Gated Multi-Rendition HLS Delivery

- **Status:** Accepted
- **Date:** 2026-10-30
- **Deciders:** Nour Emil, AI Assistant

## Context and Problem Statement

Sage requires a robust media pipeline supporting large video lecture uploads (up to 2 GB) and protected video delivery without third-party iframe embeds (such as YouTube or Vimeo). The system must support Vercel serverless functions (which have execution timeouts <60s) without suffering persistent connection lockups, while enforcing strict access control against video URL leakage.

## Decision Drivers

1. **Resumable S3 Multipart Uploads:** Direct-to-storage uploads via presigned URLs without buffering multi-gigabyte video files in memory on the API server.
2. **Multi-Rendition Adaptive Bitrate (HLS):** Streaming adaptive bitrates (360p, 720p, 1080p) to optimize student viewing across varying network bandwidths in MENA and globally.
3. **Protected Token-Gated Delivery:** Access control preventing unauthorized direct links to video segments; only enrolled students, course instructors, and platform admins may stream full lectures.
4. **Serverless Dual-Execution Parity:** Heavy transcoding handled asynchronously via GitHub Actions workflow runners in production and local daemons in development.

## Considered Options

1. **Third-Party SaaS Video Host (e.g. Mux, Cloudflare Stream):** (Rejected: Requires paid subscription and credit card, violating zero-cost portfolio constraint).
2. **Direct Static S3 Presigned URLs inside Master Playlist:** (Rejected: Standard HLS players fetch playlists once; short-lived URLs inside playlists expire mid-lecture for videos longer than the token lifespan).
3. **API-Rewritten Dynamic Playlists & Redirect-Gated Segments:** (Accepted).

## Decision Outcome

1. **Multipart Upload Flow:**
   - Instructors initiate uploads via `POST /api/media/uploads`, validating mime types (`video/mp4`, `video/quicktime`, `video/webm`) and generating S3 presigned part URLs.
   - Frontend uploads chunks directly to S3-compatible storage (SeaweedFS / Backblaze B2) with progress tracking.
   - `POST /api/media/:id/complete` finalizes the S3 multipart upload and enqueues the transcoding job.

2. **Adaptive HLS Transcoding:**
   - Transcoder analyzes source codec via `ffprobe` and generates H.264 + AAC 6-second segments for 360p (800 kbps) and 720p (2,000 kbps), uploading outputs to `processed/{assetId}/`.

3. **Signed Playback Tokens & Dynamic Playlists:**
   - `GET /api/curriculum/lessons/:id/playback` validates CASL entitlement (enrolled, instructor, admin, or free preview) and issues a 4-hour HMAC-signed JWT.
   - `GET /api/media/:assetId/master.m3u8?token=...` dynamically rewrites rendition playlists.
   - `GET /api/media/:assetId/playlists/:rendition.m3u8?token=...` rewrites segment URIs to include the token.
   - `GET /api/media/:assetId/segments/:rendition/:file?token=...` verifies token validity and responds with HTTP `302 Found` to a 60-second presigned S3 object URL.

4. **Player Interface & UX:**
   - Custom `hls.js` player built with strict LTR seek controls (`dir="ltr"`), quality selector, speed modifier (0.75x–2x), position resume via local storage, and keyboard shortcuts.

## Consequences

- Direct media URLs are never exposed publicly; unentitled users cannot scrape raw video files.
- Resumable chunked uploads prevent memory exhaustion on serverless function runtimes.
- Full RTL-safe student learning experience with localized video playback.
