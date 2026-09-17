import { test, expect } from '../../fixtures/auth.fixture';
import { SettingsPage } from '../../pages/SettingsPage';

/** Settings > Authentication, verified against a fresh Free-plan account. */
test.describe('Settings - Authentication', () => {
  test('Change password opens a dialog with current/new/confirm fields and password requirements', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToAuthentication();

    await settings.openChangePassword();

    await expect(page.getByText('Current password', { exact: true })).toBeVisible();
    await expect(page.getByText('New password', { exact: true })).toBeVisible();
    await expect(page.getByText('Confirm new password', { exact: true })).toBeVisible();
    await expect(page.getByText('8–16 characters', { exact: true })).toBeVisible();
    await expect(page.getByText('At least 1 uppercase letter (A–Z)', { exact: true })).toBeVisible();
    await expect(page.getByText('At least 1 lowercase letter (a–z)', { exact: true })).toBeVisible();
    await expect(page.getByText('At least 1 number (0–9)', { exact: true })).toBeVisible();
    await expect(page.getByText('At least 1 special character (!@#$%^&*)', { exact: true })).toBeVisible();

    await page.getByText('Cancel', { exact: true }).click();
    await expect(page.getByText('Current password', { exact: true })).toBeHidden();
  });

  test('Change 2FA method requires re-entering the account password', async ({ page, freshNotesPage }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();
    await settings.goToAuthentication();

    await settings.openChange2faMethod();

    await expect(page.getByText("Please verify it's you", { exact: true })).toBeVisible();
    await expect(page.getByText('Enter account password to proceed.', { exact: true })).toBeVisible();
  });
});
