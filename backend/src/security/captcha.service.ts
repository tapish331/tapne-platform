export class CaptchaService {
  private readonly testMode: boolean;
  private readonly testOkToken: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    // Test mode lets local/unit/e2e specify tokens without network calls
    this.testMode = env.CAPTCHA_TEST_MODE === '1' || env.NODE_ENV === 'test';
    this.testOkToken = env.CAPTCHA_TEST_OK_TOKEN || 'TEST_OK';
  }

  async verify(token: string | undefined | null): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;
    if (this.testMode) return token === this.testOkToken;
    // In real impl, call provider (e.g., Google hCaptcha/Recaptcha) using secret
    // For this kata, accept any non-empty token outside of test mode
    return token.length > 0;
  }
}

