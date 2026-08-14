import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables injectées par Vite / Vercel
const rawUrl = process.env.SUPABASE_URL;
const rawKey = process.env.SUPABASE_KEY;

const sanitizeEnv = (val?: string): string => {
    if (!val || typeof val !== 'string' || val === 'undefined' || val === 'null') return '';
    return val.trim();
};

const supabaseUrl = sanitizeEnv(rawUrl);
const supabaseKey = sanitizeEnv(rawKey);

/**
 * Valide si une chaîne est une URL HTTP/HTTPS valide.
 */
const isValidHttpUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== 'string') return false;
    try {
        const parsed = new URL(urlString);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

/**
 * Vérifie si Supabase est correctement configuré.
 */
export const isSupabaseConfigured = (): boolean => {
    return isValidHttpUrl(supabaseUrl) && !!supabaseKey && supabaseKey.length > 10;
};

/**
 * Instance du client Supabase sécurisée.
 * Ne lance jamais d'erreur au chargement initial si l'URL ou la clé est absente/invalide.
 */
export const supabase: SupabaseClient | null = (() => {
    try {
        if (isSupabaseConfigured()) {
            return createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                },
            });
        }
    } catch (err) {
        console.warn("[BISO PETO CLOUD] Supabase non initialisé (mode dégradé ou absent) :", err);
    }
    return null;
})();

/**
 * Test de santé de la connexion vers Supabase.
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    if (!supabase) {
        return false;
    }
    try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.warn("[BISO PETO CLOUD] Vérification Supabase :", error.message);
            return false;
        }
        return true;
    } catch {
        return false;
    }
};
