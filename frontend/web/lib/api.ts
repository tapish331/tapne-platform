/**
 * Lightweight API helper for frontend tests.
 * No external dependencies; avoids fetch to keep tests deterministic.
 */

export type LoginRequest = { email: string; password: string };
export type LoginResponse = {
  ok: boolean;
  user?: { id: string; email: string };
  accessToken?: string;
  error?: string;
};

export type SignupRequest = { email: string; password: string };
export type GenericResponse = { ok: boolean; error?: string };

// Trivial in-memory stub for tests; not used in production.
const memory: { users: Map<string, { id: string; email: string; password: string }> } = {
  users: new Map(),
};

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return (crypto as any).randomUUID();
  return Math.random().toString(36).slice(2);
}

export const apiClient = {
  async login(body: LoginRequest): Promise<LoginResponse> {
    const key = body.email.toLowerCase();
    const user = memory.users.get(key);
    if (!user || user.password !== body.password) return { ok: false, error: 'Invalid credentials' };
    return { ok: true, user: { id: user.id, email: user.email }, accessToken: 'stub-token' };
  },

  async signup(body: SignupRequest): Promise<GenericResponse> {
    const key = body.email.toLowerCase();
    if (memory.users.has(key)) return { ok: false, error: 'User already exists' };
    memory.users.set(key, { id: makeId(), email: key, password: body.password });
    return { ok: true };
  },

  // Placeholders to mirror endpoints
  async sendVerification(_email: string): Promise<GenericResponse> {
    return { ok: true };
  },
  async resetPassword(_email: string): Promise<GenericResponse> {
    return { ok: true };
  },
};

export type ApiClient = typeof apiClient;

