/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Optional base URL for every API request (see `web/src/api/config.ts`).
   * Unset by default: requests stay same-origin relative (`/api/...`).
   */
  readonly VITE_API_BASE_URL?: string;
}
