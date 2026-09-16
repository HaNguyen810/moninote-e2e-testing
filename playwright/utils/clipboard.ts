import type { Page } from '@playwright/test';

/** Reads the OS clipboard via the page - requires clipboard-read permission (see playwright.config.ts). */
export async function readClipboardText(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
