import clsx from 'clsx';

import styles from './StatusPanel.module.css';

const VARIANT_CLASSES = {
  empty: styles.iconDiscEmpty,
  error: styles.iconDiscError,
};

export const StatusPanel = ({
  overline,
  icon: Icon,
  variant = 'empty',
  title,
  body,
  action: { icon: ActionIcon, label, onClick },
  actionAccent = false,
}) => (
  <div className={styles.panel}>
    <div className={styles.overline}>
      <span className={styles.overlineDot} />
      {overline}
    </div>

    <div className={clsx(styles.iconDisc, VARIANT_CLASSES[variant])}>
      <Icon size={34} aria-hidden="true" />
    </div>

    <h2 className={styles.title}>{title}</h2>
    <p className={styles.body}>{body}</p>

    <button
      className={clsx(styles.action, actionAccent && styles.actionAccent)}
      type="button"
      onClick={onClick}
    >
      <ActionIcon size={15} aria-hidden="true" />
      {label}
    </button>
  </div>
);
