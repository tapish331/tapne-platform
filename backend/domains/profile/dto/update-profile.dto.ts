export type UpdateProfileDto = {
  userId: string;
  username?: string;
  bio?: string | null;
  pronouns?: string | null;
  style?: string | null;
  showUpcomingTrips?: boolean;
  showRecentReviews?: boolean;
  showOrganizedTrips?: boolean;
  showPastAttendance?: boolean;
};

export function validateUpdateProfileDto(input: any): asserts input is UpdateProfileDto {
  if (!input || typeof input !== 'object') throw new Error('Invalid payload');
  if (typeof input.userId !== 'string' || input.userId.length < 1) throw new Error('Invalid userId');
  if ('username' in input && typeof input.username !== 'string') throw new Error('Invalid username');
  for (const k of [
    'showUpcomingTrips',
    'showRecentReviews',
    'showOrganizedTrips',
    'showPastAttendance',
  ]) {
    if (k in input && typeof (input as any)[k] !== 'boolean') throw new Error(`Invalid flag ${k}`);
  }
}

