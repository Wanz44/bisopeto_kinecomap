
import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement
// Cette fonction empêche le crash si import.meta.env est indéfini
const getEnv = (key: string) => {
    try {
        // @ts-ignore
        const env = (import.meta as any).env;
        return env ? env[key] : '';
    } catch (e) {
        console.warn('Environment variable access warning:', e);
        return '';
    }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Vérification si la configuration est présente
export const isSupabaseConfigured = () => {
    return typeof supabaseUrl === 'string' && 
           supabaseUrl.length > 0 && 
           typeof supabaseAnonKey === 'string' && 
           supabaseAnonKey.length > 0 &&
           !supabaseUrl.includes('votre-projet');
};

// Initialisation du client uniquement si la config est bonne
export const supabase = isSupabaseConfigured() 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

// Helper pour gérer les erreurs
export const handleSupabaseError = (error: any) => {
    console.error("Supabase Error:", error);
    return error.message || "Une erreur inconnue est survenue";
};
