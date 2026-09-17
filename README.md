# Moninotes Automation

Automation testing for Moninotes, split by platform:
- **Android mobile** (`com.moniva.moniNote`) — [Maestro](https://maestro.dev/), `maestro/android/`
- **Moninotes Web** (`dev-app.moninotes.com`) — [Playwright](https://playwright.dev/), `playwright/`

Web used to be covered by Maestro too, but Maestro's web flows drove Chrome via WebDriver/CDP and had a documented hang bug on newer Chrome plus no ability to inspect network/console/DOM state - Playwright doesn't have either limitation and can additionally drive file-upload-shaped flows that Maestro's web driver couldn't. The legacy `maestro/web/` flows have been removed now that Playwright covers the same ground.

The Maestro setup below is written for **Windows** and covers Android only. All Maestro flows are authored and run through **Maestro Studio** — no separate CLI install or Java runtime needed, Studio ships with its own bundled JVM and engine. Playwright is a standalone npm dependency and works cross-platform.

## Prerequisites (Windows)

1. **Git** — to clone this repo.

## Install Maestro Studio (Windows)

1. Download the Windows installer from the [Maestro Studio GitHub releases](https://github.com/mobile-dev-inc/maestro-studio/releases) — grab `win-Maestro-Studio-x64-setup.exe` from the latest release.
2. Run the installer and launch **Maestro Studio**.
3. Connect a device: pick your running Android emulator/device.
4. Open a flow file (e.g. `maestro/android/flows/sign-up.yaml`) from this repo to run or step through it.

## Android flows

Android needs a device. Maestro talks to it over `adb`, so you need Android SDK platform tools and a running emulator or connected device.

1. Install Android Studio (includes the SDK + emulator), or just the [command-line tools](https://developer.android.com/studio#command-tools).
2. Make sure `adb` is on your PATH — Android Studio installs the SDK under `%LOCALAPPDATA%\Android\Sdk` by default; add `%LOCALAPPDATA%\Android\Sdk\platform-tools` to PATH.
3. Create an AVD: `Android Studio > Device Manager > Create device`, or via CLI:
   ```powershell
   sdkmanager --install "system-images;android-34;google_apis;x86_64"
   avdmanager create avd -n maestro-test -k "system-images;android-34;google_apis;x86_64"
   emulator -avd maestro-test
   ```
   (Windows note: Android emulator needs hardware virtualization — enable Hyper-V / Windows Hypervisor Platform, or use Intel HAXM if not on Hyper-V.)
4. Confirm the device is visible: `adb devices` should list it as `device` (not `offline`).
5. Install the Moninotes APK on the emulator/device (`adb install path\to\app.apk`) before running flows.

Flow YAML uses `appId:`:

```yaml
appId: com.moniva.moniNote
---
- launchApp
```

Run from Maestro Studio: connect your emulator/device, open a flow file under `maestro/android/flows/`, and click Run.

Current Android flows:
- `launch-app.yaml` — smoke test, app loads
- `sign-up.yaml` — creates a new account with a freshly generated test email, confirms it via `get-confirmation-link.js`

## Web flows (Playwright)

```bash
npm install
npx playwright install chromium   # first time only
npm run test:web                  # headless, all specs
npm run test:web:ui               # interactive UI mode
npm run test:web:report           # open the last HTML report
```

Structured as Page Object Model: `playwright/pages/` (one class per screen - `LoginPage`, `SignUpPage`, `NotesListPage`, `NoteEditorPage`, `EnterprisePage`, `SettingsPage`), `playwright/components/` for reusable pieces embedded in a page (`MfaModal`, `InsertBlockMenu`, `AccountMenu`, `NoteContextMenu`, `PlanSelectionModal`), and `playwright/fixtures/auth.fixture.ts` extends Playwright's `test` with two fixtures that are already signed in when the test body runs:
- `notesPage` - the fixed test account, via full sign-in + MFA. Use only when a test needs that account's persistent data (e.g. enterprise membership) - it depends on Mailinator, see "Known issues" below.
- `freshNotesPage` - a brand-new account via sign-up, no MFA/email wait at all. **Prefer this** for anything that doesn't specifically need the fixed account.

Specs shouldn't call `LoginPage`/`SignUpPage` directly except inside `tests/auth/` - everywhere else should consume `notesPage`/`freshNotesPage`.

Current specs:
- `tests/auth/sign-in.spec.ts` - the fixed test account can reach `/notes` (MFA-dependent, see Known issues)
- `tests/smoke/smoke.spec.ts` - fast happy-path coverage on `freshNotesPage`: app loads logged-out, sign-up reaches an empty notes list, a note can be created, search finds it (live/partial/case-insensitive, per manual QA on 2026-09-13), and a note survives a reload
- `tests/notes/note-management.spec.ts` - Favorite/Archive/Move to trash (all reached via the list item's right-click context menu - there's no hover/ellipsis button) and editing an existing note's title
- `tests/notes/note-management-2.spec.ts` - Pin, Read only, and the Trash view's own Restore/permanent Delete actions (a different context menu than the Notes-view one)
- `tests/notes/note-content.spec.ts` - body text persists across a reload, a tag can be added, duplicating a note copies its body content too
- `tests/notes/formatting.spec.ts` - Bold/Italic/Underline on selected text, and converting a line to a checklist item + toggling it checked/unchecked
- `tests/notes/organization.spec.ts` - linking a note to a newly created notebook, and creating/assigning a color (colors become their own sidebar collection)
- `tests/notes/sharing.spec.ts` - Copy link puts a `nn://note/<id>` deep link on the clipboard; Lock's entry point (full vault creation/unlock flow not covered, see Known issues)
- `tests/notes/reminders.spec.ts` - adding a reminder (needs the "notifications" permission and an explicit future date - see Known issues) surfaces the note under Reminders
- `tests/notes/plan-gating.spec.ts` - "Set expiry" is Pro-plan-gated; a Free-plan account gets an upgrade paywall instead of the expiry dialog
- `tests/notes/export.spec.ts` - Markdown/Text/HTML export each produce a genuine browser download with verifiable content; PDF deliberately not covered (see Known issues)
- `tests/notes/upload-attachment.spec.ts` - the PNG/GIF/JPEG/PDF upload-and-decrypt regression run manually on 2026-09-15 (boss's ask after an afternoon spot-check found images failing to decrypt), now codified as specs
- `tests/settings/subscription.spec.ts` - Settings > Subscription details shows the current plan and its usage limits; its Upgrade button opens the plan selection modal
- `tests/settings/sync.spec.ts` - Settings > Sync's four toggles and Force push/pull are Essential-plan-gated on Free (same paywall pattern as plan-gating.spec.ts), and its "Compare all plans" link opens the full plan comparison modal
- `tests/settings/plan-selection.spec.ts` - the "Select a plan" pricing modal shows correct Yearly pricing; also documents a real bug (see Known issues) via `test.fail()`
- `tests/admin/admin-console.spec.ts` - structure-only for now, pending admin credentials (see Known issues)

### Known issues found while building this suite (2026-09-15)

**"Upload from disk" cannot be automated with `page.setInputFiles()`.** The editor's Image/Attachment "Upload from disk" menu item calls `window.showOpenFilePicker()` (the File System Access API) instead of using a plain `<input type="file">` - there is no file input in the DOM to target, and neither `HTMLInputElement.prototype.click` nor `window.showOpenFilePicker` could be intercepted from outside the app bundle. **Workaround:** the editor's paste handler accepts a synthetic `ClipboardEvent('paste')` carrying a `File` in a `DataTransfer`, which behaves identically to a real Cmd/Ctrl+V and requires no OS clipboard access - see `playwright/utils/pasteFile.ts`. This is also a real user-facing upload path in its own right (pasting a screenshot or copied file), not just a test workaround.

**Login/signup text fields don't have real `placeholder` attributes.** "Enter email address", "Enter account password", "Enter 6 digit code" etc. render as a floating label (the field's accessible *name*), not the HTML `placeholder` attribute - `page.getByPlaceholder()` matches 0 elements even though the same text is visibly on screen. Use `page.getByRole('textbox', { name: ... })` instead (see `LoginPage`/`MfaModal`). The notes list search box and the note title field, by contrast, *do* use real `placeholder` attributes and `getByPlaceholder()` works fine there - check per field rather than assuming one pattern app-wide.

**Cold load time is inconsistent - ~10s one day, up to ~40s the next.** The app runs through a multi-tab SharedWorker/IndexedDB provider election ("Starting up the engines" → sometimes "Migrating database. This might take a while." → "Decrypting your notes") before rendering `/login` or `/signup`. This took ~10s on 2026-09-15 but was measured up to ~40s on 2026-09-16 against the same environment with no code changes on this suite's side - it isn't a fixed constant to tune once. `LoginPage.goto()`/`SignUpPage.goto()` wait for the email field specifically at 45s, and the global `expect.timeout` in `playwright.config.ts` is set to 15s (Playwright's own default is 5s) so a bare `expect()` without its own override (e.g. `waitUntilLoaded()`) doesn't flake on a slow day either. If tests start timing out again, check whether the cold load itself is just slower right now before assuming a regression.

**Mailinator's public API rate-limits polling, and can just be unreliable.** The same free-tier inbox used by the now-removed Maestro web flows (`moninotes-signintest-mfa@mailinator.com`) returns HTTP 429 if polled faster than roughly every 15s, and separately can return plain HTTP 500s or simply never receive an email at all (confirmed by checking the inbox directly - `curl -i https://api.mailinator.com/api/v2/domains/public/inboxes/moninotes-signintest-mfa`) with nothing to do with this suite's code. `utils/mailinator.ts` polls at 15s intervals to match that previously proven-out cadence. **This is why `freshNotesPage` (sign-up) is preferred over `notesPage` (sign-in) wherever a test doesn't specifically need the fixed account** - sign-up needs no email round-trip at all.

**The notes list is virtualized, and a note's title can appear twice in the DOM.** `[data-testid="virtuoso-item-list"]` only renders rows currently in view, and a bare `page.getByText(title)` for a note's title also matches that same title rendered on its own open editor tab - both cause strict-mode violations or false negatives. `NotesListPage.noteInList()` scopes to the virtuoso container specifically; use it instead of matching by text directly. Likewise `NoteEditorPage`'s title field can have more than one match if a previous tab is still mounted off-screen - `titleInput` takes `.last()` for this reason.

**A note's title save is debounced past the blur event - reloading immediately after typing can lose it entirely.** Calling `setTitle()` then `page.reload()` back-to-back landed on a completely empty "Untitled" note in both open tabs (confirmed 2026-09-15) - the title never made it to local storage in time. `NoteEditorPage.setTitle()` blurs the field, but that alone isn't enough; anything that reloads/navigates right after setting a title should add a short wait first (see `tests/smoke/smoke.spec.ts`, "survives a page reload"). This might be worth a real product bug report if a real user can trigger the same data loss by refreshing quickly after typing a title - it wasn't investigated further here since reproducing the exact debounce window was enough to make the suite reliable.

**A note list item has no hover/ellipsis button - all actions (Favorite, Archive, Move to trash, Duplicate, Tags, ...) are only reachable via right-click.** `NoteContextMenu` drives this. Each menu item carries a stable `data-test-id="menu-button-<action>"` (e.g. `menu-button-archive`) - prefer that over matching the item's visible text, since "Archive" in particular is ambiguous: the same word is also the left sidebar's nav item text, so `page.getByText('Archive')` resolves to two elements and throws a strict-mode violation.

**The left sidebar's Notes/Favorites/Trash/Archive/Reminders items are clickable `<div>`s, not `<button>` elements.** `page.getByRole('button', { name: 'Favorites' })` matches nothing (confirmed 2026-09-15) even though the item is clearly clickable on screen. `NotesListPage.sidebarItem()` uses `getByText(name, { exact: true })` instead.

**A tag name renders in three places at once, and two of them collide with a bare text match.** Adding a tag shows it in the sidebar list item's preview text *and* in the open editor's tag area - `page.getByText(tag)` matches both and throws a strict-mode violation. `NoteEditorPage.tagChip()` scopes to `#editorContainer`. Separately, the "Add a tag" input has the same multi-tab-mounting duplication as the title field (see below) - `tagInput` also takes `.last()`.

**A previous tab's fields can stay mounted (and disabled) after switching notes**, not just the title field noted earlier - the "Add a tag" input showed the identical pattern: two matches for the same placeholder, the stale one `disabled`. Any new per-note field locator added to `NoteEditorPage` should default to `.last()` unless proven otherwise, rather than assuming a bare `getByPlaceholder`/`getByRole` is safe.

**The note list item's right-click context menu has entirely different contents depending on which view it's opened from.** In Notes/Favorites/Archive it's the full Open/PIN/Read only/Favorite/Lock/.../Move to trash menu; in Trash it's just Restore and Delete - there's no "Move to trash" item to wait for there, so `NoteContextMenu.openFor()` waits on the generic `[data-test-id="menu-container"]` wrapper rather than any specific item, to work from either view.

**A checklist item's checkbox has no accessible role or form control at all - it's a CSS pseudo-element positioned outside the `<li>`'s own bounding box.** Clicking anywhere inside the `<li>`'s rect (including its own left edge) does nothing; the actual clickable checkbox sits roughly 8-20px to the *left* of that rect, confirmed by probing offsets directly. `NoteEditorPage.toggleChecklistItem()` clicks at a fixed `box.x - 16` offset rather than anywhere on the `<li>` locator itself.

**Toggling "Read only" removes the contenteditable attribute entirely, it doesn't just disable it.** After toggling, `[contenteditable="true"]` matches 0 elements rather than an element with `contenteditable="false"` - the editor is swapped for a genuinely different (non-editable) view. `NoteEditorPage.isBodyEditable()` checks element *count*, not an attribute value, for this reason.

**Notebooks and Colors have different apply semantics, despite very similar creation dialogs.** Creating a notebook (Notebooks -> Link notebooks -> Add notebook -> Create) leaves you back in a "Select notebooks" picker - you still have to select it and click Done. Creating a color (Assign color -> Add color -> Create) applies it to the note immediately, no separate select-and-confirm step. `NoteContextMenu.linkToNewNotebook()` and `.assignNewColor()` reflect this difference; don't assume one implies the other's behavior.

**Once created, a color becomes its own top-level sidebar collection, the same as Favorites/Trash/Archive.** `NotesListPage.goToColor(name)` reuses the same clickable-`<div>` sidebar pattern as the built-in collections.

**"Copy link" and Lock's "Create vault" step need `clipboard-read`/`clipboard-write` permission and careful text scoping respectively.** Playwright's `navigator.clipboard.readText()` throws without the permission granted in `playwright.config.ts`'s `use.permissions`. Separately, the "Create vault" dialog's heading and its submit button both render the exact text "Create vault" - `page.getByText('Create vault')` is a strict-mode violation there; scope to the dialog's unique description text instead (see `tests/notes/sharing.spec.ts`).

**Locking a note is a much deeper feature than it looks from the context menu - it's gated behind creating a whole separate "vault" password**, distinct from both the account password and the app-lock PIN. This suite only verifies the entry point (the "Create vault" prompt appears); actually creating a vault and testing a locked note's unlock flow was judged out of scope for this pass - it would need its own dedicated fixture/spec given the extra password state involved.

**Investigated further on 2026-09-16: after actually creating a vault (filling `#password`/`#confirmPassword` in the `password-dialog` and submitting), the locked note shows "Please enter the password to unlock this note" with an "Open note" button - but clicking that button appears to do nothing.** Tried three ways: `locator.click()`, `locator.click({force: true})`-equivalent via `.last()`, and a fully native `page.mouse.move/down/up` sequence at the button's exact coordinates - none produced any visible change, no new dialog, no console output, nothing in 10+ attempts. This is a genuinely suspicious finding (a real user would notice a dead button immediately), but it wasn't escalated as a confirmed bug here because: (a) the account throughout this investigation showed a persistent "Email not confirmed" banner (the same Mailinator confirmation-email delivery issue affecting the rest of this suite), which the unlock flow might silently depend on, and (b) it was only tested in headless Chromium - per this project's own established caution (see project memory on synthetic-click false positives), a click that "does nothing" in headless automation should be re-verified with a real click in a real browser before being reported as a bug. **Recommended next step:** manually try locking a note and clicking "Open note" in a real desktop Chrome session, ideally on a confirmed-email account, before deciding whether this needs a bug report or just a differently-timed automated test.

**Running several headless Chromium instances against dev-app.moninotes.com at once (e.g. the test suite plus ad-hoc exploration scripts) can itself cause `SignUpPage`/`LoginPage` cold-load timeouts, even at 45s.** Confirmed 2026-09-16: a 22-test combined run had 5 failures, all the identical "email field never appeared" timeout, while ~10 Chromium processes were running concurrently on the machine (test run + separate one-off exploration scripts). Re-running the same 5 tests individually, with nothing else running, passed every one. Before concluding the app or the suite has regressed, check `ps aux | grep -i chromium` (or `playwright test`) for other concurrent runs eating the same machine's resources - it looks identical to a real dev-environment slowdown from inside a single test's failure message.

**Reminders need the "notifications" browser permission, and reject a time that's already passed by the moment you submit.** Without `notifications` granted (see `playwright.config.ts`'s `use.permissions`), the dialog's "Add" button silently does nothing except re-show "Please grant notifications permission to add new reminders." - confirmed 2026-09-16. Separately, even with the permission granted, submitting the dialog's own pre-filled default date/time can fail with "Reminder time cannot be earlier than the current time." - that default is a snapshot taken when the dialog opened, not a live clock, so by the time a slower test actually clicks Add it can already be in the past. Always pass an explicit future date via `NoteContextMenu.addReminder(noteItem, date, time)` rather than accepting the dialog's default - see `utils/env.ts`'s `tomorrowDateDDMMYYYY()`. Also note: the Date/Time fields are real `<input id="date">`/`<input id="time">` elements with no `placeholder` attribute - the "DD-MM-YYYY"/"hh:mm AM/PM" text visible next to their labels is a separate `<span>` hint, not something `getByPlaceholder()` will ever match.

**"Set expiry" and image/file uploads share the exact same Pro-plan storage gate - and a fresh sign-up can never test the upload path at all.** A fresh account (`freshNotesPage`) always lands on the Free plan, which shows the identical "Storage is not available on this plan" paywall for both "Set expiry" and any paste/upload into a note - confirmed 2026-09-16, after `tests/notes/upload-attachment.spec.ts` was switched to `freshNotesPage` and every image/PDF test failed with the image/attachment never appearing (it was silently blocked by the paywall, not a real regression). **That spec was reverted back to `notesPage`** (the fixed paid-plan test account) specifically because uploads need real storage, unlike every other spec in this suite where `freshNotesPage` is still the right default.

**`upload-attachment.spec.ts` used `__dirname`, which doesn't exist in this package's ESM (`"type": "module"`) - it crashed at import time and none of its tests had ever actually run.** The error only surfaces when Playwright tries to *load* the file, not when a specific test in it runs - so passing `--grep`/`--grep-invert` to skip it doesn't help, since grep filters test names after files are already imported. Fixed with `import.meta.dirname` (Node 20.11+/21.2+) instead of `__dirname`. Worth remembering: a spec file that type-checks cleanly and was never actually executed can still be completely broken - `tsc --noEmit` does not catch a runtime-only ESM issue like this.

**"Export as" -> Markdown/Text/HTML fire a normal Playwright `download` event; PDF does not, and it's unclear why.** Confirmed 2026-09-16: clicking PDF produces no `download` event even at a 30s wait, no new page/tab, no `window.print()` call (checked by monkey-patching it before the click), and no PDF-related network request - from the outside it looks like the click simply does nothing. `NoteContextMenu.exportAs()` still accepts `'pdf'` as a format (the code path is there if this gets revisited), but `export.spec.ts` deliberately only tests md/txt/html. This might be a real silent-failure product bug, or it might be specific to headless Chromium's print-to-PDF path not reproducing on a real desktop browser - automated evidence alone can't distinguish those, so it needs a manual check on non-headless Chrome before writing either a bug report or a test for it.

**BUG: the "Select a plan" pricing modal shows a duplicate, mispriced "Essential" card when Monthly billing is selected.** Confirmed 2026-09-17 by direct inspection (screenshot + `innerText` dump, not a snapshot-tooling artifact): Yearly billing correctly shows one card per plan (Free/Essential/Pro), but switching to Monthly renders *two* "Essential" cards back to back - one at the correct $1.99/month, a second, otherwise identical one at $24/month. `tests/settings/plan-selection.spec.ts` codifies this as a `test.fail()` so it's tracked without failing the suite; remove that annotation once the duplicate card is fixed.

**CTA-style action buttons ("Upgrade", "Start your free trial", "Compare all plans", "Force push/pull changes") don't match `page.getByRole('button', { name })`, even though they're real, enabled `<button>` elements.** Confirmed 2026-09-17 via a direct `page.evaluate()`-vs-locator comparison in the same test: raw DOM queries and `getByText` both find these buttons reliably (stable for 90+ seconds once rendered), but `getByRole('button', ...)` consistently finds zero matches for exactly these four, even with a 60s timeout - not a timing issue. Likely an accessible-name mismatch (e.g. an icon inside the button contributing to the computed name). `SettingsPage`/`PlanSelectionModal` use `getByText(..., { exact: true })` for these specifically; `getByRole('button', ...)` still works fine elsewhere in this suite (e.g. `LoginPage`, `SignUpPage`), so don't assume this pattern applies app-wide - check per element.

**`page.locator('div').filter({ hasText })` also matches every ancestor div, not just the specific row you want** - a real bug caught while writing `SettingsPage`'s sync-toggle locators: `.filter({ hasText: 'Enable sync' })` matched the single row *and* every containing wrapper up to the whole Sync panel (since substring `hasText` checks the full descendant text), so `.locator('label').last()` on that result silently resolved to the *last* toggle in the panel ("Full offline mode") instead of the intended one - confirmed by watching `toggleSync('Enable sync')` actually trip the "Full offline mode" paywall. Fixed by anchoring on the row's own exact-text label first, then walking up to the nearest ancestor that actually contains the checkbox (`xpath=ancestor::div[.//input[@type="checkbox"]][1]`) - see `SettingsPage.syncRow()`. Worth remembering for any future locator built on `.filter({ hasText })` over a broad tag like `div`.

## npm wrapper (optional, requires the Maestro CLI)

```powershell
npm install
npm run maestro:android
npm run maestro:android sign-up
```

`scripts/run-maestro.ts` shells out to the `maestro` CLI per flow file — Maestro itself has no native TS API, flows stay in YAML. **This is the one path in this repo that still needs the CLI**, separately from Maestro Studio: install it from the [official install docs](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) (Java 17+ required) if you want to run flows this way, e.g. for scripting or CI. It isn't needed for the Studio-based workflow described above.

## Structure

```
.
├── maestro/
│   ├── android/
│   │   ├── config.yaml    # shared appId
│   │   ├── flows/         # *.yaml Maestro flows (appId-based)
│   │   └── scripts/       # JS helpers (test email, email confirmation link)
├── playwright/
│   ├── pages/              # Page Object Model - one class per screen
│   ├── components/         # reusable pieces embedded in a page (modals, menus)
│   ├── fixtures/
│   │   ├── auth.fixture.ts # extends `test` with an already-signed-in `notesPage`
│   │   └── files/          # PNG/GIF/JPEG/PDF fixtures for upload specs
│   ├── utils/               # env config, Mailinator polling, the paste-upload helper
│   ├── tests/               # *.spec.ts, organized by feature area
│   └── playwright.config.ts
└── scripts/
    └── run-maestro.ts     # optional TS wrapper to run Maestro flows via the CLI
```
