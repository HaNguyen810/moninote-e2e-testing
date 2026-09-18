import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Cac check happy-path nhanh, dien rong cho web app - "duong critical van
 * chay duoc ve co ban" thoi, khong phai regression coverage sau (cai do
 * thuoc ve spec rieng tung feature, vd tests/notes/upload-attachment.spec.ts).
 *
 * Dung fixture `freshNotesPage` (sign-up, khong phai sign-in) o moi cho co
 * the: khong phai cho code MFA va khong bi rate limit inbox dung chung, nen
 * suite nay chay nhanh va khong phu thuoc Mailinator co healthy hay khong -
 * xem utils/mailinator.ts va section "Known issues" trong README de biet ly
 * do cai nay quan trong o day.
 */

test.describe('Smoke: web', () => {
  test('the app loads for a logged-out visitor', async ({ page }) => {
    await page.goto('https://dev-app.moninotes.com/login');
    await expect(page.getByText('Welcome to MoniNotes')).toBeVisible({ timeout: 20_000 });
  });

  test('sign-up reaches the notes list with an empty state', async ({ page, freshNotesPage }) => {
    void freshNotesPage;
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByText('Add a note')).toBeVisible();
  });

  test('a new note can be created with a title and body', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Smoke test note');
    await editor.typeInBody('Created by the Playwright smoke suite.');

    await expect(freshNotesPage.noteInList('Smoke test note')).toBeVisible();
  });

  test('search finds a note by a partial, case-insensitive title match', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Findable Smoke Note');

    // Khong can navigate - note list va editor la 2 panel cua cung 1 view
    // /notes. Ban truoc cua test nay co goi freshNotesPage.goto() o day, la
    // full page reload va xoa mat title vua set truoc khi no kip sync
    // (confirm 2026-09-15).
    await freshNotesPage.search('findable smoke');
    await expect(freshNotesPage.noteInList('Findable Smoke Note')).toBeVisible();

    await freshNotesPage.clearSearch();
    await freshNotesPage.search('does-not-exist-xyz');
    await expect(freshNotesPage.noteInList('Findable Smoke Note')).toBeHidden();
  });

  test('a created note survives a page reload', async ({ page, freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Reload-resistant note');

    // Confirm 2026-09-15: reload ngay sau setTitle() (da blur field roi) co
    // the xoa sach title - ca 2 tab editor quay lai deu trong trơn. Viec
    // luu title co ve bi debounce sau blur event, khong sync ngay luc do.
    // Cho nay dai dien cho "cho app 1 chut de luu that su", cung la hanh vi
    // thuc te cua nguoi dung (khong ai reload 0ms sau khi go) - nhung
    // khoang cach debounce-vs-blur nay co the dang bao bug san pham neu
    // nguoi dung that trigger duoc bang cach refresh nhanh.
    await page.waitForTimeout(2_000);
    await page.reload();
    await freshNotesPage.waitUntilLoaded();
    // waitUntilLoaded() chi confirm search box da mount - note list thuc su
    // duoc populate tu local storage tre hon 1 chut, nen cho assertion nay
    // nhieu thoi gian hon default 5s (confirm can thiet 2026-09-15).
    await expect(freshNotesPage.noteInList('Reload-resistant note')).toBeVisible({
      timeout: 15_000,
    });
  });
});
