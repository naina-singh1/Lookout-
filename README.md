# Lookout

A real-time pothole reporting and proximity alert app for Delhi, built with React Native and Firebase.

## About

Lookout lets users report potholes on Delhi's roads and receive live alerts when approaching a reported pothole while driving. Reports are shared across all users in real time, so the map gets more accurate the more people use it.

**Key features:**
- Live pothole map with severity-coded markers (red, orange, green)
- Proximity alerts with sound and vibration when within 100m of a pothole
- Background location tracking with push notifications while driving
- Voice-coded alerts — 3 beeps for severe, 2 for moderate, 1 for minor
- Route planner that highlights potholes along your path
- Points and leaderboard system for reporting and resolving potholes
- Mark potholes as resolved when roads are fixed
- English and Hindi language support
- Works on iOS and Android

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Firebase Firestore + Firebase Auth
- **Maps:** React Native Maps (Google Maps)
- **Location:** expo-location (foreground + background)
- **Notifications:** expo-notifications
- **Routing:** OSRM + Nominatim (free, no API key required)

## Prerequisites

- Node.js 18+
- Expo CLI
- EAS CLI (`npm install -g eas-cli`)
- Firebase project with Firestore and Authentication enabled
- Google Maps API key (Maps SDK for iOS + Android enabled)

## Installation

1. **Unzip the project and navigate into it**
   ```bash
   cd Lookout
   ```

2. **Install Node dependencies**
   ```bash
   npm install
   ```

3. **Install iOS native dependencies**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run the app**
   ```bash
   npx expo start
   ```

## Building for Production

**iOS (TestFlight):**
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

**Android (APK):**
```bash
eas build --platform android --profile preview
```

## Firestore Security Rules

Add these rules to your Firestore console to secure your database:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /potholes/{id} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Project Structure

```
Lookout/
├── assets/          # App icons and audio files
├── components/      # Reusable UI components
├── constants/       # Theme, colours, mock data
├── contexts/        # Language context (i18n)
├── screens/         # App screens (Map, Feed, Route, Profile, Auth)
├── services/        # Firebase, notifications, proximity, points, sound
├── tasks/           # Background location task
└── app.json         # Expo config
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
