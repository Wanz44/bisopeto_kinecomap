
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par Vite via 'define' dans vite.config.ts
// Cela correspond à votre configuration Vercel (SUPABASE_URL et SUPABASE_KEY)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

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
    ? createClient(supabaseUrl!, supabaseAnonKey!) 
    : null;

// Helper pour gérer les erreurs
export const handleSupabaseError = (error: any) => {
    console.error("Supabase Error:", error);
    return error.message || "Une erreur inconnue est survenue";
};
