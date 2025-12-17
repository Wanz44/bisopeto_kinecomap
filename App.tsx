
import React, { useState, useEffect, useRef } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { MapView } from './components/Map';
import { Academy } from './components/Academy';
import { Marketplace } from './components/Marketplace'; 
import { Profile } from './components/Profile';
import { Layout } from './components/Layout';
import { Subscription } from './components/Subscription';
import { Planning } from './components/Planning';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';
import { AdminUsers } from './components/AdminUsers';
import { AdminAds } from './components/AdminAds';
import { AdminSubscriptions } from './components/AdminSubscriptions';
import { AdminVehicles } from './components/AdminVehicles';
import { AdminAcademy } from './components/AdminAcademy';
import { AdminPermissions } from './components/AdminPermissions';
import { CollectorJobs } from './components/CollectorJobs';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, UserType, Theme, SubscriptionPlan, Language, NotificationItem, SystemSettings } from './types';
import { SettingsAPI, UserAPI } from './services/api';
import { OfflineManager } from './services/offlineManager';
import { AlertTriangle, Lock } from 'lucide-react';

// Plans initiaux par défaut
const DEFAULT_PLANS: SubscriptionPlan[] = [
    { 
        id: 'standard', 
        name: 'Standard', 
        priceUSD: 10, 
        schedule: 'Mardi & Samedi',
        features: ['2 jours / semaine', 'Mardi & Samedi', 'Suivi basique'] 
    },
    { 
        id: 'plus', 
        name: 'Plus', 
        priceUSD: 15, 
        popular: true,
        schedule: 'Mardi, Jeudi & Samedi',
        features: ['3 jours / semaine', 'Mar, Jeu, Sam', 'Points doublés'] 
    },
    { 
        id: 'premium', 
        name: 'Premium', 
        priceUSD: 20, 
        schedule: 'Lun, Mer, Ven & Dim',
        features: ['4 jours / semaine', 'Lun, Mer, Ven, Dim', 'Certificat Eco', 'Support VIP'] 
    },
    { 
        id: 'special', 
        name: 'Spécial / Kilo', 
        priceUSD: 0, 
        isVariable: true,
        schedule: 'Sur demande',
        features: ['Paiement à la pesée', 'Idéal gros volumes', 'Horaires flexibles'] 
    },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    { id: '1', title: 'Bienvenue', message: 'Bienvenue sur KIN ECO-MAP ! Complétez votre profil pour commencer.', type: 'info', time: 'À l\'instant', read: false, targetUserId: 'ALL' }
];

function App() {
    // State
    const [loading, setLoading] = useState(true);
    
    // User State with LocalStorage Persistence for Offline Support
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('kinecomap_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    // Track if History API is supported/allowed in the current environment
    const historySupported = useRef(true);

    // NAVIGATION STATE: Improved History Stack
    // Using lazy initialization to recover state from browser refresh
    const [history, setHistory] = useState<AppView[]>(() => {
        // 1. Try to recover from browser history state (Refresh scenario)
        try {
            if (typeof window !== 'undefined' && window.history && window.history.state && window.history.state.history) {
                return window.history.state.history;
            }
        } catch (e) {
            // If accessing history.state fails (e.g. security sandbox), fallback to default
            historySupported.current = false;
        }
        
        // 2. Default based on auth status
        // We use the same logic as user initialization since we are in the same render cycle
        try {
            const savedUser = localStorage.getItem('kinecomap_user');
            return savedUser ? [AppView.DASHBOARD] : [AppView.ONBOARDING];
        } catch {
            return [AppView.ONBOARDING];
        }
    });

    const view = history[history.length - 1] || AppView.ONBOARDING;

    const [theme, setTheme] = useState<Theme>('light');
    const [language, setLanguage] = useState<Language>('fr');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Global Settings State
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        maintenanceMode: false,
        supportEmail: 'support@kinecomap.cd',
        appVersion: '1.0.3',
        force2FA: false,
        sessionTimeout: 60,
        passwordPolicy: 'strong',
        marketplaceCommission: 0.05
    });

    // Subscription Data State
    const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
    const [exchangeRate, setExchangeRate] = useState(2800);

    // Global Branding State
    const [appLogo, setAppLogo] = useState('./logo.png');

    // Notifications Global State
    const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

    // --- TOAST STATE ---
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false
    });

    // Initial Load & Offline Manager Hook
    useEffect(() => {
        const loadInitData = async () => {
            // Initial Navigation Sync
            // Only replace state if it's missing (to preserve existing history entries on refresh)
            try {
                if (historySupported.current && (!window.history.state || !window.history.state.history)) {
                    const initialStack = user ? [AppView.DASHBOARD] : [AppView.ONBOARDING];
                    // We don't setHistory here because it's already set in lazy init
                    window.history.replaceState({ history: initialStack }, '', `#${initialStack[initialStack.length-1]}`);
                }
            } catch (e) {
                console.warn("History API restricted (Blob/Sandbox detected). Navigation will be internal only.");
                historySupported.current = false;
            }
            
            // Load Settings from API
            const settings = await SettingsAPI.get();
            setSystemSettings(settings);
            
            setTimeout(() => setLoading(false), 2500);
        };
        loadInitData();

        // Gestion du retour en ligne pour synchroniser
        const handleOnline = () => {
            handleShowToast("Connexion rétablie. Synchronisation...", "info");
            OfflineManager.processQueue((task) => {
                handleShowToast(`Donnée synchronisée: ${task.type}`, "success");
            });
        };

        window.addEventListener('online', handleOnline);
        
        // Check queue au démarrage si online
        if (navigator.onLine) {
            OfflineManager.processQueue();
        }

        return () => window.removeEventListener('online', handleOnline);
    }, []); 

    // Handle Browser History (Back/Forward Buttons)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.history) {
                // Restore the stack from the history state
                setHistory(event.state.history);
            } else {
                // Fallback for external navigation or missing state
                // If user is logged in, default to Dashboard, else Onboarding
                const fallbackStack = user ? [AppView.DASHBOARD] : [AppView.ONBOARDING];
                setHistory(fallbackStack);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [user]);

    // Persist User Changes
    useEffect(() => {
        if (user) {
            localStorage.setItem('kinecomap_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('kinecomap_user');
        }
    }, [user]);

    // Theme Management
    useEffect(() => {
        const root = window.document.documentElement;
        const body = window.document.body;
        if (theme === 'dark') {
            root.classList.add('dark');
            body.classList.add('dark');
        } else {
            root.classList.remove('dark');
            body.classList.remove('dark');
        }
    }, [theme]);

    const handleThemeToggle = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
        handleShowToast(theme === 'light' ? 'Mode sombre activé' : 'Mode clair activé', 'info');
    };

    // --- NAVIGATION HANDLERS ---

    // 1. Navigate Deeper (Push to stack & browser history)
    const navigateTo = (newView: AppView) => {
        if (newView !== view) {
            const newStack = [...history, newView];
            setHistory(newStack);
            try {
                if (historySupported.current) {
                    window.history.pushState({ history: newStack }, '', `#${newView}`);
                }
            } catch (e) {
                historySupported.current = false;
            }
        }
    };

    // 2. Go Back (Pop from stack & browser history)
    const goBack = () => {
        if (history.length > 1) {
            if (historySupported.current) {
                try {
                    window.history.back(); // This triggers popstate, properly updating state
                } catch (e) {
                    // Fallback if browser history fails
                    setHistory(prev => prev.slice(0, -1));
                }
            } else {
                // Fallback for restricted environments (Blob URLs)
                setHistory(prev => prev.slice(0, -1));
            }
        }
    };

    // 3. Switch Tab (Reset stack) - Used by Sidebar
    const switchTab = (newRootView: AppView) => {
        if (newRootView !== view) {
            const newStack = [newRootView];
            setHistory(newStack);
            try {
                if (historySupported.current) {
                    window.history.pushState({ history: newStack }, '', `#${newRootView}`);
                }
            } catch (e) {
                historySupported.current = false;
            }
        }
    };

    // Data Refresh Simulation
    const handleRefresh = async () => {
        if (!navigator.onLine) {
            handleShowToast("Mode hors ligne. Impossible d'actualiser.", "error");
            return;
        }
        setIsRefreshing(true);
        
        // Reload Settings
        const settings = await SettingsAPI.get();
        setSystemSettings(settings);

        // Process Offline Queue if any
        await OfflineManager.processQueue((task) => {
             handleShowToast("Données en attente envoyées", "success");
        });

        setTimeout(() => {
            setIsRefreshing(false);
            handleShowToast("Données mises à jour", "success");
        }, 1500);
    };

    // Notification Handler
    const handleSendNotification = (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
        const newNotif: NotificationItem = {
            id: Date.now().toString(),
            title,
            message,
            type,
            time: 'À l\'instant',
            read: false,
            targetUserId: targetId
        };
        setNotifications(prev => [newNotif, ...prev]);
        
        // Toast feedback for admin/collector
        if (user?.type === UserType.ADMIN || user?.type === UserType.COLLECTOR) {
             if (type === 'success' || type === 'info') {
                 handleShowToast(title + ": " + message, 'success');
             }
        }
    };

    const handleMarkAllRead = () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => 
            (n.targetUserId === user.id || n.targetUserId === 'ALL' || (user.type === UserType.ADMIN && n.targetUserId === 'ADMIN')) 
            ? { ...n, read: true } 
            : n
        ));
        handleShowToast("Toutes les notifications marquées comme lues", "info");
    };

    // --- TOAST HANDLER ---
    const handleShowToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    // Handlers
    const handleOnboardingComplete = (data: Partial<User>) => {
        const newUser: User = {
            id: 'u' + Date.now(),
            firstName: data.firstName || 'Utilisateur',
            lastName: data.lastName || '',
            phone: data.phone || '',
            type: data.type || UserType.CITIZEN,
            address: data.address || 'Kinshasa',
            points: 0,
            collections: 0,
            badges: 0,
            subscription: data.subscription || 'standard',
            companyName: data.companyName,
            companyPhone: data.companyPhone,
            sector: data.sector,
            vehicleType: data.vehicleType,
            housingType: data.housingType,
            zone: data.zone,
            permissions: data.type === UserType.ADMIN ? 
                ['manage_users', 'validate_docs', 'view_finance', 'manage_ads', 'export_data', 'system_settings', 'manage_fleet', 'manage_academy', 'manage_communications', 'manage_pos'] : 
                undefined
        };
        
        // Offline Support: If created offline, queue it
        if (!navigator.onLine) {
            OfflineManager.addToQueue('UPDATE_PROFILE', newUser);
            handleShowToast("Compte créé hors ligne. Synchronisation en attente.", "info");
        }

        setUser(newUser);
        
        // Start Navigation Stack
        const newStack = [AppView.DASHBOARD];
        setHistory(newStack);
        try {
            if (historySupported.current) {
                window.history.pushState({ history: newStack }, '', `#${AppView.DASHBOARD}`);
            }
        } catch (e) {
            historySupported.current = false;
        }
        
        handleShowToast(`Bienvenue, ${newUser.firstName} !`, 'success');
    };

    const handleLogout = () => {
        setUser(null);
        
        // Reset Navigation Stack
        const newStack = [AppView.ONBOARDING];
        setHistory(newStack);
        try {
            if (historySupported.current) {
                window.history.pushState({ history: newStack }, '', '#onboarding');
            }
        } catch (e) {
            // Ignore
        }
        
        localStorage.removeItem('kinecomap_user');
        handleShowToast("Déconnexion réussie", "info");
    };

    const handleUpdateUserPlan = (newPlan: 'standard' | 'plus' | 'premium' | 'special') => {
        if (user) {
            const updatedUser = { ...user, subscription: newPlan };
            setUser(updatedUser);
            
            if (!navigator.onLine) {
                OfflineManager.addToQueue('UPDATE_PROFILE', { subscription: newPlan });
                handleShowToast("Plan mis à jour (Sauvegardé hors ligne)", "info");
            } else {
                handleShowToast("Plan mis à jour avec succès", "success");
            }
        }
    };

    const handleUpdateProfile = async (updatedData: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        
        // Persist
        if (updatedUser.id) {
            await UserAPI.update(updatedUser as User & { id: string });
        }
        
        if (!navigator.onLine) {
            OfflineManager.addToQueue('UPDATE_PROFILE', updatedUser);
            handleShowToast("Profil mis à jour (Hors ligne)", "info");
        } else {
            handleShowToast("Profil mis à jour avec succès", "success");
        }
    };

    // Admin Handlers
    const handleUpdatePlanConfig = (updatedPlan: SubscriptionPlan) => {
        setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
        handleShowToast("Configuration du plan enregistrée", "success");
    };

    const handleUpdateExchangeRate = (rate: number) => {
        setExchangeRate(rate);
        handleShowToast(`Nouveau taux : 1$ = ${rate} FC`, "success");
    };

    const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
        setSystemSettings(newSettings);
        await SettingsAPI.update(newSettings);
    };

    // Get Filtered Notifications
    const userNotifications = notifications.filter(n => {
        if (!user) return false;
        if (n.targetUserId === 'ALL') return true;
        if (n.targetUserId === 'ADMIN' && user.type === UserType.ADMIN) return true;
        return n.targetUserId === user.id;
    });

    const unreadCount = userNotifications.filter(n => !n.read).length;

    // View Router
    const renderContent = () => {
        if (!user) return null;

        // MAINTENANCE MODE CHECK
        if (systemSettings.maintenanceMode && user.type !== UserType.ADMIN) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-500 animate-pulse">
                        <AlertTriangle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Maintenance en cours</h1>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                        L'application KIN ECO-MAP est momentanément inaccessible pour une mise à jour technique.
                        <br/>Veuillez revenir dans quelques instants.
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                        <Lock size={20} className="text-gray-400" />
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-300">Code: MAINTENANCE_MODE_ACTIVE</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="mt-8 text-sm text-gray-400 hover:text-gray-600 underline"
                    >
                        Se déconnecter
                    </button>
                </div>
            );
        }

        const commonProps = { onToast: handleShowToast };

        switch (view) {
            case AppView.DASHBOARD:
                return <Dashboard user={user} onChangeView={navigateTo} {...commonProps} />;
            case AppView.MAP:
                return <MapView user={user} onBack={goBack} />;
            case AppView.ACADEMY:
                return <Academy onBack={goBack} />;
            case AppView.MARKETPLACE: 
                return <Marketplace user={user} onBack={goBack} systemSettings={systemSettings} {...commonProps} />;
            case AppView.PROFILE:
                return (
                    <Profile 
                        user={user} 
                        theme={theme}
                        onToggleTheme={handleThemeToggle}
                        onBack={goBack} 
                        onLogout={handleLogout}
                        onManageSubscription={() => navigateTo(AppView.SUBSCRIPTION)}
                        onSettings={() => navigateTo(AppView.SETTINGS)}
                        onUpdateProfile={handleUpdateProfile}
                        {...commonProps}
                    />
                );
            case AppView.SUBSCRIPTION:
                return (
                    <Subscription 
                        user={user} 
                        onBack={goBack} 
                        onUpdatePlan={handleUpdateUserPlan}
                        plans={plans}
                        exchangeRate={exchangeRate}
                        {...commonProps}
                    />
                );
            case AppView.PLANNING:
                return <Planning onBack={goBack} />;
            case AppView.NOTIFICATIONS:
                return (
                    <Notifications 
                        onBack={goBack} 
                        notifications={userNotifications}
                        onMarkAllRead={handleMarkAllRead}
                    />
                );
            case AppView.SETTINGS:
                return (
                    <Settings 
                        user={user}
                        theme={theme}
                        onToggleTheme={handleThemeToggle}
                        onBack={goBack}
                        onLogout={handleLogout}
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        {...commonProps}
                    />
                );
            
            // --- ROUTES ADMIN / COLLECTOR ---
            case AppView.ADMIN_USERS:
                return <AdminUsers currentUser={user} onBack={goBack} onNotify={handleSendNotification} {...commonProps} />;
            case AppView.ADMIN_ADS:
                return <AdminAds onBack={goBack} {...commonProps} />;
            case AppView.ADMIN_SUBSCRIPTIONS:
                return (
                    <AdminSubscriptions 
                        onBack={goBack} 
                        plans={plans}
                        exchangeRate={exchangeRate}
                        onUpdatePlan={handleUpdatePlanConfig}
                        onUpdateExchangeRate={handleUpdateExchangeRate}
                        currentLogo={appLogo}
                        onUpdateLogo={setAppLogo}
                        // Passage des props système
                        systemSettings={systemSettings}
                        onUpdateSystemSettings={handleUpdateSystemSettings}
                        {...commonProps}
                    />
                );
            case AppView.ADMIN_ACADEMY: 
                return <AdminAcademy onBack={goBack} {...commonProps} />;
            case AppView.ADMIN_VEHICLES:
                return <AdminVehicles onBack={goBack} {...commonProps} />;
            case AppView.ADMIN_PERMISSIONS:
                return <AdminPermissions onBack={goBack} {...commonProps} />;
            case AppView.COLLECTOR_JOBS:
                return (
                    <CollectorJobs 
                        user={user} 
                        onBack={goBack} 
                        onNotify={handleSendNotification}
                        {...commonProps}
                    />
                );
            
            default:
                return <Dashboard user={user} onChangeView={navigateTo} />;
        }
    };

    if (loading) {
        return <SplashScreen appLogo={appLogo} />;
    }

    if (view === AppView.ONBOARDING) {
        return <Onboarding onComplete={handleOnboardingComplete} appLogo={appLogo} onToast={handleShowToast} />;
    }

    return (
        <Layout 
            currentView={view} 
            onChangeView={switchTab} // IMPORTANT: Sidebar uses switchTab to reset stack
            onLogout={handleLogout} 
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            user={user}
            unreadNotifications={unreadCount}
            appLogo={appLogo}
            toast={toast}
            onCloseToast={() => setToast(prev => ({...prev, visible: false}))}
        >
            {renderContent()}
        </Layout>
    );
}

export default App;
