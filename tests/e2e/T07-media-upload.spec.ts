import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T07: Media upload flow', () => {
  test('presign then webhook generates a thumbnail URL', async () => {
    // Pin env so URL assertions are deterministic
    process.env.S3_ENDPOINT = 'https://s3.e2e';
    process.env.S3_BUCKET = 'tapne-e2e';
    process.env.MEDIA_CDN_URL = 'https://cdn.e2e';

    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // 1) Presign an image upload
    const presignRes = await fetch(`${baseUrl}/media/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'photo.webp', contentType: 'image/webp' }),
    });
    expect(presignRes.status).toBe(200);
    const presign = (await presignRes.json()) as {
      ok: boolean;
      key: string;
      uploadUrl: string;
      publicUrl: string;
    };
    expect(presign.ok).toBe(true);
    expect(presign.key).toMatch(/^uploads\/images\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{12}\.webp$/);
    expect(presign.uploadUrl.startsWith(`https://s3.e2e/tapne-e2e/${encodeURIComponent(presign.key)}`)).toBe(
      true
    );
    expect(presign.publicUrl).toBe(`https://cdn.e2e/${presign.key}`);

    // 2) Simulate webhook after successful upload
    const webhookRes = await fetch(`${baseUrl}/media/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: presign.key }),
    });
    expect(webhookRes.status).toBe(200);
    const webhook = (await webhookRes.json()) as {
      ok: boolean;
      key: string;
      thumbnail: { key: string; url: string };
    };
    expect(webhook.ok).toBe(true);
    expect(webhook.key).toBe(presign.key);
    // Thumb path mirrors directory with /images/thumbs and -thumb.jpg suffix
    expect(webhook.thumbnail.key).toMatch(
      /^uploads\/images\/thumbs\/\d{4}\/\d{2}\/\d{2}\/[a-f0-9]{12}-thumb\.jpg$/
    );
    expect(webhook.thumbnail.url).toBe(`https://cdn.e2e/${webhook.thumbnail.key}`);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

