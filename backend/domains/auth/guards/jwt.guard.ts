import { JwtStrategy } from '../strategies/jwt.strategy';

export function isAuthenticated(req: import('http').IncomingMessage, env: NodeJS.ProcessEnv = process.env): boolean {
  const auth = req.headers['authorization'];
  if (!auth || Array.isArray(auth)) return false;
  const m = /^Bearer\s+(.+)$/.exec(auth);
  if (!m) return false;
  const token = m[1];
  const jwt = new JwtStrategy(env);
  const { valid } = jwt.verify(token);
  return valid;
}

