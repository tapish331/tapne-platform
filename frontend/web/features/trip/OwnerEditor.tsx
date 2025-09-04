// Minimal owner editor helpers (T19)

export type TripDraft = {
  title: string;
  isPrivate: boolean;
};

export function emptyDraft(): TripDraft {
  return { title: '', isPrivate: false };
}

export function applyDraftPatch(draft: TripDraft, patch: Partial<TripDraft>): TripDraft {
  return {
    title: patch.title ?? draft.title,
    isPrivate: patch.isPrivate ?? draft.isPrivate,
  };
}

// T21 integration: owner cover image update via upload helpers
import { prepareAndUpload } from '../media/UploadImage';

export async function updateCoverImage(
  slug: string,
  file: Blob & { name?: string; type?: string },
  client?: any
) {
  const s = String(slug || '').trim();
  if (!s) return { ok: false as const, error: 'slug required' };
  const uploaded = await prepareAndUpload(file, client);
  return { ok: true as const, coverUrl: uploaded.url, thumbnailUrl: uploaded.thumbnailUrl };
}
