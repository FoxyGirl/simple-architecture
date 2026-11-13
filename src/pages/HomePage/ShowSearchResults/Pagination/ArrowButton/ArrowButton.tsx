import type { LucideIcon } from 'lucide-react';

import styles from './ArrowButton.module.css';

interface ArrowButtonProps {
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
}

export const ArrowButton = ({
  label,
  icon: Icon,
  disabled,
  onClick,
}: ArrowButtonProps) => (
  <button
    className={styles.arrow}
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
  >
    <Icon className={styles.arrowIcon} aria-hidden="true" />
  </button>
);
