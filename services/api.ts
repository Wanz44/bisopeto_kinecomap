
import { User, MarketplaceItem, Vehicle, Collector, Course, AdCampaign, Partner, UserType, SystemSettings, WasteReport } from '../types';
import { OfflineManager } from './offlineManager';
import { supabase, isSupabaseConfigured } from './supabaseClient';

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
    REPORTS: 'kinecomap_waste_reports'
};

const DEFAULT_SETTINGS: SystemSettings = {
    maintenanceMode: false,
    supportEmail: 'support@kinecomap.cd',
    appVersion: '1.0.4',
    force2FA: false,
    sessionTimeout: 60,
    passwordPolicy: 'strong',
    marketplaceCommission: 0.05
};

const initializeData = () => {
    try {
        if (!localStorage.getItem(KEYS.REPORTS)) localStorage.setItem(KEYS.REPORTS, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.MARKETPLACE)) localStorage.setItem(KEYS.MARKETPLACE, JSON.stringify([]));
        if (!localStorage.getItem(KEYS.SETTINGS)) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        
        const usersStr = localStorage.getItem(KEYS.USERS);
        const users = usersStr ? JSON.parse(usersStr) : [];
        if (!users.some((u: User) => u.email === 'adonailutonadio70@gmail.com')) {
            const defaultAdmin: User = {
                id: 'admin-super-01',
                firstName: 'Adonai',
                lastName: 'Lutonadio',
                email: 'adonailutonadio70@gmail.com',
                phone: '+243000000000',
                type: UserType.ADMIN,
                status: 'active',
                address: 'QG Kinshasa',
                points: 999,
                collections: 0,
                badges: 5,
                subscription: 'premium',
                permissions: ['manage_users', 'validate_docs', 'view_finance', 'manage_ads', 'export_data', 'system_settings', 'manage_fleet', 'manage_academy', 'manage_communications', 'manage_pos']
            };
            users.push(defaultAdmin);
            localStorage.setItem(KEYS.USERS, JSON.stringify(users));
        }
    } catch (e) { console.error(e); }
};

initializeData();

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
    getAll: async (): Promise<WasteReport[]> => getCollection<WasteReport>(KEYS.REPORTS),
    add: async (report: WasteReport): Promise<WasteReport> => {
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        const newReport = { ...report, id: `rep-${Date.now()}` };
        reports.unshift(newReport);
        saveCollection(KEYS.REPORTS, reports);
        return newReport;
    },
    update: async (report: WasteReport): Promise<void> => {
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        const idx = reports.findIndex(r => r.id === report.id);
        if (idx !== -1) {
            reports[idx] = report;
            saveCollection(KEYS.REPORTS, reports);
        }
    }
};

export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
        return { ...DEFAULT_SETTINGS, ...stored };
    },
    update: async (settings: SystemSettings) => localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
};

export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        const users = getCollection<User>(KEYS.USERS);
        return users.find(u => (u.email === identifier || u.phone === identifier)) || null;
    },
    register: async (user: User, password?: string): Promise<User> => {
        const users = getCollection<User>(KEYS.USERS);
        const newUser = { ...user, id: `u-${Date.now()}`, points: 0, collections: 0, badges: 0 };
        users.unshift(newUser);
        saveCollection(KEYS.USERS, users);
        return newUser;
    },
    getAll: async () => getCollection<User>(KEYS.USERS),
    update: async (user: Partial<User> & { id: string }) => {
        const users = getCollection<User>(KEYS.USERS);
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...user };
            saveCollection(KEYS.USERS, users);
        }
    },
    delete: async (id: string) => saveCollection(KEYS.USERS, getCollection<User>(KEYS.USERS).filter(u => u.id !== id))
};

export const VehicleAPI = {
    getAll: async () => getCollection<Vehicle>(KEYS.VEHICLES),
    add: async (v: Vehicle) => {
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const nv = { ...v, id: `v-${Date.now()}` };
        list.push(nv);
        saveCollection(KEYS.VEHICLES, list);
        return nv;
    },
    update: async (v: Vehicle) => {
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const idx = list.findIndex(item => item.id === v.id);
        if (idx !== -1) { list[idx] = v; saveCollection(KEYS.VEHICLES, list); }
    },
    delete: async (id: string) => saveCollection(KEYS.VEHICLES, getCollection<Vehicle>(KEYS.VEHICLES).filter(v => v.id !== id))
};

export const MarketplaceAPI = {
    getAll: async () => getCollection<MarketplaceItem>(KEYS.MARKETPLACE),
    add: async (item: MarketplaceItem) => {
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const ni = { ...item, id: `item-${Date.now()}` };
        items.unshift(ni);
        saveCollection(KEYS.MARKETPLACE, items);
        return ni;
    },
    update: async (item: MarketplaceItem) => {
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const idx = items.findIndex(i => i.id === item.id);
        if (idx !== -1) { items[idx] = item; saveCollection(KEYS.MARKETPLACE, items); }
    }
};

export const JobAPI = {
    getAll: async () => getCollection<any>(KEYS.JOBS),
    updateStatus: async (id: string, status: string, proof?: string) => {
        const list = getCollection<any>(KEYS.JOBS);
        const job = list.find((j:any) => j.id == id);
        if (job) { job.status = status; if(proof) job.proofImage = proof; saveCollection(KEYS.JOBS, list); }
    }
};

export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }
};

export const PartnersAPI = {
    getAll: async () => getCollection<Partner>(KEYS.PARTNERS),
    add: async (p: Partner) => {
        const list = getCollection<Partner>(KEYS.PARTNERS);
        const np = { ...p, id: `p-${Date.now()}` };
        list.push(np);
        saveCollection(KEYS.PARTNERS, list);
        return np;
    },
    update: async (p: Partner) => {
        const list = getCollection<Partner>(KEYS.PARTNERS);
        const idx = list.findIndex(item => item.id === p.id);
        if (idx !== -1) { list[idx] = p; saveCollection(KEYS.PARTNERS, list); }
    },
    delete: async (id: string) => saveCollection(KEYS.PARTNERS, getCollection<Partner>(KEYS.PARTNERS).filter(item => item.id !== id))
};

export const AdsAPI = {
    getAll: async () => getCollection<AdCampaign>(KEYS.ADS),
    add: async (a: AdCampaign) => {
        const list = getCollection<AdCampaign>(KEYS.ADS);
        const na = { ...a, id: `ad-${Date.now()}` };
        list.push(na);
        saveCollection(KEYS.ADS, list);
        return na;
    },
    updateStatus: async (id: string, status: string) => {
        const list = getCollection<AdCampaign>(KEYS.ADS);
        const ad = list.find(item => item.id === id);
        if (ad) { ad.status = status as any; saveCollection(KEYS.ADS, list); }
    },
    delete: async (id: string) => saveCollection(KEYS.ADS, getCollection<AdCampaign>(KEYS.ADS).filter(item => item.id !== id))
};
