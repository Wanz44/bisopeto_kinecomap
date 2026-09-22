import { 
    User, MarketplaceItem, Vehicle, AdCampaign, Partner, UserType, 
    SystemSettings, WasteReport, GlobalImpact, DatabaseHealth, 
    NotificationItem, Payment, AuditLog, UserPermission, CashBookEntry 
} from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { auth } from './firebase';
import { 
    signInWithPopup, GoogleAuthProvider,
    createUserWithEmailAndPassword, signInWithEmailAndPassword
} from 'firebase/auth';

// --- MAPPERS RÉSILIENTS (Support camelCase et snake_case) ---
export const mapUser = (u: any, id?: string): User => ({
    id: id || u.id || `user_${Date.now()}`,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    email: u.email || '',
    phone: u.phone || '',
    totalTonnage: Number(u.totalTonnage || u.total_tonnage || 0),
    co2Saved: Number(u.co2Saved || u.co2_saved || 0),
    recyclingRate: Number(u.recyclingRate || u.recycling_rate || 0),
    points: Number(u.points || 0),
    collections: Number(u.collections || 0),
    badges: Number(u.badges || 0),
    subscription: u.subscription || 'standard',
    permissions: Array.isArray(u.permissions) ? u.permissions : [], 
    status: u.status || 'active',
    type: u.type || UserType.CITIZEN,
    address: u.address || '',
    commune: u.commune || '',
    neighborhood: u.neighborhood || '',
    country: u.country || 'RDC',
    avatarUrl: u.avatarUrl || u.avatar_url || '',
    emailConsent: u.emailConsent ?? u.email_consent ?? false
});

export const mapReport = (r: any, id?: string): WasteReport => ({
    id: id || r.id || `rep_${Date.now()}`,
    reporterId: r.reporterId || r.reporter_id,
    lat: Number(r.lat),
    lng: Number(r.lng),
    imageUrl: r.imageUrl || r.image_url,
    proofUrl: r.proofUrl || r.proof_url,
    wasteType: r.wasteType || r.waste_type,
    urgency: r.urgency || 'medium',
    status: r.status || 'pending',
    assignedTo: r.assignedTo || r.assigned_to,
    commune: r.commune,
    comment: r.comment || '',
    date: r.date || r.created_at || new Date().toISOString()
});

export const mapAd = (ad: any, id?: string): AdCampaign => ({
    id: id || ad.id || `ad_${Date.now()}`,
    title: ad.title || 'Sans titre',
    partner: ad.partner || 'Partenaire Anonyme',
    status: ad.status || 'paused',
    views: Number(ad.views || 0),
    clicks: Number(ad.clicks || 0),
    budget: Number(ad.budget || 0),
    spent: Number(ad.spent || 0),
    startDate: ad.startDate || ad.start_date || new Date().toISOString(),
    endDate: ad.endDate || ad.end_date || '',
    image: ad.image || ad.image_url || '',
    targetCommune: ad.targetCommune || ad.target_commune || 'all',
    targetUserType: ad.targetUserType || ad.target_user_type || 'all',
    link: ad.link || ''
});

export const mapPartner = (p: any, id?: string): Partner => ({
    ...p,
    id: id || p.id,
    name: p.name || 'Partenaire',
    contactName: p.contactName || p.contact_name,
    activeCampaigns: Number(p.activeCampaigns || p.active_campaigns || 0),
    totalBudget: Number(p.totalBudget || p.total_budget || 0)
});

export const mapMarketplaceItem = (i: any, id?: string): MarketplaceItem => ({
    ...i,
    id: id || i.id,
    sellerId: i.sellerId || i.seller_id,
    sellerName: i.sellerName || i.seller_name,
    buyerId: i.buyerId || i.buyer_id,
    imageUrl: i.imageUrl || i.image_url,
    date: i.date || i.created_at || new Date().toISOString()
});

export const mapPayment = (p: any, id?: string): Payment => ({
    ...p,
    id: id || p.id,
    userId: p.userId || p.user_id,
    userName: p.userName || p.user_name,
    amountFC: Number(p.amountFC || p.amount_fc || 0),
    collectorId: p.collectorId || p.collector_id,
    collectorName: p.collectorName || p.collector_name,
    qrCodeData: p.qrCodeData || p.qr_code_data,
    createdAt: p.createdAt || p.created_at || new Date().toISOString()
});

// Cache local mémoire / localStorage pour assurer la continuité hors-ligne ou transition
const getLocalData = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(`bp_${key}`);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setLocalData = <T>(key: string, data: T) => {
    try {
        localStorage.setItem(`bp_${key}`, JSON.stringify(data));
    } catch {}
};

// ==========================================
// 1. USER API (Supabase)
// ==========================================
export const UserAPI = {
    login: async (identifier: string, password?: string): Promise<User | null> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                // Tentative via Supabase Auth si email + password
                if (identifier.includes('@') && password) {
                    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                        email: identifier,
                        password: password
                    });
                    if (!authError && authData.user) {
                        return await UserAPI.getById(authData.user.id);
                    }
                }

                // Recherche directe dans la table 'users' de Supabase (par email ou téléphone)
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .or(`email.eq.${identifier},phone.eq.${identifier}`)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    const u = data[0];
                    if (!password || !u.password || u.password === password) {
                        const mapped = mapUser(u);
                        localStorage.setItem('kinecomap_user', JSON.stringify(mapped));
                        return mapped;
                    }
                }
            }

            // Fallback Firebase Auth si configuré
            if (identifier.includes('@') && password) {
                try {
                    const credential = await signInWithEmailAndPassword(auth, identifier, password);
                    return await UserAPI.getById(credential.user.uid);
                } catch {}
            }

            // Fallback local stocké
            const localUsers = getLocalData<User[]>('users', []);
            const found = localUsers.find(u => u.email === identifier || u.phone === identifier);
            if (found) {
                localStorage.setItem('kinecomap_user', JSON.stringify(found));
                return found;
            }

            return null;
        } catch (error) {
            console.error("[UserAPI] Erreur connexion Supabase :", error);
            return null;
        }
    },

    getById: async (id: string): Promise<User | null> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();

                if (!error && data) {
                    return mapUser(data, id);
                }
            }

            // Recherche fallback locale
            const localUsers = getLocalData<User[]>('users', []);
            const user = localUsers.find(u => u.id === id);
            return user || null;
        } catch (error) {
            console.warn("[UserAPI] Erreur getById Supabase :", error);
            const localUsers = getLocalData<User[]>('users', []);
            return localUsers.find(u => u.id === id) || null;
        }
    },

    getAll: async (): Promise<User[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    const mapped = data.map(u => mapUser(u));
                    setLocalData('users', mapped);
                    return mapped;
                }
            }
            return getLocalData<User[]>('users', []);
        } catch (error) {
            console.warn("[UserAPI] Erreur getAll Supabase :", error);
            return getLocalData<User[]>('users', []);
        }
    },

    update: async (u: Partial<User> & { id: string }) => {
        try {
            const { id, ...updates } = u;
            const payload: any = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { error } = await supabase
                    .from('users')
                    .update(payload)
                    .eq('id', id);

                if (error) {
                    console.warn("[UserAPI] Erreur update Supabase :", error.message);
                }
            }

            // Mise à jour cache local
            const localUsers = getLocalData<User[]>('users', []);
            const updatedList = localUsers.map(user => user.id === id ? { ...user, ...updates } : user);
            setLocalData('users', updatedList);
        } catch (error) {
            console.error("[UserAPI] Erreur update :", error);
        }
    },

    register: async (u: User, password?: string): Promise<User> => {
        try {
            let uid = u.id || `user_${Date.now()}`;

            // Création de compte Supabase Auth si email + password
            if (u.email && password && supabase && isSupabaseConfigured()) {
                try {
                    const { data: authData } = await supabase.auth.signUp({
                        email: u.email,
                        password: password,
                        options: {
                            data: {
                                firstName: u.firstName,
                                lastName: u.lastName,
                                phone: u.phone,
                                type: u.type
                            }
                        }
                    });
                    if (authData?.user) {
                        uid = authData.user.id;
                    }
                } catch (e) {
                    console.warn("[UserAPI] Inscription Supabase Auth :", e);
                }
            }

            const userData: any = {
                id: uid,
                first_name: u.firstName,
                last_name: u.lastName,
                email: u.email || '',
                phone: u.phone || '',
                type: u.type,
                status: 'pending',
                address: u.address || '',
                commune: u.commune || '',
                neighborhood: u.neighborhood || '',
                country: u.country || 'RDC',
                subscription: u.subscription || 'standard',
                points: 0,
                collections: 0,
                total_tonnage: 0,
                co2_saved: 0,
                email_consent: u.emailConsent || false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { error } = await supabase.from('users').upsert(userData);
                if (error) {
                    console.warn("[UserAPI] Erreur enregistrement Supabase :", error.message);
                }
            }

            const mapped = mapUser(userData, uid);
            const localUsers = getLocalData<User[]>('users', []);
            setLocalData('users', [mapped, ...localUsers.filter(x => x.id !== uid)]);
            return mapped;
        } catch (error) {
            console.error("[UserAPI] Erreur register :", error);
            throw error;
        }
    },

    invite: async (email: string, type: UserType): Promise<boolean> => {
        try {
            const inviteId = `invited-${Date.now()}`;
            const inviteData = {
                id: inviteId,
                email: email,
                type: type,
                status: 'pending',
                first_name: 'Invité',
                last_name: 'Biso Peto',
                phone: 'N/A',
                address: 'En attente',
                points: 0,
                collections: 0,
                total_tonnage: 0,
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                await supabase.from('users').insert(inviteData);
            }

            const localUsers = getLocalData<User[]>('users', []);
            setLocalData('users', [mapUser(inviteData, inviteId), ...localUsers]);
            return true;
        } catch {
            return false;
        }
    },

    loginWithGoogle: async (): Promise<User> => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const nameParts = user.displayName?.split(' ') || ['', ''];
            const isAdminEmail = user.email === 'adonailutonadio70@gmail.com';
            
            const userData: any = {
                id: user.uid,
                first_name: nameParts[0],
                last_name: nameParts.slice(1).join(' ') || 'Utilisateur',
                email: user.email,
                phone: user.phoneNumber || '',
                type: isAdminEmail ? UserType.ADMIN : UserType.CITIZEN,
                status: 'active',
                address: '',
                points: 0,
                collections: 0,
                total_tonnage: 0,
                co2_saved: 0,
                avatar_url: user.photoURL || '',
                updated_at: new Date().toISOString()
            };

            // Enregistrement / Synchronisation directe dans la table Supabase
            if (supabase && isSupabaseConfigured()) {
                const { data: existing } = await supabase.from('users').select('*').eq('id', user.uid).maybeSingle();
                if (!existing) {
                    userData.created_at = new Date().toISOString();
                    await supabase.from('users').insert(userData);
                } else {
                    if (isAdminEmail && existing.type !== UserType.ADMIN) {
                        userData.type = UserType.ADMIN;
                    }
                    await supabase.from('users').update(userData).eq('id', user.uid);
                }
            }

            const mapped = mapUser(userData, user.uid);
            localStorage.setItem('kinecomap_user', JSON.stringify(mapped));
            return mapped;
        } catch (error) {
            console.error("[UserAPI] Erreur connexion Google :", error);
            throw error;
        }
    },

    resetAllSubscriptionCounters: async () => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase
                    .from('users')
                    .update({ points: 0, collections: 0, total_tonnage: 0, co2_saved: 0 })
                    .neq('type', UserType.ADMIN);
            }
            const localUsers = getLocalData<User[]>('users', []);
            const updated = localUsers.map(u => u.type === UserType.ADMIN ? u : { ...u, points: 0, collections: 0, totalTonnage: 0, co2Saved: 0 });
            setLocalData('users', updated);
        } catch (error) {
            console.error("[UserAPI] Erreur reset counters :", error);
        }
    }
};

// ==========================================
// 2. CASH BOOK API (Livre de Caisse Supabase)
// ==========================================
export const CashBookAPI = {
    getAll: async (): Promise<CashBookEntry[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('cash_book')
                    .select('*')
                    .order('date', { ascending: false });

                if (!error && data) {
                    return data.map((d: any) => ({
                        id: d.id,
                        date: d.date || d.created_at,
                        ref: d.ref,
                        label: d.label,
                        type: d.type,
                        category: d.category,
                        amount: Number(d.amount || 0),
                        userId: d.userId || d.user_id,
                        userName: d.userName || d.user_name
                    }));
                }
            }
            return getLocalData<CashBookEntry[]>('cash_book', []);
        } catch (error) {
            return getLocalData<CashBookEntry[]>('cash_book', []);
        }
    },

    add: async (entry: Partial<CashBookEntry>): Promise<CashBookEntry | null> => {
        try {
            const entryData = {
                id: `cash_${Date.now()}`,
                date: new Date().toISOString(),
                ref: entry.ref || `REF-${Date.now()}`,
                label: entry.label || '',
                type: entry.type || 'expense',
                category: entry.category || 'Général',
                amount: Number(entry.amount || 0),
                user_id: entry.userId,
                user_name: entry.userName
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('cash_book').insert(entryData).select().single();
                if (!error && data) {
                    return {
                        id: data.id,
                        date: data.date,
                        ref: data.ref,
                        label: data.label,
                        type: data.type,
                        category: data.category,
                        amount: data.amount,
                        userId: data.user_id || data.userId || '',
                        userName: data.user_name || data.userName || ''
                    };
                }
            }

            const local = getLocalData<CashBookEntry[]>('cash_book', []);
            const newEntry: CashBookEntry = {
                id: entryData.id,
                date: entryData.date,
                ref: entryData.ref,
                label: entryData.label,
                type: entryData.type as any,
                category: entryData.category,
                amount: entryData.amount,
                userId: entryData.user_id || '',
                userName: entryData.user_name || ''
            };
            setLocalData('cash_book', [newEntry, ...local]);
            return newEntry;
        } catch (error) {
            console.error("[CashBookAPI] Erreur add :", error);
            return null;
        }
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('cash_book').delete().eq('id', id);
            }
            const local = getLocalData<CashBookEntry[]>('cash_book', []);
            setLocalData('cash_book', local.filter(x => x.id !== id));
            return true;
        } catch {
            return false;
        }
    }
};

// ==========================================
// 3. REPORTS API (Signalements Supabase)
// ==========================================
export const ReportsAPI = {
    getAll: async (page = 0, pageSize = 50, filters?: any): Promise<WasteReport[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                let query = supabase
                    .from('waste_reports')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(pageSize);

                if (filters?.commune && filters.commune !== 'all') {
                    query = query.eq('commune', filters.commune);
                }
                if (filters?.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }

                const { data, error } = await query;
                if (!error && data) {
                    const mapped = data.map(r => mapReport(r));
                    setLocalData('waste_reports', mapped);
                    return mapped;
                }
            }
            return getLocalData<WasteReport[]>('waste_reports', []);
        } catch (error) {
            console.warn("[ReportsAPI] Erreur getAll Supabase :", error);
            return getLocalData<WasteReport[]>('waste_reports', []);
        }
    },

    getByUserId: async (userId: string): Promise<WasteReport[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('waste_reports')
                    .select('*')
                    .eq('reporter_id', userId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data.map(r => mapReport(r));
                }
            }
            const local = getLocalData<WasteReport[]>('waste_reports', []);
            return local.filter(r => r.reporterId === userId);
        } catch (error) {
            const local = getLocalData<WasteReport[]>('waste_reports', []);
            return local.filter(r => r.reporterId === userId);
        }
    },

    add: async (r: WasteReport): Promise<WasteReport> => {
        try {
            const reportId = r.id || `rep_${Date.now()}`;
            const reportData: any = {
                id: reportId,
                reporter_id: r.reporterId,
                lat: r.lat,
                lng: r.lng,
                image_url: r.imageUrl || null,
                proof_url: r.proofUrl || null,
                waste_type: r.wasteType,
                urgency: r.urgency || 'medium',
                status: r.status || 'pending',
                assigned_to: r.assignedTo || null,
                comment: r.comment || '',
                commune: r.commune || 'Gombe',
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('waste_reports').insert(reportData).select().single();
                if (!error && data) {
                    const created = mapReport(data);
                    const local = getLocalData<WasteReport[]>('waste_reports', []);
                    setLocalData('waste_reports', [created, ...local]);
                    return created;
                }
            }

            const created = mapReport(reportData, reportId);
            const local = getLocalData<WasteReport[]>('waste_reports', []);
            setLocalData('waste_reports', [created, ...local]);
            return created;
        } catch (error) {
            console.error("[ReportsAPI] Erreur add :", error);
            throw error;
        }
    },

    update: async (r: Partial<WasteReport> & { id: string }) => {
        try {
            const { id, ...updates } = r;
            const payload: any = {};
            if (updates.status !== undefined) payload.status = updates.status;
            if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
            if (updates.proofUrl !== undefined) payload.proof_url = updates.proofUrl;
            if (updates.comment !== undefined) payload.comment = updates.comment;

            if (supabase && isSupabaseConfigured()) {
                await supabase.from('waste_reports').update(payload).eq('id', id);
            }

            const local = getLocalData<WasteReport[]>('waste_reports', []);
            setLocalData('waste_reports', local.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch (error) {
            console.error("[ReportsAPI] Erreur update :", error);
        }
    },

    delete: async (id: string): Promise<boolean> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('waste_reports').delete().eq('id', id);
            }
            const local = getLocalData<WasteReport[]>('waste_reports', []);
            setLocalData('waste_reports', local.filter(x => x.id !== id));
            return true;
        } catch (error) {
            console.error("[ReportsAPI] Erreur delete :", error);
            throw error;
        }
    },

    deleteMultiple: async (ids: string[]): Promise<boolean> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('waste_reports').delete().in('id', ids);
            }
            const local = getLocalData<WasteReport[]>('waste_reports', []);
            setLocalData('waste_reports', local.filter(x => !ids.includes(x.id)));
            return true;
        } catch (error) {
            console.error("[ReportsAPI] Erreur deleteMultiple :", error);
            throw error;
        }
    }
};

// ==========================================
// 4. MARKETPLACE API (Supabase)
// ==========================================
export const MarketplaceAPI = {
    getAll: async (): Promise<MarketplaceItem[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('marketplace_items')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data.map(i => mapMarketplaceItem(i));
                }
            }
            return getLocalData<MarketplaceItem[]>('marketplace_items', []);
        } catch (error) {
            return getLocalData<MarketplaceItem[]>('marketplace_items', []);
        }
    },

    add: async (item: MarketplaceItem): Promise<MarketplaceItem> => {
        try {
            const itemData: any = {
                id: item.id || `item_${Date.now()}`,
                seller_id: item.sellerId,
                seller_name: item.sellerName,
                title: item.title,
                category: item.category,
                description: item.description,
                weight: item.weight,
                price: item.price,
                image_url: item.imageUrl,
                status: 'available',
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('marketplace_items').insert(itemData).select().single();
                if (!error && data) {
                    return mapMarketplaceItem(data);
                }
            }

            const created = mapMarketplaceItem(itemData);
            const local = getLocalData<MarketplaceItem[]>('marketplace_items', []);
            setLocalData('marketplace_items', [created, ...local]);
            return created;
        } catch (error) {
            console.error("[MarketplaceAPI] Erreur add :", error);
            throw error;
        }
    },

    update: async (i: Partial<MarketplaceItem> & { id: string }) => {
        try {
            const { id, ...updates } = i;
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('marketplace_items').update(updates).eq('id', id);
            }
            const local = getLocalData<MarketplaceItem[]>('marketplace_items', []);
            setLocalData('marketplace_items', local.map(x => x.id === id ? { ...x, ...updates } : x));
        } catch (error) {
            console.error("[MarketplaceAPI] Erreur update :", error);
        }
    }
};

// ==========================================
// 5. ADS API (Campagnes Publicitaires Supabase)
// ==========================================
export const AdsAPI = {
    getAll: async (): Promise<AdCampaign[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('ad_campaigns')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    return data.map(ad => mapAd(ad));
                }
            }
            return getLocalData<AdCampaign[]>('ad_campaigns', []);
        } catch (error) {
            return getLocalData<AdCampaign[]>('ad_campaigns', []);
        }
    },

    getForUser: async (commune: string, type: UserType): Promise<AdCampaign[]> => {
        try {
            const allAds = await AdsAPI.getAll();
            return allAds.filter(ad => 
                ad.status === 'active' &&
                (ad.targetCommune === commune || ad.targetCommune === 'all') &&
                (ad.targetUserType === type || ad.targetUserType === 'all')
            );
        } catch {
            return [];
        }
    },

    recordImpression: async (adId: string) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { error } = await supabase.rpc('increment_ad_views', { ad_id: adId });
                if (error) {
                    const { data } = await supabase.from('ad_campaigns').select('views').eq('id', adId).single();
                    if (data) {
                        await supabase.from('ad_campaigns').update({ views: (data.views || 0) + 1 }).eq('id', adId);
                    }
                }
            }
        } catch {}
    },

    recordClick: async (adId: string) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data } = await supabase.from('ad_campaigns').select('clicks').eq('id', adId).single();
                if (data) {
                    await supabase.from('ad_campaigns').update({ clicks: (data.clicks || 0) + 1 }).eq('id', adId);
                }
            }
        } catch {}
    },

    add: async (ad: AdCampaign): Promise<AdCampaign> => {
        try {
            const adData: any = {
                id: ad.id || `ad_${Date.now()}`,
                title: ad.title,
                partner: ad.partner,
                status: 'paused',
                views: 0,
                clicks: 0,
                budget: ad.budget || 0,
                spent: 0,
                start_date: ad.startDate || new Date().toISOString(),
                end_date: ad.endDate || null,
                image: ad.image || '',
                target_commune: ad.targetCommune || 'all',
                target_user_type: ad.targetUserType || 'all',
                link: ad.link || '',
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('ad_campaigns').insert(adData).select().single();
                if (!error && data) return mapAd(data);
            }

            const created = mapAd(adData);
            const local = getLocalData<AdCampaign[]>('ad_campaigns', []);
            setLocalData('ad_campaigns', [created, ...local]);
            return created;
        } catch (error) {
            console.error("[AdsAPI] Erreur add :", error);
            throw error;
        }
    },

    updateStatus: async (id: string, status: string) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('ad_campaigns').update({ status }).eq('id', id);
            }
            const local = getLocalData<AdCampaign[]>('ad_campaigns', []);
            setLocalData('ad_campaigns', local.map(x => x.id === id ? { ...x, status: status as any } : x));
        } catch {}
    },

    delete: async (id: string) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('ad_campaigns').delete().eq('id', id);
            }
            const local = getLocalData<AdCampaign[]>('ad_campaigns', []);
            setLocalData('ad_campaigns', local.filter(x => x.id !== id));
        } catch {}
    }
};

// ==========================================
// 6. PARTNERS API (Supabase)
// ==========================================
export const PartnersAPI = {
    getAll: async (): Promise<Partner[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('partners')
                    .select('*')
                    .order('name', { ascending: true });

                if (!error && data) return data.map(p => mapPartner(p));
            }
            return getLocalData<Partner[]>('partners', []);
        } catch {
            return getLocalData<Partner[]>('partners', []);
        }
    }
};

// ==========================================
// 7. PAYMENTS API (Paiements Supabase)
// ==========================================
export const PaymentsAPI = {
    record: async (p: Payment): Promise<Payment> => {
        try {
            const pData: any = {
                id: p.id || `pay_${Date.now()}`,
                user_id: p.userId,
                user_name: p.userName,
                amount_fc: p.amountFC,
                collector_id: p.collectorId,
                collector_name: p.collectorName,
                qr_code_data: p.qrCodeData,
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('payments').insert(pData).select().single();
                if (!error && data) return mapPayment(data);
            }

            const created = mapPayment(pData);
            const local = getLocalData<Payment[]>('payments', []);
            setLocalData('payments', [created, ...local]);
            return created;
        } catch (error) {
            console.error("[PaymentsAPI] Erreur record :", error);
            throw error;
        }
    },

    getAll: async (): Promise<Payment[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('payments')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (!error && data) return data.map(p => mapPayment(p));
            }
            return getLocalData<Payment[]>('payments', []);
        } catch {
            return getLocalData<Payment[]>('payments', []);
        }
    }
};

// ==========================================
// 8. AUDIT API (Supabase)
// ==========================================
export const AuditAPI = {
    log: async (l: Partial<AuditLog>) => {
        try {
            const logData = {
                id: l.id || `log_${Date.now()}`,
                user_id: l.userId || 'system',
                action: l.action || 'ACTION',
                entity: l.entity || 'general',
                entity_id: l.entityId || 'none',
                metadata: l.metadata || null,
                timestamp: l.timestamp || new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                await supabase.from('audit_logs').insert(logData);
            }
        } catch {}
    }
};

// ==========================================
// 9. NOTIFICATIONS API (Supabase)
// ==========================================
export const NotificationsAPI = {
    add: async (n: Partial<NotificationItem & { commune?: string; neighborhood?: string }>) => {
        try {
            const nData: any = {
                id: n.id || `notif_${Date.now()}`,
                title: n.title,
                message: n.message,
                type: n.type || 'info',
                time: n.time || new Date().toLocaleTimeString(),
                target_user_id: n.targetUserId || 'ALL',
                commune: n.commune || null,
                neighborhood: n.neighborhood || null,
                read: false,
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('notifications').insert(nData).select().single();
                if (!error && data) return { ...nData, id: data.id };
            }

            const local = getLocalData<NotificationItem[]>('notifications', []);
            setLocalData('notifications', [{ ...nData, read: false } as any, ...local]);
            return nData;
        } catch (error) {
            console.error("[NotificationsAPI] Erreur add :", error);
        }
    },

    getAll: async (userId: string, isAdmin: boolean): Promise<NotificationItem[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });

                if (!isAdmin) {
                    query = query.in('target_user_id', [userId, 'ALL', 'citizen', 'collector', 'business']);
                }

                const { data, error } = await query;
                if (!error && data) {
                    return data.map((d: any) => ({
                        id: d.id,
                        title: d.title,
                        message: d.message,
                        type: d.type || 'info',
                        time: d.time || (d.created_at ? new Date(d.created_at).toLocaleTimeString() : new Date().toLocaleTimeString()),
                        date: d.created_at || d.date,
                        read: d.read || false,
                        targetUserId: d.target_user_id || d.targetUserId || 'ALL'
                    }));
                }
            }
            return getLocalData<NotificationItem[]>('notifications', []);
        } catch {
            return getLocalData<NotificationItem[]>('notifications', []);
        }
    }
};

// ==========================================
// 10. VEHICLE API (Véhicules Supabase)
// ==========================================
export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('vehicles').select('*');
                if (!error && data) {
                    return data.map((v: any) => ({
                        id: v.id,
                        name: v.name,
                        plateNumber: v.plateNumber || v.plate_number || v.registration_number || 'KN-000',
                        registrationNumber: v.registration_number || v.registrationNumber,
                        type: v.type || 'tricycle',
                        status: v.status || 'active',
                        lat: Number(v.lat || -4.325),
                        lng: Number(v.lng || 15.3222),
                        signalStrength: Number(v.signalStrength || v.signal_strength || 95),
                        currentDriverId: v.current_driver_id || v.currentDriverId,
                        currentDriverName: v.current_driver_name || v.currentDriverName,
                        capacityKg: v.capacity_kg || v.capacityKg,
                        fuelLevel: v.fuel_level || v.fuelLevel,
                        lastMaintenanceDate: v.last_maintenance_date || v.lastMaintenanceDate,
                        batteryLevel: Number(v.battery_level || v.batteryLevel || 100)
                    }));
                }
            }
            return getLocalData<Vehicle[]>('vehicles', []);
        } catch {
            return getLocalData<Vehicle[]>('vehicles', []);
        }
    },

    add: async (v: Vehicle): Promise<Vehicle> => {
        try {
            const vData: any = {
                id: v.id || `veh_${Date.now()}`,
                name: v.name,
                plate_number: v.plateNumber,
                registration_number: v.registrationNumber || v.plateNumber,
                type: v.type,
                status: v.status,
                lat: v.lat || -4.325,
                lng: v.lng || 15.3222,
                signal_strength: v.signalStrength || 95,
                battery_level: v.batteryLevel || 100,
                capacity_kg: v.capacityKg,
                fuel_level: v.fuelLevel,
                created_at: new Date().toISOString()
            };

            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase.from('vehicles').insert(vData).select().single();
                if (!error && data) return { ...v, id: data.id };
            }

            const local = getLocalData<Vehicle[]>('vehicles', []);
            setLocalData('vehicles', [v, ...local]);
            return v;
        } catch (error) {
            console.error("[VehicleAPI] Erreur add :", error);
            throw error;
        }
    },

    update: async (v: Partial<Vehicle> & { id: string }) => {
        try {
            const { id, ...updates } = v;
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('vehicles').update(updates).eq('id', id);
            }
            const local = getLocalData<Vehicle[]>('vehicles', []);
            setLocalData('vehicles', local.map(item => item.id === id ? { ...item, ...updates } : item));
        } catch {}
    },

    delete: async (id: string) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('vehicles').delete().eq('id', id);
            }
            const local = getLocalData<Vehicle[]>('vehicles', []);
            setLocalData('vehicles', local.filter(x => x.id !== id));
        } catch {}
    }
};

// ==========================================
// 11. STORAGE API (Supabase Storage)
// ==========================================
export const StorageAPI = {
    uploadImage: async (file: File): Promise<string | null> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const fileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage
                    .from('branding')
                    .upload(fileName, file, { cacheControl: '3600', upsert: true });

                if (!error && data) {
                    const { data: publicUrlData } = supabase.storage
                        .from('branding')
                        .getPublicUrl(fileName);
                    if (publicUrlData?.publicUrl) {
                        return publicUrlData.publicUrl;
                    }
                }
            }
        } catch (err) {
            console.warn("[StorageAPI] Supabase storage fallback to local Blob :", err);
        }
        return URL.createObjectURL(file);
    },

    uploadLogo: async (file: File): Promise<string | null> => {
        return StorageAPI.uploadImage(file);
    }
};

// ==========================================
// 12. SETTINGS API (Configuration Système)
// ==========================================
export const SettingsAPI = {
    get: async (): Promise<SystemSettings | null> => {
        try {
            if (supabase && isSupabaseConfigured()) {
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('*')
                    .eq('id', '1')
                    .maybeSingle();

                if (!error && data) {
                    return data as SystemSettings;
                }
            }
            return getLocalData<SystemSettings | null>('system_settings', null);
        } catch {
            return null;
        }
    },

    getRolesConfig: async (): Promise<Record<string, UserPermission[]>> => {
        try {
            const settings = await SettingsAPI.get();
            return settings?.rolesConfig || {};
        } catch {
            return {};
        }
    },

    getImpact: async (): Promise<GlobalImpact | null> => {
        return { digitalization: 75, recyclingRate: 42, education: 60, realTimeCollection: 88 };
    },

    update: async (s: SystemSettings) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('system_settings').upsert({ id: '1', ...s });
            }
            setLocalData('system_settings', s);
        } catch (error) {
            console.error("[SettingsAPI] Erreur update :", error);
        }
    },

    updateRolesConfig: async (config: Record<string, UserPermission[]>) => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await supabase.from('system_settings').upsert({ id: '1', rolesConfig: config });
            }
        } catch {}
    },

    checkDatabaseIntegrity: async (): Promise<DatabaseHealth> => {
        try {
            const startTime = Date.now();
            let usersCount = 0;
            let reportsCount = 0;
            let isConnected = false;

            if (supabase && isSupabaseConfigured()) {
                const [usersRes, reportsRes] = await Promise.all([
                    supabase.from('users').select('id', { count: 'exact', head: true }),
                    supabase.from('waste_reports').select('id', { count: 'exact', head: true })
                ]);
                usersCount = usersRes.count || 0;
                reportsCount = reportsRes.count || 0;
                isConnected = !usersRes.error && !reportsRes.error;
            }

            const latency = Date.now() - startTime;

            return {
                status: isConnected && latency < 600 ? 'healthy' : 'degraded',
                totalSizeKB: Math.round(usersCount * 0.5 + reportsCount * 2),
                tables: [
                    { name: 'users', count: usersCount, status: isConnected ? 'ok' : 'error', sizeKB: Math.round(usersCount * 0.5) },
                    { name: 'waste_reports', count: reportsCount, status: isConnected ? 'ok' : 'error', sizeKB: Math.round(reportsCount * 2) }
                ],
                supabaseConnected: isConnected,
                lastAudit: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'degraded',
                totalSizeKB: 0,
                tables: [],
                supabaseConnected: false,
                lastAudit: new Date().toISOString()
            };
        }
    },

    repairDatabase: async () => {
        return new Promise(resolve => setTimeout(resolve, 1000));
    },

    resetAllData: async () => {
        try {
            if (supabase && isSupabaseConfigured()) {
                await Promise.all([
                    supabase.from('waste_reports').delete().neq('id', ''),
                    supabase.from('marketplace_items').delete().neq('id', ''),
                    supabase.from('cash_book').delete().neq('id', '')
                ]);
            }
            ['waste_reports', 'marketplace_items', 'cash_book'].forEach(k => localStorage.removeItem(`bp_${k}`));
        } catch {}
    }
};
