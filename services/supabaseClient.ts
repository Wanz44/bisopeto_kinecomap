
import { createClient } from '@supabase/supabase-js';

// Récupération des variables injectées par Vite
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

/**
 * Vérifie si Supabase est correctement configuré.
 */
export const isSupabaseConfigured = () => {
    return !!supabaseUrl && !!supabaseKey && supabaseKey.length > 10;
};

/**
 * Instance du client Supabase.
 * Note: Le client est null si la config est manquante pour éviter les crashs au démarrage.
 */
export const supabase = isSupabaseConfigured() 
    ? createClient(supabaseUrl!, supabaseKey!) 
    : null;

/**
 * Test de santé de la connexion vers Supabase.
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
        // On tente de lire une ligne de la table users pour valider la clé
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.warn("Supabase connection check failed:", error.message);
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};
