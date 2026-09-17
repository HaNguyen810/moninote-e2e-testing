import type { Page } from '@playwright/test';

/**
 * The Enterprise Admin console (reached via EnterprisePage.openEnterprise()).
 * Structure-only for now: we haven't logged in with an admin account or seen
 * the actual console UI yet, so there's nothing here to assert against.
 * Fill in real locators/methods once admin credentials are available and the
 * console has been explored (see tests/admin/admin-console.spec.ts for the
 * planned test cases this should support).
 */
export class AdminConsolePage {
  constructor(private readonly page: Page) {}

  async waitUntilLoaded(): Promise<void> {
    throw new Error('TODO: not yet implemented - admin console UI unexplored');
  }
}
