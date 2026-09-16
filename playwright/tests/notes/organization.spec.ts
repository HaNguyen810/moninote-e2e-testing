import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Notebooks: right-click a note -> Notebooks -> Link notebooks -> Add
 * notebook -> Create -> select it -> Done. See
 * NoteContextMenu.linkToNewNotebook() for the full flow.
 */

test.describe('Notebooks', () => {
  test('a note can be linked to a newly created notebook', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Notebook candidate');

    await freshNotesPage.contextMenu.linkToNewNotebook(
      freshNotesPage.noteInList('Notebook candidate'),
      'Work Notebook'
    );

    // The notebook's name renders as its own badge line in the sidebar list
    // item, under the note title - noteInList() is a generic virtuoso-list
    // text matcher so it works here too, not just for note titles.
    await expect(freshNotesPage.noteInList('Work Notebook')).toBeVisible();
    await expect(freshNotesPage.noteInList('Notebook candidate')).toBeVisible();
  });
});

test.describe('Colors', () => {
  test('creating a color assigns it to the note and adds a sidebar collection', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Color candidate');

    // Unlike notebooks (create, then separately select + Done), creating a
    // color auto-applies it to the note immediately.
    await freshNotesPage.contextMenu.assignNewColor(
      freshNotesPage.noteInList('Color candidate'),
      'Important',
      '#FF5733'
    );

    await freshNotesPage.goToColor('Important');
    await expect(freshNotesPage.noteInList('Color candidate')).toBeVisible();
  });
});
