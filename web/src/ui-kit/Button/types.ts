import type { ReactNode } from 'react';

/**
 * The visual treatments the shared Button offers: `primary` for the main
 * call to action of a form, `secondary` for compact surface actions.
 */
export type ButtonVariant = 'primary' | 'secondary';

/**
 * Presentational button props: the label, an optional decorative icon and
 * the state and handlers of its host — no business or feature knowledge.
 */
export type ButtonProps = {
  label: string;
  icon?: ReactNode;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  disabled?: boolean;
  onClick?: () => void;
};
