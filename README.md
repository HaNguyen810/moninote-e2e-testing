# Moninotes Maestro Automation

Automation testing for Moninotes using [Maestro](https://maestro.dev/):
- **Moninotes Web** (`dev-app.moninotes.com`) — web platform (Beta)
- **Android mobile** (`com.moniva.moniNote`)

## Install Maestro CLI

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Then add Maestro to your shell PATH if the installer prompts you to (it installs to `~/.maestro/bin`). Verify with:

```bash
maestro --version
```

## Web flows

No device setup needed. Maestro manages its own Chromium instance automatically (downloads it on first run).

Flow YAML uses `url:` instead of `appId:`:

```yaml
url: https://dev-app.moninotes.com
---
- launchApp
- assertVisible: "some text"
```

Run:

```bash
maestro test maestro/web/flows/launch-web.yaml   # single flow
maestro test maestro/web/flows/                  # every flow in the folder
npm run maestro:web                              # via wrapper, all web flows
npm run maestro:web launch-web                   # via wrapper, one flow by name
```

## Android flows

Android needs a device. Maestro talks to it over `adb`, so you need Android SDK platform tools and a running emulator or connected device:

1. Install Android Studio (includes the SDK + emulator) or just the [command-line tools](https://developer.android.com/studio#command-tools).
2. Create an AVD: `Android Studio > Device Manager > Create device`, or via CLI:
   ```bash
   sdkmanager --install "system-images;android-34;google_apis;x86_64"
   avdmanager create avd -n maestro-test -k "system-images;android-34;google_apis;x86_64"
   emulator -avd maestro-test
   ```
3. Confirm the device is visible: `adb devices` should list it as `device` (not `offline`).
4. Install the Moninotes APK on the emulator/device (`adb install path/to/app.apk`) before running flows.

Flow YAML uses `appId:`:

```yaml
appId: com.moniva.moniNote
---
- launchApp
```

Run:

```bash
maestro test maestro/android/flows/launch-app.yaml
npm run maestro:android
npm run maestro:android launch-app
```

## npm wrapper

```bash
npm install
```

`scripts/run-maestro.ts` shells out to the `maestro` CLI per flow file (`npm run maestro:<android|web> [flow-name]`) — Maestro itself has no native TS API, flows stay in YAML. This is optional convenience; `maestro test <path>` works standalone with no npm/TypeScript involved.

## Structure

```
.
├── maestro/
│   ├── android/
│   │   ├── config.yaml    # shared appId
│   │   └── flows/         # *.yaml Maestro flows (appId-based)
│   └── web/
│       └── flows/         # *.yaml Maestro flows (url-based)
└── scripts/
    └── run-maestro.ts     # optional TS wrapper to run Maestro flows
```
