# Moninotes Maestro Automation

Automation testing for Moninotes using [Maestro](https://maestro.dev/):
- **Moninotes Web** (`dev-app.moninotes.com`) — web platform (Beta)
- **Android mobile** (`com.moniva.moniNote`)

Setup below is written for **Windows**. All flows are authored and run through **Maestro Studio** — no separate CLI install or Java runtime needed, Studio ships with its own bundled JVM and engine.

## Prerequisites (Windows)

1. **Git** — to clone this repo.

## Install Maestro Studio (Windows)

1. Download the Windows installer from the [Maestro Studio GitHub releases](https://github.com/mobile-dev-inc/maestro-studio/releases) — grab `win-Maestro-Studio-x64-setup.exe` from the latest release.
2. Run the installer and launch **Maestro Studio**.
3. Connect a device: for web, point it at a Chrome session; for Android, pick your running emulator/device.
4. Open a flow file (e.g. `maestro/web/flows/sign-up.yaml`) from this repo to run or step through it.

> **Note — a known Chrome-compatibility issue.** Web flows can hang indefinitely (no timeout, no error — `tapOn`/`assertVisible`/etc. just stall) against Chrome 150+, because Studio's bundled Selenium falls back to a broken no-op CDP (DevTools Protocol) implementation when it can't find one matching the browser version. Studio bundles its own JVM and engine, so this needs a Studio update specifically — check for a newer release if you hit it. Its logs live under `%APPDATA%\maestro-studio\logs\studio-server.log`; a `"no-op implementation of the CDP"` error there confirms this issue.

## Web flows

No device setup needed. Maestro's `chromium` web device actually drives your system-installed Google Chrome, automated via WebDriver with a disposable temp profile — there's no separate Chromium binary and no way to point it at a different browser.

Flow YAML uses `url:` instead of `appId:`:

```yaml
url: https://dev-app.moninotes.com
---
- launchApp
- assertVisible: "some text"
```

Run from Maestro Studio: connect the Chrome web device, open a flow file under `maestro/web/flows/`, and click Run.

Current web flows:
- `launch-web.yaml` — smoke test, app loads
- `sign-up.yaml` — creates a new account with a freshly generated test email, picks the Free plan, lands on `/notes`
- `sign-in.yaml` — signs in with a fixed mailinator test account and completes MFA via `get-mfa-code.js`
- `add-note.yaml` — chains `sign-up.yaml` via `runFlow` for a freshly authenticated session (in the same browser tab), re-launches the app to confirm the session survives, then creates a note and verifies its title and body were saved

Running multiple flow files independently gives each its own isolated browser — session state isn't shared between them. `runFlow` is the way to carry a session from one set of steps into the next, since a subflow runs in the same browser tab as its parent (see how `add-note.yaml` reuses `sign-up.yaml`).

If a web flow hangs unpredictably (`tapOn`/`assertVisible`/`extendedWaitUntil` stalling for minutes regardless of `timeout:`), see the Chrome-compatibility note under Install Maestro Studio above.

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

## npm wrapper (optional, requires the Maestro CLI)

```powershell
npm install
npm run maestro:web            # all web flows, headless
npm run maestro:web sign-in    # one flow by name, headless
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
│   └── web/
│       ├── flows/         # *.yaml Maestro flows (url-based)
│       └── scripts/       # JS helpers (test email, MFA code)
└── scripts/
    └── run-maestro.ts     # optional TS wrapper to run Maestro flows via the CLI
```
