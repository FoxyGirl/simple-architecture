/**
 * Parse a `page` query parameter. A missing, non-numeric, non-integer or
 * sub-1 value is the default page 1 — invalid URLs never throw.
 */
export const parsePageParam = (value: string | null): number => {
  if (value === null) return 1;

  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
};
