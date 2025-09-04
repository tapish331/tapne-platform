export type ListReviewsQuery = {
  tripId?: string;
};

export function parseListReviewsQuery(params: URLSearchParams): ListReviewsQuery {
  return { tripId: params.get('tripId') || undefined };
}

