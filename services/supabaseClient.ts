
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
    if (!supabase) {
        console.error("[BISO PETO CLOUD] Erreur : Client non initialisé. Vérifiez les secrets SUPABASE_URL/KEY.");
        return false;
    }
    try {
        // On tente de lire une ligne de la table users pour valider la clé
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.warn("[BISO PETO CLOUD] Échec de la vérification :", error.message);
            return false;
        }
        console.log("[BISO PETO CLOUD] Connexion établie avec succès. Temps réel actif.");
        return true;
    } catch (e) {
        console.error("[BISO PETO CLOUD] Erreur critique de connexion.");
        return false;
    }
};
