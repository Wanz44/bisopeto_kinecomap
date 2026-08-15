import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely (singleton)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured database ID, long polling, and tab cache
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch (e) {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
  }
})();

export const auth = getAuth(app);
