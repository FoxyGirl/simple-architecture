/**
 * The session response envelope of `POST /api/auth/login` and
 * `GET /api/auth/me` (`{ email }`) and `POST /api/auth/logout`
 * (`{ email: null }`). The frontend mirrors this shape in `web/src/types.ts`.
 */
export type AuthSession = {
  email: string | null;
};
