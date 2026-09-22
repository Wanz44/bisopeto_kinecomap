import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import defaultConfig from '../firebase-applet-config.json';

// Configuration Firebase dynamique pour l'authentification
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || defaultConfig.appId,
};

// Initialisation de l'instance Firebase en mode singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Service d'authentification Firebase (Google & Email Auth)
export const auth = getAuth(app);
export const db = null as any;




