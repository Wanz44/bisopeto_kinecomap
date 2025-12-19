
import { User, MarketplaceItem, Vehicle, Collector, Course, AdCampaign, Partner, UserType, SystemSettings, WasteReport, GlobalImpact, DatabaseHealth } from '../types';
import { OfflineManager } from './offlineManager';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from './supabaseClient';

const KEYS = {
    USERS: 'kinecomap_users',
    MARKETPLACE: 'kinecomap_marketplace',
    VEHICLES: 'kinecomap_vehicles',
    JOBS: 'kinecomap_jobs', 
    COLLECTORS: 'kinecomap_collectors',
    COURSES: 'kinecomap_courses',
    ADS: 'kinecomap_ads',
    PARTNERS: 'kinecomap_partners',
    SETTINGS: 'kinecomap_system_settings',
    REPORTS: 'kinecomap_waste_reports',
    LOGO: 'kinecomap_app_logo',
    IMPACT: 'kinecomap_global_impact',
    NOTIFICATIONS: 'kinecomap_notifications'
};

const DEFAULT_SETTINGS: SystemSettings = {
    maintenanceMode: false,
    supportEmail: 'support@kinecomap.cd',
    appVersion: '1.4.0',
    force2FA: false,
    sessionTimeout: 60,
    passwordPolicy: 'strong',
    marketplaceCommission: 0.05,
    exchangeRate: 2800
};

const DEFAULT_IMPACT: GlobalImpact = {
    digitalization: 0,
    recyclingRate: 0,
    education: 0,
    realTimeCollection: 0
};

const SUPER_ADMIN: User = {
    id: 'admin-super-01',
    firstName: 'Adonai',
    lastName: 'Lutonadio',
    email: 'adonailutonadio70@gmail.com',
    phone: '+243000000000',
    type: UserType.ADMIN,
    status: 'active',
    address: 'QG Kinshasa',
    points: 0,
    collections: 0,
    badges: 0,
    subscription: 'premium',
    totalTonnage: 0,
    co2Saved: 0,
    recyclingRate: 0,
    permissions: ['manage_users', 'validate_docs', 'view_finance', 'manage_ads', 'export_data', 'system_settings', 'manage_fleet', 'manage_academy', 'manage_communications', 'manage_pos']
};

const getCollection = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch { return []; }
};

const saveCollection = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- REPORTS API ---
export const ReportsAPI = {
    getAll: async (): Promise<WasteReport[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('waste_reports').select('*').order('date', { ascending: false });
            if (!error && data) return data as WasteReport[];
        }
        return getCollection<WasteReport>(KEYS.REPORTS);
    },
    add: async (report: WasteReport): Promise<WasteReport> => {
        const newReport = { ...report, id: report.id || `rep-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('waste_reports').insert([newReport]).select().single();
            if (!error && data) return data as WasteReport;
        }
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        reports.unshift(newReport);
        saveCollection(KEYS.REPORTS, reports);
        return newReport;
    },
    update: async (report: Partial<WasteReport> & { id: string }): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('waste_reports').update(report).eq('id', report.id);
        }
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        const idx = reports.findIndex(r => r.id === report.id);
        if (idx !== -1) {
            reports[idx] = { ...reports[idx], ...report };
            saveCollection(KEYS.REPORTS, reports);
        }
    }
};

// --- USER API ---
export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq."${identifier}",phone.eq."${identifier}"`)
                .maybeSingle();
            if (!error && data) return data as User;
        }
        const users = getCollection<User>(KEYS.USERS);
        if (identifier === SUPER_ADMIN.email) return SUPER_ADMIN;
        return users.find(u => (u.email === identifier || u.phone === identifier)) || null;
    },
    register: async (user: User, password?: string): Promise<User> => {
        const newUser = { ...user, id: `u-${Date.now()}`, points: 0, collections: 0, badges: 0, totalTonnage: 0, co2Saved: 0 };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('users').insert([newUser]).select().single();
            if (!error && data) return data as User;
        }
        const users = getCollection<User>(KEYS.USERS);
        users.unshift(newUser);
        saveCollection(KEYS.USERS, users);
        return newUser;
    },
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('users').select('*');
            if (!error && data) return data as User[];
        }
        return getCollection<User>(KEYS.USERS);
    },
    update: async (user: Partial<User> & { id: string }) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('users').update(user).eq('id', user.id);
        }
        const users = getCollection<User>(KEYS.USERS);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...user };
            saveCollection(KEYS.USERS, users);
        }
    }
};

// --- SYSTEM SETTINGS API ---
export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('system_settings').select('*').maybeSingle();
            if (!error && data) return data as SystemSettings;
        }
        const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
        return { ...DEFAULT_SETTINGS, ...stored };
    },
    getImpact: async (): Promise<GlobalImpact> => {
        const stored = JSON.parse(localStorage.getItem(KEYS.IMPACT) || JSON.stringify(DEFAULT_IMPACT));
        return stored;
    },
    update: async (settings: SystemSettings) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('system_settings').upsert(settings);
        }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    },
    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        const isSupabaseLive = await testSupabaseConnection();
        const tables = Object.entries(KEYS).map(([name, key]) => {
            let status: 'ok' | 'error' = 'ok';
            let count = 0;
            try {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                count = Array.isArray(data) ? data.length : 1;
            } catch { status = 'error'; }
            return {
                name: name.toLowerCase(),
                count,
                status,
                sizeKB: Math.round(new Blob([localStorage.getItem(key) || '']).size / 1024)
            };
        });

        const totalSizeKB = tables.reduce((acc, t) => acc + t.sizeKB, 0);
        return {
            status: isSupabaseLive ? 'healthy' : 'degraded',
            totalSizeKB,
            tables,
            supabaseConnected: isSupabaseLive,
            lastAudit: new Date().toISOString()
        };
    },
    repairDatabase: async () => {
        const users = getCollection<User>(KEYS.USERS);
        if (!users.some(u => u.type === UserType.ADMIN)) {
            users.push(SUPER_ADMIN);
            saveCollection(KEYS.USERS, users);
        }
    },
    resetAllData: async () => {
        // 1. Réinitialisation Supabase (si configuré)
        if (isSupabaseConfigured() && supabase) {
            try {
                // Suppression de toutes les données transactionnelles
                await supabase.from('waste_reports').delete().neq('id', '0');
                await supabase.from('marketplace_items').delete().neq('id', '0');
                await supabase.from('ads').delete().neq('id', '0');
                // Réinitialisation des statistiques utilisateurs
                await supabase.from('users').update({ 
                    points: 0, 
                    collections: 0, 
                    totalTonnage: 0, 
                    co2Saved: 0,
                    recyclingRate: 0 
                }).neq('email', SUPER_ADMIN.email);
            } catch (e) {
                console.error("Supabase Reset Error:", e);
            }
        }

        // 2. Réinitialisation LocalStorage
        localStorage.clear();
        
        // 3. Restauration de l'Admin par défaut avec compteurs à zéro
        const cleanAdmin = { ...SUPER_ADMIN, points: 0, collections: 0, totalTonnage: 0, co2Saved: 0 };
        localStorage.setItem(KEYS.USERS, JSON.stringify([cleanAdmin]));
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        localStorage.setItem(KEYS.IMPACT, JSON.stringify(DEFAULT_IMPACT));
        localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
        localStorage.setItem(KEYS.MARKETPLACE, JSON.stringify([]));
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify([]));
        localStorage.setItem(KEYS.ADS, JSON.stringify([]));
        localStorage.setItem(KEYS.PARTNERS, JSON.stringify([]));
    }
};

// --- VEHICLE API ---
export const VehicleAPI = {
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('vehicles').select('*');
            if (!error && data) return data as Vehicle[];
        }
        return getCollection<Vehicle>(KEYS.VEHICLES);
    },
    add: async (v: Vehicle) => {
        const nv = { ...v, id: v.id || `v-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('vehicles').insert([nv]).select().single();
            if (!error && data) return data as Vehicle;
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        list.push(nv);
        saveCollection(KEYS.VEHICLES, list);
        return nv;
    },
    update: async (v: Vehicle) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').update(v).eq('id', v.id);
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const idx = list.findIndex(item => item.id === v.id);
        if (idx !== -1) {
            list[idx] = v;
            saveCollection(KEYS.VEHICLES, list);
        }
    },
    delete: async (id: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').delete().eq('id', id);
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const filtered = list.filter(v => v.id !== id);
        saveCollection(KEYS.VEHICLES, filtered);
    }
};

// --- MARKETPLACE API ---
export const MarketplaceAPI = {
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('marketplace_items').select('*').order('date', { ascending: false });
            if (!error && data) return data as MarketplaceItem[];
        }
        return getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
    },
    add: async (item: MarketplaceItem) => {
        const ni = { ...item, id: item.id || `item-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('marketplace_items').insert([ni]).select().single();
            if (!error && data) return data as MarketplaceItem;
        }
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        items.unshift(ni);
        saveCollection(KEYS.MARKETPLACE, items);
        return ni;
    },
    update: async (item: MarketplaceItem) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('marketplace_items').update(item).eq('id', item.id);
        }
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const idx = items.findIndex(i => i.id === item.id);
        if (idx !== -1) { items[idx] = item; saveCollection(KEYS.MARKETPLACE, items); }
    }
};

// --- ADS API ---
export const AdsAPI = {
    getAll: async (): Promise<AdCampaign[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('ads').select('*');
            if (!error && data) return data as AdCampaign[];
        }
        return getCollection<AdCampaign>(KEYS.ADS);
    },
    add: async (ad: AdCampaign): Promise<AdCampaign> => {
        const newAd = { ...ad, id: ad.id || `ad-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('ads').insert([newAd]).select().single();
            if (!error && data) return data as AdCampaign;
        }
        const ads = getCollection<AdCampaign>(KEYS.ADS);
        ads.unshift(newAd);
        saveCollection(KEYS.ADS, ads);
        return newAd;
    },
    updateStatus: async (id: string, status: AdCampaign['status']): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('ads').update({ status }).eq('id', id);
        }
        const ads = getCollection<AdCampaign>(KEYS.ADS);
        const idx = ads.findIndex(a => a.id === id);
        if (idx !== -1) {
            ads[idx].status = status;
            saveCollection(KEYS.ADS, ads);
        }
    },
    delete: async (id: string): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('ads').delete().eq('id', id);
        }
        const ads = getCollection<AdCampaign>(KEYS.ADS);
        const filtered = ads.filter(a => a.id !== id);
        saveCollection(KEYS.ADS, filtered);
    }
};

// --- PARTNERS API ---
export const PartnersAPI = {
    getAll: async (): Promise<Partner[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('partners').select('*');
            if (!error && data) return data as Partner[];
        }
        return getCollection<Partner>(KEYS.PARTNERS);
    },
    add: async (partner: Partner): Promise<Partner> => {
        const newPartner = { ...partner, id: partner.id || `part-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('partners').insert([newPartner]).select().single();
            if (!error && data) return data as Partner;
        }
        const partners = getCollection<Partner>(KEYS.PARTNERS);
        partners.push(newPartner);
        saveCollection(KEYS.PARTNERS, partners);
        return newPartner;
    },
    update: async (partner: Partner): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('partners').update(partner).eq('id', partner.id);
        }
        const partners = getCollection<Partner>(KEYS.PARTNERS);
        const idx = partners.findIndex(p => p.id === partner.id);
        if (idx !== -1) {
            partners[idx] = partner;
            saveCollection(KEYS.PARTNERS, partners);
        }
    },
    delete: async (id: string): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('partners').delete().eq('id', id);
        }
        const partners = getCollection<Partner>(KEYS.PARTNERS);
        const filtered = partners.filter(p => p.id !== id);
        saveCollection(KEYS.PARTNERS, filtered);
    }
};

// --- STORAGE API ---
export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const fileName = `${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from('images').upload(fileName, file);
                if (!error && data) {
                    const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
                    return urlData.publicUrl;
                }
            } catch (e) { console.error("Upload error", e); }
        }
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    },

    uploadLogo: async (file: File): Promise<string | null> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const fileName = `logo-${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from('branding').upload(fileName, file, {
                    upsert: true,
                    cacheControl: '3600'
                });
                
                if (error) throw error;
                
                if (data) {
                    const { data: urlData } = supabase.storage.from('branding').getPublicUrl(data.path);
                    return urlData.publicUrl;
                }
            } catch (e) { 
                console.error("Logo Upload error", e);
                return null;
            }
        }
        return null;
    }
};
