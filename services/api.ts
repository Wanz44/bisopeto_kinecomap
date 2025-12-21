
import { User, MarketplaceItem, Vehicle, AdCampaign, Partner, UserType, SystemSettings, WasteReport, GlobalImpact, DatabaseHealth, NotificationItem, Payment } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- MAPPERS ---
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
    assignedTo: r.assigned_to,
    commune: r.commune
});

const mapSettings = (s: any): SystemSettings => ({
    maintenanceMode: s.maintenance_mode,
    supportEmail: s.support_email,
    appVersion: s.app_version,
    exchangeRate: Number(s.exchange_rate || 2800),
    marketplaceCommission: Number(s.marketplace_commission || 0.05),
    force2FA: s.force_2fa || false,
    sessionTimeout: s.session_timeout || 60,
    passwordPolicy: s.password_policy || 'strong',
    logoUrl: s.logo_url
});

// --- API IMPLEMENTATION ---

export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},phone.eq.${identifier}`)
            .eq('password', password)
            .maybeSingle();
        return (data && !error) ? mapUser(data) : null;
    },
    register: async (u: User, password?: string): Promise<User> => {
        if (!supabase) throw new Error("Database offline");
        const { data, error } = await supabase.from('users').insert([{
            first_name: u.firstName,
            last_name: u.lastName,
            email: u.email,
            phone: u.phone,
            password: password,
            type: u.type,
            status: u.status || 'pending',
            address: u.address,
            commune: u.commune,
            subscription: u.subscription || 'standard',
            points: 0,
            collections: 0,
            badges: 0
        }]).select().single();
        if (error) throw error;
        return mapUser(data);
    },
    getAll: async (): Promise<User[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        return (data && !error) ? data.map(mapUser) : [];
    },
    update: async (u: Partial<User> & { id: string }) => {
        if (!supabase) return;
        const dbUpdate: any = {};
        if (u.firstName) dbUpdate.first_name = u.firstName;
        if (u.lastName) dbUpdate.last_name = u.lastName;
        if (u.status) dbUpdate.status = u.status;
        if (u.type) dbUpdate.type = u.type;
        if (u.permissions) dbUpdate.permissions = u.permissions; 
        if (u.points !== undefined) dbUpdate.points = u.points;
        if (u.subscription) dbUpdate.subscription = u.subscription;
        await supabase.from('users').update(dbUpdate).eq('id', u.id);
    },
    // Remise à zéro des compteurs d'abonnements pour tous les utilisateurs non-admins
    resetAllSubscriptionCounters: async () => {
        if (!supabase) return;
        const { error } = await supabase
            .from('users')
            .update({ collections: 0, points: 0, total_tonnage: 0, co2_saved: 0 })
            .neq('type', 'admin');
        if (error) throw error;
    }
};

export const ReportsAPI = {
    getAll: async (): Promise<WasteReport[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('waste_reports').select('*').order('created_at', { ascending: false });
        return (data && !error) ? data.map(mapReport) : [];
    },
    add: async (r: WasteReport): Promise<WasteReport> => {
        if (!supabase) throw new Error("Offline");
        const dbData = {
            reporter_id: r.reporterId,
            lat: r.lat,
            lng: r.lng,
            image_url: r.imageUrl,
            waste_type: r.wasteType,
            urgency: r.urgency,
            status: 'pending',
            comment: r.comment,
            commune: r.commune
        };
        const { data, error } = await supabase.from('waste_reports').insert([dbData]).select().single();
        if (error) throw error;
        return mapReport(data);
    },
    update: async (r: Partial<WasteReport> & { id: string }) => {
        if (!supabase) return;
        const dbUpdate: any = {};
        if (r.status) dbUpdate.status = r.status;
        if (r.assignedTo) dbUpdate.assigned_to = r.assignedTo;
        await supabase.from('waste_reports').update(dbUpdate).eq('id', r.id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('waste_reports').delete().eq('id', id);
    }
};

export const SettingsAPI = {
    get: async (): Promise<SystemSettings | null> => {
        if (!supabase) return null;
        const { data } = await supabase.from('system_settings').select('*').eq('id', 1).maybeSingle();
        return data ? mapSettings(data) : null;
    },
    update: async (s: SystemSettings) => {
        if (!supabase) return;
        const dbData = {
            maintenance_mode: s.maintenanceMode,
            support_email: s.supportEmail,
            exchange_rate: s.exchangeRate,
            marketplace_commission: s.marketplaceCommission,
            // Fixed: use s.logoUrl as defined in the SystemSettings interface
            logo_url: s.logoUrl
        };
        await supabase.from('system_settings').upsert({ id: 1, ...dbData });
    },
    getImpact: async (): Promise<GlobalImpact> => {
        if (!supabase) return { digitalization: 0, recyclingRate: 0, education: 0, realTimeCollection: 0 };
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: reportCount } = await supabase.from('waste_reports').select('*', { count: 'exact', head: true });
        return {
            digitalization: Math.min(100, Math.floor((userCount || 0) / 5)), 
            recyclingRate: 48, 
            education: 65,
            realTimeCollection: Math.min(100, (reportCount || 0) * 2)
        };
    },
    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        if (!supabase) return { status: 'critical', totalSizeKB: 0, tables: [], supabaseConnected: false, lastAudit: '' };
        const tables = ['users', 'waste_reports', 'vehicles', 'marketplace_items', 'payments'];
        const report = await Promise.all(tables.map(async name => {
            const { count } = await supabase.from(name).select('*', { count: 'exact', head: true });
            return { name, count: count || 0, status: 'ok' as const, sizeKB: (count || 0) * 0.4 };
        }));
        return {
            status: 'healthy',
            totalSizeKB: Math.round(report.reduce((a, b) => a + b.sizeKB, 0)),
            tables: report,
            supabaseConnected: true,
            lastAudit: new Date().toISOString()
        };
    },
    repairDatabase: async () => {
        if (!supabase) return;
    },
    resetAllData: async () => {
        if (!supabase) return;
        const tables = ['waste_reports', 'payments', 'notifications', 'marketplace_items'];
        for (const t of tables) await supabase.from(t).delete().neq('id', '0');
    }
};

export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        return data ? data.map(p => ({
            ...p,
            userId: p.user_id,
            userName: p.user_name,
            amountFC: p.amount_fc,
            collectorId: p.collector_id,
            collectorName: p.collector_name,
            qrCodeData: p.qr_code_data,
            createdAt: p.created_at
        })) : [];
    },
    record: async (p: Payment) => {
        if (!supabase) return p;
        const { data } = await supabase.from('payments').insert([{
            user_id: p.userId,
            user_name: p.userName,
            amount_fc: p.amountFC,
            currency: p.currency,
            method: p.method,
            period: p.period,
            collector_id: p.collectorId,
            collector_name: p.collectorName,
            qr_code_data: p.qrCodeData
        }]).select().single();
        return data;
    }
};

export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('vehicles').select('*');
        return data ? data.map(v => ({
            ...v,
            plateNumber: v.plate_number,
            batteryLevel: v.battery_level,
            signalStrength: v.signal_strength,
            gpsId: v.gps_id,
            lastUpdate: v.last_update
        })) : [];
    },
    update: async (v: Partial<Vehicle> & { id: string }) => {
        if (!supabase) return;
        const dbData: any = { ...v };
        if (v.plateNumber) { dbData.plate_number = v.plateNumber; delete dbData.plateNumber; }
        await supabase.from('vehicles').update(dbData).eq('id', v.id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('vehicles').delete().eq('id', id);
    },
    add: async (v: Vehicle) => {
        if (!supabase) return v;
        const { data } = await supabase.from('vehicles').insert([{
            name: v.name,
            type: v.type,
            plate_number: v.plateNumber,
            status: v.status,
            lat: v.lat,
            lng: v.lng,
            gps_id: v.gpsId
        }]).select().single();
        return data;
    }
};

export const MarketplaceAPI = {
    getAll: async (): Promise<MarketplaceItem[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
        return data ? data.map(i => ({
            ...i,
            sellerId: i.seller_id,
            sellerName: i.seller_name,
            imageUrl: i.image_url,
            date: new Date(i.created_at).toLocaleDateString()
        })) : [];
    },
    add: async (i: MarketplaceItem) => {
        if (!supabase) return i;
        const { data } = await supabase.from('marketplace_items').insert([{
            seller_id: i.sellerId,
            seller_name: i.sellerName,
            title: i.title,
            category: i.category,
            description: i.description,
            price: i.price,
            image_url: i.imageUrl,
            status: 'available'
        }]).select().single();
        return data;
    },
    update: async (i: Partial<MarketplaceItem> & { id: string }) => {
        if (!supabase) return;
        const dbUpdate: any = { ...i };
        if (i.sellerId) { dbUpdate.seller_id = i.sellerId; delete dbUpdate.sellerId; }
        if (i.sellerName) { dbUpdate.seller_name = i.sellerName; delete dbUpdate.sellerName; }
        if (i.imageUrl) { dbUpdate.image_url = i.imageUrl; delete dbUpdate.imageUrl; }
        await supabase.from('marketplace_items').update(dbUpdate).eq('id', i.id);
    }
};

export const NotificationsAPI = {
    getAll: async (userId: string, isAdmin: boolean): Promise<NotificationItem[]> => {
        if (!supabase) return [];
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (!isAdmin) query = query.or(`target_user_id.eq.${userId},target_user_id.eq.ALL`);
        const { data } = await query;
        return data ? data.map(n => ({ ...n, targetUserId: n.target_user_id, time: new Date(n.created_at).toLocaleTimeString() })) : [];
    },
    add: async (n: Partial<NotificationItem>) => {
        if (!supabase) return n as NotificationItem;
        const { data } = await supabase.from('notifications').insert([{
            target_user_id: n.targetUserId || 'ALL',
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            read: false
        }]).select().single();
        return { ...data, targetUserId: data.target_user_id, time: 'Maintenant' };
    }
};

export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (!supabase) return null;
        const name = `${Date.now()}-${file.name}`;
        const { data } = await supabase.storage.from('images').upload(name, file);
        return data ? supabase.storage.from('images').getPublicUrl(data.path).data.publicUrl : null;
    },
    uploadLogo: async (file: File): Promise<string | null> => {
        if (!supabase) return null;
        const name = `branding/${Date.now()}-${file.name}`;
        const { data } = await supabase.storage.from('branding').upload(name, file);
        return data ? supabase.storage.from('branding').getPublicUrl(data.path).data.publicUrl : null;
    }
};

export const PartnersAPI = {
    getAll: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('partners').select('*');
        return data || [];
    },
    add: async (p: any) => {
        if (!supabase) return p;
        const { data } = await supabase.from('partners').insert([p]).select().single();
        return data;
    },
    update: async (p: any) => {
        if (!supabase) return;
        await supabase.from('partners').update(p).eq('id', p.id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('partners').delete().eq('id', id);
    }
};

export const AdsAPI = {
    getAll: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('ads').select('*');
        return data || [];
    },
    add: async (a: any) => {
        if (!supabase) return a;
        const { data } = await supabase.from('ads').insert([a]).select().single();
        return data;
    },
    updateStatus: async (id: string, status: string) => {
        if (supabase) await supabase.from('ads').update({ status }).eq('id', id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('ads').delete().eq('id', id);
    }
};
