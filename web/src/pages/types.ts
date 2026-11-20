/**
 * Router navigation state carried by the Favorites entry: the HomePage URL
 * it was opened from, so "Back to Home" can restore that exact view.
 */
export type FavoritesLocationState = {
  fromHome: string;
};
