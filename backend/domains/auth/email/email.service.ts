import crypto from 'node:crypto';
import { AuthService, UserRecord } from '../auth.service';

export type EmailKinds = 'verify' | 'reset';

export type SentEmail = {
  to: string;
  subject: string;
  html: string;
  kind: EmailKinds;
  token: string;
};

type TokenRecord = {
  userId: string;
  type: 'VERIFY_EMAIL' | 'RESET_PASSWORD';
  token: string;
  expiresAt: number; // epoch ms
};

export class EmailService {
  private readonly baseUrl: string;
  private readonly tokenTtlVerify: number;
  private readonly tokenTtlReset: number;
  private tokens = new Map<string, TokenRecord>();
  public sent: SentEmail[] = [];

  constructor(private readonly auth: AuthService, env: NodeJS.ProcessEnv = process.env) {
    // Base URL where backend is reachable; used to craft links in templates
    this.baseUrl = env.PUBLIC_BASE_URL || 'http://localhost:3001';
    this.tokenTtlVerify = Number(env.VERIFY_TOKEN_TTL_SEC || 60 * 60); // 1h
    this.tokenTtlReset = Number(env.RESET_TOKEN_TTL_SEC || 15 * 60); // 15m
  }

  private genToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  private upsertToken(userId: string, type: TokenRecord['type'], ttlSec: number): string {
    const token = this.genToken();
    const rec: TokenRecord = {
      userId,
      type,
      token,
      expiresAt: Date.now() + ttlSec * 1000,
    };
    this.tokens.set(token, rec);
    return token;
  }

  sendVerificationEmail(user: UserRecord): string {
    const token = this.upsertToken(user.id, 'VERIFY_EMAIL', this.tokenTtlVerify);
    const verifyUrl = `${this.baseUrl}/auth/email/verify?token=${encodeURIComponent(token)}`;
    const subject = 'Verify your email';
    const html = this.renderTemplate('verify', { verifyUrl, email: user.email });
    this.sent.push({ to: user.email, subject, html, kind: 'verify', token });
    return token;
  }

  sendPasswordResetEmail(user: UserRecord): string {
    const token = this.upsertToken(user.id, 'RESET_PASSWORD', this.tokenTtlReset);
    const resetUrl = `${this.baseUrl}/auth/email/reset?token=${encodeURIComponent(token)}`;
    const subject = 'Reset your password';
    const html = this.renderTemplate('reset', { resetUrl, email: user.email });
    this.sent.push({ to: user.email, subject, html, kind: 'reset', token });
    return token;
  }

  verifyEmail(token: string): { ok: boolean; user?: { id: string; email: string; emailVerified: boolean } } {
    const rec = this.tokens.get(token);
    if (!rec || rec.type !== 'VERIFY_EMAIL' || rec.expiresAt < Date.now()) {
      return { ok: false };
    }
    this.tokens.delete(token);
    this.auth.markEmailVerified(rec.userId);
    const user = this.auth.getUserById(rec.userId);
    if (!user) return { ok: false };
    return { ok: true, user: { id: user.id, email: user.email, emailVerified: user.emailVerified } };
  }

  resetPassword(token: string, newPassword: string): { ok: boolean } {
    const rec = this.tokens.get(token);
    if (!rec || rec.type !== 'RESET_PASSWORD' || rec.expiresAt < Date.now()) {
      return { ok: false };
    }
    this.tokens.delete(token);
    this.auth.setPassword(rec.userId, newPassword);
    return { ok: true };
  }

  private renderTemplate(kind: EmailKinds, vars: Record<string, string>): string {
    // Simple inline templates; in a fuller app we'd read from files
    if (kind === 'verify') {
      return `<!doctype html><html><body><p>Hello ${vars.email},</p><p>Please verify your email by clicking <a href="${vars.verifyUrl}">this link</a>.</p></body></html>`;
    }
    if (kind === 'reset') {
      return `<!doctype html><html><body><p>Hello ${vars.email},</p><p>Reset your password using <a href="${vars.resetUrl}">this link</a>.</p></body></html>`;
    }
    return '';
  }
}

