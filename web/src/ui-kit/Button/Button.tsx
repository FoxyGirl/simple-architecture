import clsx from 'clsx';

import type { ButtonProps } from './types';

import styles from './Button.module.css';

/**
 * The shared Button primitive: a presentational action that renders its
 * label, an optional decorative icon (hidden from assistive technology so
 * the accessible name stays the label) and the state it receives.
 */
export const Button = ({
  label,
  icon,
  type = 'button',
  variant = 'secondary',
  disabled = false,
  onClick,
}: ButtonProps) => (
  <button
    type={type}
    className={clsx(styles.button, styles[variant])}
    disabled={disabled}
    onClick={onClick}
  >
    {icon !== undefined ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : null}
    {label}
  </button>
);
