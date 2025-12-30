
import React, { useState, useEffect } from 'react';
import { 
    Home, Map as MapIcon, GraduationCap, User as UserIcon, LogOut, Settings, RotateCw, 
    Users, ClipboardList, Megaphone, PieChart, CreditCard, Truck, 
    ShoppingBag, AlertTriangle, X, Shield, Bell, Camera, DollarSign, Lock,
    Cloud, CloudOff, RefreshCw, ShieldAlert, BookOpen, BarChart3, Database,
    Key, Receipt, Check, Info
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
        AppView.SUBSCRIPTION,
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

    const getNavItems = (isMobile: boolean): NavItem[] => {
        if (user?.type === UserType.ADMIN) {
            const adminFull = [
                { view: AppView.DASHBOARD, icon: Home, label: 'Dashboard' },
                { view: AppView.ADMIN_REPORTS, icon: AlertTriangle, label: 'SIG Alertes' },
                { view: AppView.ADMIN_USERS, icon: Users, label: 'Utilisateurs' },
                { view: AppView.ADMIN_VEHICLES, icon: Truck, label: 'Flotte GPS' },
                { view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, label: 'Finance' },
                { view: AppView.ADMIN_RECOVERY, icon: Receipt, label: 'Recouvrement' },
                { view: AppView.ADMIN_ADS, icon: Megaphone, label: 'Régie Pub' },
                { view: AppView.ADMIN_ACADEMY, icon: GraduationCap, label: 'Académie CMS' },
                { view: AppView.ADMIN_MARKETPLACE, icon: ShoppingBag, label: 'Marketplace' },
                { view: AppView.ADMIN_PERMISSIONS, icon: Key, label: 'Privilèges' },
                { view: AppView.NOTIFICATIONS, icon: Bell, label: 'Notifications' },
                { view: AppView.PROFILE, icon: UserIcon, label: 'Profil Admin' },
            ];
            return isMobile ? adminFull.filter(i => [AppView.DASHBOARD, AppView.ADMIN_REPORTS, AppView.ADMIN_SUBSCRIPTIONS, AppView.NOTIFICATIONS, AppView.PROFILE].includes(i.view)) : adminFull;
        }

        if (user?.type === UserType.COLLECTOR) {
            return [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Missions' },
                { view: AppView.MAP, icon: MapIcon, label: 'Carte SIG' },
                { view: AppView.NOTIFICATIONS, icon: Bell, label: 'Alertes' },
                { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
            ];
        }

        const citizenFull = [
            { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
            { view: AppView.REPORTING, icon: Camera, label: 'Signaler' },
            { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
            { view: AppView.ACADEMY, icon: GraduationCap, label: 'Académie' },
            { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Boutique' },
            { view: AppView.SUBSCRIPTION, icon: CreditCard, label: 'Abonnement' },
            { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
        ];
        
        return isMobile ? citizenFull.filter(i => [AppView.DASHBOARD, AppView.REPORTING, AppView.MAP, AppView.ACADEMY, AppView.PROFILE].includes(i.view)) : citizenFull;
    };

    const sidebarItems = getNavItems(false);
    const mobileTabItems = getNavItems(true);

    return (
        <div className="w-full h-full flex bg-[#F5F5F5] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            
            {/* SIDEBAR (Desktop) */}
            <aside className="hidden md:flex flex-col w-[18rem] h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex flex-col gap-1 text-center items-center">
                    <div className="w-14 h-14 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1.5 shrink-0 mb-3"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl text-primary tracking-tighter leading-none uppercase">BISO PETO</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Plateforme SIG</span>
                    </div>
                </div>
                
                <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto no-scrollbar pb-10">
                    {sidebarItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button 
                                key={item.view} 
                                onClick={() => onChangeView(item.view)} 
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <item.icon size={18} className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
                                <span className={`font-black text-[0.75rem] uppercase tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 border-t dark:border-white/5">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-black uppercase text-[0.7rem] tracking-widest">
                        <LogOut size={16} /> Quitter
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                {/* Header Global */}
                {showGlobalHeader && (
                    <header className="min-h-[4rem] md:min-h-[5rem] px-6 md:px-10 flex items-center justify-between sticky top-0 z-40 shrink-0 bg-white/80 backdrop-blur-xl dark:bg-black/80 border-b dark:border-white/5 safe-pt">
                        <div className="flex items-center gap-3 md:hidden">
                            <div className="w-8 h-8 bg-white dark:bg-black rounded-lg flex items-center justify-center shadow-md border border-gray-100 p-1"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                            <span className="font-black text-sm tracking-tighter text-primary uppercase">BISO PETO</span>
                        </div>
                        
                        <div className="hidden md:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Console de gestion</p>
                            <h1 className="font-black text-lg text-gray-800 dark:text-white tracking-tight uppercase mt-1">Tableau de bord</h1>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {syncQueueSize > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-full border border-orange-100 dark:border-orange-800 animate-pulse">
                                    <CloudOff size={12} />
                                    <span className="text-[8px] font-black uppercase">{syncQueueSize} offline</span>
                                </div>
                            )}
                            <button onClick={onRefresh} className={`p-2 rounded-xl text-gray-500 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
                            <button onClick={() => onChangeView(AppView.NOTIFICATIONS)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 relative">
                                <Bell size={18} />
                                {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[7px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-black">{unreadNotifications}</span>}
                            </button>
                        </div>
                    </header>
                )}

                {/* Main Scroll View */}
                <main className={`flex-1 overflow-y-auto overflow-x-hidden relative h-full w-full no-scrollbar transition-all duration-500 pb-[calc(6rem+env(safe-area-inset-bottom))]`}>
                    {children}
                </main>
                
                {/* TAB BAR (Mobile) */}
                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] flex items-center justify-evenly px-4 pb-[env(safe-area-inset-bottom)]">
                    {mobileTabItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex flex-col items-center justify-center h-full relative flex-1">
                                <div className={`relative z-10 p-3 rounded-2xl transition-all duration-500 ${isActive ? 'bg-primary text-white -translate-y-4 shadow-2xl scale-110' : 'text-gray-400 hover:text-primary/50'}`}>
                                    <item.icon size={22} />
                                </div>
                                <span className={`absolute bottom-1 text-[7px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Toasts */}
            {toast && toast.visible && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] max-w-xs">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-2xl ${toast.type === 'success' ? 'bg-[#00C853]/90 text-white border-green-400/20' : toast.type === 'error' ? 'bg-red-500/90 text-white border-red-400/20' : 'bg-blue-600/90 text-white border-blue-400/20'}`}>
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                           {toast.type === 'success' ? <Check size={16} strokeWidth={4}/> : <Info size={16} strokeWidth={4}/>}
                        </div>
                        <span className="font-black text-xs leading-tight flex-1 uppercase tracking-tight">{toast.message}</span>
                        <button onClick={onCloseToast} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
