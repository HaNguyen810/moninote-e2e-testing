import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The "Select a plan" pricing modal - reachable from AccountMenu.openUpgradeMenu(),
 * SettingsPage.openUpgradeFromSubscription(), or any plan-gated paywall's
 * "Compare all plans" link (all three render the same modal, confirmed 2026-09-17).
 */
export class PlanSelectionModal {
  constructor(private readonly page: Page) {}

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page.getByText('Select a plan', { exact: true })).toBeVisible();
  }

  async selectBilling(period: 'Monthly' | 'Yearly'): Promise<void> {
    await this.page.getByRole('button', { name: period, exact: true }).click();
  }

  /**
   * "Start your free trial" CTAs, one per paid-plan card. Should be exactly
   * 2 (Essential, Pro) - Yearly billing shows exactly that, but Monthly
   * billing renders 3: a genuine duplicate "Essential" card at the wrong
   * price ($24/month alongside the correct $1.99/month), confirmed via
   * direct inspection (screenshot + innerText dump) 2026-09-17, not a
   * tooling artifact. See tests/settings/plan-selection.spec.ts.
   *
   * Uses getByText, not getByRole('button', ...): these are real <button>
   * elements, but getByRole consistently finds 0 matches for them (confirmed
   * 2026-09-17 via a direct evaluate()-vs-locator comparison - the buttons
   * were present and stable in the DOM the whole time, this isn't a timing
   * issue). Likely an accessible-name mismatch, e.g. an icon contributing
   * to the computed name - getByText matches the same elements reliably.
   * Same root cause affects openCompareTable() below.
   */
  get paidPlanTrialButtons() {
    return this.page.getByText('Start your free trial');
  }

  async openCompareTable(): Promise<void> {
    await this.page.getByText('Compare all plans', { exact: true }).click();
  }
}
