import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { Locator } from '@playwright/test';

/**
 * MoniNotes' "Upload from disk" menu item calls window.showOpenFilePicker()
 * (the File System Access API), not a plain <input type="file">. Confirmed by
 * manual QA on 2026-09-15: there is no file input in the DOM, and attempts to
 * intercept HTMLInputElement.prototype.click / patch window.showOpenFilePicker
 * from outside the app bundle did not work (the app appears to bind its own
 * reference before test code can run) - so Playwright's normal
 * page.setInputFiles()/filechooser flow cannot drive that menu item.
 *
 * The editor's paste handler is the reliable path instead: pasting an image
 * or file (Cmd/Ctrl+V) inserts it exactly like "Upload from disk" would, and
 * this is a real, user-facing upload path in its own right (screenshots,
 * copied files), not just a test workaround. This helper builds a File from
 * fixture bytes and dispatches a synthetic ClipboardEvent('paste') carrying
 * it in a DataTransfer, targeted at the currently focused element - the same
 * mechanism a real Cmd+V triggers, but driven headlessly with no OS clipboard
 * access required (unlike the manual QA pass, which used osascript).
 */

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
};

export async function pasteFileIntoFocusedElement(target: Locator, filePath: string): Promise<void> {
  const bytes = readFileSync(filePath);
  const base64 = bytes.toString('base64');
  const ext = extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) {
    throw new Error(`pasteFileIntoFocusedElement: no MIME mapping for extension "${ext}"`);
  }
  const fileName = filePath.split('/').pop()!;

  await target.click();
  await target.page().evaluate(
    ({ base64, mimeType, fileName }) => {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], fileName, { type: mimeType });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
      });

      (document.activeElement ?? document.body).dispatchEvent(pasteEvent);
    },
    { base64, mimeType, fileName }
  );
}
