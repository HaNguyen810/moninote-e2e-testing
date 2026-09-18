import { test, expect } from '../../fixtures/auth.fixture';
import { readClipboardText } from '../../utils/clipboard';

/**
 * Cac action sharing/security cap note, vao qua right-click context menu:
 * Copy link va Lock. Xem NoteContextMenu de biet flow ben duoi.
 */

test.describe('Copy link', () => {
  test('copies a nn://note/<id> deep link to the clipboard', async ({ page, freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Copy link candidate');

    await freshNotesPage.contextMenu.copyLink(freshNotesPage.noteInList('Copy link candidate'));

    await expect
      .poll(() => readClipboardText(page), { timeout: 10_000 })
      .toMatch(/^nn:\/\/note\/[a-f0-9]+$/);
  });
});

test.describe('Lock', () => {
  const VAULT_PASSWORD = 'VaultPass123!';

  test('locking a note for the first time prompts to create a vault', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Lock candidate');
    // Can co body o day - khoa note KHONG co body content thi khong bao gio
    // hien placeholder locked, ngay ca sau khi mo lai (confirm 2026-09-17,
    // xem section Known issues cua README). Khong phai cai test nay dang
    // check, nen tranh han edge case nay thay vi workaround.
    await editor.typeInBody('Non-empty so the lock actually takes visible effect.');

    await freshNotesPage.contextMenu.lock(
      freshNotesPage.noteInList('Lock candidate'),
      VAULT_PASSWORD
    );

    // Placeholder locked co the mat vai giay moi render cho tab da mo san
    // tu luc tao lock (confirm 2026-09-17, flaky duoi tai headless - luc
    // gan nhu instant, luc 3s+) - poll thay vi check 1 lan ngay sau khi
    // lock() return.
    await expect.poll(() => editor.isLocked(), { timeout: 15_000 }).toBe(true);
  });

  test('a locked note can be unlocked with the vault password to read its content', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Unlock candidate');
    await editor.typeInBody('Secret payload that must survive lock/unlock.');

    await freshNotesPage.contextMenu.lock(
      freshNotesPage.noteInList('Unlock candidate'),
      VAULT_PASSWORD
    );
    await expect.poll(() => editor.isLocked(), { timeout: 15_000 }).toBe(true);

    await editor.unlockNote(VAULT_PASSWORD);

    await expect.poll(() => editor.isLocked(), { timeout: 10_000 }).toBe(false);
    await expect
      .poll(() => editor.bodyText(), { timeout: 10_000 })
      .toContain('Secret payload that must survive lock/unlock.');
  });

  test.fail(
    'BUG: locking a note with no body content never shows the locked placeholder (confirmed 2026-09-17)',
    async ({ freshNotesPage }) => {
      const editor = await freshNotesPage.createNote();
      await editor.setTitle('Empty lock candidate');
      // Co tinh khong co body content.

      await freshNotesPage.contextMenu.lock(
        freshNotesPage.noteInList('Empty lock candidate'),
        VAULT_PASSWORD
      );

      // Ky vong: placeholder locked giong het cac note khac (xem test o
      // tren). Thuc te: editor van o view rong "Start writing your
      // note..." binh thuong - ngay ca sau khi dong roi mo lai note - trong
      // khi sidebar list item VAN hien dung icon lock nho, chung to note
      // thuc su duoc danh dau locked o tang du lieu. Chi la lock khong
      // duoc enforce tren UI cho case khong-co-content cu the nay. Test
      // nay ky vong se fail cho toi khi duoc fix; neu no bat dau pass thi
      // bo test.fail() di.
      await expect.poll(() => editor.isLocked(), { timeout: 15_000 }).toBe(true);
    },
  );
});
