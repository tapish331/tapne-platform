import { describe, it, expect } from 'vitest';

import RootLayout, { metadata } from '../app/layout';

describe('T15: Frontend bootstrap layout', () => {
  it('exports basic metadata', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBeTypeOf('string');
  });

  it('renders children passthrough without JSX', () => {
    const marker = { ok: true };
    const out = RootLayout({ children: marker } as any);
    expect(out).toBe(marker);
  });
});

