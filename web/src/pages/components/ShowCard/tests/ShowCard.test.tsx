import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { Show } from '~/types';

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

describe('ShowCard pending toggle', () => {
  afterEach(cleanup);

  it('passes the pending flag through to the disabled heart', () => {
    render(
      <ShowCard
        show={show()}
        isFavorite
        onToggleFavorite={() => {}}
        isPending
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    ).toBeDisabled();
  });
});

describe('ShowCard favorite gate', () => {
  afterEach(cleanup);

  it('renders the heart when the gate is omitted', () => {
    renderCard();

    expect(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    ).toBeVisible();
  });

  it('renders the heart when favorites are allowed', () => {
    render(
      <ShowCard
        show={show()}
        isFavorite
        onToggleFavorite={() => {}}
        canFavorite
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Remove Show One from favorites' }),
    ).toBeVisible();
  });

  it('renders no heart when favorites are not allowed', () => {
    render(
      <ShowCard
        show={show()}
        isFavorite
        onToggleFavorite={() => {}}
        canFavorite={false}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Show One' })).toBeVisible();
  });
});
