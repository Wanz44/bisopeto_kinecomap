
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

interface NavSection {
    title?: string;
    items: NavItem[];
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

    const hasPermission = (perm?: UserPermission): boolean => {
        if (currentView === AppView.PROFILE) return true;
        if (!perm) return true;
        if (!user) return false;
        return user.permissions?.includes(perm) || false;
    };

    const getNavSections = (): NavSection[] => {
        const type = user?.type;
        if (type === UserType.ADMIN) {
            const sections: NavSection[] = [{ items: [{ view: AppView.DASHBOARD, icon: Home, label: 'Dashboard' }] }];
            const gestionItems: NavItem[] = [];
            if (hasPermission('manage_reports')) gestionItems.push({ view: AppView.ADMIN_REPORTS, icon: AlertTriangle, label: 'Signalements SIG', permission: 'manage_reports' });
            if (hasPermission('manage_users')) gestionItems.push({ view: AppView.ADMIN_USERS, icon: Users, label: 'Utilisateurs', permission: 'manage_users' });
            if (hasPermission('manage_recovery')) gestionItems.push({ view: AppView.ADMIN_RECOVERY, icon: DollarSign, label: 'Recouvrement Cash', permission: 'manage_recovery' });
            if (hasPermission('manage_subscriptions')) gestionItems.push({ view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, label: 'Abonnements', permission: 'manage_subscriptions' });
            if (gestionItems.length > 0) sections.push({ title: 'Opérations', items: gestionItems });
            const contenuItems: NavItem[] = [];
            if (hasPermission('manage_marketplace')) contenuItems.push({ view: AppView.ADMIN_MARKETPLACE, icon: ShoppingBag, label: 'Marketplace', permission: 'manage_marketplace' });
            if (hasPermission('manage_academy')) contenuItems.push({ view: AppView.ADMIN_ACADEMY, icon: GraduationCap, label: 'Academy', permission: 'manage_academy' });
            if (hasPermission('manage_ads')) contenuItems.push({ view: AppView.ADMIN_ADS, icon: Megaphone, label: 'Régie Pub', permission: 'manage_ads' });
            if (contenuItems.length > 0) sections.push({ title: 'Contenu', items: contenuItems });
            const systemeItems: NavItem[] = [{ view: AppView.NOTIFICATIONS, icon: Bell, label: 'Notifications' }];
            if (hasPermission('manage_fleet')) systemeItems.push({ view: AppView.ADMIN_VEHICLES, icon: Truck, label: 'Flotte GPS', permission: 'manage_fleet' });
            if (hasPermission('system_settings')) systemeItems.push({ view: AppView.ADMIN_PERMISSIONS, icon: Shield, label: 'Privilèges', permission: 'system_settings' });
            if (hasPermission('system_settings')) systemeItems.push({ view: AppView.SETTINGS, icon: Settings, label: 'Config Système', permission: 'system_settings' });
            sections.push({ title: 'Système', items: systemeItems });
            sections.push({ items: [{ view: AppView.PROFILE, icon: UserIcon, label: 'Mon Profil' }] });
            return sections;
        }
        if (type === UserType.COLLECTOR) {
            return [{ items: [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Missions' },
                { view: AppView.MAP, icon: MapIcon, label: 'Carte Live' },
                { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
            ]}];
        }
        return [{ items: [
            { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
            { view: AppView.REPORTING, icon: Camera, label: 'Biso Peto Alert' },
            { view: AppView.MAP, icon: MapIcon, label: 'Points Verts' },
            { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Boutique' },
            { view: AppView.ACADEMY, icon: GraduationCap, label: 'Academy' },
            { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' },
        ]}];
    };

    const navSections = getNavSections();
    const flattenedItems = navSections.flatMap(s => s.items);
    const mobileItems = user?.type === UserType.ADMIN 
        ? [
            flattenedItems.find(i => i.view === AppView.DASHBOARD),
            flattenedItems.find(i => i.view === AppView.ADMIN_REPORTS),
            flattenedItems.find(i => i.view === AppView.ADMIN_USERS),
            flattenedItems.find(i => i.view === AppView.NOTIFICATIONS),
            flattenedItems.find(i => i.view === AppView.PROFILE),
        ].filter(Boolean) as NavItem[]
        : flattenedItems.slice(0, 5);

    return (
        <div className="w-full h-[100dvh] flex bg-[#F5F5F5] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-[18rem] h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex flex-col gap-1 text-center items-center">
                    <div className="w-14 h-14 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1.5 shrink-0 mb-2"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                    <div className="flex flex-col"><span className="font-black text-2xl text-primary tracking-tighter leading-none">KIN ECO MAP</span><span className="text-xs font-bold text-secondary uppercase tracking-widest mt-0.5">BISO PETO GROUP</span></div>
                </div>
                <nav className="flex-1 px-4 space-y-6 mt-2 overflow-y-auto no-scrollbar">
                    {navSections.map((section, idx) => (
                        <div key={idx} className="space-y-1.5">
                            {section.title && <h3 className="px-4 text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{section.title}</h3>}
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                return (
                                    <button key={item.view} onClick={() => onChangeView(item.view)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                        <item.icon className="w-5 h-5 relative z-10" />
                                        <span className="relative z-10 font-bold tracking-tight text-sm">{item.label}</span>
                                        {item.view === AppView.NOTIFICATIONS && unreadNotifications > 0 && !isActive && <span className="ml-auto w-5 h-5 bg-action text-gray-900 text-xs font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">{unreadNotifications}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content View */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                <header className="min-h-[5rem] px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 bg-white/50 backdrop-blur-sm dark:bg-black/50">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="w-10 h-10 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1"><img src={appLogo} alt="Logo" className="w-full h-full object-contain" /></div>
                        <span className="font-black text-xl tracking-tighter text-primary">KIN ECO MAP</span>
                    </div>
                    <div className="hidden md:block"><h1 className="font-black text-2xl text-gray-800 dark:text-white tracking-tight">{flattenedItems.find(n => n.view === currentView)?.label || 'Biso Peto'}</h1></div>
                    
                    <div className="flex items-center gap-3 ml-auto">
                        <button onClick={onRefresh} className={`p-3 rounded-2xl text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white shadow-sm ${isRefreshing ? 'animate-spin text-primary-light' : ''}`}><RotateCw className="w-5 h-5" /></button>
                        <button onClick={() => onChangeView(AppView.PROFILE)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${currentView === AppView.PROFILE ? 'bg-primary' : 'bg-primary-light'}`}><UserIcon className="w-5 h-5" /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto relative pb-40 md:pb-8 h-full w-full no-scrollbar">
                    {children}
                </main>
                
                {/* Tab Bar (Mobile) */}
                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full shadow-2xl z-[100] flex items-center justify-evenly px-2">
                    {mobileItems.map((item: any) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex flex-col items-center justify-center h-full relative w-12">
                                <div className={`relative z-10 p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-white -translate-y-4 shadow-xl scale-110' : 'text-gray-400'}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>
            {toast && toast.visible && <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] max-w-sm"><div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-primary-light text-white' : 'bg-red-500 text-white'} `}><span className="font-bold text-sm">{toast.message}</span><button onClick={onCloseToast} className="ml-auto"><X className="w-4 h-4" /></button></div></div>}
        </div>
    );
};
