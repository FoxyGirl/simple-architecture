import { ALL_GENRES } from '../constants';

type UseGenreFilterParams = {
  genres: string[];
  activeGenre: string;
  onSelectGenre: (genre: string) => void;
};

export const useGenreFilter = ({
  genres,
  activeGenre,
  onSelectGenre,
}: UseGenreFilterParams) => ({
  // The "All genres" option leads the genres present in the result set.
  chips: [ALL_GENRES, ...genres],
  activeGenre,
  selectGenre: onSelectGenre,
});
