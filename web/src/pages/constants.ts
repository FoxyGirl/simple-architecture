/**
 * The favorites toast messages shared by the HomePage and the Favorites
 * page — the nearest common ancestor of both consumers owns the strings.
 * A successful add and a successful removal toast distinct messages.
 */
export const TOAST_MESSAGES = {
  ADDED: 'was added to favorites',
  REMOVED: 'was removed from favorites',
} as const;
