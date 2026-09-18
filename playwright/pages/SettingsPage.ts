import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { PlanSelectionModal } from '../components/PlanSelectionModal';

type SyncToggleLabel = 'Enable sync' | 'Enable auto sync' | 'Enable realtime sync' | 'Full offline mode';

/**
 * Dialog Settings (mo qua AccountMenu.openSettingsMenu()), scope vao cac
 * tab Profile/Subscription details/Sync/Authentication cua section
 * Account - la cac tab suite nay thuc su dung toi. Cac section
 * Customization/Import & export/Privacy & security/Other cung co (confirm
 * 2026-09-17) nhung chua cover o day.
 */
export class SettingsPage {
  constructor(private readonly page: Page) {}

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page.getByText('Profile', { exact: true })).toBeVisible();
  }

  async goToSubscriptionDetails(): Promise<void> {
    await this.page.getByText('Subscription details', { exact: true }).click();
    await expect(this.page.getByText('CURRENT PLAN', { exact: true })).toBeVisible();
  }

  async goToSync(): Promise<void> {
    await this.page.getByText('Sync', { exact: true }).click();
    await expect(this.page.getByText('SYNC', { exact: true })).toBeVisible();
  }

  async goToAuthentication(): Promise<void> {
    await this.page.getByText('Authentication', { exact: true }).click();
    await expect(this.page.getByText('PASSWORD', { exact: true })).toBeVisible();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  // --- Profile ---

  /**
   * Vai row trong Profile render nut action voi text giong het heading cua
   * row do (vd heading "Change email address" + nut "Change email
   * address"), nen match exact-text se ra 2 element - `.last()` chon dung
   * nut, luon render sau block heading/description. Confirm 2026-09-17.
   */
  async openChangeEmail(): Promise<void> {
    await this.page.getByText('Change email address', { exact: true }).last().click();
  }

  async openAttachmentsManager(): Promise<void> {
    await this.page.getByText('Open', { exact: true }).click();
  }

  /** Mo dialog reauth password "Please verify it's you", giong openChange2faMethod(). */
  async clickSaveRecoveryKey(): Promise<void> {
    await this.page.getByText('Save', { exact: true }).click();
  }

  get deleteAccountWarning() {
    return this.page.getByText(
      'All your data will be removed permanently. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.',
      { exact: true },
    );
  }

  get logoutRowDescription() {
    return this.page.getByText(
      'Are you sure you want to logout from this device? Any unsynced changes will be lost.',
      { exact: true },
    );
  }

  get logoutAllDevicesRowDescription() {
    return this.page.getByText('Force logout from all your logged in devices.', { exact: true });
  }

  // --- Authentication ---

  /** Cung loi trung heading-va-button-text nhu openChangeEmail() o tren. */
  async openChangePassword(): Promise<void> {
    await this.page.getByText('Change password', { exact: true }).last().click();
  }

  /** Mo dialog reauth password "Please verify it's you", giong clickSaveRecoveryKey(). */
  async openChange2faMethod(): Promise<void> {
    await this.page.getByText('Change', { exact: true }).click();
  }

  // --- Subscription details ---

  /** Badge ten plan duoi "CURRENT PLAN" - 2 cai nam ke nhau (sibling) trong DOM. */
  get currentPlanName() {
    return this.page.getByText('CURRENT PLAN', { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /** Gia tri 1 row usage, vd usageFor('Colors') -> "0 of 7" - label/value render sibling ke nhau. */
  usageFor(label: string) {
    return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /**
   * Dung getByText, khong dung getByRole('button', ...): control "Upgrade"
   * nay (va Compare all plans / Force push / Force pull ben duoi) la
   * <button> that, nhung getByRole luon tim ra 0 match (confirm 2026-09-17
   * qua so sanh truc tiep evaluate() voi locator - khong phai do timing,
   * button van hien dien va on dinh suot). Co le do accessible-name bi
   * lech (vd icon anh huong ten tinh toan) chu khong phai loi cua button -
   * getByText thi match dung on dinh.
   */
  async openUpgradeFromSubscription(): Promise<PlanSelectionModal> {
    await this.page.getByText('Upgrade', { exact: true }).click();
    const modal = new PlanSelectionModal(this.page);
    await modal.waitUntilLoaded();
    return modal;
  }

  // --- Sync ---

  /**
   * Row cua 1 toggle - div ancestor gan nhat co chua checkbox, di len tu
   * label exact-text cua row do. Co tinh khong dung
   * `page.locator('div').filter({ hasText: rowLabel })`: cach do cung match
   * moi div *ancestor* (ca panel SYNC luon, vi filter substring match vao
   * toan bo text con chau), nen `.last()` tren label/checkbox tim duoc
   * trong nhung match do se am tham resolve ra toggle CUOI trong panel
   * (Full offline mode) thay vi row minh muon - confirm 2026-09-17 khi xem
   * toggleSync('Enable sync') thuc ra lai bat "Full offline mode" trong
   * paywall no trigger.
   */
  private syncRow(rowLabel: SyncToggleLabel) {
    return this.page
      .getByText(rowLabel, { exact: true })
      .first()
      .locator('xpath=ancestor::div[.//input[@type="checkbox"]][1]');
  }

  /**
   * Moi setting sync la 1 switch co style rieng: <label> bao boc
   * <input type="checkbox"> that, click truc tiep vao input se bi timeout -
   * Playwright bao label "intercepts pointer events" (confirm 2026-09-17).
   * Click vao label thay vi input, cung pattern "click cai thuc su click
   * duoc, dung click vao control ben duoi no" giong checkbox checklist
   * trong NoteEditorPage.
   */
  private syncToggleLabel(rowLabel: SyncToggleLabel) {
    return this.syncRow(rowLabel).locator('label');
  }

  private syncCheckbox(rowLabel: SyncToggleLabel) {
    return this.syncRow(rowLabel).locator('input[type="checkbox"]');
  }

  /**
   * Ca 4 toggle deu bi gate boi Essential plan tren Free (confirm
   * 2026-09-17): click vao bat ky cai nao se mo cung paywall upgrade nhu
   * "Set expiry" (plan-gating.spec.ts) thay vi thuc su bat toggle.
   */
  async toggleSync(rowLabel: SyncToggleLabel): Promise<void> {
    await this.syncToggleLabel(rowLabel).click();
  }

  async isSyncEnabled(rowLabel: SyncToggleLabel): Promise<boolean> {
    return this.syncCheckbox(rowLabel).isChecked();
  }

  /** getByText, khong dung getByRole - xem comment openUpgradeFromSubscription() o tren. */
  get forcePushButton() {
    return this.page.getByText('Force push changes', { exact: true });
  }

  get forcePullButton() {
    return this.page.getByText('Force pull changes', { exact: true });
  }
}
