// Minimal building blocks for Home page (T17)
// Avoid JSX and React deps to keep unit tests simple and deterministic.

export type Card<T> = { kind: 'card'; data: T };

export function makeTripCard<T extends { id: string; title: string }>(t: T): Card<T> {
  return { kind: 'card', data: t };
}

export function makeProfileCard<T extends { id: string; username: string }>(p: T): Card<T> {
  return { kind: 'card', data: p };
}

export function loading(label = 'loading'): { kind: 'loading'; label: string } {
  return { kind: 'loading', label };
}

