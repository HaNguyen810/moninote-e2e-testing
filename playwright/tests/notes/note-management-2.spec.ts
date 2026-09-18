import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Cac action quan ly note khac, tach ra tu note-management.spec.ts de file
 * do chi giu lai cac flow pho bien nhat Favorite/Archive/Trash/edit-title.
 * Cover: Pin, Read only, va cac action Restore/Delete rieng cua view Trash
 * (khac voi context menu cua view Notes - xem NoteContextMenu).
 */

test.describe('Pin and read-only', () => {
  test('pinning a note surfaces a PINNED section above the list', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Pin candidate');

    await expect(freshNotesPage.pinnedSectionHeader).toBeHidden();

    await freshNotesPage.contextMenu.pin(freshNotesPage.noteInList('Pin candidate'));

    await expect(freshNotesPage.pinnedSectionHeader).toBeVisible();
    await expect(freshNotesPage.noteInList('Pin candidate')).toBeVisible();
  });

  test('toggling read-only locks the body from editing', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Read-only candidate');
    await editor.typeInBody('This text exists before locking.');

    expect(await editor.isBodyEditable()).toBe(true);

    await freshNotesPage.contextMenu.toggleReadOnly(
      freshNotesPage.noteInList('Read-only candidate')
    );

    await expect
      .poll(() => editor.isBodyEditable(), { timeout: 10_000 })
      .toBe(false);
  });
});

test.describe('Trash: restore and permanent delete', () => {
  test('a trashed note can be restored back to Notes', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Restore candidate');

    await freshNotesPage.contextMenu.moveToTrash(freshNotesPage.noteInList('Restore candidate'));

    await freshNotesPage.goToTrash();
    await expect(freshNotesPage.noteInList('Restore candidate')).toBeVisible();

    await freshNotesPage.contextMenu.restore(freshNotesPage.noteInList('Restore candidate'));
    await expect(freshNotesPage.noteInList('Restore candidate')).toBeHidden();

    await freshNotesPage.goToNotes();
    await expect(freshNotesPage.noteInList('Restore candidate')).toBeVisible();
  });

  test('a trashed note can be permanently deleted', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Permanent delete candidate');

    await freshNotesPage.contextMenu.moveToTrash(
      freshNotesPage.noteInList('Permanent delete candidate')
    );

    await freshNotesPage.goToTrash();
    await expect(freshNotesPage.noteInList('Permanent delete candidate')).toBeVisible();

    await freshNotesPage.contextMenu.permanentlyDelete(
      freshNotesPage.noteInList('Permanent delete candidate')
    );
    await expect(freshNotesPage.noteInList('Permanent delete candidate')).toBeHidden();
  });
});
