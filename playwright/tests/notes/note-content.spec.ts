import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Edit noi dung note ngoai title: body text, tag, va duplicate. Xem
 * NoteEditorPage de biet locator/hanh vi ben duoi (vd placeholder body
 * contenteditable, field "Add a tag").
 */

test.describe('Note content', () => {
  test('editing a note body persists its content across a reload', async ({
    page,
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Body persistence check');
    await editor.typeInBody('This body text should survive a reload.');

    // Cung khoang debounce-vs-reload nhu da ghi cho title trong
    // tests/smoke/smoke.spec.ts - cho body 1 chut de luu that su truoc khi
    // reload, thay vi gia dinh chi blur/typing la du.
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

    // Confirm 2026-09-15: duplicate them " (Copy)" vao cuoi title.
    const copy = freshNotesPage.noteInList('Note to duplicate (Copy)');
    await expect(copy).toBeVisible();
    await expect(freshNotesPage.noteInList('Note to duplicate')).toBeVisible();

    await copy.click();
    await expect
      .poll(() => editor.bodyText(), { timeout: 15_000 })
      .toContain('Content that should be copied too.');
  });
});
