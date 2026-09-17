import { test, expect } from '../../fixtures/auth.fixture';
import { PlanSelectionModal } from '../../components/PlanSelectionModal';

/** The "Select a plan" pricing modal, reached directly via the account menu's Upgrade item. */
test.describe('Plan selection modal', () => {
  test('Yearly billing (the default) shows one card per paid plan with correct pricing', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openUpgradeMenu();
    const planModal = new PlanSelectionModal(page);
    await planModal.waitUntilLoaded();

    await expect(page.getByText('$1.67 / month')).toBeVisible();
    await expect(page.getByText('billed annually at $19.99')).toBeVisible();
    await expect(page.getByText('$5.83 / month')).toBeVisible();
    await expect(page.getByText('billed annually at $69.99')).toBeVisible();
    await expect(planModal.paidPlanTrialButtons).toHaveCount(2);
  });

  test.fail(
    'BUG: Monthly billing renders a duplicate "Essential" card at the wrong price (confirmed 2026-09-17)',
    async ({ page, freshNotesPage }) => {
      await freshNotesPage.accountMenu.openUpgradeMenu();
      const planModal = new PlanSelectionModal(page);
      await planModal.waitUntilLoaded();

      await planModal.selectBilling('Monthly');

      // Expected: exactly 2 paid-plan cards (Essential $1.99/mo, Pro
      // $6.99/mo). Actually renders 3 - a second "Essential" card at
      // $24/month, otherwise identical to the correct one. Verified via
      // screenshot + innerText dump, not a snapshot-tooling artifact. This
      // test is expected to fail until the duplicate card is fixed; if it
      // starts passing, remove test.fail() here.
      await expect(planModal.paidPlanTrialButtons).toHaveCount(2);
    },
  );
});
