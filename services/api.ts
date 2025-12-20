
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

// --- MAPPERS (Snake Case to Camel Case) ---

const mapUser = (u: any): User => ({
    ...u,
    firstName: u.first_name,
    lastName: u.last_name,
    totalTonnage: Number(u.total_tonnage || 0),
    co2Saved: Number(u.co2_saved || 0),
    recyclingRate: Number(u.recycling_rate || 0),
    points: u.points || 0,
    collections: u.collections || 0,
    badges: u.badges || 0,
    subscription: u.subscription || 'standard',
    permissions: u.permissions || []
});

const mapReport = (r: any): WasteReport => ({
    ...r,
    reporterId: r.reporter_id,
    imageUrl: r.image_url,
    wasteType: r.waste_type,
    assignedTo: r.assigned_to
});

const mapMarketplace = (i: any): MarketplaceItem => ({
    ...i,
    sellerId: i.seller_id,
    sellerName: i.seller_name,
    imageUrl: i.image_url,
    date: i.created_at ? new Date(i.created_at).toLocaleDateString('fr-FR') : ''
});

const mapPayment = (p: any): Payment => ({
    ...p,
    userId: p.user_id,
    userName: p.user_name,
    amountFC: Number(p.amount_fc || 0),
    collectorId: p.collector_id,
    collectorName: p.collector_name,
    qrCodeData: p.qr_code_data,
    createdAt: p.created_at
});

const mapVehicle = (v: any): Vehicle => ({
    ...v,
    plateNumber: v.plate_number,
    batteryLevel: v.battery_level,
    signalStrength: v.signal_strength,
    driverId: v.driver_id,
    gpsId: v.gps_id,
    lastUpdate: v.last_update
});

const mapSettings = (s: any): SystemSettings => ({
    maintenanceMode: s.maintenance_mode,
    supportEmail: s.support_email,
    appVersion: s.app_version,
    exchangeRate: Number(s.exchange_rate || 2800),
    marketplaceCommission: Number(s.marketplace_commission || 0.05),
    force2FA: false,
    sessionTimeout: 60,
    passwordPolicy: 'strong'
});

// --- PAYMENTS API ---
export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(mapPayment);
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
            if (!error && data) return mapPayment(data);
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
                // Recherche par email ou téléphone
                let query = supabase
                    .from('users')
                    .select('*')
                    .or(`email.eq.${identifier},phone.eq.${identifier}`);
                
                // Si un mot de passe est fourni, on filtre par la colonne password
                if (password) {
                    query = query.eq('password', password);
                }

                const { data, error } = await query.maybeSingle();
                if (!error && data) return mapUser(data);
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
            password: password,
            type: u.type,
            status: u.status,
            address: u.address,
            commune: u.commune,
            subscription: u.subscription,
            permissions: u.permissions || []
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
    getAll: async (): Promise<User[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(mapUser);
        }
        return getCollection<User>(KEYS.USERS).map(mapUser);
    },
    update: async (u: Partial<User> & { id: string }) => {
        const dbUpdate: any = { ...u };
        // Mapping inverse
        if (u.firstName) dbUpdate.first_name = u.firstName;
        if (u.lastName) dbUpdate.last_name = u.lastName;
        if (u.totalTonnage !== undefined) dbUpdate.total_tonnage = u.totalTonnage;
        if (u.co2Saved !== undefined) dbUpdate.co2_saved = u.co2Saved;
        if (u.recyclingRate !== undefined) dbUpdate.recycling_rate = u.recyclingRate;
        
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
    getAll: async (): Promise<Vehicle[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('vehicles').select('*');
            if (!error && data) return data.map(mapVehicle);
        }
        return getCollection<Vehicle>(KEYS.VEHICLES).map(mapVehicle);
    },
    add: async (v: Vehicle): Promise<Vehicle> => {
        const dbData = {
            id: v.id || `veh-${Date.now()}`,
            name: v.name,
            type: v.type,
            plate_number: v.plateNumber,
            status: v.status,
            battery_level: v.batteryLevel,
            signal_strength: v.signalStrength,
            lat: v.lat,
            lng: v.lng,
            driver_id: v.driverId,
            gps_id: v.gpsId
        };
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('vehicles').insert([dbData]).select().single();
            if (!error && data) return mapVehicle(data);
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        list.push(v);
        saveCollection(KEYS.VEHICLES, list);
        return v;
    },
    update: async (v: Vehicle) => {
        const dbData = {
            name: v.name,
            type: v.type,
            plate_number: v.plateNumber,
            status: v.status,
            battery_level: v.batteryLevel,
            signal_strength: v.signalStrength,
            lat: v.lat,
            lng: v.lng,
            driver_id: v.driverId,
            gps_id: v.gpsId
        };
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').update(dbData).eq('id', v.id);
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
    getAll: async (): Promise<MarketplaceItem[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
            if (!error && data) return data.map(mapMarketplace);
        }
        return getCollection<MarketplaceItem>(KEYS.MARKETPLACE).map(mapMarketplace);
    },
    add: async (i: MarketplaceItem): Promise<MarketplaceItem> => {
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
            if (!error && data) return mapMarketplace(data);
        }
        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        items.unshift(i);
        saveCollection(KEYS.MARKETPLACE, items);
        return i;
    },
    update: async (i: MarketplaceItem) => {
        const dbData = {
            title: i.title,
            status: i.status,
            price: i.price
        };
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('marketplace_items').update(dbData).eq('id', i.id);
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
                if (!error && data) return data.map(n => ({ 
                    ...n, 
                    targetUserId: n.target_user_id,
                    time: n.created_at ? new Date(n.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '...'
                })) as NotificationItem[];
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
            if (!error && data) return { 
                ...data, 
                targetUserId: data.target_user_id,
                time: 'Maintenant'
            } as any;
        }
        return n as NotificationItem;
    }
};

// --- SYSTEM SETTINGS API ---
export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase.from('system_settings').select('*').maybeSingle();
            if (!error && data) return mapSettings(data);
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
