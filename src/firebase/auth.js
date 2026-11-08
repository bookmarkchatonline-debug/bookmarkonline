// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import {
  getPendingGoogleSignInRole,
  settleNativeGoogleSignInFailure,
  settleNativeGoogleSignInSuccess,
} from '../utils/webview';

/**
 * Translate Firebase Auth errors into clear, actionable messages for the user.
 */
export function getFriendlyAuthErrorMessage(err) {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const code = (err.code || '').toLowerCase();
  const message = (err.message || '').toLowerCase();

  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return "Incorrect email or password. If you don't have an account yet, tap 'Join free' below.";
  }
  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (code.includes('email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code.includes('weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Please wait a few moments and try again.';
  }
  if (code.includes('network-request-failed')) {
    return 'Network connection failed. Please check your internet connection.';
  }
  if (code.includes('popup-blocked') || code.includes('popup-closed')) {
    return 'Sign-in window was blocked or closed. Please sign in with email and password.';
  }
  if (code.includes('disallowed_useragent') || message.includes('disallowed_useragent')) {
    return 'Google Sign-In is blocked in this mobile preview. Please sign in with email and password below.';
  }
  if (code.includes('operation-not-supported') || message.includes('not supported') || message.includes('native google sign-in')) {
    return 'Google Sign-In requires the installed native app or desktop browser. Please sign in with email & password.';
  }

  const clean = (err.message || '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(auth\/[a-z0-9-]+\)\.?/i, '')
    .trim();

  return clean && clean.toLowerCase() !== 'error'
    ? clean
    : 'Authentication failed. Please check your credentials and try again.';
}

/**
 * Helper — write (or merge) the user profile doc in Firestore.
 * Retries once after 800ms if Firestore rejects (auth token propagation race).
 */
export async function upsertUserProfile(uid, data, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
      return;
    } catch (err) {
      if (i < retries - 1) {
        // Wait for Firebase auth token to propagate to Firestore rules engine
        await new Promise((r) => setTimeout(r, 800));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Create a Firestore users/{uid} profile on first Google sign-in.
 * Shared by loginWithGoogle (popup) and loginWithGoogleToken (native/WebView).
 */
async function ensureGoogleUserProfile(user, role = 'artist') {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  await upsertUserProfile(user.uid, {
    uid: user.uid,
    username: user.displayName || user.email.split('@')[0],
    email: user.email,
    avatarUrl: user.photoURL || null,
    bio: '',
    role,
    plan: 'free',
    creatorLevel: 'Rising Artist',
    stats: {
      followers: 0,
      totalLikes: 0,
      weeklyLikes: 0,
      uploads: 0,
      rankDelta: 0,
    },
    createdAt: serverTimestamp(),
  });
}

/** Create user with email/password and write Firestore profile doc */
export async function registerWithEmail(email, password, username, role = 'artist') {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Update Firebase Auth display name
  await updateProfile(cred.user, { displayName: username });
  // Write Firestore profile — retry once if auth token hasn't propagated yet
  await upsertUserProfile(cred.user.uid, {
    uid: cred.user.uid,
    username,
    email,
    avatarUrl: null,
    bio: '',
    role,
    plan: 'free',
    creatorLevel: 'Rising Artist',
    stats: {
      followers: 0,
      totalLikes: 0,
      weeklyLikes: 0,
      uploads: 0,
      rankDelta: 0,
    },
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

/** Sign in with email/password */
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Sign in with Google (browser) — creates Firestore profile if first time */
export async function loginWithGoogle(role = 'artist') {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureGoogleUserProfile(cred.user, role);
  return cred.user;
}

/**
 * Sign in with a Google ID token from native Android/iOS Google Sign-In.
 * Used when the app runs inside a WebView (popup OAuth is unavailable).
 */
export async function loginWithGoogleToken(idToken, role = 'artist') {
  if (!idToken) {
    throw new Error('Missing Google ID token');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await ensureGoogleUserProfile(cred.user, role);
  return cred.user;
}

/**
 * Expose a global entry point for the native WebView shell.
 * Native apps should call: window.bookmarkchatSignInWithGoogleTokens(idToken)
 */
export function registerNativeGoogleSignInBridge() {
  if (typeof window === 'undefined') return;

  window.bookmarkchatSignInWithGoogleTokens = async (idToken) => {
    try {
      const role = getPendingGoogleSignInRole();
      const user = await loginWithGoogleToken(idToken, role);
      settleNativeGoogleSignInSuccess(user);
      return user;
    } catch (err) {
      settleNativeGoogleSignInFailure(err);
      throw err;
    }
  };

  // Optional: native can report cancel/failure without an idToken
  window.bookmarkchatGoogleSignInFailed = (message) => {
    settleNativeGoogleSignInFailure(message || 'Google Sign-In cancelled');
  };
}

/** Sign out */
export async function logout() {
  await signOut(auth);
}
