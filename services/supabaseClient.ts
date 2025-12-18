
import { createClient } from '@supabase/supabase-js';

// URL du projet fournie par l'utilisateur
const supabaseUrl = 'https://xjllcclxkffrpdnbttmj.supabase.co';

// On utilise SUPABASE_KEY qui est injecté via vite.config.ts depuis le .env
const supabaseKey = process.env.SUPABASE_KEY;

/**
 * Vérifie la validité de la configuration
 */
export const isSupabaseConfigured = () => {
    return !!supabaseKey && supabaseKey.length > 20;
};

/**
 * Instance unique du client Supabase
 */
export const supabase = isSupabaseConfigured() 
    ? createClient(supabaseUrl, supabaseKey!) 
    : null;

/**
 * Utilitaire de test de connexion rapide
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // Simple requête de comptage sur la table users pour vérifier l'accès
        const { error } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
        return !error;
    } catch {
        return false;
    }
};
