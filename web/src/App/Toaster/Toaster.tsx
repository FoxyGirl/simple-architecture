import { Toaster as SonnerToaster } from 'sonner';

import styles from './Toaster.module.css';

const NOTIFY_DURATION_MS = 3000;

// The sticky AccountBar is 56px tall; Sonner's 24px desktop / 16px mobile
// defaults are shifted 30px down so the toasts sit at the header's bottom edge.
export const Toaster = () => (
  <SonnerToaster
    position="top-right"
    theme="dark"
    duration={NOTIFY_DURATION_MS}
    richColors
    offset={{ top: 54 }}
    mobileOffset={{ top: 46 }}
    toastOptions={{
      className: styles.toast,
      // Sonner hardcodes the toast box-shadow in its runtime-injected
      // stylesheet; an inline style is the one override that always wins.
      style: { boxShadow: 'var(--shadow-card)' },
    }}
  />
);
