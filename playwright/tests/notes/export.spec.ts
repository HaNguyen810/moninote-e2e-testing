import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Export as. Xem NoteContextMenu.exportAs() - Markdown/Text/HTML la file
 * download that su cua browser (event `download` cua Playwright), nen doc
 * va assert truc tiep noi dung duoc.
 *
 * PDF KHONG cover o day. Confirm 2026-09-16: click vao no khong ra event
 * `download` nao ca (cho 30s), khong mo tab/page moi, khong goi
 * `window.print()` (da monkey-patch de check), va khong co network request
 * lien quan PDF - click co ve hoan toan la no-op trong Chromium headless
 * automation. Co the la bug silent-failure that, hoac chi la gioi han rieng
 * cua path print-to-PDF cua Chromium headless khong reproduce tren browser
 * desktop that - automation don thuan khong phan biet duoc 2 kha nang nay,
 * nen can check manual tren Chrome that (khong headless) truoc khi viet bug
 * report hay test tu dong cho no.
 */

test.describe('Export as', () => {
  test('Markdown export produces a .md file with the title as an H1 and the body text', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Export candidate');
    await editor.typeInBody('Some content to export.');

    const download = await freshNotesPage.contextMenu.exportAs(
      freshNotesPage.noteInList('Export candidate'),
      'md'
    );

    expect(download.suggestedFilename()).toBe('Export-candidate.md');
    const stream = await download.createReadStream();
    let content = '';
    for await (const chunk of stream) content += chunk.toString();
    // Trim: export co them dong trong o cuoi sau body text (confirm
    // 2026-09-16) - chi la chi tiet format cosmetic, khong dang assert
    // chinh xac o day.
    expect(content.trim()).toBe('# Export candidate\n\nSome content to export.');
  });

  test('Text export produces a .txt file with the title and body text', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Export Text');
    await editor.typeInBody('Body content.');

    const download = await freshNotesPage.contextMenu.exportAs(
      freshNotesPage.noteInList('Export Text'),
      'txt'
    );

    expect(download.suggestedFilename()).toBe('Export-Text.txt');
    const stream = await download.createReadStream();
    let content = '';
    for await (const chunk of stream) content += chunk.toString();
    expect(content.trim()).toBe('Export Text\n\nBody content.');
  });

  test('HTML export produces a standalone .html file containing the body content', async ({
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Export HTML');
    await editor.typeInBody('Body content.');

    const download = await freshNotesPage.contextMenu.exportAs(
      freshNotesPage.noteInList('Export HTML'),
      'html'
    );

    expect(download.suggestedFilename()).toBe('Export-HTML.html');
    const stream = await download.createReadStream();
    let content = '';
    for await (const chunk of stream) content += chunk.toString();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Body content.');
  });
});
