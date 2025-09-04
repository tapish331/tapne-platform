import crypto from 'node:crypto';

function b64uToBuf(input: string): Buffer {
  input = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = input.length % 4;
  if (pad) input += '='.repeat(4 - pad);
  return Buffer.from(input, 'base64');
}

export class JwtStrategy {
  private readonly secret: string;
  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.secret = env.JWT_SECRET || 'dev-secret';
  }

  verify(token: string): { valid: boolean; payload?: any; reason?: string } {
    try {
      const [encHeader, encPayload, encSig] = token.split('.');
      if (!encHeader || !encPayload || !encSig) return { valid: false, reason: 'Malformed token' };
      const data = `${encHeader}.${encPayload}`;
      const expected = crypto.createHmac('sha256', this.secret).update(data).digest();
      const got = b64uToBuf(encSig);
      if (expected.length !== got.length || !crypto.timingSafeEqual(expected, got)) {
        return { valid: false, reason: 'Bad signature' };
      }
      const payload = JSON.parse(Buffer.from(encPayload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === 'number' && payload.exp < now) {
        return { valid: false, reason: 'Expired' };
      }
      return { valid: true, payload };
    } catch (e) {
      return { valid: false, reason: (e as Error).message };
    }
  }
}

