import { test, expect } from '../../fixtures/auth.fixture';
import { PlanSelectionModal } from '../../components/PlanSelectionModal';

/** Modal pricing "Select a plan", vao truc tiep qua item Upgrade cua account menu. */
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

      // Ky vong: dung 2 card paid-plan (Essential $1.99/thang, Pro
      // $6.99/thang). Thuc te render 3 - card "Essential" thu 2 o gia
      // $24/thang, con lai giong het card dung. Da verify qua screenshot +
      // innerText dump, khong phai loi cua tooling snapshot. Test nay ky
      // vong se fail cho toi khi fix duoc card bi trung; neu no bat dau
      // pass thi bo test.fail() o day di.
      await expect(planModal.paidPlanTrialButtons).toHaveCount(2);
    },
  );
});
