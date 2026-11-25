export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type SearchStatus = (typeof STATUS)[keyof typeof STATUS];
