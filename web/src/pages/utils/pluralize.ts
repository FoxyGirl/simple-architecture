/**
 * Picks the word form that matches `count`: the singular `singleWord` for
 * exactly one, otherwise the provided `pluralWord` or `singleWord` + 's' —
 * used wherever UI text embeds a number ("1 favorite" / "4 favorites").
 */
export const pluralize = (
  count: number,
  singleWord: string,
  pluralWord?: string,
): string => (count === 1 ? singleWord : (pluralWord ?? `${singleWord}s`));
