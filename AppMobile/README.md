# CesiZen Mobile App

This is the mobile application for CesiZen, built with React Native and Expo.

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)
- A physical mobile device or emulator

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd AppMobileCesiZen
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

## Running the App

1. Start the development server:
```bash
npm start
# or
yarn start
# or
npx expo start
```

2. Once the Metro Bundler starts, you can:
   - Press `a` to run on an Android emulator
   - Press `i` to run on an iOS simulator
   - Scan the QR code with the Expo Go app on your phone

## Connecting to Your Backend

The app is configured to connect to your Docker-based backend running locally:

- **Android Emulator**: Uses `10.0.2.2:3000` (special Android IP that points to host's localhost)
- **iOS Simulator**: Uses `localhost:3000`
- **Physical Device**: For physical device testing on the same network as your computer, you'll need to:
  1. Find your computer's IP address on your local network
  2. Uncomment and edit the line in `src/services/api.service.ts` and `auth.service.ts`:
     ```javascript
     // const API_URL = 'http://192.168.x.x:3000'; // Replace with your actual IP
     ```

Make sure your Docker backend is running and accessible on port 3000.

## Features

- User authentication (login, register)
- Dashboard with overview of wellness data
- Resources browsing
- Emotion tracking
- Diagnostic assessments
- User profile management

## Project Structure

- `src/components`: Reusable UI components
- `src/screens`: App screens
- `src/services`: API services
- `src/context`: React Context for state management
- `src/types`: TypeScript type definitions

## Backend Connection

The app connects to the CesiZen backend API. The API URL is configured in the API services.

For development with an Android emulator, the API URL is set to `http://10.0.2.2:3000` which points to `localhost:3000` on your development machine.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is proprietary and confidential. 