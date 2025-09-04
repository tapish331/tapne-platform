// Minimal review form helpers (T19)

export type ReviewDraft = {
  rating: number; // 1..5
  text: string;
};

export function makeReviewDraft(init?: Partial<ReviewDraft>): ReviewDraft {
  return {
    rating: init?.rating ?? 5,
    text: init?.text ?? '',
  };
}

export function validateReview(draft: ReviewDraft): { ok: boolean; error?: string } {
  const r = Number(draft.rating);
  if (!Number.isFinite(r) || r < 1 || r > 5) return { ok: false, error: 'Rating must be 1-5' };
  if (typeof draft.text !== 'string') return { ok: false, error: 'Text must be string' };
  return { ok: true };
}

