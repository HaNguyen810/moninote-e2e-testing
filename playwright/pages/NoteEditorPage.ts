import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { InsertBlockMenu } from '../components/InsertBlockMenu';
import { FormattingToolbar } from '../components/FormattingToolbar';
import { pasteFileIntoFocusedElement } from '../utils/pasteFile';

/** The right-hand note editor pane: title, tags, and the rich-text body. */
export class NoteEditorPage {
  readonly insertMenu: InsertBlockMenu;
  readonly toolbar: FormattingToolbar;

  constructor(private readonly page: Page) {
    this.insertMenu = new InsertBlockMenu(page);
    this.toolbar = new FormattingToolbar(page);
  }

  private get titleInput() {
    // The editor supports multiple open tabs, and a previous note's title
    // textarea can stay mounted (off-screen) after switching tabs - so more
    // than one element can match this placeholder at once. The most
    // recently opened tab's title field is last in DOM order; confirmed
    // 2026-09-15 via a strict-mode violation surfaced by createNote().
    return this.page.getByPlaceholder('Note title').last();
  }

  private get body() {
    return this.page.getByText('Start writing your note...').or(this.bodyWithContent);
  }

  /** Body locator once it already holds content (placeholder text is gone). */
  private get bodyWithContent() {
    return this.page.locator('[contenteditable="true"]').last();
  }

  private get appErrorScreen() {
    return this.page.getByText('Something went wrong');
  }

  private get tagInput() {
    // Same multi-tab mounting issue as titleInput - a previous tab's tag
    // field can still be in the DOM (confirmed 2026-09-15).
    return this.page.getByPlaceholder('Add a tag').last();
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
  }

  async setTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
    // The sidebar list title appears to update on blur/debounce rather than
    // on every keystroke - blur explicitly so callers don't need to know
    // that and can immediately assert against the list (e.g. noteInList()).
    await this.titleInput.blur();
  }

  async focusBody(): Promise<void> {
    await this.body.click();
  }

  /**
   * Types plain text into the body. Uses the keyboard rather than `.fill()`
   * because the body is a contenteditable rich-text block, not a plain
   * input/textarea - `.fill()` doesn't reliably target contenteditable
   * elements the way it does form fields.
   */
  async typeInBody(text: string): Promise<void> {
    await this.focusBody();
    await this.page.keyboard.type(text);
  }

  /** The body's current plain-text content, for asserting edits persisted. */
  async bodyText(): Promise<string> {
    return this.bodyWithContent.innerText();
  }

  /** The body's current HTML, for asserting formatting (bold/italic/checklist/etc). */
  async bodyHtml(): Promise<string> {
    return this.bodyWithContent.innerHTML();
  }

  /** Selects all text currently in the body (assumes the body is already focused). */
  async selectAllInBody(): Promise<void> {
    await this.focusBody();
    await this.page.keyboard.press('Meta+a');
  }

  /**
   * A checklist item's <li>, by position. The checkbox itself has no
   * accessible role or form control - it's a CSS pseudo-element roughly
   * 16px to the left of the item's text, not inside the <li>'s own
   * bounding box (confirmed 2026-09-16). Use toggleChecklistItem() to
   * click it rather than clicking this locator directly.
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
   * Adds a tag via the "Add a tag" field (confirmed 2026-09-15: typing a
   * name and pressing Enter adds it - there's no separate "confirm" button).
   */
  async addTag(tag: string): Promise<void> {
    await this.tagInput.click();
    await this.tagInput.fill(tag);
    await this.page.keyboard.press('Enter');
  }

  /**
   * A tag chip attached to the note, by name. Scoped to #editorContainer -
   * a bare page-wide getByText(tag) also matches the same tag rendered in
   * the sidebar list item's preview text, causing a strict-mode violation
   * (confirmed 2026-09-15).
   */
  tagChip(tag: string) {
    return this.page.locator('#editorContainer').getByText(tag, { exact: true });
  }

  /**
   * Pastes a file (image or attachment) into the note body via a synthetic
   * clipboard paste event - see utils/pasteFile.ts for why this is used
   * instead of the normal Playwright file-upload flow.
   */
  async pasteFile(filePath: string): Promise<void> {
    await this.focusBody();
    await pasteFileIntoFocusedElement(this.body, filePath);
  }

  /** Image block inserted into the body, located by its position among image blocks. */
  imageBlock(index = 0) {
    return this.page.locator('img, [data-block-type="image"]').nth(index);
  }

  /** Attachment (non-image file) chip inserted into the body, by its file name. */
  attachmentChip(fileName: string) {
    return this.page.getByText(fileName, { exact: false });
  }

  /**
   * True if pasting/uploading crashed the whole app to the full-screen
   * "Something went wrong" error, rather than failing gracefully inline.
   * Reproduced manually on 2026-09-15 with a malformed/truncated JPEG -
   * see fixtures/files/malformed.jpg and tests/notes/upload-attachment.spec.ts.
   */
  async hasCrashedToErrorScreen(): Promise<boolean> {
    return this.appErrorScreen.isVisible({ timeout: 3_000 }).catch(() => false);
  }

  async reloadApp(): Promise<void> {
    await this.page.getByRole('button', { name: 'Reload app' }).click();
  }

  /**
   * True if the body is currently editable. Toggling read-only via
   * NoteContextMenu.toggleReadOnly() removes the contenteditable attribute
   * entirely rather than just disabling it (confirmed 2026-09-16) - so this
   * checks for the element's absence, not a disabled state.
   */
  async isBodyEditable(): Promise<boolean> {
    return (await this.page.locator('[contenteditable="true"]').count()) > 0;
  }
}
