import { test, expect } from '@playwright/test';

// URL synchronization for the HomePage: the applied search term, genre and
// page live in `?search=&genre=&page=`. The "world" fixture serves six shows
// over two pages, four of them Drama, so genre/page steps stay stable.

const searchInput = (page) =>
  page.getByRole('textbox', { name: 'Search for TV shows' });

const card = (page, name) => page.getByRole('heading', { name });
const chip = (page, name) => page.getByRole('button', { name, exact: true });
const arrow = (page, label) => page.getByRole('button', { name: label });

const historyLength = (page) => page.evaluate(() => globalThis.history.length);

const expectDramaPageTwo = async (page) => {
  await expect(searchInput(page)).toHaveValue('world');
  await expect(chip(page, 'Drama')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'World News')).toBeVisible();
  await expect(card(page, 'World Tour')).toHaveCount(0);
};

test('a deep link renders the search, genre, page and matching results', async ({
  page,
}) => {
  await page.goto('/?search=world&genre=Drama&page=2');
  await expectDramaPageTwo(page);
});

test('a reload restores the parameterized view', async ({ page }) => {
  await page.goto('/?search=world&genre=Drama&page=2');
  await expectDramaPageTwo(page);

  await page.reload();
  await expectDramaPageTwo(page);
});

test('typing writes search after the debounce with replace semantics', async ({
  page,
}) => {
  await page.goto('/');
  const before = await historyLength(page);

  await searchInput(page).fill('world');

  // The draft is local: the URL still has no applied search.
  await expect(searchInput(page)).toHaveValue('world');
  expect(new URL(page.url()).searchParams.get('search')).toBeNull();

  await expect(card(page, 'World Tour')).toBeVisible();
  expect(new URL(page.url()).searchParams.get('search')).toBe('world');
  expect(await historyLength(page)).toBe(before);
});

test('clearing removes the search parameter and returns to idle', async ({
  page,
}) => {
  await page.goto('/?search=world');
  await expect(card(page, 'World Tour')).toBeVisible();
  const before = await historyLength(page);

  await page.getByRole('button', { name: 'Clear search' }).click();

  await expect(searchInput(page)).toHaveValue('');
  await expect(page.getByText('Search Results')).toHaveCount(0);
  await expect(page).not.toHaveURL(/search=/);
  expect(await historyLength(page)).toBe(before);
});

test('genre and page writes push history and back/forward restore state', async ({
  page,
}) => {
  await page.goto('/?search=world');
  await expect(card(page, 'World Tour')).toBeVisible();
  const base = await historyLength(page);

  await chip(page, 'Drama').click();
  await expect(page).toHaveURL(/genre=Drama/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByText('Page 1 of 2')).toBeVisible();
  expect(await historyLength(page)).toBe(base + 1);

  await arrow(page, 'Next page').click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'World News')).toBeVisible();
  expect(await historyLength(page)).toBe(base + 2);

  await page.goBack();
  await expect(page).not.toHaveURL(/page=/);
  await expect(searchInput(page)).toHaveValue('world');
  await expect(chip(page, 'Drama')).toHaveAttribute('aria-pressed', 'true');
  await expect(card(page, 'World Tour')).toBeVisible();

  await page.goForward();
  await expect(page.getByText('Page 2 of 2')).toBeVisible();
  await expect(card(page, 'World News')).toBeVisible();
});

test('invalid parameters fall back to defaults without crashing', async ({
  page,
}) => {
  await page.goto('/?search=world&page=abc');
  await expect(card(page, 'World Tour')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();

  await page.goto('/?search=world&page=0');
  await expect(card(page, 'World Tour')).toBeVisible();
  await expect(page.getByText('Page 1 of 2')).toBeVisible();

  await page.goto('/?search=world&genre=Horror');
  await expect(chip(page, 'All genres')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('6 shows found')).toBeVisible();
  await expect(page).not.toHaveURL(/genre=Horror/);
});
