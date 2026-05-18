# Liaison

A private, offline-first app for tracking events, partnerships, and device usage. Everything lives in your browser -- no accounts, no servers, no cloud sync.

## Features

**Events and partnerships.** Create and manage events with custom tags and positions. Keep records of partners and browse your history by calendar or list.

**Timers.** Track time spent on devices. Start and stop timers per device, review sessions, and see breakdowns by device and year in the statistics page.

**Statistics.** See summaries of your event data and timer sessions, broken down by partner, tag, and time period.

**Import and export.** Back up everything to a JSON file and restore it on any device.

**Responsive design.** Works on desktop and mobile. Can be installed as a PWA from the browser.

## Privacy

All data is stored locally using IndexedDB in your browser. Once installed, the app makes no network calls at all during normal use. There is no telemetry, no analytics, and no login required.

The only optional network activity is when you tap "Check for Updates" in Settings. That fetches a small manifest file from whichever server you installed the app from -- the GitHub Pages host, or your own server if you self-host. No data from your device is sent.

## Using the app

The hosted version is available at https://inherhands.github.io/liaison/

You can install it as an app on any device. On desktop, look for the install button in the address bar. On Android, use "Add to Home screen" from the Chrome menu. On iOS, use the Share button in Safari and choose "Add to Home Screen."

To check for updates, go to Settings and tap "Check for Updates." The app does not check automatically.

## Self-hosting

You can build and host your own copy of Liaison with no dependency on GitHub Pages or any external service. The app has no backend and makes no external calls, so any static file host works.

**Build it:**

```bash
git clone https://github.com/inherhands/liaison.git
cd liaison
npm install
npm run build
```

The output goes to `dist/liaison/browser/`. Copy that folder to any web server, object storage bucket, or local file host and it will work as a fully self-contained app. There are no API keys, no environment variables, and no callbacks to GitHub or any other service.

If you want to run it locally without a web server:

```bash
npm start
```

Then open `http://localhost:4200/` in your browser. This mode supports live reloading during development.

## Tech stack

Built with Angular 21, Angular Material, and IndexedDB for storage.

## License

MIT
