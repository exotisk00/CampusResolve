/**
 * Firebase Client SDK Configuration
 * CampusResolve AI — Lovely Professional University (LPU), Phagwara Campus
 *
 * IMPORTANT: These are PUBLIC Firebase config values (NOT secret keys).
 * They are safe to include in frontend code — Firebase Security Rules
 * and backend Firebase Admin SDK control actual access and permissions.
 *
 * HOW TO CONFIGURE:
 *   1. Go to https://console.firebase.google.com
 *   2. Create a project (or use existing one)
 *   3. Project Settings → General → Your Apps → Web App
 *   4. Copy the firebaseConfig object values into VITE_ env vars in .env.local
 *
 * Required .env.local variables:
 *   VITE_FIREBASE_API_KEY=
 *   VITE_FIREBASE_AUTH_DOMAIN=
 *   VITE_FIREBASE_PROJECT_ID=
 *   VITE_FIREBASE_STORAGE_BUCKET=
 *   VITE_FIREBASE_MESSAGING_SENDER_ID=
 *   VITE_FIREBASE_APP_ID=
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env =
  (typeof import.meta !== 'undefined' && import.meta.env) ||
  (typeof process !== 'undefined' && process.env) ||
  {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is legitimately configured
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

// Safe initialization: Only initialize Firebase SDK when valid config is present.
// Prevents unhandled FirebaseError (auth/invalid-api-key) from crashing React on module load.
let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Initialization caught error:', err.message);
  }
}

export { app, auth, db };
export default app;
