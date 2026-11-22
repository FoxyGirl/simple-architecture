import { useMediaQuery } from '~/hooks/useMediaQuery';

import { ShowCard } from '../ShowCard';
import { ShowRowCard } from '../ShowRowCard';

import type { ShowListProps } from './types';

import { useShowList } from './logic/useShowList';

import styles from './ShowList.module.css';

const neverRemoved = () => false;

export const ShowList = (props: ShowListProps) => {
  const { shows, isRemoved = neverRemoved } = props;
  const { isFavorite, toggleFavorite } = useShowList(props);
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
            onToggleFavorite={() => toggleFavorite(show)}
          />
        ) : (
          <ShowRowCard
            key={show.id}
            show={show}
            isFavorite={isFavorite(show.id)}
            isRemoved={isRemoved(show.id)}
            onToggleFavorite={() => toggleFavorite(show)}
          />
        ),
      )}
    </div>
  );
};
