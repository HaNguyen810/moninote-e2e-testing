import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { InsertBlockMenu } from '../components/InsertBlockMenu';
import { FormattingToolbar } from '../components/FormattingToolbar';
import { pasteFileIntoFocusedElement } from '../utils/pasteFile';

/** Pane editor note ben phai: title, tag, va body rich-text. */
export class NoteEditorPage {
  readonly insertMenu: InsertBlockMenu;
  readonly toolbar: FormattingToolbar;

  constructor(private readonly page: Page) {
    this.insertMenu = new InsertBlockMenu(page);
    this.toolbar = new FormattingToolbar(page);
  }

  private get titleInput() {
    // Editor cho phep mo nhieu tab, va textarea title cua note truoc van co
    // the con mount (o ngoai man hinh) sau khi chuyen tab - nen co the co
    // hon 1 element match placeholder nay cung luc. Field title cua tab moi
    // mo gan nhat se nam cuoi cung theo thu tu DOM; confirm 2026-09-15 qua
    // loi strict-mode phat hien trong createNote().
    return this.page.getByPlaceholder('Note title').last();
  }

  private get body() {
    return this.page.getByText('Start writing your note...').or(this.bodyWithContent);
  }

  /** Locator cua body khi da co content (placeholder text da bien mat). */
  private get bodyWithContent() {
    return this.page.locator('[contenteditable="true"]').last();
  }

  private get appErrorScreen() {
    return this.page.getByText('Something went wrong');
  }

  private get tagInput() {
    // Bi loi mount multi-tab giong titleInput - field tag cua tab truoc van
    // co the con trong DOM (confirm 2026-09-15).
    return this.page.getByPlaceholder('Add a tag').last();
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
  }

  async setTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
    // Title trong sidebar list hinh nhu update luc blur/debounce chu khong
    // phai moi lan go phim - blur ro rang de noi goi khong can biet dieu
    // do va co the assert ngay vao list (vd noteInList()).
    await this.titleInput.blur();
  }

  async focusBody(): Promise<void> {
    await this.body.click();
  }

  /**
   * Go plain text vao body. Dung keyboard thay vi `.fill()` vi body la
   * block rich-text contenteditable, khong phai input/textarea thuong -
   * `.fill()` khong target on dinh vao contenteditable nhu voi form field.
   */
  async typeInBody(text: string): Promise<void> {
    await this.focusBody();
    await this.page.keyboard.type(text);
  }

  /** Noi dung plain-text hien tai cua body, dung de assert edit da luu. */
  async bodyText(): Promise<string> {
    return this.bodyWithContent.innerText();
  }

  /** HTML hien tai cua body, dung de assert format (bold/italic/checklist/...). */
  async bodyHtml(): Promise<string> {
    return this.bodyWithContent.innerHTML();
  }

  /** Select toan bo text dang co trong body (gia dinh body da duoc focus). */
  async selectAllInBody(): Promise<void> {
    await this.focusBody();
    await this.page.keyboard.press('Meta+a');
  }

  /**
   * `<li>` cua 1 checklist item, theo vi tri. Checkbox tu no khong co role
   * accessible hay form control gi ca - no la 1 pseudo-element CSS nam
   * khoang 16px ben trai text cua item, khong nam trong bounding box cua
   * `<li>` (confirm 2026-09-16). Dung toggleChecklistItem() de click vao
   * thay vi click truc tiep locator nay.
   */
  checklistItem(index = 0) {
    return this.bodyWithContent.locator('ul.simple-checklist > li').nth(index);
  }

  async toggleChecklistItem(index = 0): Promise<void> {
    const item = this.checklistItem(index);
    const box = await item.boundingBox();
    if (!box) throw new Error(`toggleChecklistItem: checklist item ${index} has no bounding box`);
    await this.page.mouse.click(box.x - 16, box.y + box.height / 2);
  }

  async isChecklistItemChecked(index = 0): Promise<boolean> {
    const className = (await this.checklistItem(index).getAttribute('class')) ?? '';
    return className.includes('checked');
  }

  /**
   * Them tag qua field "Add a tag" (confirm 2026-09-15: go ten roi bam
   * Enter la them duoc - khong co nut "confirm" rieng nao ca).
   */
  async addTag(tag: string): Promise<void> {
    await this.tagInput.click();
    await this.tagInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Chip cua 1 tag gan vao note, theo ten. Scope vao #editorContainer - vi
   * getByText(tag) tren ca page se match luon tag do trong preview text
   * cua sidebar list item, gay loi strict-mode (confirm 2026-09-15).
   */
  tagChip(tag: string) {
    return this.page.locator('#editorContainer').getByText(tag, { exact: true });
  }

  /**
   * Paste 1 file (anh hoac attachment) vao body note qua 1 clipboard paste
   * event gia lap - xem utils/pasteFile.ts de biet ly do dung cach nay
   * thay vi flow upload file binh thuong cua Playwright.
   */
  async pasteFile(filePath: string): Promise<void> {
    await this.focusBody();
    await pasteFileIntoFocusedElement(this.body, filePath);
  }

  /** Image block da insert vao body, tim theo vi tri trong cac image block. */
  imageBlock(index = 0) {
    return this.page.locator('img, [data-block-type="image"]').nth(index);
  }

  /** Chip attachment (file khong phai anh) da insert vao body, theo ten file. */
  attachmentChip(fileName: string) {
    return this.page.getByText(fileName, { exact: false });
  }

  /**
   * True neu paste/upload lam crash ca app ra man hinh loi full-screen
   * "Something went wrong", thay vi fail nhe nhang tai cho. Reproduce
   * manual ngay 2026-09-15 voi 1 file JPEG malformed/bi cat cut - xem
   * fixtures/files/malformed.jpg va tests/notes/upload-attachment.spec.ts.
   */
  async hasCrashedToErrorScreen(): Promise<boolean> {
    return this.appErrorScreen.isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async reloadApp(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reload app' }).click();
  }

  /**
   * True neu body dang editable duoc. Bat read-only qua
   * NoteContextMenu.toggleReadOnly() xoa han attribute contenteditable chu
   * khong phai chi disable (confirm 2026-09-16) - nen cai nay check element
   * co ton tai hay khong, khong phai check trang thai disabled.
   */
  async isBodyEditable(): Promise<boolean> {
    return (await this.page.locator('[contenteditable="true"]').count()) > 0;
  }

  /**
   * True neu note dang mo hien placeholder khoa ("Please enter the
   * password to unlock this note") thay vi content that. Confirm 2026-09-17.
   */
  async isLocked(): Promise<boolean> {
    return this.page
      .getByText('Please enter the password to unlock this note')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }

  /**
   * Mo khoa 1 note dang bi khoa. Confirm 2026-09-17 dau tien qua browser
   * that (khong headless), roi reproduce lai trong Playwright headless: co
   * that 1 input password o day ("Enter your access code."), rat de bo lo
   * vi no render khong khac gi ve mat hinh thuc cho toi khi duoc focus -
   * cac lan thu mo khoa truoc do that bai chi vi field nay chua duoc dien
   * truoc khi click "Open note", khong phai do bug that su cua san pham.
   * `.last()` vi ly do bi mount trung multi-tab nhu thuong le.
   */
  async unlockNote(vaultPassword: string): Promise<void> {
    const input = this.page.getByPlaceholder('Enter your access code.').last();
    await input.fill(vaultPassword);
    await this.page.getByText('Open note', { exact: true }).last().click();
  }
}
