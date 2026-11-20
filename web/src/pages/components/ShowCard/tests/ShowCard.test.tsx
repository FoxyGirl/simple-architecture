import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Show } from '~/api/types';

import { ShowCard } from '..';

import styles from '../ShowCard.module.css';

const show = (): Show =>
  ({
    id: 1,
    name: 'Show One',
    genres: ['Drama'],
    premiered: '2010-05-01',
  }) as Show;

const renderCard = (isRemoved?: boolean) =>
  render(
    <ShowCard
      show={show()}
      isFavorite
      onToggleFavorite={() => {}}
      {...(isRemoved === undefined ? {} : { isRemoved })}
    />,
  );

describe('ShowCard removed state', () => {
  afterEach(cleanup);

  it('renders without the removed modifier by default', () => {
    renderCard();

    expect(screen.getByRole('article')).not.toHaveClass(styles.removed);
  });

  it('renders the removed modifier when the card is flagged', () => {
    renderCard(true);

    expect(screen.getByRole('article')).toHaveClass(styles.removed);
    expect(screen.getByRole('article')).toHaveClass(styles.card);
  });
});
