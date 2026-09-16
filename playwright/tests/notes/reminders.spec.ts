import { test, expect } from '../../fixtures/auth.fixture';
import { tomorrowDateDDMMYYYY } from '../../utils/env';

/**
 * Reminders. See NoteContextMenu.addReminder() for the underlying flow and
 * why an explicit future date/time is required rather than the dialog's own
 * default (it's a snapshot from when the dialog opened, and can itself
 * already be "in the past" by the time you submit).
 */

test.describe('Reminders', () => {
  test('adding a reminder surfaces the note under Reminders', async ({ freshNotesPage }) => {
    const editor = await freshNotesPage.createNote();
    await editor.setTitle('Reminder candidate');

    await freshNotesPage.contextMenu.addReminder(
      freshNotesPage.noteInList('Reminder candidate'),
      tomorrowDateDDMMYYYY(),
      '11:59 PM'
    );

    await freshNotesPage.goToReminders();
    await expect(freshNotesPage.noteInList('Reminder candidate')).toBeVisible();
  });
});
