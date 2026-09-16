import type { Page } from '@playwright/test';

/**
 * The rich-text formatting toolbar pinned above the editor body (Bold,
 * Italic, Underline, More -> Strikethrough/Code/Checklist/etc). Applies to
 * whatever text is currently selected in the body - callers select text
 * first (e.g. NoteEditorPage.selectAllInBody()).
 */
export class FormattingToolbar {
  constructor(private readonly page: Page) {}

  // Same multi-tab mounting issue as NoteEditorPage's title/tag fields - a
  // previous tab's toolbar can still be in the DOM, so every button here
  // takes .last().
  private button(title: string) {
    return this.page.locator(`button[title="${title}"]`).last();
  }

  async bold(): Promise<void> {
    await this.button('Bold').click();
  }

  async italic(): Promise<void> {
    await this.button('Italic').click();
  }

  async underline(): Promise<void> {
    await this.button('Underline').click();
  }

  /** Opens the "More" formatting overflow (Strikethrough, Code, Checklist, ...). */
  async openMore(): Promise<void> {
    await this.button('More').click();
  }

  /**
   * Converts the current line into a checklist item. Reached via More ->
   * Checklist on the formatting toolbar (confirmed 2026-09-16) - distinct
   * from the "+" InsertBlockMenu's "Task list" item, which was not
   * exercised here; both may produce equivalent results but only this path
   * has been verified.
   */
  async convertLineToChecklist(): Promise<void> {
    await this.openMore();
    await this.button('Checklist').click();
  }
}
