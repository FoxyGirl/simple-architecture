import { ALL_GENRES } from '../../constants';

// TODO: Is it Presenter or helper function?
export const useGenreFilter = (genres: string[]) => {
  return {
    chips: [ALL_GENRES, ...genres],
  };
};
