import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The /signup flow: email -> password -> confirm password -> Create account.
 * Deliberately does NOT wait on an email confirmation - mirrors
 * ../../maestro/web/flows/sign-up.yaml, which navigates straight to /notes
 * after account creation without polling Mailinator at all. This makes
 * sign-up the preferred way to get a fresh authenticated session for smoke
 * tests: no MFA code, no shared-inbox rate limits, a brand new account every
 * run. Use LoginPage/the fixed test account instead only when a test
 * specifically needs persistent data (e.g. enterprise membership).
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
    // Cold load ("Starting up the engines" -> multi-tab provider election)
    // was observed taking up to ~40s on 2026-09-16, well past the ~10s seen
    // on 2026-09-15 - the dev environment's responsiveness apparently
    // varies. 45s gives real headroom without masking a genuine hang.
    await expect(this.emailInput).toBeVisible({ timeout: 45_000 });
  }

  /**
   * Creates a brand new account and lands on /notes, skipping the plan
   * picker the same way the Maestro flow does (direct navigation rather
   * than clicking a plan) since which plan is selected isn't the point of
   * a signup smoke test.
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
