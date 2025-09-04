export type UpdateTripDto = {
  id: string;
  title?: string;
  isPrivate?: boolean;
};

export function validateUpdateTripDto(input: any): asserts input is UpdateTripDto {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload');
  if (typeof input.id !== 'string' || input.id.length < 1) throw new Error('Invalid id');
  if ('title' in input && typeof input.title !== 'string') throw new Error('Invalid title');
  if ('isPrivate' in input && typeof input.isPrivate !== 'boolean') throw new Error('Invalid isPrivate');
}

