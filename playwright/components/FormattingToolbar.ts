import type { Page } from '@playwright/test';

/**
 * Toolbar format rich-text ghim tren dau body editor (Bold, Italic,
 * Underline, More -> Strikethrough/Code/Checklist/...). Ap dung cho doan
 * text dang duoc select trong body - noi goi phai select text truoc (vd
 * NoteEditorPage.selectAllInBody()).
 */
export class FormattingToolbar {
  constructor(private readonly page: Page) {}

  // Bi loi mount multi-tab giong field title/tag cua NoteEditorPage - toolbar
  // cua tab truoc van co the con trong DOM, nen moi button o day deu phai
  // dung .last().
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

  /** Mo overflow "More" cua toolbar format (Strikethrough, Code, Checklist, ...). */
  async openMore(): Promise<void> {
    await this.button('More').click();
  }

  /**
   * Chuyen dong hien tai thanh checklist item. Vao qua More -> Checklist
   * tren formatting toolbar (confirm 2026-09-16) - khac voi item "Task
   * list" cua InsertBlockMenu dau "+", cai do chua test o day; ca 2 co the
   * cho ket qua giong nhau nhung chi duong nay da duoc verify.
   */
  async convertLineToChecklist(): Promise<void> {
    await this.openMore();
    await this.button('Checklist').click();
  }
}
