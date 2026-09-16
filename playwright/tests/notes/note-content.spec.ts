import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Note content editing beyond the title: body text, tags, and duplication.
 * See NoteEditorPage for the underlying locators/behavior notes (e.g. the
 * contenteditable body placeholder, the "Add a tag" field).
 */

test.describe('Note content', () => {
  test('editing a note body persists its content across a reload', async ({
    page,
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Body persistence check');
    await editor.typeInBody('This body text should survive a reload.');

    // Same debounce-vs-reload gap documented for the title in
    // tests/smoke/smoke.spec.ts - give the body a moment to actually save
    // before reloading, rather than assuming blur/typing alone is enough.
    await page.waitForTimeout(2_000);
    await page.reload();
    await freshNotesPage.waitUntilLoaded();

    await freshNotesPage.noteInList('Body persistence check').click();
    await expect
      .poll(() => editor.bodyText(), { timeout: 15_000 })
      .toContain('This body text should survive a reload.');
  });

  test('a tag can be added to a note', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Tag me');
    await editor.addTag('smoketesttag');

    await expect(editor.tagChip('smoketesttag')).toBeVisible();
  });

  test('duplicating a note creates a copy with the same body content', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Note to duplicate');
    await editor.typeInBody('Content that should be copied too.');

    await freshNotesPage.contextMenu.duplicate(freshNotesPage.noteInList('Note to duplicate'));

    // Confirmed 2026-09-15: duplicate appends " (Copy)" to the title.
    const copy = freshNotesPage.noteInList('Note to duplicate (Copy)');
    await expect(copy).toBeVisible();
    await expect(freshNotesPage.noteInList('Note to duplicate')).toBeVisible();

    await copy.click();
    await expect
      .poll(() => editor.bodyText(), { timeout: 15_000 })
      .toContain('Content that should be copied too.');
  });
});
