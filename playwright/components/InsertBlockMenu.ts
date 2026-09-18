import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Menu "Choose a block to insert" mo tu nut "+" tren toolbar editor.
 *
 * Luu y: cac item submenu "Upload from disk" / "Attach file" KHONG duoc
 * automate o day - chung goi window.showOpenFilePicker(), Playwright khong
 * drive duoc (xem utils/pasteFile.ts de biet ly do, va workaround dung
 * paste thay the ma suite nay dung).
 */
export class InsertBlockMenu {
  constructor(private readonly page: Page) {}

  /**
   * Confirm 2026-09-17: locator cu, `button:near(:text("Bold"))`, resolve
   * ra 0 element - "Bold" la nut chi co icon voi attribute `title`, khong
   * phai text hien thi, nen pseudo-class `:text()` cua Playwright khong
   * bao gio match duoc. Chua co test nao thuc su goi `open()` truoc khi bug
   * nay bi phat hien.
   *
   * Nut "+" khong co title/aria-label/data-test-id gi ca - cach duy nhat
   * tim duoc de target no la theo cau truc: no la `<button>` dau tien ben
   * trong container cua formatting toolbar, len 2 cap tu nut Bold (co the
   * target qua title). `.last()` tren Bold de xu ly viec bi mount trung
   * multi-tab nhu thuong le truoc khi di len tu do.
   */
  private get plusButton() {
    return this.page
      .locator('button[title="Bold"]')
      .last()
      .locator('xpath=../..')
      .locator('button')
      .first();
  }

  // Moi item co data-test-id on dinh, giong pattern context menu right-click
  // cua note list (xem NoteContextMenu) - confirm 2026-09-17. Full list
  // thay: tasklist, outlinelist, hr, codeblock, math, callout, blockquote,
  // image, attachment, embed, table.
  private menuItem(testId: string) {
    return this.page.locator(`[data-test-id="menu-button-${testId}"]`);
  }

  private get imageMenuItem() {
    return this.menuItem('image');
  }

  private get attachmentMenuItem() {
    return this.menuItem('attachment');
  }

  async open(): Promise<void> {
    await this.plusButton.click();
    await expect(this.page.getByText('Choose a block to insert')).toBeVisible();
  }

  /** Mo submenu Image (Upload from disk / Attach image from URL). */
  async openImageSubmenu(): Promise<void> {
    await this.open();
    await this.imageMenuItem.hover();
  }

  async insertTaskList(): Promise<void> {
    await this.open();
    await this.menuItem('tasklist').click();
  }

  /**
   * "Table" mo 1 submenu long nhau voi grid size-picker hover-de-preview
   * (cell la div `[data-index="N"]`, khong co data-test-id rieng tung cell
   * - hover 1 cai se update text "R x C" o cho khac trong submenu, confirm
   * 2026-09-17) cong voi 1 option rieng "Import CSV" (chua cover o day).
   * `gridIndex` chon 1 cell truc tiep - truyen index nho nhat can dung;
   * chua co helper tinh row/column tu size mong muon vi chua confirm duoc
   * chieu rong grid.
   *
   * **`gridIndex: 0` (option nho nhat/"1 x 1") lam crash ca app** - xem bai
   * viet ve bug ben canh insertTaskList() trong README va test.fail() cua
   * `insert-blocks.spec.ts` cho cai nay. Bat ky index tu 14 tro len (confirm
   * "5 x 2") deu insert table binh thuong, chay tot.
   */
  async insertTable(gridIndex: number): Promise<void> {
    await this.open();
    await this.menuItem('table').hover();
    const cell = this.page.locator(`[data-index="${gridIndex}"]`).last();
    // Phai hover vao cell muc tieu truoc khi click, khong duoc click thang -
    // state preview size cua grid chi commit dung cho cell duoc hover gan
    // nhat (confirm 2026-09-17: click thang khong hover truoc vao cung 1
    // cell van ra crash "1 x 1" du dang o gridIndex 14, hover truoc thi khong bi).
    await cell.hover();
    await cell.click();
  }

  async insertCodeBlock(): Promise<void> {
    await this.open();
    await this.menuItem('codeblock').click();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
