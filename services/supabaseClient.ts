import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération sécurisée des variables d'environnement (Vite define, import.meta.env ou process.env)
const getEnvVar = (name: string): string => {
    try {
        if (typeof process !== 'undefined' && process.env && process.env[name]) {
            return String(process.env[name]).trim();
        }
    } catch {}
    try {
        const metaEnv = (import.meta as any).env;
        if (metaEnv && metaEnv[name]) {
            return String(metaEnv[name]).trim();
        }
    } catch {}
    return '';
};

const sanitizeEnv = (val?: string): string => {
    if (!val || typeof val !== 'string' || val === 'undefined' || val === 'null') return '';
    return val.trim();
};

const rawUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || 'https://xjllcclxkffrpdnbttmj.supabase.co';
const rawKey = getEnvVar('SUPABASE_KEY') || getEnvVar('VITE_SUPABASE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

export const supabaseUrl = sanitizeEnv(rawUrl);
export const supabaseKey = sanitizeEnv(rawKey);

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
 * Vérifie si Supabase est correctement configuré avec URL et Clé.
 */
export const isSupabaseConfigured = (): boolean => {
    return isValidHttpUrl(supabaseUrl) && !!supabaseKey && supabaseKey.length > 10;
};

/**
 * Instance du client Supabase principale avec persistance de session et Realtime.
 */
export const supabase: SupabaseClient | null = (() => {
    try {
        if (isSupabaseConfigured()) {
            return createClient(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    storageKey: 'bisopeto_supabase_auth',
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                    },
                },
            });
        }
    } catch (err) {
        console.warn("[BISO PETO SUPABASE] Initialisation du client :", err);
    }
    return null;
})();

/**
 * Test de connectivité vers la base de données Supabase.
 */
export const testSupabaseConnection = async (): Promise<boolean> => {
    if (!supabase) {
        return false;
    }
    try {
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) {
            console.warn("[BISO PETO SUPABASE] Diagnostic table users :", error.message);
            // S'il s'agit d'une table pas encore créée, la connexion est valide même si la table est absente
            return !error.message.includes('FetchError') && !error.message.includes('Network');
        }
        return true;
    } catch {
        return false;
    }
};

