
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
import { CollectorJobs } from './components/CollectorJobs';
import { Reporting } from './components/Reporting';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, Theme, SubscriptionPlan, Language, NotificationItem, SystemSettings, UserType, GlobalImpact } from './types';
import { SettingsAPI, UserAPI } from './services/api';
import { NotificationService } from './services/notificationService';

const DEFAULT_PLANS: SubscriptionPlan[] = [
    { id: 'standard', name: 'Standard', priceUSD: 10, schedule: 'Mardi & Samedi', features: ['2 jours / semaine', 'Mardi & Samedi', 'Suivi basique'] },
    { id: 'plus', name: 'Plus', priceUSD: 15, popular: true, schedule: 'Mardi, Jeudi & Samedi', features: ['3 jours / semaine', 'Mar, Jeu, Sam', 'Points doublés'] },
    { id: 'premium', name: 'Premium', priceUSD: 20, schedule: 'Lun, Mer, Ven & Dim', features: ['4 jours / semaine', 'Lun, Mer, Ven, Dim', 'Certificat Eco', 'Support VIP'] },
    { id: 'special', name: 'Spécial / Kilo', priceUSD: 0, isVariable: true, schedule: 'Sur demande', features: ['Paiement à la pesée', 'Idéal gros volumes', 'Horaires flexibles'] },
];

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
    const [theme, setTheme] = useState<Theme>('light');
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
        exchangeRate: 2800
    });

    const [impactData, setImpactData] = useState<GlobalImpact>({
        digitalization: 0,
        recyclingRate: 0,
        education: 0,
        realTimeCollection: 0
    });

    const [notifications, setNotifications] = useState<NotificationItem[]>([
        { id: '1', title: 'Système Biso Peto', message: 'Bienvenue sur votre Control Tower.', type: 'info', time: 'À l\'instant', read: false, targetUserId: 'ALL' }
    ]);

    const [exchangeRate, setExchangeRate] = useState(2800);
    const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
    const [appLogo, setAppLogo] = useState(() => {
        return localStorage.getItem('kinecomap_app_logo') || 'logobisopeto.png';
    });

    useEffect(() => {
        const loadInitData = async () => {
            try {
                const [settings, impact] = await Promise.all([
                    SettingsAPI.get(),
                    SettingsAPI.getImpact()
                ]);
                if (settings) setSystemSettings(settings);
                if (impact) setImpactData(impact);
            } finally {
                const delay = user ? 1000 : 2500;
                setTimeout(() => setLoading(false), delay);
            }
        };
        loadInitData();
    }, [user]);

    useEffect(() => {
        if (theme === 'dark') document.body.classList.add('dark');
        else document.body.classList.remove('dark');
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

    const handleNotify = (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => {
        const newNotif: NotificationItem = {
            id: Date.now().toString(),
            title, message, type, time: 'À l\'instant', read: false, targetUserId: targetId
        };
        setNotifications([newNotif, ...notifications]);

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
            if (view === AppView.ONBOARDING) return <Onboarding initialShowLogin={onboardingStartWithLogin} onBackToLanding={() => setHistory([AppView.LANDING])} onComplete={(data) => { setUser(data as User); localStorage.setItem('kinecomap_user', JSON.stringify(data)); setHistory([AppView.DASHBOARD]); }} appLogo={appLogo} onToast={handleShowToast} />;
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
            case AppView.NOTIFICATIONS: return <Notifications onBack={goBack} notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, read: true})))} isAdmin={user.type === UserType.ADMIN} onSendNotification={(n) => handleNotify(n.targetUserId || 'ALL', n.title || '', n.message || '', n.type)} />;
            case AppView.SETTINGS: return <Settings user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} currentLanguage={language} onLanguageChange={setLanguage} onChangeView={navigateTo} onToast={handleShowToast} appLogo={appLogo} onUpdateLogo={handleUpdateLogo} systemSettings={systemSettings} />;
            case AppView.COLLECTOR_JOBS: return <CollectorJobs user={user} onBack={goBack} onNotify={handleNotify} onToast={handleShowToast} />;
            case AppView.ADMIN_USERS: return <AdminUsers onBack={goBack} currentUser={user} onNotify={handleNotify} onToast={handleShowToast} />;
            case AppView.ADMIN_VEHICLES: return <AdminVehicles onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_ACADEMY: return <AdminAcademy onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_REPORTS: return <AdminReports onBack={goBack} onToast={handleShowToast} onNotify={handleNotify} />;
            case AppView.ADMIN_MARKETPLACE: return <AdminMarketplace onBack={goBack} onToast={handleShowToast} />;
            case AppView.ADMIN_SUBSCRIPTIONS: return <AdminSubscriptions onBack={goBack} plans={plans} exchangeRate={exchangeRate} onUpdatePlan={(p) => setPlans(plans.map(pl => pl.id === p.id ? p : pl))} onUpdateExchangeRate={setExchangeRate} currentLogo={appLogo} onUpdateLogo={handleUpdateLogo} systemSettings={systemSettings} onUpdateSystemSettings={(s) => setSystemSettings(s)} onToast={handleShowToast} />;
            case AppView.ADMIN_PERMISSIONS: return <AdminPermissions onBack={goBack} onToast={handleShowToast} />;
            default: return <Dashboard user={user} onChangeView={navigateTo} onToast={handleShowToast} />;
        }
    };

    if (loading) return <SplashScreen appLogo={appLogo} />;
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
