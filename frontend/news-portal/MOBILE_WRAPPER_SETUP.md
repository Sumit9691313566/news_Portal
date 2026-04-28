# Garud Samachar Mobile Wrapper

This project now includes Capacitor-based Android and iOS wrappers around the live website.

## What is configured

- Android wrapper in `frontend/news-portal/android`
- iOS wrapper in `frontend/news-portal/ios`
- Live website loading from `https://garudsamachar.in`
- Android secure screen flag enabled via `FLAG_SECURE`
- Android backups disabled
- iOS privacy shield for app switcher and active screen capture/recording
- Frontend API resolution adjusted so the wrapper can talk to the live backend safely

## Useful commands

```bash
npm run build
npm run cap:sync
npm run cap:android
npm run cap:ios
```

## Android

Open the Android project:

```bash
npm run cap:android
```

In Android Studio:

1. Wait for Gradle sync.
2. Run on a device or emulator.
3. `FLAG_SECURE` will block normal screenshots and recent-app previews.

## iOS

Open the iOS project:

```bash
npm run cap:ios
```

In Xcode:

1. Open on a Mac.
2. Let Swift packages resolve.
3. Run on a real device or simulator.

Note: iOS does not offer the same hard screenshot blocking as Android for all cases. The wrapper includes a privacy shield for app switching and active capture/recording detection, which is the stable native approach available here.

## After frontend updates

Whenever the website frontend changes, refresh the wrapper:

```bash
npm run build
npm run cap:sync
```
