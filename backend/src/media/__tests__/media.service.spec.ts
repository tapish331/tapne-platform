import { describe, it, expect, vi } from 'vitest';
import { MediaService } from '../media.service';

describe('T07: MediaService', () => {
  it('presigns image uploads and returns S3 + CDN URLs', () => {
    const env = {
      S3_ENDPOINT: 'https://s3.test',
      S3_BUCKET: 'tapne',
      MEDIA_CDN_URL: 'https://cdn.test',
    } as NodeJS.ProcessEnv;
    const svc = new MediaService(env);
    const out = svc.getPresignedUpload({ filename: 'photo.png', contentType: 'image/png' });
    // Key format: uploads/images/YYYY/MM/DD/<hex>.png
    expect(out.key).toMatch(/^uploads\/images\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{12}\.png$/);
    expect(out.uploadUrl.startsWith(`https://s3.test/tapne/${encodeURIComponent(out.key)}`)).toBe(true);
    expect(out.publicUrl).toBe(`https://cdn.test/${out.key}`);
  });

  it('rejects non-image content types', () => {
    const svc = new MediaService({} as NodeJS.ProcessEnv);
    expect(() => svc.getPresignedUpload({ filename: 'doc.pdf', contentType: 'application/pdf' })).toThrow(
      /Only image uploads/
    );
  });

  it('webhook generates thumbnail key and URL via processor', async () => {
    const calls: Buffer[] = [];
    const fakeProcessor = {
      createThumbnail: vi.fn(async (buf: Buffer) => {
        calls.push(buf);
        return Buffer.concat([Buffer.from('THUMB:'), buf]);
      }),
    };
    const env = { MEDIA_CDN_URL: 'https://cdn.test' } as NodeJS.ProcessEnv;
    const svc = new MediaService(env, fakeProcessor as any);

    const key = 'uploads/images/2025/09/03/abcdef123456.png';
    const res = await svc.handleUploadWebhook({ key });
    expect(res.ok).toBe(true);
    expect(res.key).toBe(key);
    expect(res.thumbnail.key).toBe('uploads/images/thumbs/2025/09/03/abcdef123456-thumb.jpg');
    expect(res.thumbnail.url).toBe('https://cdn.test/uploads/images/thumbs/2025/09/03/abcdef123456-thumb.jpg');
    expect(fakeProcessor.createThumbnail).toHaveBeenCalledTimes(1);
    expect(String(calls[0])).toContain('uploads/images/2025/09/03/abcdef123456.png');
  });
});

