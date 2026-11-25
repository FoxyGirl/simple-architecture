import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import styles from '../Button.module.css';
import { Button } from '../Button';

afterEach(cleanup);

const icon = () => <svg data-testid="icon" viewBox="0 0 16 16" />;

describe('Button', () => {
  it('renders the label as the accessible name and defaults to type button', () => {
    render(<Button label="Continue" />);

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass(styles.button);
    expect(button).toHaveClass(styles.secondary);
  });

  it('renders an optional icon as decorative without changing the accessible name', () => {
    render(<Button label="Sign in" icon={icon()} />);

    const button = screen.getByRole('button', { name: 'Sign in' });
    const wrapper = screen.getByTestId('icon').closest('[aria-hidden="true"]');

    expect(wrapper).not.toBeNull();
    expect(wrapper?.parentElement).toBe(button);
  });

  it('supports a submit type and the primary variant', () => {
    render(<Button label="Continue" type="submit" variant="primary" />);

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveClass(styles.button);
    expect(button).toHaveClass(styles.primary);
    expect(button).not.toHaveClass(styles.secondary);
  });

  it('propagates the disabled state and swallows clicks', () => {
    const onClick = vi.fn();
    render(<Button label="Continue" disabled onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls the click handler while enabled', () => {
    const onClick = vi.fn();
    render(<Button label="Continue" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
