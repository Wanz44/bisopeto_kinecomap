import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with robust connection settings for web preview / offline fallback
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch {
    // If already initialized, retrieve existing Firestore instance
    return getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  }
})();

export const auth = getAuth(app);
