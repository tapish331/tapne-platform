export type CreateTripDto = {
  ownerId: string;
  title: string;
  isPrivate?: boolean;
};

export function validateCreateTripDto(input: any): asserts input is CreateTripDto {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload');
  if (typeof input.ownerId !== 'string' || input.ownerId.length < 1) throw new Error('Invalid ownerId');
  if (typeof input.title !== 'string' || input.title.trim().length < 3) throw new Error('Invalid title');
  if ('isPrivate' in input && typeof input.isPrivate !== 'boolean') throw new Error('Invalid isPrivate');
}

