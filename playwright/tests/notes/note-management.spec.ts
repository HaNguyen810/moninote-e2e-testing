import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Cac action CRUD/organization co ban cua note, tat ca vao qua right-click
 * context menu cua list item (khong co nut hover/ellipsis nao tren list
 * item - confirm 2026-09-15, xem components/NoteContextMenu.ts).
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

  test('un-favoriting a note removes it from Favorites', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Unfavorite candidate');
    const item = freshNotesPage.noteInList('Unfavorite candidate');

    // Cung 1 menu item toggle ca 2 chieu - click "Favorite" lan thu 2 se
    // un-favorite (confirm 2026-09-17, label khong doi).
    await freshNotesPage.contextMenu.toggleFavorite(item);
    await freshNotesPage.contextMenu.toggleFavorite(item);

    await freshNotesPage.goToFavorites();
    await expect(freshNotesPage.noteInList('Unfavorite candidate')).toBeHidden();
  });

  test('un-pinning a note removes the PINNED section once it was the only pinned note', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Unpin candidate');
    const item = freshNotesPage.noteInList('Unpin candidate');

    await freshNotesPage.contextMenu.pin(item);
    await expect(freshNotesPage.pinnedSectionHeader).toBeVisible();

    // Cung 1 menu item PIN toggle ca 2 chieu, giong Favorite o tren.
    await freshNotesPage.contextMenu.pin(item);
    await expect(freshNotesPage.pinnedSectionHeader).toBeHidden();
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
