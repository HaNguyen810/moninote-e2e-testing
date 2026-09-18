import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignUpPage } from '../pages/SignUpPage';
import { NotesListPage } from '../pages/NotesListPage';
import { EnterprisePage } from '../pages/EnterprisePage';
import { AdminConsolePage } from '../pages/AdminConsolePage';
import { SIGN_IN_ACCOUNT, SIGN_UP_PASSWORD, generateSignUpEmail } from '../utils/env';
import { snapshotInboxIds, waitForVerificationCode } from '../utils/mailinator';

interface AuthFixtures {
  /** NotesListPage cho session da sign-in san tren account test co dinh. */
  notesPage: NotesListPage;
  enterprisePage: EnterprisePage;
  /**
   * NotesListPage cho 1 account moi toanh tao qua sign-up, khong phai
   * sign-in. Uu tien dung cai nay cho smoke test: khong can cho MFA code,
   * khong bi rate limit inbox chung, account sach khong co note nao moi
   * lan chay. Chi dung `notesPage` khi test can du lieu ben vung cua
   * account co dinh (vd enterprise membership).
   */
  freshNotesPage: NotesListPage;
  /**
   * TODO: moi co structure, chua wire that. Dang cho credential admin
   * (xem ADMIN_ACCOUNT trong utils/env.ts) va can xem qua flow sign-in
   * admin thuc su the nao - co the khac /login flow cua account thuong.
   * Xem AdminConsolePage.ts / tests/admin/admin-console.spec.ts.
   */
  adminConsolePage: AdminConsolePage;
}

/**
 * Extend base test cua Playwright them fixture `notesPage`, tu dong
 * sign-in bang account test Mailinator co dinh (xem utils/env.ts) truoc
 * khi test body chay, giong cach flow sign-in.yaml cua Maestro (da xoa)
 * dung account nay. Uu tien dung cai nay hon la sign-up account moi cho
 * moi test (Mailinator public API co rate limit - xem utils/mailinator.ts).
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
    // Phu thuoc vao notesPage de dam bao sign-in da xong roi.
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

  adminConsolePage: async ({ page }, use) => {
    void page;
    void use;
    throw new Error(
      'TODO: not yet implemented - fill in ADMIN_ACCOUNT (utils/env.ts) and the ' +
        'admin sign-in flow once credentials are available',
    );
  },
});

export { expect } from '@playwright/test';
