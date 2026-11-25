import { toast } from 'sonner';

import type { NotifyOptions, NotifyPromiseMessages } from './types';

/**
 * The library-independent notification API: every toast the app shows
 * goes through these functions, so no consumer imports Sonner directly.
 * Rendering, stacking and the auto-dismiss timing belong to the single
 * global `<Toaster />` mounted once in App.
 */
export const notify = {
  success: (message: string, options?: NotifyOptions): void => {
    toast.success(message, options);
  },
  error: (message: string, options?: NotifyOptions): void => {
    toast.error(message, options);
  },
  info: (message: string, options?: NotifyOptions): void => {
    toast.info(message, options);
  },
  warning: (message: string, options?: NotifyOptions): void => {
    toast.warning(message, options);
  },
  loading: (message: string, options?: NotifyOptions): void => {
    toast.loading(message, options);
  },
  promise: <T>(
    promise: Promise<T>,
    messages: NotifyPromiseMessages<T>,
  ): void => {
    toast.promise(promise, messages);
  },
};
