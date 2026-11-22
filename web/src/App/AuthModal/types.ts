/**
 * The modal's inputs come from its single owner, App: a successful sign-in
 * closes the modal in place, and every dismiss path closes it without
 * touching the session.
 */
export type AuthModalProps = {
  onSignedIn: () => void;
  onClose: () => void;
};
