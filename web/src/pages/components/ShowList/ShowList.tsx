import type { Show } from '~/api/types';
import { useMediaQuery } from '~/hooks/useMediaQuery';

import { ShowCard } from '../ShowCard';
import { ShowRowCard } from '../ShowRowCard';

import styles from './ShowList.module.css';

type ShowListProps = {
  shows: Show[];
  isFavorite: (showId: number) => boolean;
  onToggleFavorite: (show: Show) => void;
  isRemoved?: (showId: number) => boolean;
};

const neverRemoved = () => false;

export const ShowList = ({
  shows,
  isFavorite,
  onToggleFavorite,
  isRemoved = neverRemoved,
}: ShowListProps) => {
  const { isDesktop } = useMediaQuery();

  return (
    <div className={styles.list}>
      {shows.map((show) =>
        isDesktop ? (
          <ShowCard
            key={show.id}
            show={show}
            isFavorite={isFavorite(show.id)}
            isRemoved={isRemoved(show.id)}
            onToggleFavorite={() => onToggleFavorite(show)}
          />
        ) : (
          <ShowRowCard
            key={show.id}
            show={show}
            isFavorite={isFavorite(show.id)}
            isRemoved={isRemoved(show.id)}
            onToggleFavorite={() => onToggleFavorite(show)}
          />
        ),
      )}
    </div>
  );
};
