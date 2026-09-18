import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Notebooks: right-click note -> Notebooks -> Link notebooks -> Add
 * notebook -> Create -> chon no -> Done. Xem
 * NoteContextMenu.linkToNewNotebook() de biet full flow.
 */

test.describe('Notebooks', () => {
  test('a note can be linked to a newly created notebook', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Notebook candidate');

    await freshNotesPage.contextMenu.linkToNewNotebook(
      freshNotesPage.noteInList('Notebook candidate'),
      'Work Notebook'
    );

    // Ten notebook render thanh 1 dong badge rieng trong sidebar list item,
    // duoi title note - noteInList() la text matcher chung cua virtuoso-list
    // nen dung duoc o day luon, khong chi cho title note.
    await expect(freshNotesPage.noteInList('Work Notebook')).toBeVisible();
    await expect(freshNotesPage.noteInList('Notebook candidate')).toBeVisible();
  });

  test('a linked note appears when browsing Notebooks', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Notebook browse candidate');

    await freshNotesPage.contextMenu.linkToNewNotebook(
      freshNotesPage.noteInList('Notebook browse candidate'),
      'Personal Projects'
    );

    await freshNotesPage.goToNotebooks();
    await expect(freshNotesPage.noteInList('Notebook browse candidate')).toBeVisible();
  });
});

test.describe('Colors', () => {
  test('creating a color assigns it to the note and adds a sidebar collection', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Color candidate');

    // Khac voi notebook (tao xong roi chon rieng + Done), tao color se
    // tu dong apply luon vao note ngay lap tuc.
    await freshNotesPage.contextMenu.assignNewColor(
      freshNotesPage.noteInList('Color candidate'),
      'Important',
      '#FF5733'
    );

    await freshNotesPage.goToColor('Important');
    await expect(freshNotesPage.noteInList('Color candidate')).toBeVisible();
  });
});
