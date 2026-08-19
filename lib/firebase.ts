import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';

export { app, db, auth } from '../services/firebase';

/**
 * Connecte l'utilisateur via Google Auth avec détection fine des erreurs
 * et signalement pour basculement vers la saisie manuelle.
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return { user: result.user, fallbackToManual: false };
  } catch (error: any) {
    const errorCode = error?.code || '';
    // Détection des erreurs typiques de popup ou de configuration
    const isPopupError = [
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/popup-blocked',
      'auth/unauthorized-domain',
      'auth/operation-not-allowed'
    ].includes(errorCode);

    return { 
      user: null, 
      fallbackToManual: true, 
      errorCode, 
      error 
    };
  }
};

