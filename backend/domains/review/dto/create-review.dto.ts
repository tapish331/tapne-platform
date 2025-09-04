export type CreateReviewDto = {
  tripId: string;
  userId: string;
  rating: number; // 1..5
  comment?: string | null;
};

export function validateCreateReviewDto(input: any): asserts input is CreateReviewDto {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload');
  if (typeof input.tripId !== 'string' || input.tripId.length < 1) throw new Error('Invalid tripId');
  if (typeof input.userId !== 'string' || input.userId.length < 1) throw new Error('Invalid userId');
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error('Invalid rating');
  if ('comment' in input && input.comment !== null && typeof input.comment !== 'string') throw new Error('Invalid comment');
}

