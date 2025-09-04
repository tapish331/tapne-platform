export function basicSlugify(input: string): string {
  const s = (input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return s || "trip";
}

/**
 * Generate a unique slug for a title. If `isTaken(slug)` returns true,
 * append a numeric suffix: `-2`, `-3`, ... until unique.
 */
export function uniqueSlug(
  title: string,
  isTaken: (slug: string) => boolean
): string {
  const base = basicSlugify(title);
  if (!isTaken(base)) return base;
  let i = 2;
  while (true) {
    const candidate = `${base}-${i}`;
    if (!isTaken(candidate)) return candidate;
    i += 1;
    // hard stop to avoid infinite loops in pathological tests
    if (i > 10000) throw new Error("Failed to generate unique slug");
  }
}

