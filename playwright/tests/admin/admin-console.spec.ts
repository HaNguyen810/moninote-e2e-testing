import { test } from '../../fixtures/auth.fixture';

/**
 * Enterprise Admin console - hien tai chi co structure, chua co gi that.
 *
 * Bi block boi 2 thu truoc khi viet duoc that:
 *  1. Credential admin (ADMIN_ACCOUNT trong utils/env.ts hien dang rong).
 *  2. Chua thuc su nhin qua UI console - EnterprisePage.openEnterprise()
 *     confirm co vao duoc "Admin console" cua no va openMyWorkspace()
 *     confirm co link Workspace > My Workspace, nhung chua thay gi khac ve
 *     console (co section gi, quan ly member/role, billing, v.v.).
 *
 * Moi test ben duoi la 1 placeholder cho 1 test case, danh dau `fixme` de no
 * duoc collect nhung khong chay. Thay body (va sua lai mo ta TC neu sai) sau
 * khi da explore console that su.
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

  // TODO: moi thu ben duoi la doan phong theo scope co the co cua
  // admin-console, chua phai feature confirm chac chan. Verify tung cai co
  // that truoc khi bo skip, cai nao khong ap dung thi xoa.
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
