/**
 * The in-session search state: the last search that succeeded, with the
 * genre/page selection it was made with. It outlives the HomePage unmount
 * within the app session so returning to the page can restore the view; a
 * fresh app start has none. Presentation status and the query being typed
 * stay in the Presenter — this is application data only.
 */
export type SearchSession = {
  query: string;
  genre: string;
  page: number;
};
