import { AuthService } from './auth.service';
import { validateSignUpDto } from './dto/signup.dto';
import { validateLoginDto } from './dto/login.dto';
import { defaultCookieOptions, serializeCookie } from '../../src/config/cookies';

export class AuthController {
  constructor(private readonly service: AuthService, private readonly env: NodeJS.ProcessEnv = process.env) {}

  async handle(req: import('http').IncomingMessage, res: import('http').ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/auth/signup') {
      const body = await this.readJson(req);
      validateSignUpDto(body);
      const user = this.service.signup(body.email, body.password);
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, user }));
      return true;
    }

    if (req.method === 'POST' && path === '/auth/login') {
      const body = await this.readJson(req);
      validateLoginDto(body);
      const { user, accessToken, refreshToken } = this.service.login(body.email, body.password);
      const cookieOpts = defaultCookieOptions(this.env);
      res.setHeader('Set-Cookie', [
        serializeCookie('tapne_access', accessToken, { ...cookieOpts, maxAge: 15 * 60 }),
        serializeCookie('tapne_refresh', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 }),
      ]);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, user, accessToken }));
      return true;
    }

    return false;
  }

  private async readJson(req: import('http').IncomingMessage): Promise<any> {
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

