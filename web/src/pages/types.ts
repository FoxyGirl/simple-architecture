/**
 * Router navigation state carried by the Favorites entry: the HomePage URL
 * it was opened from, so "Back to Home" can restore that exact view.
 */
export type FavoritesLocationState = {
  fromHome: string;
};

/**
 * Router navigation state carried by the Sign In entry: the HomePage URL the
 * `/login` entry was opened from, so either exit can restore that exact view.
 */
export type SignInLocationState = {
  fromHome: string;
};
