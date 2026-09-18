import path from 'node:path';
import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Regression suite cho flow "upload anh/file vao note", cover ma tran
 * PNG/GIF/JPEG/PDF x personal/enterprise da chay manual ngay 2026-09-15
 * (boss yeu cau, do 1 lan spot-check buoi chieu phat hien vai anh decrypt
 * loi sau khi backend doi "mio"). Ket qua manual luc do: tat ca file *hop
 * le* deu pass tren ca 2 workspace Personal va Enterprise; chi 1 file JPEG
 * co tinh lam malformed moi reproduce duoc loi, va no lam crash ca app thay
 * vi fail nhe nhang chi rieng block do - xem
 * NoteEditorPage.hasCrashedToErrorScreen().
 *
 * Dung `notesPage` (account paid-plan co dinh), KHONG dung `freshNotesPage`.
 * Confirm 2026-09-16: sign-up moi luon vao Free plan, chan het viec luu
 * anh/file ("Storage is not available on this plan" paywall, cung gate voi
 * "Set expiry" - xem plan-gating.spec.ts) - nen freshNotesPage khong bao
 * gio chay duoc flow nay, ke ca de reproduce loi.
 */

// __dirname khong ton tai trong ESM (package nay la "type": "module") -
// dung import.meta.dirname thay the (Node 20.11+/21.2+). Confirm
// 2026-09-16: truoc do ca file bi crash ngay luc import voi loi "__dirname
// is not defined in ES module scope", nen chua test nao trong file nay
// tung chay duoc.
const FIXTURES = path.join(import.meta.dirname, '..', '..', 'fixtures', 'files');

for (const [label, file] of [
  ['PNG', 'valid.png'],
  ['GIF', 'valid.gif'],
  ['JPEG', 'valid.jpg'],
] as const) {
  test(`${label} image survives paste-upload and a reload (Personal)`, async ({
    page,
    notesPage,
  }) => {
    const editor = await notesPage.createNote();
    await editor.setTitle(`QE automation - personal - ${label} paste`);
    await editor.pasteFile(path.join(FIXTURES, file));

    await expect(editor.imageBlock()).toBeVisible();
    expect(await editor.hasCrashedToErrorScreen()).toBe(false);

    // Reload de force decrypt lai tu storage, khong chi dung object URL
    // trong memory da tao luc paste - day chinh la cai bat duoc class bug
    // "decrypt loi sau khi upload" trong lan test manual.
    await page.reload();
    await expect(editor.imageBlock()).toBeVisible();
  });
}

test('PDF attachment survives upload and a reload (Personal)', async ({ page, notesPage }) => {
  const editor = await notesPage.createNote();
  await editor.setTitle('QE automation - personal - PDF paste');
  await editor.pasteFile(path.join(FIXTURES, 'sample.pdf'));

  await expect(editor.attachmentChip('sample.pdf')).toBeVisible();

  await page.reload();
  await expect(editor.attachmentChip('sample.pdf')).toBeVisible();
});

test('a malformed JPEG fails the upload without crashing the whole app', async ({ notesPage }) => {
  const editor = await notesPage.createNote();
  await editor.setTitle('QE automation - malformed JPEG');
  await editor.pasteFile(path.join(FIXTURES, 'malformed.jpg'));

  // Reproduce lai finding manual tu 2026-09-15: paste 1 JPEG malformed/bi
  // cat cut hien dang lam crash ra man hinh full-screen "Something went
  // wrong / Failed to load the image", chi khoi phuc duoc qua "Reload app"
  // - thay vi chi fail rieng 1 block do inline. Assertion nay co tinh viet
  // theo hanh vi MONG MUON (fail nhe nhang) va ky vong se fail cho toi khi
  // duoc fix; doi lai assertion (hoac xoa test nay) khi app xu ly nhe
  // nhang duoc.
  expect(await editor.hasCrashedToErrorScreen()).toBe(false);
});
