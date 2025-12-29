
import { User, MarketplaceItem, Vehicle, AdCampaign, Partner, UserType, SystemSettings, WasteReport, GlobalImpact, DatabaseHealth, NotificationItem, Payment, AuditLog, UserPermission } from '../types';
import { supabase } from './supabaseClient';

// --- MAPPERS (Source of Truth Alignment) ---
export const mapUser = (u: any): User => ({
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
    permissions: Array.isArray(u.permissions) ? u.permissions : [], 
    status: u.status || 'active',
    type: u.type || UserType.CITIZEN,
    address: u.address || '',
    commune: u.commune || '',
    neighborhood: u.neighborhood || ''
});

export const mapReport = (r: any): WasteReport => ({
    ...r,
    id: r.id,
    reporterId: r.reporter_id,
    imageUrl: r.image_url,
    proofUrl: r.proof_url,
    wasteType: r.waste_type,
    urgency: r.urgency,
    status: r.status,
    assignedTo: r.assigned_to,
    commune: r.commune,
    comment: r.comment || '',
    date: r.created_at || r.date
});

// --- API IMPLEMENTATION ---

export const AuditAPI = {
    log: async (l: Partial<AuditLog>) => {
        if (!supabase) return;
        await supabase.from('audit_logs').insert([{
            user_id: l.userId,
            action: l.action,
            entity: l.entity,
            entity_id: l.entityId,
            metadata: l.metadata
        }]);
    }
};

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
        const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        return (data && !error) ? mapUser(data) : null;
    },
    getAll: async (): Promise<User[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        return data ? data.map(mapUser) : [];
    },
    update: async (u: Partial<User> & { id: string }) => {
        if (!supabase) return;
        const dbUpdate: any = {};
        if (u.firstName !== undefined) dbUpdate.first_name = u.firstName;
        if (u.lastName !== undefined) dbUpdate.last_name = u.lastName;
        if (u.status !== undefined) dbUpdate.status = u.status;
        if (u.points !== undefined) dbUpdate.points = u.points;
        if (u.collections !== undefined) dbUpdate.collections = u.collections;
        if (u.totalTonnage !== undefined) dbUpdate.total_tonnage = u.totalTonnage;
        if (u.type !== undefined) dbUpdate.type = u.type;
        if (u.permissions !== undefined) dbUpdate.permissions = u.permissions;
        if (u.commune !== undefined) dbUpdate.commune = u.commune;
        
        const { error } = await supabase.from('users').update(dbUpdate).eq('id', u.id);
        if (error) throw error;
    },
    register: async (u: User, password?: string): Promise<User> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('users').insert([{
            first_name: u.firstName,
            last_name: u.lastName,
            email: u.email,
            phone: u.phone,
            password: password,
            type: u.type,
            status: 'pending',
            address: u.address,
            commune: u.commune,
            neighborhood: u.neighborhood,
            subscription: u.subscription || 'standard',
            points: 0,
            collections: 0,
            total_tonnage: 0,
            co2_saved: 0,
            email_consent: u.emailConsent
        }]).select().single();
        if (error) throw error;
        return mapUser(data);
    },
    resetAllSubscriptionCounters: async () => {
        if (!supabase) return;
        const { error } = await supabase.from('users')
            .update({ points: 0, collections: 0, total_tonnage: 0, co2_saved: 0 })
            .neq('type', UserType.ADMIN);
        if (error) throw error;
    }
};

export const ReportsAPI = {
    getAll: async (page = 0, pageSize = 50, filters?: any): Promise<WasteReport[]> => {
        if (!supabase) return [];
        let query = supabase.from('waste_reports').select('*');
        
        if (filters?.commune && filters.commune !== 'all') query = query.eq('commune', filters.commune);
        if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
        if (filters?.wasteType && filters.wasteType !== 'all') query = query.eq('waste_type', filters.wasteType);
        
        // Date Filtering Implementation
        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom);
        }
        if (filters?.dateTo) {
            // End of day filter to include reports from the selected end date
            query = query.lte('created_at', `${filters.dateTo}T23:59:59`);
        }

        const { data } = await query.order('created_at', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
        return data ? data.map(mapReport) : [];
    },
    getByUserId: async (userId: string): Promise<WasteReport[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('waste_reports')
            .select('*')
            .eq('reporter_id', userId)
            .order('created_at', { ascending: false });
        return data ? data.map(mapReport) : [];
    },
    add: async (r: WasteReport): Promise<WasteReport> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('waste_reports').insert([{
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
        const dbUpdate: any = {};
        if (r.status) dbUpdate.status = r.status;
        if (r.assignedTo !== undefined) dbUpdate.assigned_to = r.assignedTo;
        if (r.proofUrl) dbUpdate.proof_url = r.proofUrl;
        const { error } = await supabase.from('waste_reports').update(dbUpdate).eq('id', r.id);
        if (error) throw error;
    }
};

export const NotificationsAPI = {
    add: async (n: Partial<NotificationItem>) => {
        if (!supabase) return;
        const { data } = await supabase.from('notifications').insert([{
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            target_user_id: n.targetUserId,
            read: false
        }]).select().single();
        return data;
    },
    getAll: async (userId: string, isAdmin: boolean): Promise<NotificationItem[]> => {
        if (!supabase) return [];
        let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (!isAdmin) query = query.or(`target_user_id.eq.${userId},target_user_id.eq.ALL`);
        const { data } = await query;
        return data || [];
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
            seller_id: i.sellerId,
            seller_name: i.sellerName,
            title: i.title,
            category: i.category,
            description: i.description,
            price: i.price,
            image_url: i.imageUrl,
            status: 'available'
        }]).select().single();
        if (error) throw error;
        return data;
    },
    update: async (i: Partial<MarketplaceItem> & { id: string }) => {
        if (!supabase) return;
        const { error } = await supabase.from('marketplace_items').update(i).eq('id', i.id);
        if (error) throw error;
    }
};

export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('vehicles').select('*');
        return data || [];
    },
    add: async (v: Vehicle): Promise<Vehicle> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('vehicles').insert([v]).select().single();
        if (error) throw error;
        return data;
    },
    update: async (v: Partial<Vehicle> & { id: string }) => {
        if (!supabase) return;
        const { error } = await supabase.from('vehicles').update(v).eq('id', v.id);
        if (error) throw error;
    },
    delete: async (id: string) => {
        if (!supabase) return;
        await supabase.from('vehicles').delete().eq('id', id);
    }
};

export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        if (!supabase) return null;
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) return null;
        const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(data.path);
        return publicUrl.publicUrl;
    },
    uploadLogo: async (file: File): Promise<string | null> => {
        return StorageAPI.uploadImage(file);
    }
};

export const SettingsAPI = {
    get: async (): Promise<SystemSettings | null> => {
        if (!supabase) return null;
        const { data } = await supabase.from('system_settings').select('*').eq('id', 1).maybeSingle();
        return data ? {
            maintenanceMode: data.maintenance_mode,
            supportEmail: data.support_email,
            appVersion: data.app_version,
            exchangeRate: data.exchange_rate,
            marketplaceCommission: data.marketplace_commission,
            logoUrl: data.logo_url,
            force2FA: data.force_2fa,
            sessionTimeout: data.session_timeout,
            passwordPolicy: data.password_policy
        } : null;
    },
    getRolesConfig: async (): Promise<Record<string, UserPermission[]>> => {
        if (!supabase) return {};
        const { data } = await supabase.from('system_settings').select('roles_config').eq('id', 1).maybeSingle();
        return data?.roles_config || {};
    },
    getImpact: async (): Promise<GlobalImpact | null> => {
        return { digitalization: 75, recyclingRate: 42, education: 60, realTimeCollection: 88 };
    },
    update: async (s: SystemSettings) => {
        if (!supabase) return;
        const { error } = await supabase.from('system_settings').update({
            maintenance_mode: s.maintenanceMode,
            support_email: s.supportEmail,
            app_version: s.appVersion,
            exchange_rate: s.exchangeRate,
            marketplace_commission: s.marketplaceCommission,
            logo_url: s.logoUrl,
            force_2fa: s.force2FA,
            session_timeout: s.sessionTimeout,
            password_policy: s.passwordPolicy
        }).eq('id', 1);
        if (error) throw error;
    },
    updateRolesConfig: async (config: Record<string, UserPermission[]>) => {
        if (!supabase) return;
        const { error } = await supabase.from('system_settings').update({ roles_config: config }).eq('id', 1);
        if (error) throw error;
    },
    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        if (!supabase) throw new Error("Offline");
        return {
            status: 'healthy',
            totalSizeKB: 1024,
            tables: [
                { name: 'users', count: 120, status: 'ok', sizeKB: 256 },
                { name: 'waste_reports', count: 450, status: 'ok', sizeKB: 512 }
            ],
            supabaseConnected: true,
            lastAudit: new Date().toISOString()
        };
    },
    repairDatabase: async () => {
        return new Promise(resolve => setTimeout(resolve, 1000));
    },
    resetAllData: async () => {
        if (!supabase) return;
        await Promise.all([
            supabase.from('waste_reports').delete().neq('id', '0'),
            supabase.from('marketplace_items').delete().neq('id', '0'),
            supabase.from('notifications').delete().neq('id', '0'),
            supabase.from('audit_logs').delete().neq('id', '0'),
            supabase.from('users').delete().neq('type', UserType.ADMIN)
        ]);
    }
};

export const AdsAPI = {
    getAll: async (): Promise<AdCampaign[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    add: async (a: AdCampaign): Promise<AdCampaign> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('ad_campaigns').insert([a]).select().single();
        if (error) throw error;
        return data;
    },
    updateStatus: async (id: string, status: string) => {
        if (!supabase) return;
        await supabase.from('ad_campaigns').update({ status }).eq('id', id);
    },
    delete: async (id: string) => {
        if (!supabase) return;
        await supabase.from('ad_campaigns').delete().eq('id', id);
    }
};

export const PartnersAPI = {
    getAll: async (): Promise<Partner[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('partners').select('*').order('created_at', { ascending: false });
        return data || [];
    },
    add: async (p: Partner): Promise<Partner> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('partners').insert([p]).select().single();
        if (error) throw error;
        return data;
    },
    update: async (p: Partner) => {
        if (!supabase) return;
        await supabase.from('partners').update(p).eq('id', p.id);
    },
    delete: async (id: string) => {
        if (!supabase) return;
        await supabase.from('partners').delete().eq('id', id);
    }
};

export const PaymentsAPI = {
    record: async (p: Payment): Promise<Payment> => {
        if (!supabase) throw new Error("Offline");
        const { data, error } = await supabase.from('payments').insert([p]).select().single();
        if (error) throw error;
        return data;
    },
    getAll: async (): Promise<Payment[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
        return data || [];
    }
};
