import type { Page } from '@playwright/test';

/** Doc clipboard cua OS qua page - can quyen clipboard-read (xem playwright.config.ts). */
export async function readClipboardText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
