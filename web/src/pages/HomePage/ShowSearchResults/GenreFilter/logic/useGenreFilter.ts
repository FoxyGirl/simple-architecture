import { ALL_GENRES } from '../../constants';

export const useGenreFilter = (genres: string[]) => {
  return {
    chips: [ALL_GENRES, ...genres],
  };
};
