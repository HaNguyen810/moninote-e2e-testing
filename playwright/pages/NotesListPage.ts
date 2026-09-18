import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { NoteEditorPage } from './NoteEditorPage';
import { AccountMenu } from '../components/AccountMenu';
import { NoteContextMenu } from '../components/NoteContextMenu';

/** View list /notes (sidebar trai + note list) va entry point tao note. */
export class NotesListPage {
  readonly accountMenu: AccountMenu;
  readonly contextMenu: NoteContextMenu;

  constructor(private readonly page: Page) {
    this.accountMenu = new AccountMenu(page);
    this.contextMenu = new NoteContextMenu(page);
  }

  private get addNoteButton() {
    // Nut "+" tren toolbar top - mo 1 note trong (chua co title) trong editor pane.
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

  /** Mo 1 note trong moi va tra ve editor page object cua no. */
  async createNote(): Promise<NoteEditorPage> {
    await this.addNoteButton.first().click();
    const editor = new NoteEditorPage(this.page);
    await editor.waitUntilLoaded();
    return editor;
  }

  /**
   * Title cua 1 note nhu no hien trong sidebar list - scope vao container
   * virtualized list (data-testid="virtuoso-item-list"), vi getByText(title)
   * tren ca page se match luon title do o tab editor dang mo, gay loi
   * strict-mode (confirm 2026-09-15).
   */
  noteInList(title: string) {
    return this.page.getByTestId('virtuoso-item-list').getByText(title, { exact: true });
  }

  /**
   * Search live theo substring, confirm khong phan biet hoa thuong va
   * trigger tu 1 ky tu trong lan manual QA (2026-09-13/15) - xem memory
   * project ve tinh nhat quan search Enterprise. Fill truc tiep vao box
   * thay vi pressSequentially, vi nguoi dung that cung co the paste va ca 2
   * cach phai hoat dong nhu nhau cho o search (khac voi bug search invoice
   * tren Billing, box nay confirm xu ly tot input dua vao bang code).
   */
  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchBox.fill('');
  }

  /**
   * Navigation sidebar trai - Notes/Favorites/Reminders/Trash/Archive. Day
   * la <div> co the click voi label <span>, khong phai element <button> -
   * getByRole('button', ...) khong match cai nao (confirm 2026-09-15).
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
   * Color se thanh 1 collection dieu huong duoc rieng trong sidebar sau khi
   * tao (confirm 2026-09-16, xem NoteContextMenu.assignNewColor()) - cung
   * pattern <div> click duoc nhu Notes/Favorites/Trash/Archive.
   */
  async goToColor(colorName: string): Promise<void> {
    await this.sidebarItem(colorName).click();
  }

  /** Header section "PINNED" hien phia tren list khi co it nhat 1 note duoc pin. */
  get pinnedSectionHeader() {
    return this.page.getByText('PINNED', { exact: true });
  }

  /**
   * Icon "Notebooks" tren top rail (dung attribute `title`, khong phai text
   * sidebar list nhu cac item tren). Neu chi co 1 notebook, click vao se
   * vao thang notebook do va hien note cua no luon (confirm 2026-09-17) -
   * chua investigate hanh vi khi co nhieu notebook (list folder de drill
   * vao hay flat view).
   */
  async goToNotebooks(): Promise<void> {
    await this.page.getByTitle('Notebooks').click();
  }
}
