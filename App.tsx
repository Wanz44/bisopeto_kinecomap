
import React, { useState, useEffect, useRef } from 'react';
import { Onboarding } from './components/Onboarding';
import { LandingPage } from './components/LandingPage';
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
import { AdminReports } from './components/AdminReports';
import { AdminMarketplace } from './components/AdminMarketplace';
import { AdminRecovery } from './components/AdminRecovery';
import { CollectorJobs } from './components/CollectorJobs';
import { Reporting } from './components/Reporting';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, Theme, SubscriptionPlan, Language, NotificationItem, SystemSettings, UserType, GlobalImpact } from './types';
import { SettingsAPI, UserAPI, NotificationsAPI } from './services/api';
import { NotificationService } from './services/notificationService';
import { LogOut } from 'lucide-react';

const DEFAULT_PLANS: SubscriptionPlan[] = [
    { id: 'standard', name: 'Standard', priceUSD: 10, schedule: 'Mardi & Samedi', features: ['2 jours / semaine', 'Mardi & Samedi', 'Suivi basique'] },
    { id: 'plus', name: 'Plus', priceUSD: 15, popular: true, schedule: 'Mardi, Jeudi & Samedi', features: ['3 jours / semaine', 'Mar, Jeu, Sam', 'Points doublés'] },
    { id: 'premium', name: 'Premium', priceUSD: 20, schedule: 'Lun, Mer, Ven & Dim', features: ['4 jours / semaine', 'Lun, Mer, Ven, Dim', 'Certificat Eco', 'Support VIP'] },
    { id: 'special', name: 'Spécial / Kilo', priceUSD: 0, isVariable: true, schedule: 'Sur demande', features: ['Paiement à la pesée', 'Idéal gros volumes', 'Horaires flexibles'] },
];

const DEFAULT_LOGO = 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png';

function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('kinecomap_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) { return null; }
    });

    const [history, setHistory] = useState<AppView[]>(() => {
        return user ? [AppView.DASHBOARD] : [AppView.LANDING];
    });

    const view = history[history.length - 1] || AppView.LANDING;
    
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('kinecomap_theme') as Theme) || 'light';
    });
    
    const [language, setLanguage] = useState<Language>('fr');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [onboardingStartWithLogin, setOnboardingStartWithLogin] = useState(false);

    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        maintenanceMode: false,
        supportEmail: 'support@kinecomap.cd',
        appVersion: '1.4.0',
        force2FA: false,
        sessionTimeout: 60,
        passwordPolicy: 'strong',
        marketplaceCommission: 0.05,
        exchangeRate: 2800,
        logoUrl: DEFAULT_LOGO
    });

    const [impactData, setImpactData] = useState<GlobalImpact>({
        digitalization: 0,
        recyclingRate: 0,
        education: 0,
        realTimeCollection: 0
    });

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    const [exchangeRate, setExchangeRate] = useState(2800);
    const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
    const [appLogo, setAppLogo] = useState(() => {
        return localStorage.getItem('kinecomap_app_logo') || DEFAULT_LOGO;
    });

    useEffect(() => {
        const loadInitData = async () => {
            try {
                const [settings, impact] = await Promise.all([
                    SettingsAPI.get(),
                    SettingsAPI.getImpact()
                ]);
                
                if (settings) {
                    setSystemSettings(settings);
                    if (settings.logoUrl) {
                        setAppLogo(settings.logoUrl);
                        localStorage.setItem('kinecomap_app_logo', settings.logoUrl);
                    }
                }
                
                if (impact) setImpactData(impact);

                if (user) {
                    const notifs = await NotificationsAPI.getAll(user.id || '', user.type === UserType.ADMIN);
                    setNotifications(notifs);
                }
            } finally {
                const delay = user ? 800 : 2000;
                setTimeout(() => setLoading(false), delay);
            }
        };
        loadInitData();
    }, [user]);

    useEffect(() => {
        if (theme === 'dark') {
            document.body.classList.add('dark');
            localStorage.setItem('kinecomap_theme', 'dark');
        } else {
            document.body.classList.remove('dark');
            localStorage.setItem('kinecomap_theme', 'light');
        }
    }, [theme]);

    const handleUpdateLogo = (newLogo: string) => {
        setAppLogo(newLogo);
        localStorage.setItem('kinecomap_app_logo', newLogo);
    };

    const navigateTo = (newView: AppView) => {
        if (newView !== view) {
            setHistory([...history, newView]);
        }
    };

    const goBack = () => {
        if (history.length > 1) {
            setHistory(prev => prev.slice(0, -1));
        }
    };

    const handleShowToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type, visible: true });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    const handleLogout = () => {
        setUser(null);
        setHistory([AppView.LANDING]);
        localStorage.removeItem('kinecomap_user');
        handleShowToast("Session terminée", "info");
    };

    const handleNotify = async (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => {
        const newNotif = await NotificationsAPI.add({
            title, message, type, targetUserId: targetId
        });
        setNotifications(prev => [newNotif, ...prev]);

        if (targetId === 'ALL' || targetId === user?.id || (targetId === 'ADMIN' && user?.type === UserType.ADMIN)) {
            NotificationService.sendPush(title, message, appLogo);
        }
    };

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '', type: 'success', visible: false
    });

    const renderContent = () => {
        if (!user) {
            if (view === AppView.LANDING) return <LandingPage onStart={() => navigateTo(AppView.ONBOARDING)} onLogin={() => { setOnboardingStartWithLogin(true); navigateTo(AppView.ONBOARDING); }} appLogo={appLogo} impactData={impactData} />;
            if (view === AppView.ONBOARDING) return <Onboarding 
                initialShowLogin={onboardingStartWithLogin} 
                onBackToLanding={() => setHistory([AppView.LANDING])} 
                onComplete={(data) => { setUser(data as User); localStorage.setItem('kinecomap_user', JSON.stringify(data)); setHistory([AppView.DASHBOARD]); }} 
                appLogo={appLogo} 
                onToast={handleShowToast}
                onNotifyAdmin={(title, message) => handleNotify('ADMIN', title, message, 'alert')}
            />;
            return null;
        }

        switch (view) {
            case AppView.DASHBOARD: return <Dashboard user={user} onChangeView={navigateTo} onToast={handleShowToast} />;
            case AppView.MAP: return <MapView user={user} onBack={goBack} />;
            case AppView.ACADEMY: return <Academy onBack={goBack} />;
            case AppView.REPORTING: return <Reporting user={user} onBack={goBack} onToast={handleShowToast} />;
            case AppView.MARKETPLACE: return <Marketplace user={user} onBack={goBack} systemSettings={systemSettings} onToast={handleShowToast} />;
            case AppView.PROFILE: return <Profile user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} onManageSubscription={() => navigateTo(AppView.SUBSCRIPTION)} onSettings={() => navigateTo(AppView.SETTINGS)} onUpdateProfile={p => setUser({ ...user, ...p })} onToast={handleShowToast} />;
            case AppView.SUBSCRIPTION: return <Subscription user={user} onBack={goBack} onUpdatePlan={(p) => { setUser({...user, subscription: p}); goBack(); }} plans={plans} exchangeRate={exchangeRate} onToast={handleShowToast} />;
            case AppView.PLANNING: return <Planning onBack={goBack} />;
            case AppView.NOTIFICATIONS: return <Notifications onBack={goBack} notifications={notifications} onMarkAllRead={() => {}} isAdmin={user.type === UserType.ADMIN} onSendNotification={(n) => handleNotify(n.targetUserId || 'ALL', n.title || '', n.message || '', n.type)} />;
            case AppView.SETTINGS: return <Settings user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} currentLanguage={language} onLanguageChange={setLanguage} onChangeView={navigateTo} onToast={handleShowToast} appLogo={appLogo} onUpdateLogo={handleUpdateLogo} systemSettings={systemSettings} />;
            case AppView.COLLECTOR_JOBS: return <CollectorJobs user={user} onBack={goBack} onNotify={handleNotify} onToast={handleShowToast} />;
            case AppView.ADMIN_USERS: return <AdminUsers onBack={goBack} currentUser={user} onNotify={handleNotify} onToast={handleShowToast} />;
            case AppView.ADMIN_VEHICLES: return <AdminVehicles onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_ACADEMY: return <AdminAcademy onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_REPORTS: return <AdminReports onBack={goBack} onToast={handleShowToast} onNotify={handleNotify} currentUser={user} />;
            case AppView.ADMIN_MARKETPLACE: return <AdminMarketplace onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_RECOVERY: return <AdminRecovery onBack={goBack} currentUser={user} onToast={handleShowToast} />;
            case AppView.ADMIN_SUBSCRIPTIONS: return <AdminSubscriptions onBack={goBack} plans={plans} exchangeRate={exchangeRate} onUpdatePlan={(p) => setPlans(plans.map(pl => pl.id === p.id ? p : pl))} onUpdateExchangeRate={setExchangeRate} currentLogo={appLogo} onUpdateLogo={handleUpdateLogo} systemSettings={systemSettings} onUpdateSystemSettings={(s) => setSystemSettings(s)} onToast={handleShowToast} />;
            case AppView.ADMIN_PERMISSIONS: return <AdminPermissions onBack={goBack} onToast={handleShowToast} />;
            default: return <Dashboard user={user} onChangeView={navigateTo} onToast={handleShowToast} />;
        }
    };

    if (loading) return <SplashScreen appLogo={appLogo} />;
    
    // CAS CRITIQUE : Utilisateur non validé (PENDING)
    // On bloque l'accès au Layout (donc pas de menu, pas de carte, rien)
    const isPending = user?.type !== UserType.ADMIN && user?.status === 'pending';
    if (user && isPending) {
        return (
            <div className="h-full w-full bg-[#F5F7FA] dark:bg-[#050505] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <Dashboard user={user} onChangeView={navigateTo} onToast={handleShowToast} />
                </div>
                <div className="p-8 bg-white dark:bg-gray-900 border-t dark:border-gray-800 shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-sm flex items-center justify-center gap-3 transition-all hover:bg-red-600 hover:text-white"
                    >
                        <LogOut size={20}/> Quitter la session
                    </button>
                    <p className="text-[8px] text-gray-400 font-black uppercase text-center mt-4 tracking-[0.3em]">Biso Peto Security Protocol v1.4</p>
                </div>
            </div>
        );
    }

    if (view === AppView.LANDING || (!user && view === AppView.ONBOARDING)) return renderContent();

    return (
        <Layout 
            currentView={view} 
            onChangeView={navigateTo}
            onLogout={handleLogout} 
            onRefresh={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1500); }}
            isRefreshing={isRefreshing}
            user={user}
            unreadNotifications={notifications.filter(n => !n.read).length}
            appLogo={appLogo}
            toast={toast}
            onCloseToast={() => setToast(prev => ({...prev, visible: false}))}
        >
            {renderContent()}
        </Layout>
    );
}

export default App;
