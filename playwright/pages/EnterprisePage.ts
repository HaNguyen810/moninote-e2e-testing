import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { NotesListPage } from './NotesListPage';
import { AccountMenu } from '../components/AccountMenu';

/**
 * The profile-menu "Enterprise" modal (list of enterprises the account
 * belongs to) and the switch into an enterprise's own Workspace notes.
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

  /** Clicks an enterprise by (partial) name and lands in its Admin console. */
  async openEnterprise(namePattern: string | RegExp): Promise<void> {
    await this.openEnterpriseList();
    await this.page.getByText(namePattern).click();
  }

  /**
   * From the Enterprise Admin console, navigates to Workspace > My Workspace,
   * which opens that enterprise's own /notes editor. App lock (PIN + duress
   * passphrase) may gate this the first time - see NoteEditorPage/App lock
   * handling in tests that need it; this page object does not handle that
   * modal itself since it's a one-time setup step, not part of navigation.
   */
  async openMyWorkspace(): Promise<NotesListPage> {
    await this.page.getByRole('link', { name: 'Workspace' }).click();
    await this.page.getByText('My Workspace').click();
    const notesList = new NotesListPage(this.page);
    await notesList.waitUntilLoaded();
    return notesList;
  }
}
