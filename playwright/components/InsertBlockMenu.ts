import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The "Choose a block to insert" menu opened from the editor toolbar's "+"
 * button. Only exposes the "Image" and "Attachment" submenus for now, since
 * those are the ones QA regression testing cares about; extend as needed
 * (Task list, Table, etc.) rather than modeling every item up front.
 *
 * Note: the "Upload from disk" / "Attach file" submenu items are NOT
 * automated here - they call window.showOpenFilePicker(), which Playwright
 * cannot drive (see utils/pasteFile.ts for why, and for the paste-based
 * workaround this suite uses instead).
 */
export class InsertBlockMenu {
  constructor(private readonly page: Page) {}

  private get plusButton() {
    return this.page.locator('button:near(:text("Bold"))').first();
  }

  private get imageMenuItem() {
    return this.page.getByText('Image', { exact: true });
  }

  private get attachmentMenuItem() {
    return this.page.getByText('Attachment', { exact: true });
  }

  async open(): Promise<void> {
    await this.plusButton.click();
    await expect(this.page.getByText('Choose a block to insert')).toBeVisible();
  }

  /** Opens the Image submenu (Upload from disk / Attach image from URL). */
  async openImageSubmenu(): Promise<void> {
    await this.open();
    await this.imageMenuItem.hover();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
