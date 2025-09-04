import { describe, it, expect } from 'vitest';
import { AuthService } from '../../auth/auth.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';

describe('T04: AuthService basic flows', () => {
  it('signs up, logs in, and returns verifiable JWTs', () => {
    const service = new AuthService({ JWT_SECRET: 'test-secret' } as any);
    const email = 'alice@example.com';
    const password = 'password123';
    const user = service.signup(email, password);
    expect(user.email).toBe(email);
    expect(service.userCount).toBe(1);

    const { accessToken, refreshToken, user: u2 } = service.login(email, password);
    expect(u2.id).toBe(user.id);
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const jwt = new JwtStrategy({ JWT_SECRET: 'test-secret' } as any);
    const verified = jwt.verify(accessToken);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.sub).toBe(user.id);
  });

  it('prevents duplicate signup and rejects bad credentials', () => {
    const svc = new AuthService({ JWT_SECRET: 'x' } as any);
    svc.signup('bob@example.com', 'hunter2xxx');
    expect(() => svc.signup('bob@example.com', 'another')).toThrow();
    expect(() => svc.login('bob@example.com', 'wrongpass')).toThrow();
    expect(() => svc.login('nope@example.com', 'password')).toThrow();
  });
});

