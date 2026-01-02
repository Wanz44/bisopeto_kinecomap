
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
import { CollectorJobs } from './components/CollectorJobs';
import { Reporting } from './components/Reporting';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, Theme, Language, NotificationItem, SystemSettings, UserType, GlobalImpact } from './types';
import { SettingsAPI, NotificationsAPI, UserAPI, mapUser } from './services/api';
import { OfflineManager } from './services/offlineManager';
import { NotificationService } from './services/notificationService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { LogOut } from 'lucide-react';

const DEFAULT_LOGO = 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png';

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

    const refreshUserData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const freshUser = await UserAPI.getById(user.id);
            if (freshUser) {
                if (freshUser.status !== user.status) {
                    if (freshUser.status === 'active') {
                        showToast("Activation confirmée ! Bienvenue dans le réseau.", "success");
                        setHistory([AppView.DASHBOARD]); 
                    }
                    setUser(freshUser);
                    localStorage.setItem('kinecomap_user', JSON.stringify(freshUser));
                } else {
                    setUser(freshUser);
                    localStorage.setItem('kinecomap_user', JSON.stringify(freshUser));
                }
            }
        } catch (e) {
            console.error("Failed to refresh user profile:", e);
        }
    }, [user?.id, user?.status, showToast]);

    useEffect(() => {
        if (user?.id && isSupabaseConfigured() && supabase) {
            const activationChannel = supabase.channel(`user_activation_${user.id}`)
                .on('postgres_changes', { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'users',
                    filter: `id=eq.${user.id}`
                }, (payload) => {
                    const mapped = mapUser(payload.new);
                    if (mapped.status === 'active' && user.status === 'pending') {
                        showToast("Compte débloqué ! Mbote !", "success");
                        setUser(mapped);
                        localStorage.setItem('kinecomap_user', JSON.stringify(mapped));
                        setHistory([AppView.DASHBOARD]);
                    } else if (mapped.status !== user.status) {
                        setUser(mapped);
                        localStorage.setItem('kinecomap_user', JSON.stringify(mapped));
                    }
                })
                .subscribe();

            const notifChannel = supabase.channel('realtime_notifications')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications'
                }, (payload) => {
                    const newNotif = payload.new as NotificationItem;
                    const isAdmin = user.type === UserType.ADMIN;
                    
                    const isTargeted = newNotif.targetUserId === user.id || 
                                     newNotif.targetUserId === 'ALL' || 
                                     (isAdmin && newNotif.targetUserId === 'ADMIN');

                    if (isTargeted) {
                        setNotifications(prev => [newNotif, ...prev]);
                        showToast(`🔔 ${newNotif.title}`, newNotif.type);
                        NotificationService.sendPush(newNotif.title, newNotif.message, appLogo);
                    }
                })
                .subscribe();

            return () => { 
                supabase.removeChannel(activationChannel);
                supabase.removeChannel(notifChannel);
            };
        }
    }, [user?.id, user?.status, user?.type, showToast, appLogo]);

    const handleSync = useCallback(async () => {
        if (navigator.onLine && OfflineManager.getQueueSize() > 0) {
            await OfflineManager.processQueue((type) => {
                showToast(`Synchronisation Cloud: ${type} terminé`, 'success');
            });
        }
    }, [showToast]);

    useEffect(() => {
        window.addEventListener('online', handleSync);
        if (navigator.onLine) handleSync();
        return () => window.removeEventListener('online', handleSync);
    }, [handleSync]);

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
        if (view === AppView.PROFILE) {
            refreshUserData();
        }
    }, [view, refreshUserData]);

    useEffect(() => {
        document.body.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('kinecomap_theme', theme);
    }, [theme]);

    const navigateTo = (newView: AppView) => { if (newView !== view) setHistory([...history, newView]); };
    const goBack = () => { if (history.length > 1) setHistory(prev => prev.slice(0, -1)); };

    const handleLogout = () => {
        setUser(null);
        setHistory([AppView.LANDING]);
        localStorage.removeItem('kinecomap_user');
    };

    const handleNotify = async (targetId: string, title: string, message: string, type: any) => {
        await NotificationsAPI.add({ targetUserId: targetId, title, message, type });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refreshUserData(), handleSync()]);
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
            if ([
                AppView.LANDING, 
                AppView.LANDING_ABOUT, 
                AppView.LANDING_ECOSYSTEM, 
                AppView.LANDING_PROCESS, 
                AppView.LANDING_IMPACT, 
                AppView.LANDING_CONTACT
            ].includes(view)) {
                return (
                    <LandingPage 
                        onStart={() => navigateTo(AppView.ONBOARDING)} 
                        onLogin={() => { setOnboardingStartWithLogin(true); navigateTo(AppView.ONBOARDING); }} 
                        appLogo={appLogo} 
                        impactData={impactData}
                        onChangeView={navigateTo}
                        currentView={view}
                    />
                );
            }
            if (view === AppView.ONBOARDING) return <Onboarding initialShowLogin={onboardingStartWithLogin} onBackToLanding={() => setHistory([AppView.LANDING])} onComplete={(data) => { setUser(data as User); localStorage.setItem('kinecomap_user', JSON.stringify(data)); setHistory([AppView.DASHBOARD]); }} appLogo={appLogo} onToast={showToast} onNotifyAdmin={(t, m) => handleNotify('ADMIN', t, m, 'alert')} />;
            return null;
        }

        switch (view) {
            case AppView.DASHBOARD: return <Dashboard user={user} onChangeView={navigateTo} onToast={showToast} onRefresh={refreshUserData} />;
            case AppView.REPORTING: return <Reporting user={user} onBack={goBack} onToast={showToast} onNotifyAdmin={(t, m) => handleNotify('ADMIN', t, m, 'alert')} />;
            case AppView.MAP: return <MapView user={user} onBack={goBack} />;
            case AppView.ACADEMY: return <Academy onBack={goBack} />;
            case AppView.MARKETPLACE: return <Marketplace user={user} onBack={goBack} systemSettings={systemSettings} onToast={showToast} />;
            case AppView.PROFILE: return <Profile user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} onManageSubscription={() => navigateTo(AppView.SUBSCRIPTION)} onSettings={() => navigateTo(AppView.SETTINGS)} onUpdateProfile={p => UserAPI.update({...p, id: user.id!})} onToast={showToast} onChangeView={navigateTo} />;
            case AppView.SETTINGS: return <Settings user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} currentLanguage={language} onLanguageChange={setLanguage} onChangeView={navigateTo} onToast={showToast} appLogo={appLogo} onUpdateLogo={setAppLogo} systemSettings={systemSettings} />;
            case AppView.NOTIFICATIONS: return <Notifications onBack={goBack} notifications={notifications} onMarkAllRead={() => {}} isAdmin={user.type === UserType.ADMIN} onSendNotification={(n) => handleNotify(n.targetUserId || 'ALL', n.title || '', n.message || '', n.type)} />;
            case AppView.COLLECTOR_JOBS: return <CollectorJobs user={user} onBack={goBack} onNotify={handleNotify} onToast={showToast} />;
            case AppView.ADMIN_USERS: return <AdminUsers onBack={goBack} currentUser={user} onNotify={handleNotify} onToast={showToast} />;
            case AppView.ADMIN_VEHICLES: return <AdminVehicles onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_REPORTS: return <AdminReports onBack={goBack} onToast={showToast} onNotify={handleNotify} currentUser={user} />;
            case AppView.ADMIN_SUBSCRIPTIONS: return <AdminSubscriptions onBack={goBack} plans={[]} exchangeRate={systemSettings.exchangeRate} onUpdatePlan={() => {}} onUpdateExchangeRate={() => {}} currentLogo={appLogo} onUpdateLogo={setAppLogo} systemSettings={systemSettings} onUpdateSystemSettings={s => SettingsAPI.update(s)} onToast={showToast} />;
            case AppView.ADMIN_ADS: return <AdminAds onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_MARKETPLACE: return <AdminMarketplace onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_RECOVERY: return <AdminRecovery onBack={goBack} currentUser={user} onToast={showToast} />;
            case AppView.ADMIN_PERMISSIONS: return <AdminPermissions onBack={goBack} onToast={showToast} />;
            case AppView.ADMIN_ACADEMY: return <AdminAcademy onBack={goBack} onToast={showToast} />;
            default: return <Dashboard user={user} onChangeView={navigateTo} onToast={showToast} onRefresh={refreshUserData} />;
        }
    };

    if (view === AppView.LANDING || 
        [AppView.LANDING_ABOUT, AppView.LANDING_ECOSYSTEM, AppView.LANDING_PROCESS, AppView.LANDING_IMPACT, AppView.LANDING_CONTACT].includes(view) || 
        (!user && view === AppView.ONBOARDING)) return renderContent();

    return (
        <Layout currentView={view} onChangeView={navigateTo} onLogout={handleLogout} onRefresh={handleRefresh} isRefreshing={isRefreshing} user={user} unreadNotifications={notifications.filter(n => !n.read).length} appLogo={appLogo} toast={toast} onCloseToast={() => setToast(p => ({...p, visible: false}))}>
            {renderContent()}
        </Layout>
    );
}

export default App;
