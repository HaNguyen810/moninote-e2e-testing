import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { MfaModal } from '../components/MfaModal';

/**
 * The /login flow: email -> 2FA code -> account password.
 * Order confirmed against a fresh account by the now-removed Maestro
 * sign-in.yaml flow - password is asked for *after* the code is accepted,
 * not before.
 */
export class LoginPage {
  readonly mfa: MfaModal;

  constructor(private readonly page: Page) {
    this.mfa = new MfaModal(page);
  }

  // "Enter email address" / "Enter account password" render as a floating
  // label (the accessible name), not a real HTML `placeholder` attribute -
  // getByPlaceholder() matches 0 elements here even though the same text is
  // visible on screen. Confirmed by direct DOM inspection 2026-09-15;
  // getByRole('textbox', { name }) matches the accessible name correctly.
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
    // Cold load goes through "Starting up the engines" -> multi-tab
    // SharedWorker/IndexedDB provider election ("Decrypting your notes")
    // before the login form mounts - observed to take ~10s on 2026-09-15
    // but up to ~40s on 2026-09-16, so wait generously for the actual form
    // rather than a fixed sleep or a tight timeout.
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
   * Full sign-in: email -> code (resolved by the caller, e.g. via
   * utils/mailinator.ts) -> password. Skips the plan picker if it appears,
   * the same way the Maestro flow does defensively for an account that
   * should already have a plan.
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
