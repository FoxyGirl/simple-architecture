const SEARCH_URL = 'https://api.tvmaze.com/search/shows';

/**
 * Search TVmaze shows by title.
 *
 * @param {string} query - Title fragment to search for.
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<object[]>} Show objects, ordered by relevance.
 */
export const searchShows = async (query, { signal } = {}) => {
  const response = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`TVmaze search failed with status ${response.status}`);
  }

  const results = await response.json();

  return results.map((result) => result.show);
};
