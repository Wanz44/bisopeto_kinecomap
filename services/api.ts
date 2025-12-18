
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

const initializeData = () => {
    try {
        if (!localStorage.getItem(KEYS.REPORTS)) localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.MARKETPLACE)) localStorage.setItem(KEYS.MARKETPLACE, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.SETTINGS)) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        if (!localStorage.getItem(KEYS.IMPACT)) localStorage.setItem(KEYS.IMPACT, JSON.stringify({
            digitalization: 75,
            recyclingRate: 40,
            education: 65,
            realTimeCollection: 95
        }));
        
        const usersStr = localStorage.getItem(KEYS.USERS);
        const users = usersStr ? JSON.parse(usersStr) : [];
        if (!users.some((u: User) => u.email === SUPER_ADMIN.email)) {
            users.push(SUPER_ADMIN);
            localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        }
    } catch (e) { console.error(e); }
};

initializeData();

const getCollectionSize = (key: string): number => {
    const data = localStorage.getItem(key);
    return data ? Math.round(new Blob([data]).size / 1024) : 0;
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

export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('system_settings').select('*').single();
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
        const tables = Object.entries(KEYS).map(([name, key]) => {
            let status: 'ok' | 'error' = 'ok';
            let count = 0;
            try {
                const data = JSON.parse(localStorage.getItem(key) || '[]');
                count = Array.isArray(data) ? data.length : 1;
            } catch {
                status = 'error';
            }
            return {
                name: name.toLowerCase(),
                count,
                status,
                sizeKB: getCollectionSize(key)
            };
        });

        const totalSizeKB = tables.reduce((acc, t) => acc + t.sizeKB, 0);
        const isDegraded = tables.some(t => t.status === 'error');
        const hasAdmin = getCollection<User>(KEYS.USERS).some(u => u.type === UserType.ADMIN);
        
        // Test de connexion Supabase réel
        const isSupabaseLive = await testSupabaseConnection();

        return {
            status: (!hasAdmin || totalSizeKB > 4000 || (!isSupabaseLive && isSupabaseConfigured())) ? 'critical' : isDegraded ? 'degraded' : 'healthy',
            totalSizeKB,
            tables,
            supabaseConnected: isSupabaseLive,
            lastAudit: new Date().toISOString()
        };
    },

    repairDatabase: async () => {
        Object.entries(KEYS).forEach(([_, key]) => {
            const data = localStorage.getItem(key);
            try {
                if (data) JSON.parse(data);
            } catch {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
        
        const users = getCollection<User>(KEYS.USERS);
        if (!users.some(u => u.type === UserType.ADMIN)) {
            users.push(SUPER_ADMIN);
            saveCollection(KEYS.USERS, users);
        }
    },

    resetAllData: async () => {
        localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
        localStorage.setItem(KEYS.MARKETPLACE, JSON.stringify([]));
        localStorage.setItem(KEYS.VEHICLES, JSON.stringify([]));
        localStorage.setItem(KEYS.ADS, JSON.stringify([]));
        localStorage.setItem(KEYS.PARTNERS, JSON.stringify([]));
        localStorage.setItem(KEYS.JOBS, JSON.stringify([]));
        localStorage.setItem(KEYS.COURSES, JSON.stringify([]));
        localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify([]));
        localStorage.setItem(KEYS.IMPACT, JSON.stringify(DEFAULT_IMPACT));
        const adminWithResetStats = { ...SUPER_ADMIN, points: 0, collections: 0, totalTonnage: 0, co2Saved: 0 };
        localStorage.setItem(KEYS.USERS, JSON.stringify([adminWithResetStats]));
    }
};

export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${identifier},phone.eq.${identifier}`)
                .single();
            if (!error && data) return data as User;
        }
        const users = getCollection<User>(KEYS.USERS);
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
    },
    delete: async (id: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('users').delete().eq('id', id);
        }
        saveCollection(KEYS.USERS, getCollection<User>(KEYS.USERS).filter(u => u.id !== id));
    }
};

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
        if (idx !== -1) { list[idx] = v; saveCollection(KEYS.VEHICLES, list); }
    },
    delete: async (id: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').delete().eq('id', id);
        }
        saveCollection(KEYS.VEHICLES, getCollection<Vehicle>(KEYS.VEHICLES).filter(v => v.id !== id));
    }
};

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

export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (isSupabaseConfigured() && supabase) {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage.from('images').upload(fileName, file);
            if (!error && data) {
                const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
                return urlData.publicUrl;
            }
        }
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }
};

export const PartnersAPI = {
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('partners').select('*');
            if (!error && data) return data as Partner[];
        }
        return getCollection<Partner>(KEYS.PARTNERS);
    },
    add: async (p: Partner) => {
        const np = { ...p, id: p.id || `p-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('partners').insert([np]).select().single();
            if (!error && data) return data as Partner;
        }
        const list = getCollection<Partner>(KEYS.PARTNERS);
        list.push(np);
        saveCollection(KEYS.PARTNERS, list);
        return np;
    },
    update: async (p: Partner) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('partners').update(p).eq('id', p.id);
        }
        const list = getCollection<Partner>(KEYS.PARTNERS);
        const idx = list.findIndex(item => item.id === p.id);
        if (idx !== -1) { list[idx] = p; saveCollection(KEYS.PARTNERS, list); }
    },
    delete: async (id: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('partners').delete().eq('id', id);
        }
        saveCollection(KEYS.PARTNERS, getCollection<Partner>(KEYS.PARTNERS).filter(item => item.id !== id));
    }
};

export const AdsAPI = {
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('ads').select('*');
            if (!error && data) return data as AdCampaign[];
        }
        return getCollection<AdCampaign>(KEYS.ADS);
    },
    add: async (a: AdCampaign) => {
        const na = { ...a, id: a.id || `ad-${Date.now()}` };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('ads').insert([na]).select().single();
            if (!error && data) return data as AdCampaign;
        }
        const list = getCollection<AdCampaign>(KEYS.ADS);
        list.push(na);
        saveCollection(KEYS.ADS, list);
        return na;
    },
    updateStatus: async (id: string, status: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('ads').update({ status }).eq('id', id);
        }
        const list = getCollection<AdCampaign>(KEYS.ADS);
        const ad = list.find(item => item.id === id);
        if (ad) { ad.status = status as any; saveCollection(KEYS.ADS, list); }
    },
    delete: async (id: string) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('ads').delete().eq('id', id);
        }
        saveCollection(KEYS.ADS, getCollection<AdCampaign>(KEYS.ADS).filter(item => item.id !== id));
    }
};
