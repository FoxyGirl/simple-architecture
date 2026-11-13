import styles from './ArrowButton.module.css';

export const ArrowButton = ({ label, icon: Icon, disabled, onClick }) => (
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
