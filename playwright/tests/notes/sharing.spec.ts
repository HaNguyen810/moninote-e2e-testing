import { test, expect } from '../../fixtures/auth.fixture';
import { readClipboardText } from '../../utils/clipboard';

/**
 * Note-level sharing/security actions reached via the right-click context
 * menu: Copy link and Lock. See NoteContextMenu for the underlying flows.
 */

test.describe('Copy link', () => {
  test('copies a nn://note/<id> deep link to the clipboard', async ({ page, freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Copy link candidate');

    await freshNotesPage.contextMenu.copyLink(freshNotesPage.noteInList('Copy link candidate'));

    await expect
      .poll(() => readClipboardText(page), { timeout: 10_000 })
      .toMatch(/^nn:\/\/note\/[a-f0-9]+$/);
  });
});

test.describe('Lock', () => {
  test('locking a note for the first time prompts to create a vault', async ({
    page,
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Lock candidate');

    await freshNotesPage.contextMenu.lock(freshNotesPage.noteInList('Lock candidate'));

    // This is a deeper feature (a separate vault password, distinct from
    // the account password/app-lock PIN) - only the entry point is
    // verified here, not the full vault-creation and locked-note-unlock
    // flow, which would need its own dedicated coverage.
    // "Create vault" appears twice (the dialog heading and its submit
    // button) - the description text is unique to the heading's dialog.
    await expect(
      page.getByText('Set a password to lock your private notes.')
    ).toBeVisible();
  });
});
