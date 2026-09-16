import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Fast, broad happy-path checks for the web app - "does the critical path
 * still basically work", not deep regression coverage (that belongs in
 * feature-specific specs, e.g. tests/notes/upload-attachment.spec.ts).
 *
 * Uses the `freshNotesPage` fixture (sign-up, not sign-in) everywhere
 * possible: no MFA code to wait for and no shared-inbox rate limiting, so
 * this suite stays fast and doesn't depend on Mailinator being healthy -
 * see utils/mailinator.ts and the README's "Known issues" section for why
 * that matters here specifically.
 */

test.describe('Smoke: web', () => {
  test('the app loads for a logged-out visitor', async ({ page }) => {
    await page.goto('https://dev-app.moninotes.com/login');
    await expect(page.getByText('Welcome to MoniNotes')).toBeVisible({ timeout: 20_000 });
  });

  test('sign-up reaches the notes list with an empty state', async ({ page, freshNotesPage }) => {
    void freshNotesPage;
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByText('Add a note')).toBeVisible();
  });

  test('a new note can be created with a title and body', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Smoke test note');
    await editor.typeInBody('Created by the Playwright smoke suite.');

    await expect(freshNotesPage.noteInList('Smoke test note')).toBeVisible();
  });

  test('search finds a note by a partial, case-insensitive title match', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Findable Smoke Note');

    // No navigation needed - the note list and editor are two panels of the
    // same /notes view. An earlier version of this test called
    // freshNotesPage.goto() here, which is a full page reload and wiped the
    // just-set title before it had synced (confirmed 2026-09-15).
    await freshNotesPage.search('findable smoke');
    await expect(freshNotesPage.noteInList('Findable Smoke Note')).toBeVisible();

    await freshNotesPage.clearSearch();
    await freshNotesPage.search('does-not-exist-xyz');
    await expect(freshNotesPage.noteInList('Findable Smoke Note')).toBeHidden();
  });

  test('a created note survives a page reload', async ({ page, freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Reload-resistant note');

    // Confirmed 2026-09-15: reloading immediately after setTitle() (which
    // already blurs the field) can wipe the title entirely - both editor
    // tabs came back completely blank. The title save appears to be
    // debounced past the blur event, not synchronous with it. This wait is
    // standing in for "give the app a moment to actually persist," which is
    // also just realistic user behavior (nobody reloads 0ms after typing) -
    // but the underlying debounce-vs-blur gap may be worth a product bug
    // report if a real user can trigger it by refreshing quickly.
    await page.waitForTimeout(2_000);
    await page.reload();
    await freshNotesPage.waitUntilLoaded();
    // waitUntilLoaded() only confirms the search box has mounted - the note
    // list itself is populated from local storage slightly after that, so
    // give this specific assertion more room than the default 5s (confirmed
    // necessary 2026-09-15).
    await expect(freshNotesPage.noteInList('Reload-resistant note')).toBeVisible({
      timeout: 15_000,
    });
  });
});
