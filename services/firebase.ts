import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultConfig from '../firebase-applet-config.json';

// Configuration Firebase dynamique alimentée par les variables d'environnement (avec fallback sécurisé)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.FIREBASE_APP_ID || defaultConfig.appId,
};

const databaseId = process.env.FIREBASE_DATABASE_ID || defaultConfig.firestoreDatabaseId;

// Initialisation de l'instance Firebase en mode singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialisation de Firestore avec la base de données configurée
export const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

// Service d'authentification Firebase
export const auth = getAuth(app);


