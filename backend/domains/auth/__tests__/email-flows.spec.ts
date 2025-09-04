import { describe, it, expect } from 'vitest';
import { AuthService } from '../auth.service';
import { EmailService } from '../email/email.service';

describe('T05: Email verification & password reset', () => {
  it('issues tokens, verifies email, and resets password', () => {
    const auth = new AuthService({ JWT_SECRET: 't' } as any);
    const email = new EmailService(auth, { PUBLIC_BASE_URL: 'http://localhost:3001' } as any);

    const user = auth.signup('eve@example.com', 'initialPass1');
    // Initially unverified
    const u0 = auth.getUserById(user.id)!;
    expect(u0.emailVerified).toBe(false);

    // Send verification
    const vtoken = email.sendVerificationEmail(u0);
    expect(vtoken).toBeTypeOf('string');
    expect(email.sent.at(-1)?.kind).toBe('verify');
    expect(email.sent.at(-1)?.to).toBe('eve@example.com');

    // Verify
    const verified = email.verifyEmail(vtoken);
    expect(verified.ok).toBe(true);
    expect(verified.user?.emailVerified).toBe(true);

    // Send reset
    const rtoken = email.sendPasswordResetEmail(u0);
    expect(rtoken).toBeTypeOf('string');
    expect(email.sent.at(-1)?.kind).toBe('reset');

    // Reset password
    const reset = email.resetPassword(rtoken, 'newSecret99');
    expect(reset.ok).toBe(true);

    // Can login with new password
    const logged = auth.login('eve@example.com', 'newSecret99');
    expect(logged.user.id).toBe(user.id);
  });
});

