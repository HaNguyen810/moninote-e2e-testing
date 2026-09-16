import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The "Two factor authentication" code-entry step. Reused as-is from both
 * LoginPage and SignUpPage (component, not a page - it's just one step
 * embedded inside a larger flow).
 */
export class MfaModal {
  constructor(private readonly page: Page) {}

  // Same floating-label pattern as LoginPage's email/password fields - not a
  // real placeholder attribute, so getByRole matches where getByPlaceholder
  // would not. See LoginPage.emailInput for details.
  private get codeInput() {
    return this.page.getByRole('textbox', { name: /enter 6 digit code/i });
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: 'Submit' });
  }

  async submitCode(code: string): Promise<void> {
    await expect(this.page.getByText('Two factor authentication')).toBeVisible();
    await this.codeInput.fill(code);
    await this.submitButton.click();
  }
}
