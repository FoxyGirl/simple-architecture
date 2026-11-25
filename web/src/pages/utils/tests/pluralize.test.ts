import { describe, expect, it } from 'vitest';

import { pluralize } from '..';

describe('pluralize', () => {
  it('keeps the singular word when the count is exactly one', () => {
    expect(pluralize(1, 'show')).toBe('show');
  });

  it('appends "s" when the count is not one', () => {
    expect(pluralize(0, 'show')).toBe('shows');
    expect(pluralize(2, 'show')).toBe('shows');
  });

  it('prefers the provided plural word for irregular nouns', () => {
    expect(pluralize(1, 'person', 'people')).toBe('person');
    expect(pluralize(2, 'person', 'people')).toBe('people');
  });
});
