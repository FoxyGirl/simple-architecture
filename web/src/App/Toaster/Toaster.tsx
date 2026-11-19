import { Toaster as SonnerToaster } from 'sonner';

import styles from './Toaster.module.css';

const NOTIFY_DURATION_MS = 3000;

export const Toaster = () => (
  <SonnerToaster
    position="bottom-center"
    theme="dark"
    duration={NOTIFY_DURATION_MS}
    richColors
    toastOptions={{
      className: styles.toast,
      // Sonner hardcodes the toast box-shadow in its runtime-injected
      // stylesheet; an inline style is the one override that always wins.
      style: { boxShadow: 'var(--shadow-card)' },
    }}
  />
);
