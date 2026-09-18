import type { Page } from '@playwright/test';

/**
 * Enterprise Admin console (vao qua EnterprisePage.openEnterprise()).
 * Hien tai moi co structure: chua login duoc bang account admin hay xem
 * qua UI console that, nen chua co gi de assert ca. Dien locator/method
 * that khi co credential admin va da explore qua console (xem
 * tests/admin/admin-console.spec.ts de biet cac test case du dinh).
 */
export class AdminConsolePage {
  constructor(private readonly page: Page) {}

  async waitUntilLoaded(): Promise<void> {
    throw new Error('TODO: not yet implemented - admin console UI unexplored');
  }
}
