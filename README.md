# Moninotes Maestro Automation

Automation testing for Moninotes using [Maestro](https://maestro.dev/):
- **Moninotes Web** (`dev-app.moninotes.com`) — web platform (Beta)
- **Android mobile** (`com.moniva.moniNote`)

Setup below is written for **Windows** (PowerShell). macOS/Linux users can use the one-line curl installer instead — see the [official install docs](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli).

## Prerequisites (Windows)

1. **Java 17+** — Maestro CLI requires it. Install Temurin JDK or Oracle JDK, then confirm `JAVA_HOME` points at it:
   ```powershell
   java -version
   echo $env:JAVA_HOME
   ```
2. **Node.js** (for the npm wrapper) — install from [nodejs.org](https://nodejs.org).
3. **Git** — to clone this repo.

## Install Maestro CLI (Windows)

1. Download the latest `maestro.zip` from the [Maestro GitHub releases](https://github.com/mobile-dev-inc/maestro/releases).
2. Extract it to a stable location, e.g. `C:\maestro`.
3. Add it to your PATH (PowerShell, run as your user — restart the terminal after):
   ```powershell
   setx PATH "$env:PATH;C:\maestro\bin"
   ```
4. Verify:
   ```powershell
   maestro --version
   ```

> Maestro also supports installing inside WSL2, but the Maestro team recommends against it on Windows — it needs extra ADB port bridging (5037) between WSL and Windows and can cause flaky device detection. Prefer the native Windows CLI above.

## Web flows

No device setup needed. Maestro's `chromium` web device actually drives your system-installed Google Chrome, automated via WebDriver with a disposable temp profile — there's no separate Chromium binary and no way to point it at a different browser.

Flow YAML uses `url:` instead of `appId:`:

```yaml
url: https://dev-app.moninotes.com
---
- launchApp
- assertVisible: "some text"
```

Run (PowerShell):

```powershell
maestro test --headless maestro/web/flows/launch-web.yaml   # single flow
maestro test --headless maestro/web/flows/                  # every flow in the folder
npm run maestro:web                                          # via wrapper, all web flows, headless
npm run maestro:web sign-in                                  # via wrapper, one flow by name, headless
```

`npm run maestro:web` always runs with `--headless` (the wrapper adds it automatically) so the bundled Chromium never pops up a visible window — this avoids a one-time "Chromium is installed, click Close to launch" prompt on first run. Run `maestro test` directly (without `--headless`) if you want to watch the browser while authoring a flow.

Current web flows:
- `launch-web.yaml` — smoke test, app loads
- `sign-up.yaml` — creates a new account with a freshly generated test email, picks the Free plan, lands on `/notes`
- `sign-in.yaml` — signs in with a fixed mailinator test account and completes MFA via `get-mfa-code.js`
- `add-note.yaml` — chains `sign-up.yaml` via `runFlow` for a freshly authenticated session (in the same browser tab), re-launches the app to confirm the session survives, then creates a note and verifies its title and body were saved

`maestro test <folder>/` runs each flow file in its own isolated browser in parallel — it does not share session state between files. `runFlow` is the only way to carry a session from one set of steps into the next, since a subflow runs in the same browser tab as its parent.

> **Resolved:** the web flows used to hang unpredictably (`tapOn`/`assertVisible`/`extendedWaitUntil` stalling for minutes regardless of `timeout:`). Root cause was Maestro CLI 2.8.0's bundled Selenium missing a CDP (DevTools Protocol) implementation for Chrome 150+, silently falling back to a broken no-op stub — see the CLI 2.9.0+ requirement above. Upgrading resolved it; all web flows now run reliably headless with no hangs. If a run still stalls, confirm `maestro --version` is 2.9.0 or newer first.

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

Run:

```powershell
maestro test maestro/android/flows/launch-app.yaml
npm run maestro:android
npm run maestro:android sign-up
```

Current Android flows:
- `launch-app.yaml` — smoke test, app loads
- `sign-up.yaml` — creates a new account with a freshly generated test email, confirms it via `get-confirmation-link.js`

## npm wrapper

```powershell
npm install
```

`scripts/run-maestro.ts` shells out to the `maestro` CLI per flow file (`npm run maestro:<android|web> [flow-name]`) — Maestro itself has no native TS API, flows stay in YAML. This is optional convenience; `maestro test <path>` works standalone with no npm/TypeScript involved.

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
    └── run-maestro.ts     # optional TS wrapper to run Maestro flows
```
