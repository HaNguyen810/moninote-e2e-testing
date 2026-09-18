import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Modal pricing "Select a plan" - vao duoc tu AccountMenu.openUpgradeMenu(),
 * SettingsPage.openUpgradeFromSubscription(), hoac link "Compare all plans"
 * cua bat ky paywall plan-gated nao (ca 3 deu render cung 1 modal, confirm 2026-09-17).
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
   * Cac nut CTA "Start your free trial", moi paid-plan card 1 cai. Dung ra
   * phai la 2 (Essential, Pro) - Yearly billing dung hien 2, nhung Monthly
   * billing lai render 3: bi trung 1 card "Essential" that su voi gia sai
   * ($24/month ben canh gia dung $1.99/month), confirm qua inspect truc
   * tiep (screenshot + innerText dump) 2026-09-17, khong phai loi do tool.
   * Xem tests/settings/plan-selection.spec.ts.
   *
   * Dung getByText, khong dung getByRole('button', ...): day la <button>
   * that, nhung getByRole luon tim ra 0 match (confirm 2026-09-17 qua so
   * sanh truc tiep evaluate() voi locator - button van co san va on dinh
   * trong DOM suot, khong phai do timing). Co le do accessible-name bi lech,
   * vd icon anh huong ten tinh toan - getByText thi match dung on dinh.
   * Cung nguyen nhan goc anh huong openCompareTable() ben duoi.
   */
  get paidPlanTrialButtons() {
    return this.page.getByText('Start your free trial');
  }

  async openCompareTable(): Promise<void> {
    await this.page.getByText('Compare all plans', { exact: true }).click();
  }
}
