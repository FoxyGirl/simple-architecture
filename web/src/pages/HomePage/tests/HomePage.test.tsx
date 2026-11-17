import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HomePage } from '../index';

describe('HomePage', () => {
  it('renders the search input', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const input = screen.getByRole('textbox', { name: 'Search for TV shows' });
    await user.type(input, 'office');

    expect(input).toHaveValue('office');
  });
});
