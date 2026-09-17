import { test } from '../../fixtures/auth.fixture';

/**
 * Enterprise Admin console - structure-only for now.
 *
 * Blocked on two things before any of this can be written for real:
 *  1. Admin credentials (ADMIN_ACCOUNT in utils/env.ts is currently empty).
 *  2. An actual look at the console UI - EnterprisePage.openEnterprise()
 *     confirms you land "in its Admin console" and openMyWorkspace() confirms
 *     a Workspace > My Workspace link exists, but nothing else about the
 *     console (what sections exist, member/role management, billing, etc.)
 *     has been seen yet.
 *
 * Each test below is a placeholder for a test case, marked `fixme` so it's
 * collected but not run. Replace the body (and the TC description if it
 * turns out wrong) once the console has actually been explored.
 */

test.describe('Enterprise Admin console', () => {
  test.fixme(
    'admin can open the Admin console for an enterprise from the account menu',
    async ({ adminConsolePage }) => {
      void adminConsolePage;
    },
  );

  test.fixme('admin can switch into "My Workspace" from the Admin console', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  // TODO: everything below is a guess at likely admin-console scope, not a
  // confirmed feature. Verify each one exists before un-skipping it, and
  // delete any that don't apply.
  test.fixme('admin can view the list of enterprise members', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  test.fixme('admin can invite a new member to the enterprise', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  test.fixme('admin can remove a member from the enterprise', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  test.fixme("admin can change a member's role/permissions", async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  test.fixme('admin can view the enterprise plan/billing details', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });

  test.fixme('a non-admin member cannot reach the Admin console', async ({ adminConsolePage }) => {
    void adminConsolePage;
  });
});
