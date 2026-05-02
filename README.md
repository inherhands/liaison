# Liaison

A private, offline-first event and partnership tracking application. Manage your events, partnerships, and statistics all locally in your browser.

## Privacy & Security

**Your data stays on your device.** Liaison is designed with privacy as the top priority:

- All data is stored locally in your browser using IndexedDB
- No data is **ever** sent to external servers
- No tracking, analytics, or telemetry
- No accounts, logins, or cloud synchronization required
- Complete offline functionality

## Features

- **Event Management** - Create, track, and manage events with custom tags
- **Partnership Tracking** - Keep records of your partnerships and collaborations
- **Calendar View** - Visualize your events in an intuitive calendar interface
- **Statistics** - Get insights into your event data and patterns
- **Import/Export** - Backup your data by exporting to JSON or restore from backups
- **Responsive Design** - Works seamlessly on desktop and mobile devices

## Progressive Web App (PWA)

Liaison is a Progressive Web App, which means you can install it as a native app on your device:

### Installing as an App

**Desktop (Chrome, Edge, Firefox):**
1. Visit https://inherhands.github.io/liaison/
2. Click the **Install** button in the address bar (or use the menu)
3. Click **Install** in the dialog that appears
4. The app will be added to your applications

**Mobile (iOS/Android):**
- **Android**: Open the app in Chrome, tap the menu (⋮), select "Install app" or "Add to Home screen"
- **iOS**: Open the app in Safari, tap the Share button, select "Add to Home Screen"

Once installed, you can:
- Launch the app directly from your home screen or app drawer
- Work completely offline
- Get a native app experience with your data stored locally

## Getting Started

### Access the App

Open the live application here: **https://inherhands.github.io/liaison/**

### Updates

The online version automatically updates whenever new changes are pushed to the repository. Simply refresh your browser to load the latest version. No manual updates or installations required.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/inherhands/liaison.git
   cd liaison
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:4200/`

The application will automatically reload whenever you modify any source files.

## Development

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory. The production build is optimized for performance and speed.

## Technology Stack

- **Framework**: [Angular 21](https://angular.dev)
- **UI Library**: [Angular Material](https://material.angular.io)
- **Storage**: IndexedDB (browser-based local storage)

## Contributing

Feel free to fork the repository and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.
