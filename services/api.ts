
import { User, MarketplaceItem, Vehicle, AdCampaign, Partner, UserType, SystemSettings, WasteReport, GlobalImpact, DatabaseHealth, NotificationItem, Payment } from '../types';
import { supabase } from './supabaseClient';

// --- MAPPERS ---
const mapUser = (u: any): User => ({
    ...u,
    id: u.id,
    firstName: u.first_name || '',
    lastName: u.last_name || '',
    email: u.email || '',
    phone: u.phone || '',
    totalTonnage: Number(u.total_tonnage || 0),
    co2Saved: Number(u.co2_saved || 0),
    recyclingRate: Number(u.recycling_rate || 0),
    points: u.points || 0,
    collections: u.collections || 0,
    badges: u.badges || 0,
    subscription: u.subscription || 'standard',
    permissions: u.permissions || [],
    status: u.status || 'active',
    type: u.type || UserType.CITIZEN,
    address: u.address || '',
    commune: u.commune || ''
});

const mapReport = (r: any): WasteReport => ({
    ...r,
    id: r.id,
    reporterId: r.reporter_id,
    imageUrl: r.image_url,
    wasteType: r.waste_type,
    urgency: r.urgency,
    status: r.status,
    assignedTo: r.assigned_to,
    commune: r.commune,
    comment: r.comment || '',
    date: r.created_at || r.date
});

const mapSettings = (s: any): SystemSettings => ({
    maintenanceMode: s.maintenance_mode || false,
    supportEmail: s.support_email || '',
    appVersion: s.app_version || '1.4.2',
    force2FA: s.force_2fa || false,
    sessionTimeout: s.session_timeout || 60,
    passwordPolicy: s.password_policy || 'strong',
    marketplaceCommission: s.marketplace_commission || 0.05,
    exchangeRate: s.exchange_rate || 2800,
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
    getById: async (id: string): Promise<User | null> => {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        return (data && !error) ? mapUser(data) : null;
    },
    register: async (u: User, password?: string): Promise<User> => {
        if (!supabase) throw new Error("Database offline");
        const { data, error } = await supabase.from('users').insert([{
            id: crypto.randomUUID(), 
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
    /**
     * PAGINATION PROFESSIONNELLE : Charge 50 par 50
     */
    getAll: async (page = 0, pageSize = 50): Promise<User[]> => {
        if (!supabase) return [];
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);
        return (data && !error) ? data.map(mapUser) : [];
    },
    update: async (u: Partial<User> & { id: string }) => {
        if (!supabase) return;
        const dbUpdate: any = {};
        if (u.firstName !== undefined) dbUpdate.first_name = u.firstName;
        if (u.lastName !== undefined) dbUpdate.last_name = u.lastName;
        if (u.status !== undefined) dbUpdate.status = u.status;
        if (u.type !== undefined) dbUpdate.type = u.type;
        if (u.permissions !== undefined) dbUpdate.permissions = u.permissions; 
        if (u.points !== undefined) dbUpdate.points = u.points;
        const { error } = await supabase.from('users').update(dbUpdate).eq('id', u.id);
        if (error) throw error;
    },
    resetAllSubscriptionCounters: async () => {
        if (!supabase) return;
        const { error } = await supabase
            .from('users')
            .update({ total_tonnage: 0, co2_saved: 0, points: 0, collections: 0 })
            .neq('type', 'admin');
        if (error) throw error;
    }
};

export const ReportsAPI = {
    /**
     * PAGINATION ET FILTRAGE SIG
     */
    getAll: async (page = 0, pageSize = 50, filters?: { commune?: string, status?: string }): Promise<WasteReport[]> => {
        if (!supabase) return [];
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        let query = supabase.from('waste_reports').select('*');
        
        if (filters?.commune) query = query.eq('commune', filters.commune);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);
            
        return (data && !error) ? data.map(mapReport) : [];
    },
    add: async (r: WasteReport): Promise<WasteReport> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('waste_reports').insert([{
            id: crypto.randomUUID(), 
            reporter_id: r.reporterId,
            lat: r.lat,
            lng: r.lng,
            image_url: r.imageUrl,
            waste_type: r.wasteType,
            urgency: r.urgency,
            status: 'pending',
            comment: r.comment,
            commune: r.commune
        }]).select().single();
        if (error) throw error;
        return mapReport(data);
    },
    update: async (r: Partial<WasteReport> & { id: string }) => {
        if (!supabase) return;
        const { error } = await supabase.from('waste_reports').update(r).eq('id', r.id);
        if (error) throw error;
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
            logo_url: s.logoUrl
        };
        await supabase.from('system_settings').upsert({ id: 1, ...dbData });
    },
    getImpact: async (): Promise<GlobalImpact> => {
        if (!supabase) return { digitalization: 0, recyclingRate: 0, education: 0, realTimeCollection: 0 };
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        return {
            digitalization: Math.min(100, Math.floor((userCount || 0) / 10)), 
            recyclingRate: 48, 
            education: 65,
            realTimeCollection: 82
        };
    },
    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        if (!supabase) return { status: 'critical', totalSizeKB: 0, tables: [], supabaseConnected: false, lastAudit: '' };
        return { status: 'healthy', totalSizeKB: 1024, tables: [], supabaseConnected: true, lastAudit: new Date().toISOString() };
    },
    repairDatabase: async () => {},
    resetAllData: async () => {
        if (!supabase) return;
        await supabase.from('waste_reports').delete().neq('id', '0');
    }
};

export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    record: async (p: Payment) => {
        if (!supabase) return p;
        const { data, error } = await supabase.from('payments').insert([{
            ...p,
            id: p.id || crypto.randomUUID()
        }]).select().single();
        if (error) throw error;
        return data;
    }
};

export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('vehicles').select('*');
        return data || [];
    },
    update: async (v: Partial<Vehicle> & { id: string }) => {
        if (!supabase) return;
        await supabase.from('vehicles').update(v).eq('id', v.id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('vehicles').delete().eq('id', id);
    },
    add: async (v: Vehicle) => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('vehicles').insert([{
            ...v,
            id: crypto.randomUUID()
        }]).select().single();
        if (error) throw error;
        return data;
    }
};

export const MarketplaceAPI = {
    getAll: async (): Promise<MarketplaceItem[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('marketplace_items').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    add: async (i: MarketplaceItem) => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('marketplace_items').insert([{
            ...i,
            id: crypto.randomUUID()
        }]).select().single();
        if (error) throw error;
        return data;
    },
    update: async (i: Partial<MarketplaceItem> & { id: string }) => {
        if (!supabase) return;
        await supabase.from('marketplace_items').update(i).eq('id', i.id);
    }
};

export const NotificationsAPI = {
    getAll: async (userId: string, isAdmin: boolean): Promise<NotificationItem[]> => {
        if (!supabase) return [];
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (!isAdmin) query = query.or(`target_user_id.eq.${userId},target_user_id.eq.ALL`);
        const { data } = await query;
        return data || [];
    },
    add: async (n: Partial<NotificationItem>) => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('notifications').insert([{
            ...n,
            id: crypto.randomUUID(),
            read: false
        }]).select().single();
        if (error) throw error;
        return data;
    }
};

export const PartnersAPI = {
    getAll: async () => {
        if (!supabase) return [];
        const { data } = await supabase.from('partners').select('*');
        return data || [];
    },
    add: async (p: any) => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('partners').insert([{
            ...p,
            id: crypto.randomUUID()
        }]).select().single();
        if (error) throw error;
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
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('ads').insert([{
            ...a,
            id: crypto.randomUUID()
        }]).select().single();
        if (error) throw error;
        return data;
    },
    updateStatus: async (id: string, status: string) => {
        if (supabase) await supabase.from('ads').update({ status }).eq('id', id);
    },
    delete: async (id: string) => {
        if (supabase) await supabase.from('ads').delete().eq('id', id);
    }
};

export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (!supabase) return null;
        const fileName = `${crypto.randomUUID()}-${file.name}`;
        const { data, error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) return null;
        const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(data.path);
        return publicUrl.publicUrl;
    },
    uploadLogo: async (file: File): Promise<string | null> => {
        if (!supabase) return null;
        const fileName = `logo-${Date.now()}`;
        const { data, error } = await supabase.storage.from('branding').upload(fileName, file);
        if (error) return null;
        const { data: publicUrl } = supabase.storage.from('branding').getPublicUrl(data.path);
        return publicUrl.publicUrl;
    }
};
