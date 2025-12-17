
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
import { CollectorJobs } from './components/CollectorJobs';
import { SplashScreen } from './components/SplashScreen';
import { User, AppView, UserType, Theme, SubscriptionPlan, Language, NotificationItem, SystemSettings } from './types';
import { SettingsAPI, UserAPI } from './services/api';
import { OfflineManager } from './services/offlineManager';
import { AlertTriangle, Lock } from 'lucide-react';

const DEFAULT_PLANS: SubscriptionPlan[] = [
    { id: 'standard', name: 'Standard', priceUSD: 10, schedule: 'Mardi & Samedi', features: ['2 jours / semaine', 'Mardi & Samedi', 'Suivi basique'] },
    { id: 'plus', name: 'Plus', priceUSD: 15, popular: true, schedule: 'Mardi, Jeudi & Samedi', features: ['3 jours / semaine', 'Mar, Jeu, Sam', 'Points doublés'] },
    { id: 'premium', name: 'Premium', priceUSD: 20, schedule: 'Lun, Mer, Ven & Dim', features: ['4 jours / semaine', 'Lun, Mer, Ven, Dim', 'Certificat Eco', 'Support VIP'] },
    { id: 'special', name: 'Spécial / Kilo', priceUSD: 0, isVariable: true, schedule: 'Sur demande', features: ['Paiement à la pesée', 'Idéal gros volumes', 'Horaires flexibles'] },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    { id: '1', title: 'Bienvenue', message: 'Bienvenue sur KIN ECO-MAP ! Complétez votre profil pour commencer.', type: 'info', time: 'À l\'instant', read: false, targetUserId: 'ALL' }
];

function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('kinecomap_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) { return null; }
    });

    const historySupported = useRef(true);
    const [history, setHistory] = useState<AppView[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.history && window.history.state && window.history.state.history) {
                return window.history.state.history;
            }
        } catch (e) { historySupported.current = false; }
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
        appVersion: '1.0.3',
        force2FA: false,
        sessionTimeout: 60,
        passwordPolicy: 'strong',
        marketplaceCommission: 0.05
    });

    const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
    const [exchangeRate, setExchangeRate] = useState(2800);
    const [appLogo, setAppLogo] = useState('./logo.png');
    const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
        message: '', type: 'success', visible: false
    });

    useEffect(() => {
        const loadInitData = async () => {
            const settings = await SettingsAPI.get();
            setSystemSettings(settings);
            setTimeout(() => setLoading(false), 2500);
        };
        loadInitData();
    }, []);

    const navigateTo = (newView: AppView) => {
        if (newView !== view) {
            const newStack = [...history, newView];
            setHistory(newStack);
            if (historySupported.current) {
                window.history.pushState({ history: newStack }, '', `#${newView}`);
            }
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
        handleShowToast("Déconnexion réussie", "info");
    };

    const renderContent = () => {
        if (!user) {
            if (view === AppView.LANDING) {
                return (
                    <LandingPage 
                        onStart={() => {
                            setOnboardingStartWithLogin(false);
                            navigateTo(AppView.ONBOARDING);
                        }} 
                        onLogin={() => {
                            setOnboardingStartWithLogin(true);
                            navigateTo(AppView.ONBOARDING);
                        }}
                    />
                );
            }
            if (view === AppView.ONBOARDING) {
                return (
                    <Onboarding 
                        initialShowLogin={onboardingStartWithLogin}
                        onBackToLanding={() => {
                            setHistory([AppView.LANDING]);
                        }}
                        onComplete={(data) => {
                            const newUser = { ...data, id: 'u'+Date.now(), points: 0, collections: 0, badges: 0 } as User;
                            setUser(newUser);
                            setHistory([AppView.DASHBOARD]);
                        }} 
                        appLogo={appLogo} 
                        onToast={handleShowToast} 
                    />
                );
            }
            return null;
        }

        switch (view) {
            case AppView.DASHBOARD: return <Dashboard user={user} onChangeView={navigateTo} onToast={handleShowToast} />;
            case AppView.MAP: return <MapView user={user} onBack={goBack} />;
            case AppView.ACADEMY: return <Academy onBack={goBack} />;
            case AppView.MARKETPLACE: return <Marketplace user={user} onBack={goBack} systemSettings={systemSettings} onToast={handleShowToast} />;
            case AppView.PROFILE: return <Profile user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')} onBack={goBack} onLogout={handleLogout} onManageSubscription={() => navigateTo(AppView.SUBSCRIPTION)} onSettings={() => navigateTo(AppView.SETTINGS)} onUpdateProfile={p => setUser({ ...user, ...p })} onToast={handleShowToast} />;
            default: return <Dashboard user={user} onChangeView={navigateTo} />;
        }
    };

    if (loading) return <SplashScreen appLogo={appLogo} />;

    if (view === AppView.LANDING || (!user && view === AppView.ONBOARDING)) return renderContent();

    return (
        <Layout 
            currentView={view} 
            onChangeView={v => setHistory([v])}
            onLogout={handleLogout} 
            onRefresh={() => {}}
            isRefreshing={isRefreshing}
            user={user}
            appLogo={appLogo}
            toast={toast}
            onCloseToast={() => setToast(prev => ({...prev, visible: false}))}
        >
            {renderContent()}
        </Layout>
    );
}

export default App;
