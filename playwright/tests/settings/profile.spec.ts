import { test, expect } from '../../fixtures/auth.fixture';
import { SettingsPage } from '../../pages/SettingsPage';

/**
 * Settings > Profile, verified against a fresh Free-plan account. Delete
 * account and the two Sessions actions (Logout / Log out from all devices)
 * are deliberately never clicked here - same "entry point only" restraint
 * this suite already applies to irreversible/destructive actions elsewhere
 * (see sharing.spec.ts's Lock coverage) - only their warning/confirmation
 * text is verified.
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
