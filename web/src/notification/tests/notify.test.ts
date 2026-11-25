import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { notify } from '..';

// The library boundary: the wrapper must delegate to Sonner's toast API
// with the message and the options it received — nothing renders here.
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
  },
}));

const options = {
  duration: 1500,
  action: { label: 'Undo', onClick: () => {} },
};

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates every message type with the message and the options', () => {
    notify.success('Saved', options);
    notify.error('Failed', options);
    notify.info('Heads up', options);
    notify.warning('Careful', options);
    notify.loading('Saving', options);

    expect(toast.success).toHaveBeenCalledWith('Saved', options);
    expect(toast.error).toHaveBeenCalledWith('Failed', options);
    expect(toast.info).toHaveBeenCalledWith('Heads up', options);
    expect(toast.warning).toHaveBeenCalledWith('Careful', options);
    expect(toast.loading).toHaveBeenCalledWith('Saving', options);
  });

  it('delegates a promise lifecycle with its messages', () => {
    const pending = Promise.resolve('done');
    const messages = {
      loading: 'Working',
      success: (value: string) => `Worked: ${value}`,
      error: (error: unknown) => `Failed: ${String(error)}`,
    };

    notify.promise(pending, messages);

    expect(toast.promise).toHaveBeenCalledWith(pending, messages);
  });
});
