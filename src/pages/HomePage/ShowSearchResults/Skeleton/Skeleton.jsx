import { RESULTS_PER_PAGE } from '../constants.js';

import { SkeletonCard } from './SkeletonCard/SkeletonCard';
import { SkeletonFilter } from './SkeletonFilter/SkeletonFilter';
import { SkeletonHead } from './SkeletonHead/SkeletonHead';
import { SkeletonPagination } from './SkeletonPagination/SkeletonPagination';

import styles from './Skeleton.module.css';

const SKELETON_COUNT = RESULTS_PER_PAGE;

export const Skeleton = () => (
  <>
    <SkeletonHead />
    <SkeletonFilter />

    <div className={styles.list}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>

    <SkeletonPagination />
  </>
);
