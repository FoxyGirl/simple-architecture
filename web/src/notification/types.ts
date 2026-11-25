/**
 * Types of the library-independent notification API. They mirror the
 * small subset of the toast options the app actually uses, so consumers
 * never touch a Sonner type and the library stays swappable.
 */

/** An optional action button rendered inside a toast (e.g. Undo). */
export type NotifyAction = {
  label: string;
  onClick: () => void;
};

export type NotifyOptions = {
  /** Reuses or updates an existing toast with the same id. */
  id?: string | number;
  /** Per-toast override of the global auto-dismiss duration. */
  duration?: number;
  action?: NotifyAction;
};

/**
 * The lifecycle messages of `notify.promise`: the loading toast is
 * replaced by the success or error message once the promise settles; the
 * callbacks build the message from the settled value or rejection.
 */
export type NotifyPromiseMessages<T> = {
  loading: string;
  success: string | ((value: T) => string);
  error: string | ((error: unknown) => string);
};
