import type { IncomingMessage, ServerResponse } from 'node:http';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth.service';

export class EmailController {
  private readonly email: EmailService;

  constructor(auth: AuthService, env: NodeJS.ProcessEnv = process.env) {
    this.email = new EmailService(auth, env);
  }

  get service(): EmailService {
    return this.email;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/auth/email/send-verification') {
      const body = await this.readJson(req);
      const email = String(body?.email || '').toLowerCase();
      const user = this.email['auth'].getUserByEmail(email);
      let token: string | undefined;
      if (user) token = this.email.sendVerificationEmail(user);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      const expose = process.env.E2E_EXPOSE_TOKENS === '1';
      res.end(JSON.stringify(expose ? { ok: true, token } : { ok: true }));
      return true;
    }

    if (req.method === 'GET' && path === '/auth/email/verify') {
      const token = url.searchParams.get('token') || '';
      const result = this.email.verifyEmail(token);
      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return true;
    }

    if (req.method === 'POST' && path === '/auth/email/send-reset') {
      const body = await this.readJson(req);
      const email = String(body?.email || '').toLowerCase();
      const user = this.email['auth'].getUserByEmail(email);
      let token: string | undefined;
      if (user) token = this.email.sendPasswordResetEmail(user);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      const expose = process.env.E2E_EXPOSE_TOKENS === '1';
      res.end(JSON.stringify(expose ? { ok: true, token } : { ok: true }));
      return true;
    }

    if (req.method === 'POST' && path === '/auth/email/reset') {
      const body = await this.readJson(req);
      const token = String(body?.token || '');
      const newPassword = String(body?.newPassword || '');
      if (!newPassword || newPassword.length < 6) {
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'Password too short' }));
        return true;
      }
      const result = this.email.resetPassword(token, newPassword);
      res.statusCode = result.ok ? 200 : 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return true;
    }

    return false;
  }

  private async readJson(req: IncomingMessage): Promise<any> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      return JSON.parse(raw || '{}');
    } catch {
      throw new Error('Invalid JSON');
    }
  }
}
