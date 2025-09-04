import { describe, it, expect } from 'vitest';

import LoginPage, { metadata as loginMeta } from '../../../app/account/(auth)/login/page';
import * as api from '../../../lib/api';

describe('T16: Login page + client API', () => {
  it('exports login page metadata', () => {
    expect(loginMeta).toBeDefined();
    expect(loginMeta.title).toMatch(/Login/i);
  });

  it('login page function returns a marker object', () => {
    const out = LoginPage({ children: { ok: true } } as any);
    expect(out && typeof out).toBe('object');
    expect((out as any).page).toBe('login');
  });

  it('api client exposes signup+login and performs simple flow', async () => {
    expect(typeof api.apiClient.signup).toBe('function');
    expect(typeof api.apiClient.login).toBe('function');
    const email = 'test@example.com';
    const pass = 'pw';
    const s = await api.apiClient.signup({ email, password: pass });
    expect(s.ok).toBe(true);
    const l = await api.apiClient.login({ email, password: pass });
    expect(l.ok).toBe(true);
    expect(l.user?.email).toBe(email);
    expect(typeof l.accessToken).toBe('string');
  });
});

