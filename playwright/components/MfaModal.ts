import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Buoc nhap code "Two factor authentication". Dung lai y nguyen o ca
 * LoginPage va SignUpPage (day la component, khong phai page - chi la 1
 * buoc nam trong flow lon hon).
 */
export class MfaModal {
  constructor(private readonly page: Page) {}

  // Giong pattern floating-label cua field email/password ben LoginPage -
  // khong phai attribute placeholder that, nen getByRole moi match con
  // getByPlaceholder thi khong. Xem LoginPage.emailInput de biet chi tiet.
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
