/**
 * Central place for environment/config constants shared across the Playwright suite.
 * Mirrors the accounts and base URL already used by the now-removed Maestro web
 * flows, so this suite targets the same test data those did.
 */

export const BASE_URL = 'https://dev-app.moninotes.com';

/** Fixed account used for sign-in flows (avoids Mailinator rate limits on every run). */
export const SIGN_IN_ACCOUNT = {
  email: 'moninotes-signintest-mfa@mailinator.com',
  password: 'TestPass123!',
};

/** Password used for freshly generated sign-up accounts. */
export const SIGN_UP_PASSWORD = 'Test@123';

export function generateSignUpEmail(): string {
  return `moninotes-web-signup-${Date.now()}@mailinator.com`;
}

/**
 * Tomorrow's date as DD-MM-YYYY, the format the Remind me dialog's Date
 * field expects. Reminders reject a time earlier than "now" (confirmed
 * 2026-09-16 - the dialog's own displayed default is a snapshot from when
 * it opened, and can itself have already become "in the past" by the time
 * you submit), so tests should always pass an explicit future date rather
 * than relying on the dialog's default.
 */
export function tomorrowDateDDMMYYYY(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
