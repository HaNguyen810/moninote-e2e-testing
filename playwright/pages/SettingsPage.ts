import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { PlanSelectionModal } from '../components/PlanSelectionModal';

type SyncToggleLabel = 'Enable sync' | 'Enable auto sync' | 'Enable realtime sync' | 'Full offline mode';

/**
 * The Settings dialog (opened via AccountMenu.openSettingsMenu()), scoped to
 * the Account section's Profile/Subscription details/Sync tabs - the ones
 * this suite actually exercises. Customization/Import & export/Privacy &
 * security/Other sections and the Authentication tab exist (confirmed
 * 2026-09-17) but aren't covered here.
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

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  // --- Subscription details ---

  /** The plan name badge under "CURRENT PLAN" - the two are adjacent siblings in the DOM. */
  get currentPlanName() {
    return this.page.getByText('CURRENT PLAN', { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /** A usage row's value, e.g. usageFor('Colors') -> "0 of 7" - label/value render as adjacent siblings. */
  usageFor(label: string) {
    return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /**
   * Uses getByText, not getByRole('button', ...): this "Upgrade" control
   * (and Compare all plans / Force push / Force pull below) is a real
   * <button> element, but getByRole consistently finds 0 matches for it
   * (confirmed 2026-09-17 via a direct evaluate()-vs-locator comparison -
   * not a timing issue, the button was present and stable throughout).
   * Likely an accessible-name mismatch (e.g. an icon contributing to the
   * computed name) rather than anything wrong with the button itself -
   * getByText matches the same element reliably.
   */
  async openUpgradeFromSubscription(): Promise<PlanSelectionModal> {
    await this.page.getByText('Upgrade', { exact: true }).click();
    const modal = new PlanSelectionModal(this.page);
    await modal.waitUntilLoaded();
    return modal;
  }

  // --- Sync ---

  /**
   * The row for a given toggle - the nearest ancestor div that contains a
   * checkbox, walking up from the row's own exact-text label. Deliberately
   * not `page.locator('div').filter({ hasText: rowLabel })`: that also
   * matches every *ancestor* div (the whole SYNC panel included, since
   * substring-filter matches against the full descendant text), so
   * `.last()` on labels/checkboxes found within those matches silently
   * resolves to the LAST toggle in the panel (Full offline mode) instead of
   * the intended row - confirmed 2026-09-17 by watching toggleSync('Enable
   * sync') actually flip "Full offline mode" in the paywall it triggered.
   */
  private syncRow(rowLabel: SyncToggleLabel) {
    return this.page
      .getByText(rowLabel, { exact: true })
      .first()
      .locator('xpath=ancestor::div[.//input[@type="checkbox"]][1]');
  }

  /**
   * Each sync setting is a styled switch: a <label> wraps the actual
   * <input type="checkbox">, and clicking the input directly times out -
   * Playwright reports the label "intercepts pointer events" (confirmed
   * 2026-09-17). Click the label instead, the same "click the thing that's
   * actually clickable, not the control underneath it" pattern as the
   * checklist checkbox in NoteEditorPage.
   */
  private syncToggleLabel(rowLabel: SyncToggleLabel) {
    return this.syncRow(rowLabel).locator('label');
  }

  private syncCheckbox(rowLabel: SyncToggleLabel) {
    return this.syncRow(rowLabel).locator('input[type="checkbox"]');
  }

  /**
   * All four toggles are Essential-plan-gated on Free (confirmed 2026-09-17):
   * clicking any of them opens the same upgrade paywall as "Set expiry"
   * (plan-gating.spec.ts) instead of actually toggling.
   */
  async toggleSync(rowLabel: SyncToggleLabel): Promise<void> {
    await this.syncToggleLabel(rowLabel).click();
  }

  async isSyncEnabled(rowLabel: SyncToggleLabel): Promise<boolean> {
    return this.syncCheckbox(rowLabel).isChecked();
  }

  /** getByText, not getByRole - see openUpgradeFromSubscription()'s comment above. */
  get forcePushButton() {
    return this.page.getByText('Force push changes', { exact: true });
  }

  get forcePullButton() {
    return this.page.getByText('Force pull changes', { exact: true });
  }
}
