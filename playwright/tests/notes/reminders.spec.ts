import { test, expect } from '../../fixtures/auth.fixture';
import { tomorrowDateDDMMYYYY } from '../../utils/env';

/**
 * Reminders. Xem NoteContextMenu.addReminder() de biet flow ben duoi va ly
 * do phai truyen date/time tuong lai tuong minh thay vi dung default cua
 * dialog (default do la snapshot tu luc dialog mo, co the da "qua khu" mat
 * roi vao luc submit).
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
