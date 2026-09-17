import { test, expect } from '../../fixtures/auth.fixture';
import { SettingsPage } from '../../pages/SettingsPage';

/**
 * Settings > Sync, verified against a fresh Free-plan account. Sync controls
 * are Essential-plan-gated (confirmed 2026-09-17) - the same paywall pattern
 * already covered for "Set expiry" (plan-gating.spec.ts) and uploads
 * (upload-attachment.spec.ts), just on a different feature.
 */
test.describe('Settings - Sync', () => {
  test('all four toggles are present and off, force push/pull disabled', async ({ page, freshNotesPage }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToSync();

    for (const label of ['Enable sync', 'Enable auto sync', 'Enable realtime sync', 'Full offline mode'] as const) {
      expect(await settings.isSyncEnabled(label)).toBe(false);
    }
    await expect(settings.forcePushButton).toBeDisabled();
    await expect(settings.forcePullButton).toBeDisabled();
  });

  test('enabling sync on a Free plan shows the Essential-plan paywall instead of turning it on', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToSync();

    await settings.toggleSync('Enable sync');

    await expect(page.getByText('Unlock this feature today')).toBeVisible();
    await expect(page.getByText('Sync controls is not available on this plan.')).toBeVisible();
    expect(await settings.isSyncEnabled('Enable sync')).toBe(false); // still off - blocked, not toggled
  });

  test('"Compare all plans" from the sync paywall opens the full plan comparison modal', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToSync();
    await settings.toggleSync('Enable sync');

    // getByText, not getByRole - see PlanSelectionModal's paidPlanTrialButtons comment.
    await page.getByText('Compare all plans', { exact: true }).click();

    await expect(page.getByText('Select a plan', { exact: true })).toBeVisible();
    await expect(page.getByText('Compare plans', { exact: true })).toBeVisible();
  });
});
