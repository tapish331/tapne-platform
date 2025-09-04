import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T21: Upload UI presence + integrations', () => {
  test('media upload files exist with expected exports and references', async () => {
    const files = [
      'frontend/web/features/media/UploadImage.tsx',
      'frontend/web/lib/server/media.client.ts',
      'frontend/web/features/profile/Hero.tsx',
      'frontend/web/features/trip/OwnerEditor.tsx',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const upload = readFileSync('frontend/web/features/media/UploadImage.tsx', 'utf8');
    expect(upload).toMatch(/export\s+function\s+validateImage/);
    expect(upload).toMatch(/export\s+async\s+function\s+prepareAndUpload/);
    expect(upload).toMatch(/export\s+function\s+simulateDrop/);

    const client = readFileSync('frontend/web/lib/server/media.client.ts', 'utf8');
    expect(client).toMatch(/export\s+function\s+presignUpload/);
    expect(client).toMatch(/export\s+async\s+function\s+uploadToUrl/);
    expect(client).toMatch(/export\s+function\s+confirmUpload/);
    expect(client).toMatch(/export\s+const\s+defaultClient/);

    const hero = readFileSync('frontend/web/features/profile/Hero.tsx', 'utf8');
    expect(hero).toMatch(/updateProfilePhoto/);
    expect(hero).toMatch(/prepareAndUpload/);

    const editor = readFileSync('frontend/web/features/trip/OwnerEditor.tsx', 'utf8');
    expect(editor).toMatch(/updateCoverImage/);
    expect(editor).toMatch(/prepareAndUpload/);
  });
});

