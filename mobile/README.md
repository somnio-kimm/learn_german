# Mobile (Capacitor)

This directory wraps the `web/` PWA as native iOS and Android apps via Capacitor.

## First-time setup

The native projects (`ios/`, `android/`) are **not** committed initially —
they are large, toolchain-dependent, and Capacitor regenerates them
deterministically. Run these once locally:

```bash
cd mobile
npm install
npm run add:ios       # creates mobile/ios/
npm run add:android   # creates mobile/android/
```

Then commit the generated projects in a follow-up PR scoped to whichever
platform you set up first (e.g. `feat/<n>-ios-project` / `feat/<n>-android-project`).

## Sync the web bundle

Whenever `web/` changes:

```bash
npm run sync
```

This copies `../web/` into the platform-specific webview asset folders.

## Open in IDE

```bash
npm run open:ios       # opens Xcode
npm run open:android   # opens Android Studio
```
