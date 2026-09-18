import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Rich-text formatting va block checklist. Xem FormattingToolbar va
 * NoteEditorPage.checklistItem()/toggleChecklistItem() de biet co che ben
 * duoi - cu the la checkbox checklist khong co accessible role hay form
 * control gi ca, phai click bang coordinate offset.
 */

test.describe('Formatting', () => {
  test('bold can be applied to selected text', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Bold formatting');
    await editor.typeInBody('bold text here');
    await editor.selectAllInBody();
    await editor.toolbar.bold();

    await expect
      .poll(() => editor.bodyHtml(), { timeout: 10_000 })
      .toContain('<strong>bold text here</strong>');
  });

  test('italic can be applied to selected text', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Italic formatting');
    await editor.typeInBody('italic text here');
    await editor.selectAllInBody();
    await editor.toolbar.italic();

    const html = await editor.bodyHtml();
    expect(html).toMatch(/<em>italic text here<\/em>|<i>italic text here<\/i>/);
  });

  test('underline can be applied to selected text', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Underline formatting');
    await editor.typeInBody('underline text here');
    await editor.selectAllInBody();
    await editor.toolbar.underline();

    const html = await editor.bodyHtml();
    expect(html).toMatch(/<u>underline text here<\/u>/);
  });
});

test.describe('Checklist', () => {
  test('a line can be converted to a checklist item and checked', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Checklist basics');
    await editor.focusBody();
    await editor.toolbar.convertLineToChecklist();
    await editor.typeInBody('Buy milk');

    await expect(editor.checklistItem(0)).toBeVisible();
    expect(await editor.isChecklistItemChecked(0)).toBe(false);

    await editor.toggleChecklistItem(0);
    expect(await editor.isChecklistItemChecked(0)).toBe(true);

    // Toggle lan nua se uncheck lai - confirm day la toggle that, khong
    // phai trang thai chi doi 1 chieu.
    await editor.toggleChecklistItem(0);
    expect(await editor.isChecklistItemChecked(0)).toBe(false);
  });
});
