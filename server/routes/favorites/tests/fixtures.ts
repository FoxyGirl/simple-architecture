import type { Show } from '@server/types';

import { favoritesByEmail } from '../storage';

export const ADA = 'ada@example.com';
export const GRACE = 'grace@example.com';

export const show = (id: number): Show =>
  ({ id, name: `Show ${id}`, genres: [] as string[] }) as Show;

/** The exported storage seam: start every case from no lists at all. */
export const clearAll = (): void => {
  for (const email of Object.keys(favoritesByEmail)) {
    delete favoritesByEmail[email];
  }
};
