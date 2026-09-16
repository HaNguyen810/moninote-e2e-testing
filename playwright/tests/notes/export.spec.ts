import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Export as. See NoteContextMenu.exportAs() - Markdown/Text/HTML are
 * genuine browser file downloads (Playwright's `download` event), so their
 * content can be read and asserted on directly.
 *
 * PDF is NOT covered here. Confirmed 2026-09-16: clicking it produces no
 * `download` event (waited 30s), no new page/tab, no `window.print()` call
 * (monkey-patched to check), and no PDF-related network request - the
 * click appears to be a complete no-op in headless Chromium automation.
 * This could be a real silent-failure bug, or a headless-specific
 * limitation of Chromium's print-to-PDF path that doesn't reproduce on a
 * real desktop browser - automation alone can't tell those apart here, so
 * this needs a manual check on real (non-headless) Chrome before either
 * writing a bug report or an automated test for it.
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
    // Trimmed: the export adds trailing blank lines after the body text
    // (confirmed 2026-09-16) - a cosmetic export-formatting detail, not
    // something worth asserting on exactly here.
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
