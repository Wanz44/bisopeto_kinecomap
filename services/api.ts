
import { User, MarketplaceItem, Vehicle, Collector, Course, AdCampaign, Partner, UserType, SystemSettings } from '../types';
import { OfflineManager } from './offlineManager';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// Clés de stockage LocalStorage (Fallback)
const KEYS = {
    USERS: 'kinecomap_users',
    MARKETPLACE: 'kinecomap_marketplace',
    VEHICLES: 'kinecomap_vehicles',
    JOBS: 'kinecomap_jobs', 
    COLLECTORS: 'kinecomap_collectors',
    COURSES: 'kinecomap_courses',
    ADS: 'kinecomap_ads',
    PARTNERS: 'kinecomap_partners',
    SETTINGS: 'kinecomap_system_settings'
};

const DEFAULT_SETTINGS: SystemSettings = {
    maintenanceMode: false,
    supportEmail: 'support@kinecomap.cd',
    appVersion: '1.0.3',
    force2FA: false,
    sessionTimeout: 60,
    passwordPolicy: 'strong',
    marketplaceCommission: 0.05
};

// Credentials Super Admin
const SUPER_ADMIN_EMAIL = 'adonailutonadio70@gmail.com';
const SUPER_ADMIN_PASS = 'Bisopeto@243';

// Initialisation des données locales (Seed)
const initializeData = () => {
    if (!localStorage.getItem(KEYS.MARKETPLACE)) {
        localStorage.setItem(KEYS.MARKETPLACE, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
    
    // Ensure Super Admin exists
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const adminExists = users.some((u: User) => u.email === SUPER_ADMIN_EMAIL);
    
    if (!adminExists || !localStorage.getItem(KEYS.USERS)) {
        const defaultAdmin: User = {
            id: 'admin-super-01',
            firstName: 'Adonai',
            lastName: 'Lutonadio',
            email: SUPER_ADMIN_EMAIL,
            phone: '+243000000000',
            type: UserType.ADMIN,
            address: 'QG Kinshasa',
            points: 999,
            collections: 0,
            badges: 5,
            subscription: 'premium',
            permissions: ['manage_users', 'validate_docs', 'view_finance', 'manage_ads', 'export_data', 'system_settings', 'manage_fleet', 'manage_academy', 'manage_communications', 'manage_pos']
        };
        
        // Remove old admin if exists to clean up
        const cleanedUsers = users.filter((u: User) => u.email !== 'admin@kinecomap.cd');
        cleanedUsers.unshift(defaultAdmin);
        localStorage.setItem(KEYS.USERS, JSON.stringify(cleanedUsers));
    }

    if (!localStorage.getItem(KEYS.VEHICLES)) localStorage.setItem(KEYS.VEHICLES, JSON.stringify([]));
    if (!localStorage.getItem(KEYS.JOBS)) localStorage.setItem(KEYS.JOBS, JSON.stringify([])); 
};

initializeData();

// --- Generic Helpers ---
const getCollection = <T>(key: string): T[] => {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
};

const saveCollection = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- API SERVICES (HYBRID ARCHITECTURE) ---

export const SettingsAPI = {
    get: async (): Promise<SystemSettings> => {
        if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase.from('system_settings').select('*').single();
            if (data) {
                // Map snake_case DB to camelCase Types
                return {
                    maintenanceMode: data.maintenance_mode,
                    supportEmail: data.support_email,
                    appVersion: data.app_version,
                    force2FA: data.force_2fa,
                    sessionTimeout: data.session_timeout,
                    passwordPolicy: 'strong', // Default or fetch if added to DB
                    marketplaceCommission: data.marketplace_commission
                };
            }
        }
        try {
            const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));
            return { ...DEFAULT_SETTINGS, ...stored };
        } catch {
            return DEFAULT_SETTINGS;
        }
    },
    update: async (settings: SystemSettings): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('system_settings').update({
                maintenance_mode: settings.maintenanceMode,
                support_email: settings.supportEmail,
                force_2fa: settings.force2FA,
                session_timeout: settings.sessionTimeout,
                marketplace_commission: settings.marketplaceCommission
            }).eq('id', 1);
            return;
        }
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    }
};

export const UserAPI = {
    // Authentification réelle via Supabase ou simulation locale
    login: async (identifier: string, password?: string): Promise<User | null> => {
        
        // 0. Super Admin Hardcoded Access (Priority)
        if (identifier === SUPER_ADMIN_EMAIL) {
            if (password === SUPER_ADMIN_PASS) {
                const users = getCollection<User>(KEYS.USERS);
                const admin = users.find(u => u.email === identifier);
                return admin || {
                    id: 'admin-super-virtual',
                    firstName: 'Adonai',
                    lastName: 'Lutonadio',
                    email: SUPER_ADMIN_EMAIL,
                    phone: '+243000000000',
                    type: UserType.ADMIN,
                    address: 'QG Kinshasa',
                    points: 999,
                    collections: 0,
                    badges: 5,
                    subscription: 'premium',
                    permissions: ['manage_users', 'validate_docs', 'view_finance', 'manage_ads', 'export_data', 'system_settings', 'manage_fleet', 'manage_academy', 'manage_communications', 'manage_pos']
                };
            } else {
                return null; // Mot de passe incorrect pour le super admin
            }
        }

        // 1. Tentative Supabase Auth (si configuré)
        if (isSupabaseConfigured() && supabase) {
            try {
                if (identifier.includes('@')) {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: identifier,
                        password: password || ''
                    });
                    if (error) throw error;
                    
                    if (data.user) {
                        const { data: profile, error: profileError } = await supabase
                            .from('profiles')
                            .select('*')
                            .eq('id', data.user.id)
                            .single();
                            
                        if (profile) {
                            // Map SQL snake_case to TS camelCase
                            return {
                                id: profile.id,
                                firstName: profile.first_name,
                                lastName: profile.last_name,
                                email: profile.email,
                                phone: profile.phone,
                                type: profile.type,
                                address: profile.address,
                                points: profile.points,
                                collections: profile.collections,
                                badges: profile.badges,
                                subscription: profile.subscription,
                                companyName: profile.company_name,
                                sector: profile.sector,
                                permissions: profile.permissions
                            } as User;
                        }
                    }
                }
            } catch (error) {
                console.error("Supabase Login Error:", error);
            }
        }

        // 2. Fallback Local Storage (Simulation pour les autres utilisateurs)
        await new Promise(r => setTimeout(r, 800)); // Latence artificielle
        const users = getCollection<User>(KEYS.USERS);
        
        const user = users.find(u => 
            u.email === identifier || 
            u.phone === identifier
        );
        return user || null;
    },

    register: async (user: User, password?: string): Promise<User> => {
        // 1. Supabase Register
        if (isSupabaseConfigured() && supabase && user.email && password) {
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: user.email,
                    password: password,
                    options: {
                        data: {
                            first_name: user.firstName,
                            last_name: user.lastName,
                            type: user.type
                        }
                    }
                });
                
                if (error) throw error;
                
                if (data.user) {
                    // Profile created via SQL Trigger usually, but we can return the local object
                    return { ...user, id: data.user.id };
                }
            } catch (error) {
                console.error("Supabase Register Error:", error);
                throw error;
            }
        }

        // 2. Local Storage
        const users = getCollection<User>(KEYS.USERS);
        const newUser = { ...user, id: `u-${Date.now()}` };
        users.unshift(newUser);
        saveCollection(KEYS.USERS, users);
        return newUser;
    },

    getAll: async (): Promise<User[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase.from('profiles').select('*');
            if (data) return data.map((p: any) => ({
                id: p.id,
                firstName: p.first_name,
                lastName: p.last_name,
                email: p.email,
                phone: p.phone,
                type: p.type,
                address: p.address,
                points: p.points,
                collections: p.collections,
                badges: p.badges,
                subscription: p.subscription,
                companyName: p.company_name,
                sector: p.sector,
                permissions: p.permissions
            })) as User[];
        }
        return getCollection<User>(KEYS.USERS);
    },

    add: async (user: User): Promise<User> => {
        // Admin Add function (mostly local for now unless using Supabase Admin Auth API which is restricted on client)
        const users = getCollection<User>(KEYS.USERS);
        const newUser = { ...user, id: `u-${Date.now()}` };
        users.unshift(newUser);
        saveCollection(KEYS.USERS, users);
        return newUser;
    },

    update: async (user: Partial<User> & { id: string }): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
             const updates: any = {};
             if(user.firstName) updates.first_name = user.firstName;
             if(user.lastName) updates.last_name = user.lastName;
             if(user.phone) updates.phone = user.phone;
             if(user.address) updates.address = user.address;
             if(user.subscription) updates.subscription = user.subscription;
             
             await supabase.from('profiles').update(updates).eq('id', user.id);
             return;
        }
        
        const users = getCollection<User>(KEYS.USERS);
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...user };
            saveCollection(KEYS.USERS, users);
        }
    },

    delete: async (userId: string): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            // Note: Deleting from public.profiles might not delete from auth.users without backend func
            await supabase.from('profiles').delete().eq('id', userId);
            return;
        }
        const users = getCollection<User>(KEYS.USERS);
        const newUsers = users.filter(u => u.id !== userId);
        saveCollection(KEYS.USERS, newUsers);
    },

    resetPassword: async (identifier: string): Promise<boolean> => {
        if (isSupabaseConfigured() && supabase) {
            const { error } = await supabase.auth.resetPasswordForEmail(identifier);
            return !error;
        }
        await new Promise(r => setTimeout(r, 1500));
        return true; 
    },

    verifyOTP: async (code: string): Promise<boolean> => {
        await new Promise(r => setTimeout(r, 1000));
        return code === '123456'; // Code magique pour la démo
    },

    sendEmail: async (to: string, subject: string, message: string): Promise<boolean> => {
        console.log(`[Email Service] Préparation envoi à ${to}`);
        if (isSupabaseConfigured() && supabase) {
            try {
                // Call Supabase Edge Function if available
                // const { data, error } = await supabase.functions.invoke('send-email', { body: { to, subject, message } });
                console.log("[Email Service] Simulation Supabase OK");
                return true;
            } catch (error) {
                console.error("[Email Service] Erreur:", error);
                return false;
            }
        }
        await new Promise(r => setTimeout(r, 2000));
        return true;
    }
};

export const MarketplaceAPI = {
    getAll: async (): Promise<MarketplaceItem[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data, error } = await supabase
                .from('marketplace_items')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (data) return data.map((i: any) => ({
                id: i.id,
                sellerId: i.seller_id,
                sellerName: i.seller_name,
                title: i.title,
                category: i.category,
                description: i.description,
                weight: i.weight,
                price: i.price,
                imageUrl: i.image_url,
                status: i.status,
                date: new Date(i.created_at).toLocaleDateString('fr-FR')
            })) as MarketplaceItem[];
        }

        await new Promise(r => setTimeout(r, 500));
        return getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
    },

    add: async (item: MarketplaceItem): Promise<MarketplaceItem> => {
        if (!navigator.onLine) {
            console.log('[API] Hors ligne - Ajout MarketplaceItem en file d\'attente');
            OfflineManager.addToQueue('ADD_ITEM', item);
            return { ...item, id: `temp-${Date.now()}` };
        }

        if (isSupabaseConfigured() && supabase) {
            // Map camelCase to snake_case
            const dbItem = {
                seller_id: item.sellerId,
                seller_name: item.sellerName,
                title: item.title,
                category: item.category,
                description: item.description,
                weight: item.weight,
                price: item.price,
                image_url: item.imageUrl,
                status: item.status
            };
            const { data, error } = await supabase.from('marketplace_items').insert(dbItem).select().single();
            
            if (data) return { ...item, id: data.id };
        }

        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const newItem = { ...item, id: `item-${Date.now()}` };
        items.unshift(newItem);
        saveCollection(KEYS.MARKETPLACE, items);
        return newItem;
    },

    update: async (item: MarketplaceItem): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('marketplace_items').update({ status: item.status }).eq('id', item.id);
            return;
        }

        const items = getCollection<MarketplaceItem>(KEYS.MARKETPLACE);
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            items[index] = item;
            saveCollection(KEYS.MARKETPLACE, items);
        }
    }
};

export const VehicleAPI = {
    getAll: async (): Promise<Vehicle[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase.from('vehicles').select('*');
            if (data) return data.map((v: any) => ({
                id: v.id,
                name: v.name,
                type: v.type,
                plateNumber: v.plate_number,
                gpsId: v.gps_id,
                status: v.status,
                batteryLevel: v.battery_level,
                signalStrength: v.signal_strength,
                lat: v.lat,
                lng: v.lng,
                heading: v.heading,
                driverId: v.driver_id,
                lastUpdate: v.last_update
            })) as Vehicle[];
        }
        return getCollection<Vehicle>(KEYS.VEHICLES);
    },
    add: async (vehicle: Vehicle): Promise<Vehicle> => {
        // ... (Similaire aux autres, adaptation des champs)
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const newItem = { ...vehicle, id: `v-${Date.now()}` };
        list.push(newItem);
        saveCollection(KEYS.VEHICLES, list);
        return newItem;
    },
    update: async (vehicle: Vehicle): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').update({
                lat: vehicle.lat,
                lng: vehicle.lng,
                heading: vehicle.heading,
                status: vehicle.status,
                battery_level: vehicle.batteryLevel
            }).eq('id', vehicle.id);
            return;
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const index = list.findIndex(v => v.id === vehicle.id);
        if (index !== -1) {
            list[index] = vehicle;
            saveCollection(KEYS.VEHICLES, list);
        }
    },
    delete: async (id: string): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').delete().eq('id', id);
            return;
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const newList = list.filter(v => v.id !== id);
        saveCollection(KEYS.VEHICLES, newList);
    },
    updatePosition: async (id: string, lat: number, lng: number): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            await supabase.from('vehicles').update({ lat, lng, last_update: new Date().toISOString() }).eq('id', id);
            return;
        }
        const list = getCollection<Vehicle>(KEYS.VEHICLES);
        const v = list.find(item => item.id === id);
        if (v) {
            v.lat = lat;
            v.lng = lng;
            saveCollection(KEYS.VEHICLES, list);
        }
    }
};

export const JobAPI = {
    getAll: async (): Promise<any[]> => {
        if (isSupabaseConfigured() && supabase) {
            const { data } = await supabase.from('jobs').select('*');
            if (data) return data.map((j:any) => ({
                id: j.id,
                address: j.address,
                wasteType: j.waste_type,
                status: j.status,
                time: new Date(j.created_at).toLocaleTimeString(),
                date: j.date,
                isUrgent: j.is_urgent,
                qrCode: j.qr_code,
                proofImage: j.proof_image
            }));
        }
        return getCollection(KEYS.JOBS);
    },
    updateStatus: async (jobId: number | string, status: string, proofImage?: string): Promise<void> => {
        if (isSupabaseConfigured() && supabase) {
            const updates: any = { status };
            if(proofImage) updates.proof_image = proofImage;
            await supabase.from('jobs').update(updates).eq('id', jobId);
            return;
        }
        const list = getCollection<any>(KEYS.JOBS);
        const job = list.find(j => j.id == jobId);
        if (job) {
            job.status = status;
            if (proofImage) job.proofImage = proofImage;
            saveCollection(KEYS.JOBS, list);
        }
    }
};

export const StorageAPI = {
    uploadImage: async (file: File, bucket: 'profiles' | 'marketplace' = 'marketplace'): Promise<string | null> => {
        if (!isSupabaseConfigured() || !supabase) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }

        try {
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
            const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
            if (error) {
                console.error("Supabase Storage Upload Error:", error);
                throw error;
            }
            
            const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return publicUrlData.publicUrl;
        } catch (error) {
            console.error("Storage Error:", error);
            return null;
        }
    }
};
