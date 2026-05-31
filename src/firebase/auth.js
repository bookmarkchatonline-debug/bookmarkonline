// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './config';

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

/** Create user with email/password and write Firestore profile doc */
export async function registerWithEmail(email, password, username) {
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
    role: 'artist',
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

/** Sign in with Google — creates Firestore profile if first time */
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const userRef = doc(db, 'users', cred.user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await upsertUserProfile(cred.user.uid, {
      uid: cred.user.uid,
      username: cred.user.displayName || cred.user.email.split('@')[0],
      email: cred.user.email,
      avatarUrl: cred.user.photoURL || null,
      bio: '',
      role: 'artist',
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
  return cred.user;
}

/** Sign out */
export async function logout() {
  await signOut(auth);
}
