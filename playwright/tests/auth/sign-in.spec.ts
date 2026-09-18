import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Sign in', () => {
  test('fixed test account can sign in and reach the notes list', async ({ page, notesPage }) => {
    // Fixture notesPage da chay het flow email -> MFA -> password; toi duoc
    // day nghia la thanh cong. Assert thuc su vao duoc /notes voi list dung
    // duoc, khong chi la khong throw error.
    await expect(page).toHaveURL(/\/notes/);
    await expect(page.getByPlaceholder('Search in Notes')).toBeVisible();
    void notesPage;
  });
});
