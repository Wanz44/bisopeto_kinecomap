
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
                { view: AppView.DASHBOARD, icon: Home, label: 'Dashboard' },
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
            {/* Sidebar (Desktop) - Largeur ajustée à la nouvelle échelle */}
            <aside className="hidden md:flex flex-col w-[16rem] h-[calc(100vh-3rem)] m-6 rounded-[2rem] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-6 flex flex-col gap-1 text-center items-center">
                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1.5 shrink-0 mb-2"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                    <div className="flex flex-col"><span className="font-black text-lg text-primary tracking-tighter leading-none uppercase">KIN ECO MAP</span></div>
                </div>
                <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto no-scrollbar">
                    {mobileItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-xl' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                <item.icon className="w-4.5 h-4.5" />
                                <span className="font-bold text-[0.8rem] uppercase tracking-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content View */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                {/* Entête Global Slim Condensé */}
                {showGlobalHeader && (
                    <header className="min-h-[2.8rem] md:min-h-[3.8rem] px-5 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 bg-white/70 backdrop-blur-xl dark:bg-black/70 border-b dark:border-white/5 animate-fade-in">
                        <div className="flex items-center gap-2.5 md:hidden">
                            <div className="w-6 h-6 bg-white dark:bg-black rounded-lg flex items-center justify-center shadow-md border border-gray-100 p-1"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                            <span className="font-black text-[0.9rem] tracking-tighter text-primary uppercase">BISO PETO</span>
                        </div>
                        <div className="hidden md:block"><h1 className="font-black text-base text-gray-800 dark:text-white tracking-tight uppercase">Tableau de bord</h1></div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={onRefresh} className={`p-2 rounded-lg text-gray-500 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${isRefreshing ? 'animate-spin' : ''}`}><RotateCw className="w-4 h-4" /></button>
                            <button onClick={() => onChangeView(AppView.NOTIFICATIONS)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 relative">
                                <Bell className="w-4 h-4" />
                                {unreadNotifications > 0 && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 text-white text-[6px] font-black rounded-full flex items-center justify-center border border-white dark:border-black">{unreadNotifications}</span>}
                            </button>
                        </div>
                    </header>
                )}

                <main className={`flex-1 overflow-y-auto relative h-full w-full no-scrollbar transition-all duration-500 ${showGlobalHeader ? 'pb-24' : 'pb-16'}`}>
                    {children}
                </main>
                
                {/* Tab Bar (Mobile) - Icons Only (Taille condensée) */}
                <nav className="md:hidden fixed bottom-5 inset-x-6 h-14 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.2)] z-[100] flex items-center justify-evenly px-2">
                    {mobileItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex items-center justify-center h-full relative flex-1">
                                <div className={`relative z-10 p-3 rounded-full transition-all duration-500 ${isActive ? 'bg-primary text-white -translate-y-4 shadow-2xl scale-110' : 'text-gray-400 hover:text-primary/50'}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Toasts */}
            {toast && toast.visible && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[88%] max-w-xs">
                    <div className={`px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-primary/90 text-white' : 'bg-red-500/90 text-white'} `}>
                        <span className="font-bold text-[0.8rem] leading-tight flex-1">{toast.message}</span>
                        <button onClick={onCloseToast} className="p-1 hover:bg-white/20 rounded-lg"><X className="w-3 h-3" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
