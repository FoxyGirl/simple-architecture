import { SkeletonCard } from '../SkeletonCard';

import styles from './SkeletonCards.module.css';

type SkeletonCardsProps = {
  count: number;
};

/**
 * The cards placeholder of a loading list: one skeleton card per show slot
 * of the page, laid out in the grid ShowList uses.
 */
export const SkeletonCards = ({ count }: SkeletonCardsProps) => (
  <div className={styles.list}>
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);
