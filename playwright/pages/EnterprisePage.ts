import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { NotesListPage } from './NotesListPage';
import { AccountMenu } from '../components/AccountMenu';

/**
 * Modal "Enterprise" trong profile menu (list cac enterprise ma account
 * dang thuoc ve) va chuyen sang Workspace notes rieng cua 1 enterprise.
 */
export class EnterprisePage {
  private readonly accountMenu: AccountMenu;

  constructor(private readonly page: Page) {
    this.accountMenu = new AccountMenu(page);
  }

  async openEnterpriseList(): Promise<void> {
    await this.accountMenu.openEnterpriseMenu();
    await expect(this.page.getByRole('heading', { name: 'Enterprise' })).toBeVisible();
  }

  /** Click vao 1 enterprise theo ten (co the la 1 phan) va vao Admin console cua no. */
  async openEnterprise(namePattern: string | RegExp): Promise<void> {
    await this.openEnterpriseList();
    await this.page.getByText(namePattern).click();
  }

  /**
   * Tu Enterprise Admin console, di toi Workspace > My Workspace, mo editor
   * /notes rieng cua enterprise do. App lock (PIN + duress passphrase) co
   * the gate cai nay lan dau - xem cach test can xu ly App lock/NoteEditorPage;
   * page object nay khong tu xu ly modal do vi no chi la buoc setup 1 lan,
   * khong thuoc ve navigate.
   */
  async openMyWorkspace(): Promise<NotesListPage> {
    await this.page.getByRole('link', { name: 'Workspace' }).click();
    await this.page.getByText('My Workspace').click();
    const notesList = new NotesListPage(this.page);
    await notesList.waitUntilLoaded();
    return notesList;
  }
}
