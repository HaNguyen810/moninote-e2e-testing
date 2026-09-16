import { test, expect } from '../../fixtures/auth.fixture';

/**
 * Features gated behind a paid plan, verified against a fresh Free-plan
 * account (freshNotesPage always signs up fresh, which lands on Free -
 * confirmed 2026-09-15/16). Not testing the paid-plan path itself, since
 * there's no automated way to actually upgrade a test account here - only
 * that the gate correctly blocks a Free account with an upgrade prompt
 * rather than silently failing or (worse) letting the action through.
 */

test.describe('Plan gating', () => {
  test('"Set expiry" on a Free-plan account shows an upgrade prompt, not the expiry dialog', async ({
    page,
    freshNotesPage,
  }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Expiry gating check');

    await freshNotesPage.contextMenu.setExpiry(freshNotesPage.noteInList('Expiry gating check'));

    await expect(page).toHaveURL(/\/notes/); // no navigation away
    await expect(
      page.getByText('Expiring notes is not available on this plan.')
    ).toBeVisible();
  });
});
