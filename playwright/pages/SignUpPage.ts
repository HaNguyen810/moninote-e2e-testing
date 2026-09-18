import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Flow /signup: email -> password -> confirm password -> Create account.
 * Co tinh KHONG cho xac nhan email - giong flow sign-up.yaml cua Maestro
 * (da xoa), no di thang toi /notes sau khi tao account, khong poll
 * Mailinator gi ca. Vi vay sign-up la cach uu tien de co 1 session da
 * auth cho smoke test: khong can MFA code, khong bi rate limit inbox
 * chung, account moi toanh moi lan chay. Chi dung LoginPage/account test
 * co dinh khi test can du lieu ben vung (vd enterprise membership).
 */
export class SignUpPage {
  constructor(private readonly page: Page) {}

  private get emailInput() {
    return this.page.getByRole('textbox', { name: /enter email address/i });
  }

  private get passwordInput() {
    return this.page.getByRole('textbox', { name: /^password$/i });
  }

  private get confirmPasswordInput() {
    return this.page.getByRole('textbox', { name: /confirm password/i });
  }

  private get createAccountButton() {
    return this.page.getByRole('button', { name: 'Create account' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/signup');
    // Cold load ("Starting up the engines" -> bau chon provider multi-tab)
    // quan sat len toi ~40s ngay 2026-09-16, lau hon han ~10s thay ngay
    // 2026-09-15 - do phan hoi cua dev env hinh nhu thay doi that thuong.
    // 45s cho du room ma khong che mat 1 cai treo that su.
    await expect(this.emailInput).toBeVisible({ timeout: 45_000 });
  }

  /**
   * Tao 1 account moi va vao thang /notes, bo qua man chon plan giong
   * cach flow Maestro lam (navigate thang thay vi click chon plan) vi
   * chon plan nao khong phai trong tam cua smoke test signup.
   */
  async signUp(email: string, password: string): Promise<void> {
    await this.goto();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.createAccountButton.click();

    await expect(this.page.getByText('Select a plan')).toBeVisible({ timeout: 45_000 });
    await this.page.goto('/notes');
  }
}
