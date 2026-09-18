import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { MfaModal } from '../components/MfaModal';

/**
 * Flow /login: email -> code 2FA -> password account.
 * Thu tu confirm tren account moi qua flow sign-in.yaml cua Maestro (da
 * xoa) - password bi hoi *sau* khi code duoc accept, khong phai truoc.
 */
export class LoginPage {
  readonly mfa: MfaModal;

  constructor(private readonly page: Page) {
    this.mfa = new MfaModal(page);
  }

  // "Enter email address" / "Enter account password" render nhu floating
  // label (accessible name), khong phai attribute HTML `placeholder` that -
  // getByPlaceholder() se match 0 element o day du text van hien tren man
  // hinh. Confirm boi inspect DOM truc tiep 2026-09-15; getByRole('textbox',
  // { name }) moi match dung accessible name.
  private get emailInput() {
    return this.page.getByRole('textbox', { name: /enter email address/i });
  }

  private get continueButton() {
    return this.page.getByRole('button', { name: 'Continue' });
  }

  private get passwordInput() {
    return this.page.getByRole('textbox', { name: /enter account password/i });
  }

  private get loginButton() {
    return this.page.getByRole('button', { name: /login to your account/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
    // Cold load se qua "Starting up the engines" -> bau chon
    // SharedWorker/IndexedDB multi-tab ("Decrypting your notes") truoc khi
    // form login mount xong - quan sat mat ~10s ngay 2026-09-15 nhung co
    // luc len toi ~40s ngay 2026-09-16, nen cho rong rai cho form that thay
    // vi sleep co dinh hay timeout gap.
    await expect(this.emailInput).toBeVisible({ timeout: 45_000 });
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.continueButton.click();
  }

  async submitPassword(password: string): Promise<void> {
    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Sign-in full: email -> code (noi goi tu resolve, vd qua
   * utils/mailinator.ts) -> password. Bo qua man chon plan neu no hien ra,
   * giong cach flow Maestro lam de phong cho 1 account dang le da co plan roi.
   */
  async signIn(email: string, password: string, code: string): Promise<void> {
    await this.goto();
    await this.submitEmail(email);
    await this.mfa.submitCode(code);
    await this.submitPassword(password);

    const planPicker = this.page.getByText('Select a plan');
    if (await planPicker.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await this.page.goto('/notes');
    }
  }
}
