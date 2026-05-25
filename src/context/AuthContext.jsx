// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getUserProfile } from '../firebase/firestore';
import { upsertUserProfile } from '../firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);   // Firebase Auth user
  const [profile, setProfile] = useState(null);  // Firestore profile doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        let prof = null;
        try {
          prof = await getUserProfile(firebaseUser.uid);
        } catch (err) {
          console.error('Error fetching user profile in AuthContext:', err);
        }

        // Auto-create profile if missing (e.g. existing accounts from before rules)
        if (!prof) {
          const profileData = {
            uid: firebaseUser.uid,
            username:
              firebaseUser.displayName ||
              firebaseUser.email?.split('@')[0] ||
              'Anonymous',
            email: firebaseUser.email || '',
            avatarUrl: firebaseUser.photoURL || null,
            bio: '',
            createdAt: serverTimestamp(),
          };
          try {
            await upsertUserProfile(firebaseUser.uid, profileData, 3);
            prof = { ...profileData, createdAt: null }; // local copy (no server timestamp yet)
          } catch (err) {
            console.error('Failed to auto-create user profile:', err);
          }
        }

        setProfile(prof);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const prof = await getUserProfile(user.uid);
        setProfile(prof);
      } catch (err) {
        console.error('Error refreshing user profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
