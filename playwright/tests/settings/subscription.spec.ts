import { test, expect } from '../../fixtures/auth.fixture';
import { SettingsPage } from '../../pages/SettingsPage';

/**
 * Settings > Subscription details, verified against a fresh Free-plan
 * account (freshNotesPage always signs up fresh, landing on Free - confirmed
 * 2026-09-15/16, same basis as plan-gating.spec.ts).
 */
test.describe('Settings - Subscription details', () => {
  test('shows the Free plan and its usage limits', async ({ page, freshNotesPage }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToSubscriptionDetails();

    await expect(settings.currentPlanName).toHaveText('Free');
    await expect(settings.usageFor('Colors')).toHaveText('0 of 7');
    await expect(settings.usageFor('Tags')).toHaveText('0 of 50');
    await expect(settings.usageFor('Notebooks')).toHaveText('0 of 50');
    await expect(settings.usageFor('Active reminders')).toHaveText('0 of 10');
    await expect(settings.usageFor('Shortcuts')).toHaveText('0 of 10');
  });

  test('Upgrade opens the plan selection modal with Essential/Pro yearly pricing', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToSubscriptionDetails();

    const planModal = await settings.openUpgradeFromSubscription();

    await expect(page.getByText('$1.67 / month')).toBeVisible();
    await expect(page.getByText('billed annually at $19.99')).toBeVisible();
    await expect(page.getByText('$5.83 / month')).toBeVisible();
    await expect(page.getByText('billed annually at $69.99')).toBeVisible();
    await expect(planModal.paidPlanTrialButtons).toHaveCount(2);
  });
});
