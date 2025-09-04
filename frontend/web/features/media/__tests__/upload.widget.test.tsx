import { describe, it, expect } from 'vitest';
import { validateImage, prepareAndUpload, simulateDrop } from '../../media/UploadImage';

describe('T21: UploadImage widget helpers', () => {
  it('validateImage enforces type and size', () => {
    const ok = validateImage({ type: 'image/png', size: 1000, name: 'p.png' });
    expect(ok.ok).toBe(true);
    const badType = validateImage({ type: 'application/pdf', size: 1000, name: 'd.pdf' });
    expect(badType.ok).toBe(false);
    const tooBig = validateImage({ type: 'image/webp', size: 10 * 1024 * 1024, name: 'x.webp' });
    expect(tooBig.ok).toBe(false);
  });

  it('prepareAndUpload orchestrates presign -> upload -> confirm via client', async () => {
    const fake = simulateDrop('photo.png', 'image/png', 1024);
    const calls: string[] = [];
    const client = {
      presignUpload: ({ filename, contentType }: { filename: string; contentType: string }) => {
        calls.push(`presign:${filename}:${contentType}`);
        return {
          key: 'uploads/images/2025/09/03/deadbeefcafe00.png',
          uploadUrl: 'https://s3.test/tapne/uploads/images/2025/09/03/deadbeefcafe00.png?sig=1',
          publicUrl: 'https://cdn.test/uploads/images/2025/09/03/deadbeefcafe00.png',
        };
      },
      uploadToUrl: async (url: string) => {
        calls.push(`put:${url}`);
      },
      confirmUpload: (key: string) => {
        calls.push(`confirm:${key}`);
        return {
          ok: true as const,
          key,
          thumbnail: {
            key: 'uploads/images/thumbs/2025/09/03/deadbeefcafe00-thumb.jpg',
            url: 'https://cdn.test/uploads/images/thumbs/2025/09/03/deadbeefcafe00-thumb.jpg',
          },
        };
      },
    };
    const res = await prepareAndUpload(fake as any, client);
    expect(res.key).toMatch(/uploads\/images\/2025\/09\/03\/deadbeefcafe00\.png/);
    expect(res.url).toBe('https://cdn.test/uploads/images/2025/09/03/deadbeefcafe00.png');
    expect(res.thumbnailUrl).toBe(
      'https://cdn.test/uploads/images/thumbs/2025/09/03/deadbeefcafe00-thumb.jpg'
    );
    expect(calls[0]).toMatch(/^presign:photo.png:image\/png$/);
    expect(calls[1]).toMatch(/^put:/);
    expect(calls[2]).toMatch(/^confirm:uploads\/images/);
  });
});

