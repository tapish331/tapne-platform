import crypto from 'node:crypto';
import { ImageProcessor } from './image.processor';

export type PresignRequest = {
  filename: string;
  contentType: string;
};

export type PresignResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function randomHex(bytes = 6): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function extFrom(contentType: string, filename: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  if (map[contentType]) return map[contentType];
  // Fallback to filename extension if it matches a known image
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] || '';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return ext === 'jpeg' ? 'jpg' : ext;
  throw new Error('Unsupported content type');
}

export class MediaService {
  private readonly s3Endpoint: string;
  private readonly s3Bucket: string;
  private readonly cdnBaseUrl: string;

  constructor(
    env: NodeJS.ProcessEnv = process.env,
    private readonly processor: ImageProcessor = new ImageProcessor()
  ) {
    this.s3Endpoint = trimTrailingSlash(env.S3_ENDPOINT || 'https://s3.local');
    this.s3Bucket = env.S3_BUCKET || 'tapne';
    this.cdnBaseUrl = trimTrailingSlash(env.MEDIA_CDN_URL || 'https://cdn.local');
  }

  getPresignedUpload(input: PresignRequest): PresignResponse {
    const { filename, contentType } = input;
    if (!filename || !contentType) throw new Error('filename and contentType are required');
    if (!contentType.startsWith('image/')) throw new Error('Only image uploads are allowed');

    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const ext = extFrom(contentType, filename);
    const rand = randomHex(6);
    const key = `uploads/images/${yyyy}/${mm}/${dd}/${rand}.${ext}`;

    const uploadUrl = `${this.s3Endpoint}/${this.s3Bucket}/${encodeURIComponent(
      key
    )}?x-id=PutObject&content-type=${encodeURIComponent(contentType)}&X-Amz-Signature=${randomHex(16)}`;
    const publicUrl = `${this.cdnBaseUrl}/${key}`;

    return { key, uploadUrl, publicUrl };
  }

  async handleUploadWebhook(payload: { key: string }): Promise<{
    ok: true;
    key: string;
    thumbnail: { key: string; url: string };
  }> {
    if (!payload?.key) throw new Error('key is required');
    const key = payload.key.replace(/^\/+/, '');

    // Simulate reading original image bytes and processing
    const originalBytes = Buffer.from(key, 'utf8');
    await this.processor.createThumbnail(originalBytes, { width: 512, quality: 80 });

    const thumbKey = this.makeThumbKey(key);
    return {
      ok: true,
      key,
      thumbnail: { key: thumbKey, url: `${this.cdnBaseUrl}/${thumbKey}` },
    };
  }

  private makeThumbKey(key: string): string {
    const lastSlash = key.lastIndexOf('/');
    const dir = lastSlash >= 0 ? key.slice(0, lastSlash) : '';
    const base = lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
    const name = base.replace(/\.[^.]+$/, '');
    const outDir = dir.replace(/\/images(\/|$)/, '/images/thumbs$1');
    return `${outDir}/${name}-thumb.jpg`;
  }
}

