import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Menu InsertBlockMenu "+" (khac voi More -> Checklist cua FormattingToolbar,
 * da cover trong formatting.spec.ts). Xem components/InsertBlockMenu.ts de
 * biet locator nut "+" - phai tim theo cau truc DOM vi no khong co
 * title/aria-label/data-test-id gi ca.
 *
 * Table: table kich thuoc binh thuong (qua hover grid size-picker) hoat
 * dong tot. Chon kich thuoc NHO NHAT ("1 x 1") lam crash ca app - xem
 * test.fail() ben duoi va phan write-up trong InsertBlockMenu.insertTable().
 */

test.describe('Insert block menu', () => {
  test('Code block inserts an editable code block', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Code block candidate');
    await editor.focusBody();
    await editor.insertMenu.insertCodeBlock();
    await editor.typeInBody('const x = 1;');

    await expect
      .poll(() => editor.bodyHtml(), { timeout: 10_000 })
      .toContain('const x = 1;');
  });

  test.fail(
    'BUG: "Task list" in the Insert menu does not insert anything (confirmed 2026-09-17)',
    async ({ freshNotesPage }) => {
      const editor = await freshNotesPage.createNote();
      await editor.setTitle('Task list candidate');
      await editor.focusBody();
      await editor.insertMenu.insertTaskList();
      await editor.typeInBody('Buy milk');

      // Ky vong: 1 item <ul class="simple-checklist">, cung cau truc ma
      // More -> Checklist cua FormattingToolbar tao ra (xem
      // formatting.spec.ts). Thuc te: body van la 1 <p> thuong chua "Buy
      // milk" - click vao menu khong lam gi ngoai dong menu lai. Cung da
      // thu keyboard shortcut hien thi (Cmd+Shift+T) truc tiep - bi Chrome
      // tu intercept mat (mo lai tab da dong) truoc khi den duoc page, nen
      // khong dung de cross-check o day duoc. Test nay ky vong se fail cho
      // toi khi item Task list trong Insert-menu duoc fix; neu no bat dau
      // pass thi bo test.fail() di.
      expect(await editor.bodyHtml()).toContain('simple-checklist');
    },
  );

  test('a normal-sized table can be inserted', async ({ freshNotesPage, page }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Table candidate');
    await editor.focusBody();
    await editor.insertMenu.insertTable(14); // confirm la "5 x 2" (2026-09-17)
    await page.waitForTimeout(1_000);

    // Table khong phai 1 block [contenteditable="true"] thuong nhu phan
    // con lai cua body (confirm 2026-09-17 - ngay ca khi insert table
    // thanh cong cung ra 0 element nhu vay), nen check man hinh crash moi
    // la cai thuc su phan biet duoc voi bug "1 x 1" ben duoi, khong phai
    // check editability.
    expect(await editor.hasCrashedToErrorScreen()).toBe(false);
  });

  test.fail(
    'BUG: inserting the smallest ("1 x 1") table crashes the whole app (confirmed 2026-09-17)',
    async ({ freshNotesPage }) => {
      const editor = await freshNotesPage.createNote();
      await editor.setTitle('Table crash candidate');
      await editor.focusBody();
      await editor.insertMenu.insertTable(0); // o grid "1 x 1"

      // Thuc te: throw uncaught 1 ProseMirror RangeError ("Invalid content
      // for node table: <>"), va app fallback ve man hinh crash full-screen
      // "Something went wrong" - cung pattern chi-khoi-phuc-duoc-qua-Reload-
      // app nhu bug paste JPEG malformed (xem
      // NoteEditorPage.hasCrashedToErrorScreen() / upload-attachment.spec.ts).
      // Table o kich thuoc lon hon (confirm tu grid index 14, "5 x 2")
      // insert binh thuong - xem test pass o tren - nen bug nay chi gioi
      // han o edge case kich thuoc nho nhat, khong phai table noi chung.
      expect(await editor.hasCrashedToErrorScreen()).toBe(false);
    },
  );
});
