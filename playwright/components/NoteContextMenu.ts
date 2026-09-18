import type { Page, Locator, Download } from '@playwright/test';
import { expect } from '@playwright/test';

export type ExportFormat = 'pdf' | 'md' | 'md-frontmatter' | 'html' | 'txt';

/**
 * Context menu right-click tren 1 note list item. Khong co nut
 * hover/ellipsis nao hien thi ca - right-click la cach duy nhat de vao cac
 * action nay. Noi dung khac nhau tuy view, confirm 2026-09-16:
 * - View Notes/Favorites/Archive: Open in new tab, PIN, Read only, Favorite,
 *   Lock, Remind me, Archive, Notebooks, Assign color, Tags, Print, Export
 *   as, Copy as, Copy link, Duplicate, Sync off, Set expiry, Move to trash
 * - View Trash: chi co Restore va Delete (permanent, co dialog confirm -
 *   "This action is IRREVERSIBLE")
 */
export class NoteContextMenu {
  constructor(private readonly page: Page) {}

  private async openFor(noteItem: Locator): Promise<void> {
    await noteItem.click({ button: 'right' });
    await expect(this.page.locator('[data-test-id="menu-container"]')).toBeVisible();
  }

  // Moi item co data-test-id on dinh - uu tien dung cai nay hon la match
  // theo text. Rieng "Archive" con xuat hien trong text nav sidebar nen
  // getByText('Archive') thuong se bi ambiguous (confirm 2026-09-15, loi
  // strict-mode).
  private menuItem(testId: string) {
    return this.page.locator(`[data-test-id="menu-button-${testId}"]`);
  }

  async toggleFavorite(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('favorite').click();
  }

  async archive(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('archive').click();
  }

  async moveToTrash(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('movetotrash').click();
  }

  async duplicate(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('duplicate').click();
  }

  /** Pin note - no se chuyen vao section "PINNED" tren dau list. */
  async pin(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('pin').click();
  }

  /**
   * Bat/tat che do read-only. Confirm 2026-09-16: cai nay xoa han attribute
   * contenteditable cua body (chuyen sang view khoa) chu khong phai chi
   * disable - `[contenteditable="true"]` se match 0 element sau khi bat.
   */
  async toggleReadOnly(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('readonly').click();
  }

  /** Chi co trong view Trash - dua note tro lai Notes. */
  async restore(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('restore').click();
  }

  /**
   * Chi co trong view Trash - xoa vinh vien note sau khi confirm dialog
   * "This action is IRREVERSIBLE".
   */
  async permanentlyDelete(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('delete').click();
    await expect(this.page.getByText('IRREVERSIBLE')).toBeVisible();
    await this.page.getByText('Yes', { exact: true }).click();
  }

  /**
   * Tao 1 notebook moi va gan note nay vao, gop chung 1 flow:
   * right-click -> Notebooks -> Link notebooks -> Add notebook -> dien
   * title -> Create -> chon notebook moi tao -> Done. Confirm 2026-09-16 -
   * ten notebook se hien thanh badge duoi title note trong sidebar list.
   */
  async linkToNewNotebook(noteItem: Locator, notebookName: string): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('notebooks').click();
    await this.menuItem('link-notebooks').click();

    await this.page.getByText('Add notebook', { exact: true }).click();
    const dialog = this.page.locator('[data-test-id="add-notebook-dialog"]');
    await dialog.locator('input').first().fill(notebookName);
    await dialog.getByText('Create', { exact: true }).click();

    await this.page.getByText(notebookName, { exact: true }).click();
    await this.page.getByText('Done', { exact: true }).click();
  }

  /**
   * Tao 1 color moi va gan cho note nay, gop chung 1 flow:
   * right-click -> Assign color -> Add color -> dien title + hex -> Create.
   * Confirm 2026-09-16 - tao color se auto-apply luon vao note (khong can
   * buoc "chon roi Done" rieng nhu notebook) va no thanh 1 collection dieu
   * huong duoc rieng trong sidebar trai, giong nhu Favorites/Archive/Trash.
   */
  async assignNewColor(noteItem: Locator, colorName: string, hex: string): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('colors').click();
    await this.menuItem('new-color').click();

    const dialog = this.page.locator('[data-test-id="new-color-dialog"]');
    await dialog.locator('#title').fill(colorName);
    await dialog.locator('#color').fill(hex);
    await dialog.locator('button[data-role="positive-button"]').click();
  }

  /**
   * Copy deep link `nn://note/<id>` vao clipboard cua OS - khong co dialog
   * hay confirm hien thi gi ca, confirm 2026-09-16 bang cach doc
   * navigator.clipboard.readText() sau do. Can quyen
   * clipboard-read/clipboard-write da cap trong playwright.config.ts.
   */
  async copyLink(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('copy-link').click();
  }

  /**
   * Them 1 reminder cho note. Can quyen "notifications" (xem
   * playwright.config.ts) - neu khong co, nut Add cua dialog chi hien lai
   * thong bao "Please grant notifications permission" va khong lam gi ca.
   * `date` phai o dang DD-MM-YYYY va la tuong lai - dialog se reject neu
   * gio som hon "hien tai", va gia tri date/time mac dinh cua dialog chi la
   * snapshot luc no mo, nen phai truyen date ro rang thay vi dua vao mac
   * dinh (xem utils/env.ts, tomorrowDateDDMMYYYY()).
   */
  async addReminder(noteItem: Locator, date: string, time: string): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('remind-me').click();

    const dialog = this.page.locator('[data-test-id="add-reminder-dialog"]');
    await dialog.locator('#date').fill(date);
    await dialog.locator('#time').fill(time);
    await dialog.getByText('Add', { exact: true }).click();
  }

  /**
   * "Set expiry" bi gate boi Pro plan - tren Free plan (account moi
   * signup luon rot vao day) click vao se ra paywall upgrade thay vi
   * dialog set expiry-date, confirm 2026-09-16. Method nay chi mo bat ky
   * cai gi click nay tao ra; noi goi tu assert xem no nhan duoc cai nao.
   */
  async setExpiry(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('expiry-date').click();
  }

  /**
   * Export note va tra ve Download tuong ung. Confirm 2026-09-16: day la
   * download file that cua browser (event `download` cua Playwright co
   * fire), khong phai dialog native print/save - co the doc content truc
   * tiep qua `download.createReadStream()`. `format` map voi test id rieng
   * cua submenu export: pdf, md, md-frontmatter, html, txt.
   */
  async exportAs(noteItem: Locator, format: ExportFormat): Promise<Download> {
    await this.openFor(noteItem);
    await this.menuItem('export').click();

    // Rieng PDF generate co the lau hon actionTimeout mac dinh 15s cua
    // config (render phia client) - cho rieng cho nay lau hon thay vi
    // tang mac dinh chung toan bo.
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 30_000 }),
      this.menuItem(format).click(),
    ]);
    return download;
  }

  /**
   * Khoa note. Lan dau tien tren 1 account, cai nay se hoi tao vault -
   * 1 password rieng, khac voi password account/PIN app-lock, dung de ma
   * hoa cac note bi khoa tren thiet bi nay (`password-dialog`, field
   * `#password`/`#confirmPassword`). Confirm 2026-09-17: sau khi submit,
   * note se hien view khoa ngay lap tuc; dung chung voi
   * NoteEditorPage.unlockNote(vaultPassword) de doc lai duoc content.
   */
  async lock(noteItem: Locator, vaultPassword: string): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('lock').click();

    const dialog = this.page.locator('[data-test-id="password-dialog"]');
    await dialog.locator('#password').fill(vaultPassword);
    await dialog.locator('#confirmPassword').fill(vaultPassword);
    await dialog.locator('button[type="submit"]').click();
    // Tao vault la async (ma hoa luc submit) - cho dialog thuc su dong
    // thay vi return ngay, neu khong noi goi check
    // NoteEditorPage.isLocked() ngay sau co the bat trung luc dang submit
    // (confirm 2026-09-17: dialog van con hien voi spinner dang load).
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  }
}
