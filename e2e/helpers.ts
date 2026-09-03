/**
 * Shared Playwright helpers.
 *
 * These wrap the interaction patterns the specs repeat, so each spec contains
 * only what is unique to it.
 *
 * Selectors go through ARIA roles and strings imported from `src/locales`,
 * never CSS classes and never hardcoded copy. Two reasons: a class is a styling
 * decision that changes freely, whereas a role is part of the contract with
 * assistive technology and worth protecting; and importing the catalog means
 * rewording a button updates the tests automatically instead of breaking them.
 */
import { expect, type Browser, type Page } from '@playwright/test';

import { t } from '../src/locales';
import { SEARCH_DEBOUNCE_MS } from '../src/hooks/useDebouncedSearch';

/** Assert the current page did not bounce to an auth wall. */
export async function expectNoAuthRedirect(page: Page) {
  await expect(page).not.toHaveURL(/\/login|\/no-role/);
}

/**
 * Assert every given column header is present, scoped to `thead`.
 *
 * The scoping matters: the sort `<select>` carries `<option>` elements with the
 * same labels, so an unscoped text match passes even when the column is absent.
 */
export async function expectTableColumns(page: Page, headers: string[]) {
  await page.waitForSelector('thead th', { timeout: 15_000 });
  for (const header of headers) {
    await expect(page.locator('thead th').getByText(header, { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
  }
}

/**
 * Count real data rows, ignoring loading skeletons.
 *
 * The skeleton renders row-shaped elements too, so a plain `tbody tr` count
 * reports whatever the page happened to be showing at that instant. Waiting for
 * the skeleton to detach and counting only rows containing a link gives a
 * number that means something.
 */
export async function countDataRows(page: Page): Promise<number> {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page
    .locator('.animate-pulse')
    .first()
    .waitFor({ state: 'detached', timeout: 8_000 })
    .catch(() => {});
  return page
    .locator('tbody tr')
    .filter({ has: page.getByRole('link') })
    .count();
}

/** Wait for the search debounce plus the network round-trip it triggers. */
export async function settle(page: Page) {
  await Promise.all([
    page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {}),
    // The debounce is the one part with no observable signal to wait on — until
    // it fires there is no request in flight and nothing in the DOM has changed,
    // so `networkidle` above would resolve immediately against the *previous*
    // state. Derived from the app's own constant rather than a literal, so
    // changing the debounce cannot silently leave this too short: that used to
    // be a hardcoded 1200 against a 400ms debounce, coupled by nothing but a
    // comment.
    page.waitForTimeout(SEARCH_DEBOUNCE_MS * 3),
  ]);
}

export async function search(page: Page, term: string) {
  await page.getByRole('searchbox').fill(term);
  await settle(page);
}

/** Clear the search box via its inline button, the way a user would. */
export async function clearSearch(page: Page) {
  await page.getByRole('button', { name: t.common.clearSearch }).click();
  await settle(page);
}

export async function resetFilters(page: Page) {
  await page.getByRole('button', { name: t.buttons.resetFilters }).click();
  await settle(page);
}

/** Open the first row's detail link. Returns the id navigated to. */
export async function openFirstRowDetail(page: Page, urlPattern: RegExp): Promise<string> {
  await page.waitForSelector('tbody tr', { timeout: 15_000 });
  const firstLink = page.locator('tbody tr').first().getByRole('link').first();
  const href = await firstLink.getAttribute('href');
  await firstLink.click();
  await expect(page).toHaveURL(urlPattern, { timeout: 10_000 });
  return href?.split('/').pop() ?? '';
}

/**
 * After an implausible search, assert the page shows its empty state or renders
 * no rows — and in particular that it does neither by crashing.
 */
export async function expectEmptyOrNoRows(page: Page) {
  const emptyState = page.getByText(t.widgets.list.emptyFilteredTitle);
  const rows = page.locator('tbody tr');
  const [emptyCount, rowCount] = await Promise.all([emptyState.count(), rows.count()]);
  expect(emptyCount > 0 || rowCount === 0).toBe(true);
}

/** Sign in through the real form. Shared by every role's setup project. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(t.auth.emailPlaceholder).fill(email);
  // exact:true — the visibility-toggle button's `aria-label="Show password"`
  // otherwise ambiguously matches too: getByLabel does a case-insensitive
  // substring match by default, and "password" is a substring of
  // "Show password".
  await page.getByLabel(t.auth.passwordPlaceholder, { exact: true }).fill(password);
  await page.getByRole('button', { name: t.auth.signInButton }).click();
}

/**
 * Sign in as a given account in a brand-new, isolated browser context.
 *
 * Used by specs that need two simultaneously-live sessions in different
 * organizations (e.g. a Demo Org actor and an Acme Corp actor at once) —
 * reusing one context's cookies for a second login would just overwrite the
 * first session rather than holding both. Caller owns closing the returned
 * context.
 */
export async function loginAsNewContext(
  browser: Browser,
  email: string,
  password: string
): Promise<{ context: Awaited<ReturnType<Browser['newContext']>>; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, email, password);
  await expect(page).not.toHaveURL(/\/login|\/no-role/, { timeout: 15_000 });
  return { context, page };
}
