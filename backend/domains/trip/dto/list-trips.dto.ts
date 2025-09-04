export type ListTripsQuery = {
  page?: string;
  pageSize?: string;
  sort?: 'createdAt' | 'title' | string;
  order?: 'asc' | 'desc' | string;
  ownerId?: string;
  includePrivateForOwnerId?: string;
  excludeBlockedForUserId?: string;
};

export function parseListTripsQuery(input: URLSearchParams): ListTripsQuery {
  return {
    page: input.get('page') || undefined,
    pageSize: input.get('pageSize') || undefined,
    sort: (input.get('sort') as any) || undefined,
    order: (input.get('order') as any) || undefined,
    ownerId: input.get('ownerId') || undefined,
    includePrivateForOwnerId: input.get('includePrivateForOwnerId') || undefined,
    excludeBlockedForUserId: input.get('excludeBlockedForUserId') || undefined,
  };
}
