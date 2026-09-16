import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * The right-click context menu on a note list item. There is no visible
 * hover/ellipsis button on a list item - right-click is the only way to
 * reach these actions. Content differs by view, confirmed 2026-09-16:
 * - Notes/Favorites/Archive view: Open in new tab, PIN, Read only, Favorite,
 *   Lock, Remind me, Archive, Notebooks, Assign color, Tags, Print, Export
 *   as, Copy as, Copy link, Duplicate, Sync off, Set expiry, Move to trash
 * - Trash view: just Restore and Delete (permanent, with a confirmation
 *   dialog - "This action is IRREVERSIBLE")
 */
export class NoteContextMenu {
  constructor(private readonly page: Page) {}

  private async openFor(noteItem: Locator): Promise<void> {
    await noteItem.click({ button: 'right' });
    await expect(this.page.locator('[data-test-id="menu-container"]')).toBeVisible();
  }

  // Each item carries a stable data-test-id - prefer these over text
  // matching. "Archive" in particular also appears as sidebar nav item
  // text, so a plain getByText('Archive') is ambiguous (confirmed
  // 2026-09-15, strict-mode violation).
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

  /** Pins the note - it moves into a "PINNED" section at the top of the list. */
  async pin(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('pin').click();
  }

  /**
   * Toggles read-only mode. Confirmed 2026-09-16: this removes the body's
   * contenteditable attribute entirely (swaps to a locked view) rather than
   * just disabling it - `[contenteditable="true"]` matches 0 elements
   * afterward.
   */
  async toggleReadOnly(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('readonly').click();
  }

  /** Only available in the Trash view - moves the note back to Notes. */
  async restore(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('restore').click();
  }

  /**
   * Only available in the Trash view - permanently deletes the note after
   * confirming the "This action is IRREVERSIBLE" dialog.
   */
  async permanentlyDelete(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('delete').click();
    await expect(this.page.getByText('IRREVERSIBLE')).toBeVisible();
    await this.page.getByText('Yes', { exact: true }).click();
  }

  /**
   * Creates a brand-new notebook and links this note to it, in one flow:
   * right-click -> Notebooks -> Link notebooks -> Add notebook -> fill
   * title -> Create -> select the new notebook -> Done. Confirmed
   * 2026-09-16 - the notebook's name then appears as a badge under the
   * note's title in the sidebar list.
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
   * Creates a brand-new color and assigns it to this note, in one flow:
   * right-click -> Assign color -> Add color -> fill title + hex -> Create.
   * Confirmed 2026-09-16 - creating a color auto-applies it to the note
   * (no separate "select then Done" step, unlike notebooks) and it becomes
   * its own navigable collection in the left sidebar, the same way
   * Favorites/Archive/Trash are.
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
   * Copies a `nn://note/<id>` deep link to the OS clipboard - no dialog or
   * visible confirmation, confirmed 2026-09-16 by reading
   * navigator.clipboard.readText() afterward. Requires the
   * clipboard-read/clipboard-write permissions granted in
   * playwright.config.ts.
   */
  async copyLink(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('copy-link').click();
  }

  /**
   * Adds a reminder to the note. Requires the "notifications" permission
   * (see playwright.config.ts) - without it, the dialog's Add button just
   * re-shows a "Please grant notifications permission" message and does
   * nothing. `date` must be DD-MM-YYYY and in the future - the dialog
   * rejects a time earlier than "now", and its own default date/time value
   * is only a snapshot from when it opened, so pass an explicit date
   * rather than relying on that default (see utils/env.ts,
   * tomorrowDateDDMMYYYY()).
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
   * "Set expiry" is Pro-plan-gated - on a Free plan (which a fresh
   * signup always lands on) this opens an upgrade paywall instead of an
   * expiry-date dialog, confirmed 2026-09-16. This method just opens
   * whatever that click produces; the caller asserts which one it got.
   */
  async setExpiry(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('expiry-date').click();
  }

  /**
   * Locking a note the first time on an account prompts to set up a vault
   * (a separate password from the account password/app-lock PIN, used to
   * encrypt locked notes on this device) - confirmed 2026-09-16. This
   * method only opens that prompt; it doesn't complete vault creation.
   */
  async lock(noteItem: Locator): Promise<void> {
    await this.openFor(noteItem);
    await this.menuItem('lock').click();
  }
}
