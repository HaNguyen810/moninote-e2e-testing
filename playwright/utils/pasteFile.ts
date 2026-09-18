import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { Locator } from '@playwright/test';

/**
 * Menu "Upload from disk" cua MoniNotes goi window.showOpenFilePicker()
 * (File System Access API), khong phai <input type="file"> binh thuong.
 * Confirm boi manual QA ngay 2026-09-15: khong co file input nao trong DOM,
 * va thu intercept HTMLInputElement.prototype.click / patch
 * window.showOpenFilePicker tu ben ngoai app bundle khong an thua (app hinh
 * nhu da bind reference rieng truoc khi test code kip chay) - nen flow binh
 * thuong cua Playwright page.setInputFiles()/filechooser khong drive duoc menu nay.
 *
 * Paste handler cua editor la duong di dang tin cay hon: paste 1 anh hoac
 * file (Cmd/Ctrl+V) insert giong het nhu "Upload from disk", va day cung la
 * 1 duong upload that su nguoi dung hay dung (screenshot, file copy), khong
 * phai chi la workaround cho test. Helper nay build 1 File tu bytes cua
 * fixture roi dispatch 1 ClipboardEvent('paste') gia lap, mang file do trong
 * DataTransfer, nham vao element dang focus - dung cung co che voi Cmd+V
 * that, nhung chay headless khong can quyen truy cap OS clipboard (khac voi
 * lan manual QA truoc, phai dung osascript).
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
