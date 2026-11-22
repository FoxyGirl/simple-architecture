// The same minimal email-shape rule the backend applies: ownership
// verification is out of scope, so an address with the right shape is enough
// to start a session.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether a value has the shape of an email address. */
export const isEmail = (value: string): boolean =>
  EMAIL_SHAPE.test(value.trim());
