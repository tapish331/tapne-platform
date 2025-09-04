import crypto from 'node:crypto';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string; // format: scrypt$salt$hash
  createdAt: string;
  emailVerified: boolean;
};

export type JwtPayload = {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
};

function base64url(input: Buffer | string): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export class AuthService {
  private usersByEmail = new Map<string, UserRecord>();
  private usersById = new Map<string, UserRecord>();
  private readonly jwtSecret: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.jwtSecret = env.JWT_SECRET || 'dev-secret';
  }

  get userCount(): number {
    return this.usersByEmail.size;
  }

  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [scheme, salt, hash] = stored.split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const compare = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(compare, 'hex'));
  }

  private signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, ttlSec: number): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const full: JwtPayload = { ...payload, iat: now, exp: now + ttlSec };
    const encHeader = base64url(JSON.stringify(header));
    const encPayload = base64url(JSON.stringify(full));
    const data = `${encHeader}.${encPayload}`;
    const sig = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest();
    const encSig = base64url(sig);
    return `${data}.${encSig}`;
  }

  signAccessToken(user: UserRecord, ttlSec = 15 * 60): string {
    return this.signJwt({ sub: user.id, email: user.email }, ttlSec);
  }

  signRefreshToken(user: UserRecord, ttlSec = 7 * 24 * 60 * 60): string {
    return this.signJwt({ sub: user.id, email: user.email }, ttlSec);
  }

  signup(email: string, password: string): { id: string; email: string } {
    const lower = email.toLowerCase();
    if (this.usersByEmail.has(lower)) throw new Error('User already exists');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const rec: UserRecord = {
      id,
      email: lower,
      passwordHash: this.hashPassword(password),
      createdAt: now,
      emailVerified: false,
    };
    this.usersByEmail.set(lower, rec);
    this.usersById.set(id, rec);
    return { id, email: lower };
  }

  login(email: string, password: string): {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string };
  } {
    const lower = email.toLowerCase();
    const user = this.usersByEmail.get(lower);
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: this.signRefreshToken(user),
      user: { id: user.id, email: user.email },
    };
  }

  // --- Helpers used by email flows ---
  getUserByEmail(email: string): UserRecord | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  getUserById(id: string): UserRecord | undefined {
    return this.usersById.get(id);
  }

  markEmailVerified(userId: string): void {
    const u = this.usersById.get(userId);
    if (u) u.emailVerified = true;
  }

  setPassword(userId: string, newPassword: string): void {
    const u = this.usersById.get(userId);
    if (!u) throw new Error('User not found');
    u.passwordHash = this.hashPassword(newPassword);
  }
}
