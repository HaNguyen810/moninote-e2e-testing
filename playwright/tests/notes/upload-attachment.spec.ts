import path from 'node:path';
import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Regression suite for the "upload image/file into a note" flow, covering the
 * PNG/GIF/JPEG/PDF x personal/enterprise matrix run manually on 2026-09-15
 * (boss's ask, prompted by an afternoon spot-check where some images failed
 * to decrypt after a backend "mio" change). Manual result at the time: all
 * *valid* files passed on both Personal and Enterprise workspaces; only a
 * deliberately malformed JPEG reproduced a failure, and it crashed the whole
 * app instead of failing the single block gracefully - see
 * NoteEditorPage.hasCrashedToErrorScreen().
 *
 * Uses `notesPage` (the fixed paid-plan account), NOT `freshNotesPage`.
 * Confirmed 2026-09-16: a fresh sign-up always lands on the Free plan,
 * which blocks all image/file storage outright ("Storage is not available
 * on this plan" paywall, the same gate as "Set expiry" - see
 * plan-gating.spec.ts) - so freshNotesPage can never exercise this flow at
 * all, not even to reproduce a failure.
 */

// __dirname doesn't exist in ESM (this package is "type": "module") - use
// import.meta.dirname instead (Node 20.11+/21.2+). Confirmed 2026-09-16:
// this crashed the whole file at import time with "__dirname is not
// defined in ES module scope", so none of its tests ever actually ran.
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

    // Reload to force a fresh decrypt from storage, not just the in-memory
    // object URL created at paste time - this is what actually caught the
    // "fails to decrypt after upload" class of bug during manual testing.
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

  // Reproduces the manual finding from 2026-09-15: pasting a malformed/
  // truncated JPEG currently crashes to a full-screen "Something went wrong /
  // Failed to load the image" error, recoverable only via "Reload app" -
  // rather than failing just that one block inline. This assertion is
  // intentionally written to describe the DESIRED behavior (graceful
  // failure) and is expected to fail until that's fixed; flip the assertion
  // (or delete this test) once the app handles it gracefully.
  expect(await editor.hasCrashedToErrorScreen()).toBe(false);
});
