
import React, { useState, useEffect, useCallback } from 'react';
import { Onboarding } from './components/Onboarding';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { MapView } from './components/Map';
import { Academy } from './components/Academy';
import { Marketplace } from './components/Marketplace'; 
import { Profile } from './components/Profile';
import { Layout } from './components/Layout';
import { Subscription } from './components/Subscription';
import { Notifications } from './components/Notifications';
import { Settings } from './components/Settings';
import { AdminUsers } from './components/AdminUsers';
import { AdminVehicles } from './components/AdminVehicles';
import { AdminReports } from './components/AdminReports';
import { AdminSubscriptions } from './components/AdminSubscriptions';
import { AdminPermissions } from './components/AdminPermissions';
import { AdminAds } from './components/AdminAds';
import { AdminAcademy } from './components/AdminAcademy';
import { AdminMarketplace } from './components/AdminMarketplace';
import { AdminRecovery } from './components/AdminRecovery';
import { AdminCashBook } from './components/AdminCashBook';
import { CollectorJobs } from './components/CollectorJobs';
import { Reporting } from './components/Reporting';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, Theme, Language, NotificationItem, SystemSettings, UserType, GlobalImpact, SubscriptionPlan } from './types';
import { SettingsAPI, NotificationsAPI, UserAPI } from './services/api';
import { OfflineManager } from './services/offlineManager';
import { NotificationService } from './services/notificationService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { LogOut } from 'lucide-react';

const DEFAULT_LOGO = 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png';

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    { id: 'standard', name: 'Eco-Citoyen', priceUSD: 5, schedule: 'Hebdomadaire', features: ['1 collecte / semaine', 'Points Eco de base', 'Support standard'] },
    { id: 'plus', name: 'Eco-Plus', priceUSD: 12, schedule: 'Bi-hebdomadaire', popular: true, features: ['2 collectes / semaine', 'Points Eco x1.5', 'Alertes passage SMS'] },
    { id: 'premium', name: 'Eco-Premium', priceUSD: 25, schedule: 'Sur demande', features: ['Collecte illimitée', 'Points Eco x2', 'Rapport d\'impact mensuel'] },
    { id: 'special', name: 'Business Pro', priceUSD: 75, isVariable: true, schedule: 'Personnalisé', features: ['Volume industriel', 'Certificat RSE officiel', 'Compte multi-accès'] },
];

function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(() => {
        try {
            const saved = localStorage.getItem('kinecomap_user');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const [history, setHistory] = useState<AppView[]>(() => {
        return user ? [AppView.DASHBOARD] : [AppView.LANDING];
    });

    const view = history[history.length - 1] || AppView.LANDING;
    const [theme, setTheme] = useState<Theme>((localStorage.getItem('kinecomap_theme') as Theme) || 'light');
    const [language, setLanguage] = useState<Language>((localStorage.getItem('kinecomap_lang') as Language) || 'fr');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [onboardingStartWithLogin, setOnboardingStartWithLogin] = useState(false);

    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        maintenanceMode: false,
        supportEmail: 'support@kinecomap.cd',
        appVersion: '1.5.0',
        force2FA: false,
        sessionTimeout: 60,
        passwordPolicy: 'strong',
        marketplaceCommission: 0.05,
        exchangeRate: 2800,
        logoUrl: DEFAULT_LOGO
    });

    const [impactData, setImpactData] = useState<GlobalImpact>({ digitalization: 0, recyclingRate: 0, education: 0, realTimeCollection: 0 });
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [appLogo, setAppLogo] = useState(DEFAULT_LOGO);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'success', visible: false });
    const showToast = useCallback((msg: string, type: any = 'success') => {
        setToast({ message: msg, type, visible: true });
        setTimeout(() => setToast(p => ({ ...p, visible: false })), 4000);
    }, []);

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('kinecomap_lang', lang);
        showToast(`Langue : ${lang.toUpperCase()}`, "info");
    };

    const refreshUserData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const freshUser = await UserAPI.getById(user.id);
            if (freshUser) {
                setUser(freshUser);
                localStorage.setItem('kinecomap_user', JSON.stringify(freshUser));
                if (freshUser.status === 'active' && user.status === 'pending') {
                    setHistory([AppView.DASHBOARD]);
                }
            }
        } catch (e) {
            console.error("Failed to refresh user profile:", e);
        }
    }, [user?.id, user?.status]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // If user just logged in via Firebase Auth but local state is empty
                if (!user) {
                    const fetchedUser = await UserAPI.getById(firebaseUser.uid);
                    if (fetchedUser) {
                        setUser(fetchedUser);
                        localStorage.setItem('kinecomap_user', JSON.stringify(fetchedUser));
                    }
                }
            } else {
                // No firebase user, but maybe we have a local one (legacy or partially signed out)
                // We should probably sync and sign out if no firebase user
                if (user) {
                    handleLogout();
                }
            }
        });

        return () => unsubscribeAuth();
    }, [user]);

    useEffect(() => {
        if (user?.id) {
            const userRef = doc(db, 'users', user.id);
            const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const updatedData = docSnap.data();
                    const mapped = { ...updatedData, id: docSnap.id } as User;
                    setUser(mapped);
                    localStorage.setItem('kinecomap_user', JSON.stringify(mapped));
                    if (mapped.status === 'active' && user.status === 'pending') {
                        showToast("Compte débloqué ! Mbote !", "success");
                        setHistory([AppView.DASHBOARD]);
                    }
                }
            }, (error) => {
                console.error("User Snapshot Error:", error);
            });

            return () => unsubscribeUser();
        }
    }, [user?.id, user?.status, showToast]);

    useEffect(() => {
        const loadInitData = async () => {
            try {
                const [settings, impact] = await Promise.all([
                    SettingsAPI.get(),
                    SettingsAPI.getImpact()
                ]);
                
                if (settings) {
                    setSystemSettings(settings);
                    if (settings.logoUrl) setAppLogo(settings.logoUrl);
                }
                if (impact) setImpactData(impact);

                if (user?.id) {
                    await refreshUserData();
                    const notifs = await NotificationsAPI.getAll(user.id, user.type === UserType.ADMIN);
                    setNotifications(notifs);
                }
            } finally {
                setTimeout(() => setLoading(false), 1200);
            }
        };
        loadInitData();
    }, [user?.id]);

    useEffect(() => {
        document.body.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('kinecomap_theme', theme);
    }, [theme]);

    const navigateTo = (newView: AppView) => { if (newView !== view) setHistory([...history, newView]); };
    const goBack = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Sign out error", e);
        }
        setUser(null);
        setHistory([AppView.LANDING]);
        localStorage.removeItem('kinecomap_user');
    };

    const handleUpdatePlan = async (planId: any) => {
        if(!user?.id) return;
        try {
            await UserAPI.update({ id: user.id, subscription: planId });
            const updatedUser = { ...user, subscription: planId };
            setUser(updatedUser);
            localStorage.setItem('kinecomap_user', JSON.stringify(updatedUser));
            showToast("Abonnement mis à jour !", "success");
            navigateTo(AppView.DASHBOARD);
        } catch (e) {
            showToast("Erreur lors de la mise à jour de l'abonnement", "error");
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshUserData();
        } finally {
            setIsRefreshing(false);
        }
    };

    if (loading) return <SplashScreen appLogo={appLogo} />;

    const isPending = user?.type !== UserType.ADMIN && user?.status === 'pending';
    
    if (user && isPending) {
        return (
            <div className="h-full w-full bg-[#F5F7FA] dark:bg-[#050505] flex flex-col overflow-hidden animate-fade-in">
                <Dashboard user={user} onChangeView={navigateTo} onToast={showToast} onRefresh={refreshUserData} />
                <div className="p-8 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shrink-0 pb-12">
                    <button onClick={handleLogout} className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all"><LogOut size={20}/> Quitter la session</button>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (!user) {
            if ([AppView.LANDING, AppView.LANDING_ABOUT, AppView.LANDING_ECOSYSTEM, AppView.LANDING_PROCESS, AppView.LANDING_IMPACT, AppView.LANDING_CONTACT].includes(view)) {
                return <LandingPage onStart={() => navigateTo(AppView.ONBOARDING)} onLogin={() => { setOnboardingStartWithLogin(true); navigateTo(AppView.ONBOARDING); }} appLogo={appLogo} impactData={impactData} onChangeView={navigateTo} currentView={view} />;
            }
            if (view === AppView.ONBOARDING) return <Onboarding initialShowLogin={onboardingStartWithLogin} onBackToLanding={() => setHistory([AppView.LANDING])} onComplete={(data) => { setUser(data as User); localStorage.setItem('kinecomap_user', JSON.stringify(data)); setHistory([AppView.DASHBOARD]); }} appLogo={appLogo} onToast={showToast} onNotifyAdmin={(t, m) => NotificationsAPI.add({ targetUserId: 'ADMIN', title: t, message: m, type: 'alert' })} currentLanguage={language} onLanguageChange={handleLanguageChange} />;
            return null;
        }

        switch (view) {
            case AppView.DASHBOARD: return <Dashboard user={user} onChangeView={navigateTo} onToast={showToast} onRefresh={refreshUserData} />;
            case AppView.REPORTING: return <Reporting user={user} onBack={goBack} onToast={showToast} />;
            case AppView.MAP: return <MapView user={user} onBack={goBack} />;
            case AppView.ACADEMY: return <Academy onBack={goBack} />;
            case AppView.MARKETPLACE: return <Marketplace user={user} onBack={goBack} systemSettings={systemSettings} onToast={showToast} />;
            case AppView.PROFILE: return <Profile user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} onManageSubscription={() => navigateTo(AppView.SUBSCRIPTION)} onSettings={() => navigateTo(AppView.SETTINGS)} onUpdateProfile={p => UserAPI.update({...p, id: user.id!})} onToast={showToast} onChangeView={navigateTo} />;
            case AppView.SUBSCRIPTION: return <Subscription user={user} onBack={goBack} onUpdatePlan={handleUpdatePlan} plans={SUBSCRIPTION_PLANS} exchangeRate={systemSettings.exchangeRate} onToast={showToast} />;
            case AppView.SETTINGS: return <Settings user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} currentLanguage={language} onLanguageChange={handleLanguageChange} onChangeView={navigateTo} onToast={showToast} appLogo={appLogo} onUpdateLogo={setAppLogo} systemSettings={systemSettings} />;
            case AppView.NOTIFICATIONS: return <Notifications onBack={goBack} notifications={notifications} onMarkAllRead={() => {}} isAdmin={user.type === UserType.ADMIN} onSendNotification={n => NotificationsAPI.add(n)} />;
            case AppView.COLLECTOR_JOBS: return <CollectorJobs user={user} onBack={goBack} onNotify={(tid, t, m, type) => NotificationsAPI.add({ targetUserId: tid, title: t, message: m, type })} onToast={showToast} />;
            case AppView.ADMIN_USERS: return <AdminUsers onBack={goBack} currentUser={user} onNotify={(tid, t, m, type) => NotificationsAPI.add({ targetUserId: tid, title: t, message: m, type })} onToast={showToast} />;
            case AppView.ADMIN_VEHICLES: return <AdminVehicles onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_REPORTS: return <AdminReports onBack={goBack} onToast={showToast} onNotify={(tid, t, m, type) => NotificationsAPI.add({ targetUserId: tid, title: t, message: m, type })} currentUser={user} />;
            case AppView.ADMIN_SUBSCRIPTIONS: return <AdminSubscriptions onBack={goBack} plans={SUBSCRIPTION_PLANS} exchangeRate={systemSettings.exchangeRate} onUpdatePlan={() => {}} onUpdateExchangeRate={() => {}} currentLogo={appLogo} onUpdateLogo={setAppLogo} systemSettings={systemSettings} onUpdateSystemSettings={s => SettingsAPI.update(s)} onToast={showToast} />;
            case AppView.ADMIN_ADS: return <AdminAds onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_MARKETPLACE: return <AdminMarketplace onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_RECOVERY: return <AdminRecovery onBack={goBack} currentUser={user} onToast={showToast} />;
            case AppView.ADMIN_CASHBOOK: return <AdminCashBook onBack={goBack} currentUser={user} onToast={showToast} />;
            case AppView.ADMIN_PERMISSIONS: return <AdminPermissions onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_ACADEMY: return <AdminAcademy onBack={goBack} onToast={showToast} />;
            default: return <Dashboard user={user} onChangeView={navigateTo} onToast={showToast} onRefresh={refreshUserData} />;
        }
    };

    return (
        <Layout currentView={view} onChangeView={navigateTo} onLogout={handleLogout} onRefresh={handleRefresh} isRefreshing={isRefreshing} user={user} unreadNotifications={notifications.filter(n => !n.read).length} appLogo={appLogo} toast={toast} onCloseToast={() => setToast(p => ({...p, visible: false}))}>
            {renderContent()}
        </Layout>
    );
}

export default App;
