import type { ChangeEvent, FormEvent } from 'react';
import { vi } from 'vitest';

// The router surface both useSignInPage suites mock and assert against.
export const navigate = vi.fn();
export const route = { state: null as unknown };

export const change = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

export const submit = () =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>;

export const resetRouter = () => {
  navigate.mockReset();
  route.state = null;
};
