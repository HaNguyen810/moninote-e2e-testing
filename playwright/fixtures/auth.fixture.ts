import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { NotesListPage } from '../pages/NotesListPage';
import { EnterprisePage } from '../pages/EnterprisePage';
import { SIGN_IN_ACCOUNT, SIGN_UP_PASSWORD, generateSignUpEmail } from '../utils/env';
import { snapshotInboxIds, waitForVerificationCode } from '../utils/mailinator';

interface AuthFixtures {
  /** A NotesListPage for an already-signed-in session on the fixed test account. */
  notesPage: NotesListPage;
  enterprisePage: EnterprisePage;
  /**
   * A NotesListPage for a brand-new account created via sign-up, not
   * sign-in. Prefer this for smoke tests: no MFA code to wait for, no
   * shared-inbox rate limiting, a clean account with zero existing notes
   * every run. Reach for `notesPage` instead only when a test specifically
   * needs the fixed account's persistent data (e.g. enterprise membership).
   */
  freshNotesPage: NotesListPage;
}

/**
 * Extends the base Playwright test with a `notesPage` fixture that signs in
 * with the fixed Mailinator test account (see utils/env.ts) before the test
 * body runs, mirroring maestro/web/flows/sign-in.yaml so both suites exercise
 * the same account. Prefer this over signing up a fresh account per test
 * (Mailinator's public API has rate limits - see utils/mailinator.ts).
 */
export const test = base.extend<AuthFixtures>({
  notesPage: async ({ page }, use) => {
    const knownIds = await snapshotInboxIds(SIGN_IN_ACCOUNT.email);

    const login = new LoginPage(page);
    await login.goto();
    await login.submitEmail(SIGN_IN_ACCOUNT.email);

    const code = await waitForVerificationCode(SIGN_IN_ACCOUNT.email, {
      subjectPattern: /verification code/i,
      knownIds,
    });
    await login.mfa.submitCode(code);
    await login.submitPassword(SIGN_IN_ACCOUNT.password);

    const notesList = new NotesListPage(page);
    await notesList.waitUntilLoaded();

    await use(notesList);
  },

  enterprisePage: async ({ page, notesPage }, use) => {
    // Depending on notesPage ensures sign-in has already happened.
    void notesPage;
    await use(new EnterprisePage(page));
  },

  freshNotesPage: async ({ page }, use) => {
    const signUp = new SignUpPage(page);
    await signUp.signUp(generateSignUpEmail(), SIGN_UP_PASSWORD);

    const notesList = new NotesListPage(page);
    await notesList.waitUntilLoaded();

    await use(notesList);
  },
});

export { expect } from '@playwright/test';
