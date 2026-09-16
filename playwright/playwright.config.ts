import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './utils/env';

export default defineConfig({
  testDir: './tests',
  // Generous: the notesPage/enterprisePage fixtures poll Mailinator for a
  // real MFA email (up to 90s, see utils/mailinator.ts) on top of this app's
  // own ~10s cold-load time before the login form even appears.
  timeout: 120_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  // Playwright's own default is 5s. Observed dev-environment cold-load time
  // varies day to day (~10s on 2026-09-15, up to ~40s on 2026-09-16), so a
  // bare expect() without its own explicit timeout (e.g. waitUntilLoaded())
  // needs more room too, not just the actions with their own overrides below.
  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // The dev environment can be noticeably slow to respond (observed during
    // manual QA too - see project memory on API-response-time false
    // positives), so give individual actions more room than Playwright's
    // 0 (unlimited-until-test-timeout) default before assuming a real hang.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Needed for tests that read the clipboard after "Copy link"/"Copy as"
    // (navigator.clipboard.readText() throws NotAllowedError without this).
    // "notifications" is needed for the Remind me dialog - without it, its
    // "Add" button just re-shows "Please grant notifications permission to
    // add new reminders." and does nothing (confirmed 2026-09-16).
    permissions: ['clipboard-read', 'clipboard-write', 'notifications'],
    // Needed for "Export as" - Playwright's default is already true, but
    // set explicitly since a downloaded file's content is read directly in
    // tests (see NoteContextMenu.exportAs()), not just its existence.
    acceptDownloads: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
