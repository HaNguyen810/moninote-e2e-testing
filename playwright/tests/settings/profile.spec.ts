import { test, expect } from '../../fixtures/auth.fixture';
import { SettingsPage } from '../../pages/SettingsPage';

/**
 * Settings > Profile, verify tren account Free-plan moi tao. Delete
 * account va 2 action Sessions (Logout / Log out from all devices) co tinh
 * khong bao gio click o day - cung kieu tiet che "chi test entry point"
 * suite nay da ap dung cho cac action irreversible/destructive khac (xem
 * phan Lock trong sharing.spec.ts) - chi verify text warning/confirmation
 * cua chung thoi.
 */
test.describe('Settings - Profile', () => {
  test('shows the account plan/email and the Sessions section', async ({ page, freshNotesPage }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();

    await expect(page.getByText('Free', { exact: true })).toBeVisible();
    await expect(page.getByText(/Member since/)).toBeVisible();
    await expect(settings.deleteAccountWarning).toBeVisible();
    await expect(settings.logoutRowDescription).toBeVisible();
    await expect(settings.logoutAllDevicesRowDescription).toBeVisible();
  });

  test('Change email address opens a dialog with New Email and Account password fields', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();

    await settings.openChangeEmail();

    await expect(page.getByText('New Email', { exact: true })).toBeVisible();
    await expect(page.getByText('Account password', { exact: true })).toBeVisible();
    await page.getByText('Cancel', { exact: true }).click();
    await expect(page.getByText('New Email', { exact: true })).toBeHidden();
  });

  test('Attachments manager opens showing file categories, all empty for a fresh account', async ({
    page,
    freshNotesPage,
  }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();

    await settings.openAttachmentsManager();

    for (const category of ['All files', 'Images', 'Documents', 'Videos', 'Audios', 'Uploads', 'Orphaned']) {
      await expect(page.getByText(category, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('0 files', { exact: true })).toBeVisible();
  });

  test('Save Account recovery key requires re-entering the account password', async ({ page, freshNotesPage }) => {
    await freshNotesPage.accountMenu.openSettingsMenu();
    const settings = new SettingsPage(page);
    await settings.waitUntilLoaded();

    await settings.clickSaveRecoveryKey();

    await expect(page.getByText("Please verify it's you", { exact: true })).toBeVisible();
    await expect(page.getByText('Enter account password to proceed.', { exact: true })).toBeVisible();
  });
});
