# BookmarkChat — Expo Mobile Shell

This directory contains an **Expo (React Native) WebView shell** for BookmarkChat. It allows you to run, test, and preview BookmarkChat on your physical phone (iOS or Android) immediately via **Expo Go** without needing Xcode, Android Studio, or a Mac.

---

## Quick Start: Run on Your Phone in 60 Seconds

### 1. Install Expo Go on Your Device
- **iPhone / iPad:** Download **Expo Go** from the [Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
- **Android:** Download **Expo Go** from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).

### 2. Start the Expo Server
From the project root:
```bash
npm run expo:start
```
*(Or navigate to `mobile-expo` and run `npx expo start`)*

### 3. Open on Your Device
- **Android:** Open the **Expo Go** app and tap **Scan QR code**, then scan the QR code displayed in your terminal.
- **iOS:** Open the native **Camera** app, point it at the QR code in your terminal, and tap the **Open in Expo Go** notification.

---

## Preview Options

Inside the mobile shell, there is a small header strip at the top with a settings button (**⚙**):

1. **🌐 Live Production Site (`https://bookmarkchat.online`)**
   - The default URL. Loads the live cloud-deployed BookmarkChat application.

2. **💻 Local Development Server (`http://<YOUR_LOCAL_IP>:5173`)**
   - To preview your local code changes in real-time with hot module replacement (Vite HMR):
     1. Open a second terminal at the root and start Vite with network access:
        ```bash
        npm run dev -- --host
        ```
     2. In the Expo app on your phone, tap **⚙** and select **Local Dev Server** (or enter your computer's Wi-Fi IP address).

3. **🌍 Different Wi-Fi / Remote Network (`--tunnel`)**
   - If your phone is on cellular data or a different Wi-Fi network than your computer, start Expo using tunnel mode:
     ```bash
     npm run expo:tunnel
     ```

---

## Native Features Supported in the Shell
- **Android Hardware Back-Button:** Pressing your phone's back button navigates backwards in BookmarkChat's history instead of closing the app.
- **Full Media Playback:** Audio clips, snippets, videos, and full-screen player operate with inline media playback enabled.
- **Bridge Support:** Integrated with `src/utils/webview.js` (`window.ReactNativeWebView.postMessage`).
- **Dark Theme:** Status bar and background are styled to match BookmarkChat's dark `#0b0713` aesthetic.

