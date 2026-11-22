/**
 * The session Entity state: the email the backend reports for the current
 * session, stored verbatim, or `null` while signed out. The backend owns the
 * identity; the client mirrors it and holds no credentials of its own (the
 * session cookie is HttpOnly). The boot-restore status and the sign-in
 * modal's state are transient UI state and stay in the Presenters.
 */
export type SessionState = {
  email: string | null;
};
