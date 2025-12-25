
import React, { useState, useEffect } from 'react';
import { 
    Home, Map as MapIcon, GraduationCap, User as UserIcon, LogOut, Settings, RotateCw, 
    Users, ClipboardList, Megaphone, PieChart, CreditCard, Truck, 
    ShoppingBag, AlertTriangle, X, Shield, Bell, Camera, DollarSign, Lock,
    Cloud, CloudOff, RefreshCw
} from 'lucide-react';
import { AppView, UserType, User as UserInterface, UserPermission } from '../types';
import { OfflineManager } from '../services/offlineManager';

interface NavItem {
    view: AppView;
    icon: any;
    label: string;
    permission?: UserPermission;
}

interface LayoutProps {
    children: React.ReactNode;
    currentView: AppView;
    onChangeView: (view: AppView) => void;
    onLogout: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    user: UserInterface | null;
    unreadNotifications?: number;
    appLogo?: string;
    toast?: { message: string; type: 'success' | 'error' | 'info'; visible: boolean };
    onCloseToast?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, onRefresh, isRefreshing, user, unreadNotifications = 0, appLogo = 'logobisopeto.png', toast, onCloseToast }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [syncQueueSize, setSyncQueueSize] = useState(OfflineManager.getQueueSize());
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleSyncUpdate = (e: any) => setSyncQueueSize(e.detail.size);
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('sync_queue_updated', handleSyncUpdate);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('sync_queue_updated', handleSyncUpdate);
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // Liste des vues qui gèrent leur propre entête (donc on masque l'entête global)
    const viewsWithInternalHeader = [
        AppView.REPORTING, 
        AppView.MAP, 
        AppView.ACADEMY, 
        AppView.MARKETPLACE, 
        AppView.PROFILE, 
        AppView.SETTINGS,
        AppView.COLLECTOR_JOBS,
        AppView.ADMIN_USERS,
        AppView.ADMIN_VEHICLES,
        AppView.ADMIN_REPORTS,
        AppView.ADMIN_SUBSCRIPTIONS,
        AppView.ADMIN_MARKETPLACE,
        AppView.ADMIN_RECOVERY,
        AppView.ADMIN_PERMISSIONS,
        AppView.ADMIN_ACADEMY
    ];

    const showGlobalHeader = !viewsWithInternalHeader.includes(currentView);

    const getMobileNavItems = (): NavItem[] => {
        if (user?.type === UserType.ADMIN) {
            return [
                { view: AppView.DASHBOARD, icon: Home, label: 'Bord' },
                { view: AppView.ADMIN_REPORTS, icon: AlertTriangle, label: 'SIG' },
                { view: AppView.NOTIFICATIONS, icon: Bell, label: 'Alertes' },
                { view: AppView.PROFILE, icon: UserIcon, label: 'Admin' },
            ];
        }
        if (user?.type === UserType.COLLECTOR) {
            return [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Missions' },
                { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
                { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
            ];
        }
        return [
            { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
            { view: AppView.REPORTING, icon: Camera, label: 'Alerte' },
            { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
            { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Boutique' },
            { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
        ];
    };

    const mobileItems = getMobileNavItems();

    return (
        <div className="w-full h-[100dvh] flex bg-[#F5F5F5] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            {/* Sidebar (Desktop) - Toujours visible sur grand écran */}
            <aside className="hidden md:flex flex-col w-[18rem] h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex flex-col gap-1 text-center items-center">
                    <div className="w-14 h-14 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1.5 shrink-0 mb-2"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                    <div className="flex flex-col"><span className="font-black text-xl text-primary tracking-tighter leading-none uppercase">KIN ECO MAP</span></div>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
                    {mobileItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-xl' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <item.icon className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content View */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                {/* Entête Global Conditionnel */}
                {showGlobalHeader && (
                    <header className="min-h-[4.5rem] px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 bg-white/50 backdrop-blur-sm dark:bg-black/50 animate-fade-in">
                        <div className="flex items-center gap-3 md:hidden">
                            <div className="w-9 h-9 bg-white dark:bg-black rounded-xl flex items-center justify-center shadow-lg border border-gray-100 p-1"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                            <span className="font-black text-lg tracking-tighter text-primary uppercase">BISO PETO</span>
                        </div>
                        <div className="hidden md:block"><h1 className="font-black text-xl text-gray-800 dark:text-white tracking-tight uppercase">Tableau de bord</h1></div>
                        
                        <div className="flex items-center gap-3">
                            <button onClick={onRefresh} className={`p-2.5 rounded-xl text-gray-500 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${isRefreshing ? 'animate-spin' : ''}`}><RotateCw className="w-5 h-5" /></button>
                            <button onClick={() => onChangeView(AppView.NOTIFICATIONS)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 relative">
                                <Bell className="w-5 h-5" />
                                {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black">{unreadNotifications}</span>}
                            </button>
                        </div>
                    </header>
                )}

                {/* Zone de contenu dynamique */}
                <main className={`flex-1 overflow-y-auto relative h-full w-full no-scrollbar transition-all duration-500 ${showGlobalHeader ? 'pb-40' : 'pb-24'}`}>
                    {children}
                </main>
                
                {/* Tab Bar (Mobile) - Adapté au pouce */}
                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full shadow-2xl z-[100] flex items-center justify-evenly px-2">
                    {mobileItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex flex-col items-center justify-center h-full relative flex-1">
                                <div className={`relative z-10 p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-white -translate-y-4 shadow-xl scale-110' : 'text-gray-400'}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest mt-1 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Toasts / Notifications éphémères */}
            {toast && toast.visible && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[92%] max-w-sm">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-primary/90 text-white' : 'bg-red-500/90 text-white'} `}>
                        <span className="font-bold text-sm leading-tight flex-1">{toast.message}</span>
                        <button onClick={onCloseToast} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
