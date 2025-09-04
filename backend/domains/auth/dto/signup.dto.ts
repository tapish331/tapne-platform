export type SignUpDto = {
  email: string;
  password: string;
};

export function validateSignUpDto(input: any): asserts input is SignUpDto {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload');
  if (typeof input.email !== 'string' || !input.email.includes('@'))
    throw new Error('Invalid email');
  if (typeof input.password !== 'string' || input.password.length < 6)
    throw new Error('Password too short');
}

