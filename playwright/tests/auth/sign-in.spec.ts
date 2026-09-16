import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Sign in', () => {
  test('fixed test account can sign in and reach the notes list', async ({ page, notesPage }) => {
    // notesPage fixture already performed the full email -> MFA -> password
    // flow; reaching here means it succeeded. Assert we actually landed on
    // /notes with a usable list, not just that no error was thrown.
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByPlaceholder('Search in Notes')).toBeVisible();
    void notesPage;
  });
});
