import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Feature bi gate boi paid plan, verify tren account Free-plan moi tao
 * (freshNotesPage luon sign-up moi, vao thang Free - confirm
 * 2026-09-15/16). Khong test path paid-plan that su, vi chua co cach tu
 * dong upgrade test account o day - chi test gate co chan dung account
 * Free bang upgrade prompt hay khong, thay vi fail am tham hoac (te hon)
 * cho action lot qua.
 */

test.describe('Plan gating', () => {
  test('"Set expiry" on a Free-plan account shows an upgrade prompt, not the expiry dialog', async ({
    page,
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Expiry gating check');

    await freshNotesPage.contextMenu.setExpiry(freshNotesPage.noteInList('Expiry gating check'));

    await expect(page).toHaveURL(/\/notes/); // khong bi navigate di dau ca
    await expect(
      page.getByText('Expiring notes is not available on this plan.')
    ).toBeVisible();
  });
});
