/**
 * The outcome of the logout Task, returned to the account-bar presenter.
 * `'success'` means the backend ended the session and both Entities were
 * cleared; `'error'` carries the request layer's message.
 */
export type LogoutResult =
  { status: 'success' } | { status: 'error'; message: string };
