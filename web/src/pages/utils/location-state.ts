/**
 * Read the Home URL carried in a navigation state — the Sign In and Favorites
 * entries both remember the HomePage they were opened from. A missing or
 * malformed state yields null, so callers fall back to the bare Home.
 */
export const readFromHome = (state: unknown): string | null => {
  if (typeof state !== 'object' || state === null || !('fromHome' in state)) {
    return null;
  }

  return typeof state.fromHome === 'string' ? state.fromHome : null;
};
