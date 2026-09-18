/**
 * Noi tap trung cac hang so env/config dung chung cho ca bo Playwright.
 * Dung lai account va base URL ma cac flow Maestro web (da bi xoa) tung
 * dung, de suite nay test cung 1 bo du lieu.
 */

export const BASE_URL = 'https://dev-app.moninotes.com';

/** Account co dinh dung cho flow sign-in (tranh bi Mailinator rate limit moi lan chay). */
export const SIGN_IN_ACCOUNT = {
  email: 'moninotes-signintest-mfa@mailinator.com',
  password: 'TestPass123!',
};

// TODO: dien vao khi co credential admin (xem AdminConsolePage.ts /
// tests/admin/admin-console.spec.ts, hien tai moi co structure, dang cho
// credential va can xem qua UI console that.
export const ADMIN_ACCOUNT = {
  email: '',
  password: '',
};

/** Password dung cho cac account sign-up moi tao. */
export const SIGN_UP_PASSWORD = 'Test@123';

export function generateSignUpEmail(): string {
  return `moninotes-web-signup-${Date.now()}@mailinator.com`;
}

/**
 * Ngay mai duoi dang DD-MM-YYYY, dung format ma field Date cua dialog
 * Remind me can. Reminder se bi reject neu gio som hon "hien tai" (confirm
 * 2026-09-16 - gio mac dinh dialog hien thi la snapshot luc dialog mo, nen
 * co the da thanh "qua khu" luc minh submit), nen test luon phai truyen
 * ngay tuong lai ro rang, dung dua vao gia tri mac dinh cua dialog.
 */
export function tomorrowDateDDMMYYYY(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
