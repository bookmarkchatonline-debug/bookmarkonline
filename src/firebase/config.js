// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Capacitor } from '@capacitor/core';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Inside the Capacitor shell the app is served from a local origin, where the
// default persistence can be dropped when the WebView is torn down — which would
// sign the user out on every app launch. IndexedDB persistence keeps the session
// across restarts. The browser build keeps Firebase's default behaviour.
export const auth = Capacitor.isNativePlatform()
  ? initializeAuth(app, { persistence: indexedDBLocalPersistence })
  : getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
