import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FavoriteButton } from '..';

import styles from '../FavoriteButton.module.css';

const renderButton = (isPending?: boolean) =>
  render(
    <FavoriteButton
      showName="Show One"
      isFavorite={false}
      onToggle={() => {}}
      {...(isPending === undefined ? {} : { isPending })}
    />,
  );

const button = () =>
  screen.getByRole('button', { name: 'Add Show One to favorites' });

describe('FavoriteButton pending state', () => {
  afterEach(cleanup);

  it('renders an enabled heart by default', () => {
    renderButton();

    expect(button()).toBeEnabled();
    expect(button()).not.toHaveClass(styles.disabled);
  });

  it('renders a disabled heart with the modifier while pending', () => {
    renderButton(true);

    expect(button()).toBeDisabled();
    expect(button()).toHaveClass(styles.button);
    expect(button()).toHaveClass(styles.disabled);
  });
});
