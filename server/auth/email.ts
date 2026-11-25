// Email-only authentication (PRD 007): the address alone identifies the
// user. The backend trims and lowercases it so `A@B.com` and `a@b.com` are
// one user and one favorites list. Validation is a minimal shape check —
// ownership verification is explicitly out of scope.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The canonical form of an address: trimmed and lowercased. */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/** Whether a (normalized) value has the shape of an email address. */
export const isEmail = (email: string): boolean => EMAIL_SHAPE.test(email);
