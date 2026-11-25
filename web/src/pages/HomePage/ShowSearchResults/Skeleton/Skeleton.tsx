import { SkeletonCards } from '../../../components/SkeletonCards';
import { RESULTS_PER_PAGE } from '../constants';

import { SkeletonFilter } from './SkeletonFilter';
import { SkeletonHead } from './SkeletonHead';
import { SkeletonPagination } from './SkeletonPagination';

/** The whole results block, for a load that invalidates it (a new search). */
export const Skeleton = () => (
  <>
    <SkeletonHead />
    <SkeletonFilter />
    <SkeletonCards count={RESULTS_PER_PAGE} />
    <SkeletonPagination />
  </>
);
