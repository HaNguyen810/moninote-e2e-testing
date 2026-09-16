import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Core note CRUD/organization actions, all reached via the list item's
 * right-click context menu (there is no hover/ellipsis button on a list
 * item - confirmed 2026-09-15, see components/NoteContextMenu.ts).
 */

test.describe('Note management', () => {
  test('marking a note as favorite surfaces it under Favorites', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Favorite candidate');

    await freshNotesPage.contextMenu.toggleFavorite(freshNotesPage.noteInList('Favorite candidate'));

    await freshNotesPage.goToFavorites();
    await expect(freshNotesPage.noteInList('Favorite candidate')).toBeVisible();

    await freshNotesPage.goToNotes();
    await expect(freshNotesPage.noteInList('Favorite candidate')).toBeVisible();
  });

  test('moving a note to trash removes it from Notes and lists it under Trash', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Trash candidate');

    await freshNotesPage.contextMenu.moveToTrash(freshNotesPage.noteInList('Trash candidate'));

    await freshNotesPage.goToNotes();
    await expect(freshNotesPage.noteInList('Trash candidate')).toBeHidden();

    await freshNotesPage.goToTrash();
    await expect(freshNotesPage.noteInList('Trash candidate')).toBeVisible();
  });

  test('archiving a note removes it from Notes and lists it under Archive', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Archive candidate');

    await freshNotesPage.contextMenu.archive(freshNotesPage.noteInList('Archive candidate'));

    await freshNotesPage.goToNotes();
    await expect(freshNotesPage.noteInList('Archive candidate')).toBeHidden();

    await freshNotesPage.goToArchive();
    await expect(freshNotesPage.noteInList('Archive candidate')).toBeVisible();
  });

  test('an existing note can be reopened and its title edited', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Original title');

    await freshNotesPage.noteInList('Original title').click();
    await editor.setTitle('Edited title');

    await expect(freshNotesPage.noteInList('Edited title')).toBeVisible();
    await expect(freshNotesPage.noteInList('Original title')).toBeHidden();
  });
});
