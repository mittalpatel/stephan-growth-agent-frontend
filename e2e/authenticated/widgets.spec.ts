/**
 * The widgets list and detail — the worked example for every list page.
 *
 * These specs exercise the parts that are genuinely end-to-end and cannot be
 * unit-tested: that URL state survives a reload, that search/filter/sort round-
 * trip through the backend, and that the breadcrumb reads the detail page's
 * cache instead of refetching.
 *
 * Every spec tolerates an empty dataset. An e2e suite that only passes against
 * seeded data fails on a fresh database, and then gets ignored.
 */
import { test, expect } from '@playwright/test';

import { t } from '../../src/locales';
import {
  clearSearch,
  countDataRows,
  expectEmptyOrNoRows,
  expectNoAuthRedirect,
  expectTableColumns,
  openFirstRowDetail,
  resetFilters,
  search,
  settle,
} from '../helpers';

test.describe('Widgets list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/widgets');
    await expectNoAuthRedirect(page);
  });

  test('renders the toolbar and the expected columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: t.widgets.title })).toBeVisible();
    await expectTableColumns(page, [
      t.widgets.columns.name,
      t.widgets.columns.status,
      t.widgets.columns.category,
      t.widgets.columns.quantity,
    ]);
  });

  test('search writes to the URL and survives a reload', async ({ page }) => {
    await search(page, 'zzz-no-such-widget');

    // Namespaced key — this is what lets two lists coexist on one screen.
    await expect(page).toHaveURL(/widgets_search_by=zzz-no-such-widget/);
    await expectEmptyOrNoRows(page);

    await page.reload();
    await expect(page.getByRole('searchbox')).toHaveValue('zzz-no-such-widget');
  });

  test('clearing the search restores the unfiltered list', async ({ page }) => {
    const before = await countDataRows(page);
    await search(page, 'zzz-no-such-widget');
    await clearSearch(page);

    await expect(page).not.toHaveURL(/widgets_search_by=/);
    expect(await countDataRows(page)).toBe(before);
  });

  test('sorting writes both the field and the direction', async ({ page }) => {
    const sortSelect = page.getByLabel(t.common.sortBy);
    await sortSelect.selectOption('name');
    await settle(page);

    await expect(page).toHaveURL(/widgets_sort=name/);

    await page.getByRole('button', { name: t.common.sortDirection }).click();
    await settle(page);
    await expect(page).toHaveURL(/widgets_sort_direction=desc/);
  });

  test('reset clears every filter this list owns', async ({ page }) => {
    await search(page, 'anything');
    await resetFilters(page);
    await expect(page).not.toHaveURL(/widgets_search_by=/);
  });

  test('switches between table and card views', async ({ page }) => {
    await page.getByRole('button', { name: t.common.grid }).click();
    await expect(page.locator('table')).toHaveCount(0);

    await page.getByRole('button', { name: t.common.table }).click();
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('Widget detail', () => {
  test('opens from the list and shows the record', async ({ page }) => {
    await page.goto('/widgets');
    if ((await countDataRows(page)) === 0) test.skip(true, 'no seeded widgets');

    await openFirstRowDetail(page, /\/widgets\/[0-9a-f-]{36}/);
    await expect(page.getByRole('heading').first()).toBeVisible();
    await expect(page.getByText(t.widgets.columns.category)).toBeVisible();
  });

  test('breadcrumb labels the record from cache, without a second request', async ({ page }) => {
    await page.goto('/widgets');
    if ((await countDataRows(page)) === 0) test.skip(true, 'no seeded widgets');

    const rowName = await page.locator('tbody tr').first().getByRole('link').first().innerText();

    const detailRequests: string[] = [];
    page.on('request', (req) => {
      if (/\/api\/v1\/widgets\/[0-9a-f-]{36}\//.test(req.url())) detailRequests.push(req.url());
    });

    await openFirstRowDetail(page, /\/widgets\/[0-9a-f-]{36}/);
    await settle(page);

    // The breadcrumb resolver and the detail hook build their key from the same
    // `widgetDetailKey`, so the breadcrumb is a cache read. If the two ever drift
    // apart this count becomes 2 — the only visible symptom of that bug.
    await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText(rowName);
    expect(detailRequests.length).toBeLessThanOrEqual(1);
  });

  test('shows a not-found state for an unknown id rather than an error', async ({ page }) => {
    await page.goto('/widgets/00000000-0000-4000-8000-000000000000');
    await expect(page.getByText(t.widgets.detail.notFoundTitle)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: t.widgets.detail.backToList })).toBeVisible();
  });
});
