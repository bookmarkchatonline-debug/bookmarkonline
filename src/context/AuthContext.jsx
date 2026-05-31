// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load the user profile from Firestore, falling back to a default object if missing
  const loadProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const prof = await getUserProfile(currentUser.uid);
      if (prof) {
        setProfile(prof);
      } else {
        // Fallback for brand new users before profile is fully created
        setProfile({
          uid: currentUser.uid,
          username: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
          email: currentUser.email,
          avatarUrl: currentUser.photoURL || null,
          role: 'artist', // Default role
          plan: 'free',
          creatorLevel: 'Rising Artist',
          stats: {
            followers: 0,
            following: 0,
            totalLikes: 0,
            weeklyLikes: 0,
            uploads: 0,
            rankDelta: 0
          }
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
