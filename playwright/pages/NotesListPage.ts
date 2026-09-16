import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { NoteEditorPage } from './NoteEditorPage';
import { AccountMenu } from '../components/AccountMenu';
import { NoteContextMenu } from '../components/NoteContextMenu';

/** The /notes list view (left sidebar + note list) and note creation entry point. */
export class NotesListPage {
  readonly accountMenu: AccountMenu;
  readonly contextMenu: NoteContextMenu;

  constructor(private readonly page: Page) {
    this.accountMenu = new AccountMenu(page);
    this.contextMenu = new NoteContextMenu(page);
  }

  private get addNoteButton() {
    // "+" in the top toolbar - opens a fresh untitled note in the editor pane.
    return this.page.getByRole('button', { name: 'New tab' }).or(this.page.getByText('Add a note'));
  }

  private get searchBox() {
    return this.page.getByPlaceholder('Search in Notes');
  }

  async goto(): Promise<void> {
    await this.page.goto('/notes');
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.searchBox).toBeVisible();
  }

  /** Opens a new, empty note and returns its editor page object. */
  async createNote(): Promise<NoteEditorPage> {
    await this.addNoteButton.first().click();
    const editor = new NoteEditorPage(this.page);
    await editor.waitUntilLoaded();
    return editor;
  }

  /**
   * A note's title as it appears in the sidebar list specifically - scoped
   * to the virtualized list container (data-testid="virtuoso-item-list"),
   * since a bare page-wide getByText(title) also matches the same title
   * rendered as the open editor's tab button, causing a strict-mode
   * violation (confirmed 2026-09-15).
   */
  noteInList(title: string) {
    return this.page.getByTestId('virtuoso-item-list').getByText(title, { exact: true });
  }

  /**
   * Live substring search, confirmed case-insensitive and single-character-
   * triggered during manual QA (2026-09-13/15) - see project memory on
   * Enterprise search consistency. Fills via the box directly rather than
   * pressSequentially, since a real user can paste too and both should work
   * the same way for a search box (unlike the invoice-search bug found on
   * Billing, this box is confirmed to handle programmatic input).
   */
  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchBox.fill('');
  }

  /**
   * Left sidebar navigation - Notes/Favorites/Reminders/Trash/Archive.
   * These are clickable <div>s with a <span> text label, not <button>
   * elements - getByRole('button', ...) matches none of them (confirmed
   * 2026-09-15).
   */
  private sidebarItem(name: string) {
    return this.page.getByText(name, { exact: true });
  }

  async goToNotes(): Promise<void> {
    await this.sidebarItem('Notes').click();
  }

  async goToFavorites(): Promise<void> {
    await this.sidebarItem('Favorites').click();
  }

  async goToTrash(): Promise<void> {
    await this.sidebarItem('Trash').click();
  }

  async goToArchive(): Promise<void> {
    await this.sidebarItem('Archive').click();
  }

  async goToReminders(): Promise<void> {
    await this.sidebarItem('Reminders').click();
  }

  /**
   * Colors become their own navigable sidebar collection once created
   * (confirmed 2026-09-16, see NoteContextMenu.assignNewColor()) - same
   * clickable-<div> pattern as Notes/Favorites/Trash/Archive.
   */
  async goToColor(colorName: string): Promise<void> {
    await this.sidebarItem(colorName).click();
  }

  /** The "PINNED" section header that appears above the list once any note is pinned. */
  get pinnedSectionHeader() {
    return this.page.getByText('PINNED', { exact: true });
  }
}
