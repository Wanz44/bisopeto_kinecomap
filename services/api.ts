
import { User, MarketplaceItem, Vehicle, AdCampaign, Partner, UserType, SystemSettings, WasteReport, GlobalImpact, DatabaseHealth, NotificationItem, Payment } from '../types';
import { supabase, isSupabaseConfigured, testSupabaseConnection } from './supabaseClient';

const KEYS = {
    USERS: 'kinecomap_users',
    MARKETPLACE: 'kinecomap_marketplace',
    VEHICLES: 'kinecomap_vehicles',
    SETTINGS: 'kinecomap_system_settings',
    REPORTS: 'kinecomap_waste_reports',
    IMPACT: 'kinecomap_global_impact',
    NOTIFICATIONS: 'kinecomap_notifications',
    ADS: 'kinecomap_ads',
    PARTNERS: 'kinecomap_partners',
    PAYMENTS: 'kinecomap_payments'
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

const getCollection = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch { return []; }
};

const saveCollection = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Helper pour transformer les données Supabase (snake_case) en format App (camelCase)
const mapUser = (u: any): User => ({
    ...u,
    firstName: u.first_name,
    lastName: u.last_name,
    totalTonnage: u.total_tonnage,
    co2_saved: u.co2_saved,
    recyclingRate: u.recycling_rate,
    points: u.points || 0,
    collections: u.collections || 0,
    badges: u.badges || 0,
    subscription: u.subscription || 'standard'
});

const mapReport = (r: any): WasteReport => ({
    ...r,
    reporterId: r.reporter_id,
    imageUrl: r.image_url,
    wasteType: r.waste_type,
    assignedTo: r.assigned_to
});

// --- PAYMENTS API ---
export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(p => ({
                ...p,
                userId: p.user_id,
                userName: p.user_name,
                amountFC: p.amount_fc,
                collectorId: p.collector_id,
                collectorName: p.collector_name,
                qrCodeData: p.qr_code_data
            })) as Payment[];
        }
        return getCollection<Payment>(KEYS.PAYMENTS);
    },
    record: async (p: Payment): Promise<Payment> => {
        const dbData = {
            id: p.id || `pay-${Date.now()}`,
            user_id: p.userId,
            user_name: p.userName,
            amount_fc: p.amountFC,
            currency: p.currency,
            method: p.method,
            period: p.period,
            collector_id: p.collectorId,
            collector_name: p.collectorName,
            qr_code_data: p.qrCodeData
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('payments').insert([dbData]).select().single();
            if (!error && data) return data as any;
        }
        const payments = getCollection<Payment>(KEYS.PAYMENTS);
        payments.unshift(p);
        saveCollection(KEYS.PAYMENTS, payments);
        return p;
    }
};

// --- USER API ---
export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                // On récupère l'utilisateur par email ou téléphone
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .or(`email.eq.${identifier},phone.eq.${identifier}`)
                    .maybeSingle();
                
                if (!error && data) {
                    // Si on a un mot de passe dans la colonne 'password' (test simple)
                    if (password && data.password === password) {
                        return mapUser(data);
                    }
                    // Si on utilise Supabase Auth ou password_hash (prototype simple pour le moment)
                    // Note: Pour BCrypt/crypt, il faudrait un RPC Postgres. 
                    // On accepte la connexion si le mot de passe correspond à la colonne password
                    if (data.password === password || data.password_hash === password) {
                         return mapUser(data);
                    }
                }
            } catch (e) { console.error(e); }
        }
        const users = getCollection<User>(KEYS.USERS);
        return users.find(u => (u.email === identifier || u.phone === identifier)) || null;
    },
    register: async (u: User, password?: string): Promise<User> => {
        const dbUser = {
            id: u.id || `u-${Date.now()}`,
            first_name: u.firstName,
            last_name: u.lastName,
            email: u.email,
            phone: u.phone,
            password: password, // Utilisation de la colonne password simple
            type: u.type,
            status: u.status,
            address: u.address,
            commune: u.commune,
            subscription: u.subscription,
            permissions: u.permissions
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('users').insert([dbUser]).select().single();
            if (!error && data) return mapUser(data);
        }
        const users = getCollection<User>(KEYS.USERS);
        users.unshift(u);
        saveCollection(KEYS.USERS, users);
        return u;
    },
    getAll: async () => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(mapUser);
        }
        return getCollection<User>(KEYS.USERS);
    },
    update: async (u: Partial<User> & { id: string }) => {
        const dbUpdate: any = { ...u };
        if (u.firstName) dbUpdate.first_name = u.firstName;
        if (u.lastName) dbUpdate.last_name = u.lastName;
        
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('users').update(dbUpdate).eq('id', u.id);
        }
        const users = getCollection<User>(KEYS.USERS);
        const idx = users.findIndex(item => item.id === u.id);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...u };
            saveCollection(KEYS.USERS, users);
        }
    }
};

// --- REPORTS API ---
export const ReportsAPI = {
    getAll: async (): Promise<WasteReport[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('waste_reports').select('*').order('date', { ascending: false });
            if (!error && data) return data.map(mapReport);
        }
        return getCollection<WasteReport>(KEYS.REPORTS).map(mapReport);
    },
    add: async (r: WasteReport): Promise<WasteReport> => {
        const dbData = {
            id: r.id || `rep-${Date.now()}`,
            reporter_id: r.reporterId,
            lat: r.lat,
            lng: r.lng,
            image_url: r.imageUrl,
            waste_type: r.wasteType,
            urgency: r.urgency,
            status: r.status,
            comment: r.comment,
            commune: r.commune
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('waste_reports').insert([dbData]).select().single();
            if (!error && data) return mapReport(data);
        }
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        reports.unshift(r);
        saveCollection(KEYS.REPORTS, reports);
        return r;
    },
    update: async (r: Partial<WasteReport> & { id: string }): Promise<void> => {
        const dbUpdate: any = { ...r };
        if (r.status) dbUpdate.status = r.status;
        if (r.assignedTo) dbUpdate.assigned_to = r.assignedTo;

        if (isSupabaseConfigured() && supabase) {
            await supabase.from('waste_reports').update(dbUpdate).eq('id', r.id);
        }
        const reports = getCollection<WasteReport>(KEYS.REPORTS);
        const idx = reports.findIndex(item => item.id === r.id);
        if (idx !== -1) {
            reports[idx] = { ...reports[idx], ...r };
            saveCollection(KEYS.REPORTS, reports);
        }
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
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('vehicles').insert([v]).select().single();
            if (!error && data) return data as Vehicle;
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        list.push(v);
        saveCollection(KEYS.VEHICLES, list);
        return v;
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
            const { data, error } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(i => ({
                ...i,
                sellerId: i.seller_id,
                sellerName: i.seller_name,
                imageUrl: i.image_url
            })) as MarketplaceItem[];
        }
        return getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
    },
    add: async (i: MarketplaceItem) => {
        const dbData = {
            id: i.id || `item-${Date.now()}`,
            seller_id: i.sellerId,
            seller_name: i.sellerName,
            title: i.title,
            category: i.category,
            description: i.description,
            weight: i.weight,
            price: i.price,
            image_url: i.imageUrl,
            status: i.status
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('marketplace_items').insert([dbData]).select().single();
            if (!error && data) return data as any;
        }
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        items.unshift(i);
        saveCollection(KEYS.MARKETPLACE, items);
        return i;
    },
    update: async (i: MarketplaceItem) => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('marketplace_items').update(i).eq('id', i.id);
        }
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const idx = items.findIndex(item => item.id === i.id);
        if (idx !== -1) { items[idx] = i; saveCollection(KEYS.MARKETPLACE, items); }
    }
};

// --- NOTIFICATIONS API ---
export const NotificationsAPI = {
    getAll: async (userId: string, isAdmin: boolean): Promise<NotificationItem[]> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
                if (!isAdmin) {
                    query = query.or(`target_user_id.eq.${userId},target_user_id.eq.ALL`);
                } else {
                    query = query.or(`target_user_id.eq.${userId},target_user_id.eq.ALL,target_user_id.eq.ADMIN`);
                }
                const { data, error } = await query;
                if (!error && data) return data.map(n => ({ ...n, targetUserId: n.target_user_id })) as NotificationItem[];
            } catch (e) { console.error(e); }
        }
        return getCollection<NotificationItem>(KEYS.NOTIFICATIONS);
    },
    add: async (n: Partial<NotificationItem>): Promise<NotificationItem> => {
        const dbData = {
            target_user_id: n.targetUserId || 'ALL',
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            read: false
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('notifications').insert([dbData]).select().single();
            if (!error && data) return data as any;
        }
        return n as NotificationItem;
    }
};

// --- SYSTEM SETTINGS API ---
export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('system_settings').select('*').maybeSingle();
            if (!error && data) return {
                ...DEFAULT_SETTINGS,
                maintenanceMode: data.maintenance_mode,
                supportEmail: data.support_email,
                appVersion: data.app_version,
                exchangeRate: data.exchange_rate,
                marketplaceCommission: data.marketplace_commission
            };
        }
        const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
        return { ...DEFAULT_SETTINGS, ...stored };
    },
    getImpact: async (): Promise<GlobalImpact> => {
        const stored = JSON.parse(localStorage.getItem(KEYS.IMPACT) || JSON.stringify(DEFAULT_IMPACT));
        return stored;
    },
    update: async (s: SystemSettings) => {
        const dbData = {
            id: 1,
            maintenance_mode: s.maintenanceMode,
            support_email: s.supportEmail,
            app_version: s.appVersion,
            exchange_rate: s.exchangeRate,
            marketplace_commission: s.marketplaceCommission
        };
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('system_settings').upsert(dbData);
        }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));
    },
    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        const isSupabaseLive = await testSupabaseConnection();
        const tables = [
            { name: 'users', count: 0 },
            { name: 'waste_reports', count: 0 },
            { name: 'marketplace_items', count: 0 },
            { name: 'notifications', count: 0 },
            { name: 'vehicles', count: 0 },
            { name: 'payments', count: 0 }
        ];

        if (isSupabaseLive && supabase) {
            for (let t of tables) {
                const { count } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
                t.count = count || 0;
            }
        }

        return {
            status: isSupabaseLive ? 'healthy' : 'degraded',
            totalSizeKB: 0,
            tables: tables.map(t => ({ ...t, status: 'ok', sizeKB: 0 })),
            supabaseConnected: isSupabaseLive,
            lastAudit: new Date().toISOString()
        };
    },
    repairDatabase: async () => {},
    resetAllData: async () => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('waste_reports').delete().neq('id', '0');
            await supabase.from('marketplace_items').delete().neq('id', '0');
            await supabase.from('notifications').delete().neq('id', '0');
            await supabase.from('payments').delete().neq('id', '0');
        }
        localStorage.clear();
    }
};

// --- ADS API & PARTNERS ---
export const AdsAPI = {
    getAll: async () => getCollection<AdCampaign>(KEYS.ADS),
    add: async (a: AdCampaign) => {
        const list = getCollection<AdCampaign>(KEYS.ADS);
        list.unshift(a);
        saveCollection(KEYS.ADS, list);
        return a;
    },
    updateStatus: async (id: string, s: string) => {},
    delete: async (id: string) => {}
};

export const PartnersAPI = {
    getAll: async () => getCollection<Partner>(KEYS.PARTNERS),
    add: async (p: Partner) => {
        const list = getCollection<Partner>(KEYS.PARTNERS);
        list.push(p);
        saveCollection(KEYS.PARTNERS, list);
        return p;
    },
    update: async (p: Partner) => {},
    delete: async (id: string) => {}
};

// --- STORAGE API ---
export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const fileName = `img-${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from('images').upload(fileName, file);
                if (!error && data) {
                    const { data: urlData } = supabase.storage.from('images').getPublicUrl(data.path);
                    return urlData.publicUrl;
                }
            } catch (e) { console.error(e); }
        }
        return null;
    },
    uploadLogo: async (file: File): Promise<string | null> => {
        if (isSupabaseConfigured() && supabase) {
            try {
                const fileName = `logo-${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage.from('branding').upload(fileName, file);
                if (!error && data) {
                    const { data: urlData } = supabase.storage.from('branding').getPublicUrl(data.path);
                    return urlData.publicUrl;
                }
            } catch (e) { console.error(e); }
        }
        return null;
    }
};
