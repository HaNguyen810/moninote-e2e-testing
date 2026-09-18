import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Nut menu profile hinh tron (goc tren trai cua notes list) va dropdown cua
 * no: badge plan, Toggle dark/light mode, Enterprise, Upgrade, Settings,
 * Logout. Confirm qua screenshot manual QA ngay 2026-09-15.
 */
export class AccountMenu {
  constructor(private readonly page: Page) {}

  private get menuButton() {
    // Confirm boi inspect truc tiep ngay 2026-09-15: day la <button> dau
    // tien theo thu tu DOM tren /notes (khong co accessible name/aria-label
    // rieng - no la icon avatar), nam goc tren trai canh chu "MoniNotes".
    // Click vao se hien badge plan, email account, va Toggle dark/light
    // mode / Enterprise / Upgrade / Settings / Logout.
    return this.page.locator('button').first();
  }

  async open(): Promise<void> {
    await this.menuButton.click();
    await expect(this.page.getByText('Logout')).toBeVisible();
  }

  async logout(options: { confirmDiscardUnsyncedNotes?: boolean } = {}): Promise<void> {
    await this.open();
    await this.page.getByText('Logout', { exact: true }).click();

    // Account co note chua sync se hien dialog confirm ("You have unsynced
    // notes...") truoc khi thuc su logout.
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

  async openSettingsMenu(): Promise<void> {
    await this.open();
    await this.page.locator('[data-test-id="menu-button-settings"]').click();
  }

  /** Mo thang modal pricing "Select a plan" (xem PlanSelectionModal). */
  async openUpgradeMenu(): Promise<void> {
    await this.open();
    await this.page.locator('[data-test-id="menu-button-upgrade"]').click();
  }
}
