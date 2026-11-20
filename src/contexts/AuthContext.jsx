/**
 * AuthContext — Firebase Authentication State Provider
 * CampusResolve AI — LPU Phagwara Campus
 *
 * Provides: currentUser, userProfile, loading, signup, login, logout, resetPassword
 * Roles stored in Firestore (never editable by user via frontend).
 */

import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore profile
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Register a new user with Firebase Auth and create Firestore profile.
   * Public registration is strictly restricted to students.
   * Staff accounts are provisioned exclusively through authorized administrative channels.
   */
  async function signup(email, password, fullName) {
    if (!isFirebaseConfigured) {
      throw new Error('FIREBASE_NOT_CONFIGURED');
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    try {
      // Set display name in Firebase Auth
      await updateProfile(user, { displayName: fullName });

      // Public registration ALWAYS assigns role: 'student' and department: null
      // Ignores and never accepts staff/admin roles or department from frontend input
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        role: 'student',
        department: null,
        createdAt: serverTimestamp(),
        campus: 'LPU Phagwara',
        isActive: true,
      });

      return credential;
    } catch (profileErr) {
      // If Firestore profile creation fails, clean up the newly created Auth user
      // so the account is not orphaned without a Firestore profile.
      try {
        await user.delete();
      } catch (cleanupErr) {
        console.warn('[AuthContext] Auth user cleanup warning:', cleanupErr.message);
      }
      throw profileErr;
    }
  }

  /**
   * Log in with email and password via Firebase Auth.
   */
  async function login(email, password) {
    if (!isFirebaseConfigured) {
      throw new Error('FIREBASE_NOT_CONFIGURED');
    }
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Log out the current user.
   */
  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  /**
   * Send password reset email via Firebase Auth.
   */
  async function resetPassword(email) {
    if (!isFirebaseConfigured) {
      throw new Error('FIREBASE_NOT_CONFIGURED');
    }
    return sendPasswordResetEmail(auth, email);
  }

  /**
   * Fetch Firestore user profile document for the authenticated user.
   * Auto-heals missing profiles for valid authenticated users.
   */
  async function fetchUserProfile(userOrUid) {
    if (!userOrUid) return null;
    const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid.uid;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }

      // Auto-heal: If user is authenticated in Auth but has no Firestore profile
      if (typeof userOrUid === 'object' && userOrUid.uid) {
        const defaultProfile = {
          uid: userOrUid.uid,
          fullName: userOrUid.displayName || userOrUid.email?.split('@')[0] || 'LPU Member',
          email: userOrUid.email?.toLowerCase().trim() || '',
          role: 'student',
          department: null,
          createdAt: serverTimestamp(),
          campus: 'LPU Phagwara',
          isActive: true,
        };
        try {
          await setDoc(docRef, defaultProfile);
          return defaultProfile;
        } catch (healErr) {
          console.warn('[AuthContext] Profile auto-heal warning:', healErr.message);
        }
      }
      return null;
    } catch (err) {
      console.error('[AuthContext] Failed to fetch user profile:', err);
      return null;
    }
  }

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const profile = await fetchUserProfile(user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    authError,
    isFirebaseConfigured,
    signup,
    login,
    logout,
    resetPassword,
    fetchUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
