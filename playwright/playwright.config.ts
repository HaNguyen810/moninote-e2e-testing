import { defineConfig, devices } from '@playwright/test';
import { BASE_URL } from './utils/env';

export default defineConfig({
  testDir: './tests',
  // Set rong rai: fixture notesPage/enterprisePage phai poll Mailinator cho
  // toi khi nhan duoc email MFA that (toi 90s, xem utils/mailinator.ts),
  // cong them thoi gian cold-load ~10s cua app truoc khi form login hien ra.
  timeout: 120_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  // Default cua Playwright la 5s. Thoi gian cold-load thuc te cua moi
  // truong dev thay doi tung ngay (~10s ngay 2026-09-15, len toi ~40s ngay
  // 2026-09-16), nen expect() tran (khong set timeout rieng, vd
  // waitUntilLoaded()) cung can nhieu thoi gian hon, khong chi cac action co
  // override rieng ben duoi.
  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: BASE_URL,
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Moi truong dev nhieu luc phan hoi cham thay ro (manual QA cung gap -
    // xem memory project ve false positive do API response time), nen cho
    // tung action nhieu thoi gian hon default 0 (khong gioi han cho toi khi
    // het timeout cua ca test) cua Playwright truoc khi coi la bi treo that.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // Can cho cac test doc clipboard sau "Copy link"/"Copy as"
    // (navigator.clipboard.readText() se throw NotAllowedError neu khong co
    // permission nay). "notifications" can cho dialog Remind me - neu
    // khong co, nut "Add" cua no chi hien lai "Please grant notifications
    // permission to add new reminders." va khong lam gi ca (confirm
    // 2026-09-16).
    permissions: ['clipboard-read', 'clipboard-write', 'notifications'],
    // Can cho "Export as" - default cua Playwright da la true, nhung set
    // tuong minh ra vi noi dung file download duoc doc truc tiep trong test
    // (xem NoteContextMenu.exportAs()), khong chi check file co ton tai hay
    // khong.
    acceptDownloads: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
