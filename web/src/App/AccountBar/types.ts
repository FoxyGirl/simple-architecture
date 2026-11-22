/** The account bar takes its Sign in handler from App, the modal's owner. */
export type AccountBarProps = {
  onSignIn: () => void;
};

/**
 * The prepared account the View renders: a guest sees the Sign in entry
 * point, a signed-in user sees the email and the Logout action.
 */
export type AccountBarAccount =
  { kind: 'guest' } | { kind: 'user'; email: string };
