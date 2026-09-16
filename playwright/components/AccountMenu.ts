import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The circular profile-menu button (top-left of the notes list) and its
 * dropdown: plan badge, Toggle dark/light mode, Enterprise, Upgrade,
 * Settings, Logout. Confirmed via manual QA screenshots 2026-09-15.
 */
export class AccountMenu {
  constructor(private readonly page: Page) {}

  private get menuButton() {
    // Confirmed by direct inspection 2026-09-15: this is the first <button>
    // in DOM order on /notes (no accessible name/aria-label of its own -
    // it's an avatar icon), positioned top-left next to the "MoniNotes"
    // wordmark. Clicking it reveals the plan badge, account email, and
    // Toggle dark/light mode / Enterprise / Upgrade / Settings / Logout.
    return this.page.locator('button').first();
  }

  async open(): Promise<void> {
    await this.menuButton.click();
    await expect(this.page.getByText('Logout')).toBeVisible();
  }

  async logout(options: { confirmDiscardUnsyncedNotes?: boolean } = {}): Promise<void> {
    await this.open();
    await this.page.getByText('Logout', { exact: true }).click();

    // A logged-out-locally account with unsynced notes shows a confirmation
    // dialog ("You have unsynced notes...") before actually logging out.
    const confirmYes = this.page.getByRole('button', { name: 'Yes' });
    if (await confirmYes.isVisible({ timeout: 3_000 }).catch(() => false)) {
      if (options.confirmDiscardUnsyncedNotes === false) {
        await this.page.getByRole('button', { name: 'No' }).click();
        return;
      }
      await confirmYes.click();
    }
  }

  async openEnterpriseMenu(): Promise<void> {
    await this.open();
    await this.page.getByText('Enterprise', { exact: true }).click();
  }
}
