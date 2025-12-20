
import React, { useState } from 'react';
import { 
    Home, Map as MapIcon, GraduationCap, User, LogOut, Settings, RotateCw, 
    Users, ClipboardList, Megaphone, PieChart, CreditCard, Truck, 
    ShoppingBag, CheckCircle, AlertTriangle, AlertCircle, Info, X, 
    Shield, Bell, Camera, LayoutGrid, PackageSearch, Leaf
} from 'lucide-react';
import { AppView, UserType, User as UserInterface } from '../types';

interface NavItem {
    view: AppView;
    icon: any;
    label: string;
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

    const getNavSections = (): NavSection[] => {
        const type = user?.type;

        if (type === UserType.ADMIN) {
            return [
                {
                    items: [{ view: AppView.DASHBOARD, icon: PieChart, label: 'Dashboard' }]
                },
                {
                    title: 'Gestion',
                    items: [
                        { view: AppView.ADMIN_USERS, icon: Users, label: 'Utilisateurs' },
                        { view: AppView.ADMIN_REPORTS, icon: AlertTriangle, label: 'Signalements' },
                        { view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, label: 'Abonnements' },
                    ]
                },
                {
                    title: 'Contenu',
                    items: [
                        { view: AppView.ADMIN_MARKETPLACE, icon: ShoppingBag, label: 'Marketplace' },
                        { view: AppView.ADMIN_ACADEMY, icon: GraduationCap, label: 'Academy' },
                    ]
                },
                {
                    title: 'Système',
                    items: [
                        { view: AppView.NOTIFICATIONS, icon: Bell, label: 'Notifications' },
                        { view: AppView.ADMIN_PERMISSIONS, icon: Settings, label: 'Paramètres' },
                    ]
                },
                {
                    items: [{ view: AppView.PROFILE, icon: User, label: 'Profil Admin' }]
                }
            ];
        }

        if (type === UserType.COLLECTOR) {
            return [{
                items: [
                    { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                    { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Missions' },
                    { view: AppView.MAP, icon: MapIcon, label: 'Ma Carte' },
                    { view: AppView.PROFILE, icon: User, label: 'Profil' },
                ]
            }];
        }

        return [{
            items: [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.REPORTING, icon: Camera, label: 'Signaler' },
                { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
                { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Boutique' },
                { view: AppView.ACADEMY, icon: GraduationCap, label: 'Academy' },
                { view: AppView.PROFILE, icon: User, label: 'Profil' },
            ]
        }];
    };

    const navSections = getNavSections();
    const flattenedItems = navSections.flatMap(s => s.items);

    return (
        <div className="w-full h-[100dvh] flex bg-[#F5F5F5] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl border border-gray-100 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex flex-col gap-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1.5 shrink-0">
                            <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl text-primary tracking-tighter leading-none">KIN ECO MAP</span>
                            <span className="text-[9px] font-bold text-secondary uppercase tracking-[0.1em] mt-0.5">BISO PETO GROUP</span>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-6 mt-2 overflow-y-auto no-scrollbar">
                    {navSections.map((section, idx) => (
                        <div key={idx} className="space-y-1.5">
                            {section.title && (
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                    {section.title}
                                </h3>
                            )}
                            {section.items.map((item) => {
                                const isActive = currentView === item.view;
                                return (
                                    <button 
                                        key={item.view} 
                                        onClick={() => onChangeView(item.view)} 
                                        className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                    >
                                        <item.icon size={20} className={`relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <span className={`relative z-10 font-bold tracking-tight text-sm`}>{item.label}</span>
                                        {item.view === AppView.NOTIFICATIONS && unreadNotifications > 0 && !isActive && (
                                            <span className="ml-auto w-5 h-5 bg-action text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                                                {unreadNotifications}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="p-6 mx-2 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 transition-colors">
                        <div className="p-2 bg-red-100 rounded-xl"><LogOut size={18} /></div>
                        <span className="font-bold text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                <header className="h-[80px] px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 bg-white/50 backdrop-blur-sm dark:bg-black/50">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="w-10 h-10 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 p-1">
                            <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-xl tracking-tighter text-primary">KIN ECO MAP</span>
                    </div>

                    <div className="hidden md:block">
                        <h1 className="font-black text-2xl text-gray-800 dark:text-white tracking-tight flex items-center gap-3">
                            {user?.type === UserType.ADMIN && <Shield size={24} className="text-secondary" />}
                            {flattenedItems.find(n => n.view === currentView)?.label || 'Biso Peto'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                        <button onClick={onRefresh} className={`p-3 rounded-2xl text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white shadow-sm ${isRefreshing ? 'animate-spin text-primary-light' : ''}`}><RotateCw size={20} /></button>
                        
                        <div className="relative">
                            <button className="pl-1 pr-1 md:pr-4 md:pl-1 py-1 rounded-full md:rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm flex items-center gap-3 transition-all hover:border-primary">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${user?.type === UserType.ADMIN ? 'bg-gray-900' : 'bg-primary-light'}`}>
                                    <User size={18} />
                                </div>
                                <div className="hidden md:block text-left mr-2">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user?.firstName}</p>
                                    <p className="text-[10px] text-gray-500 font-black uppercase mt-0.5 tracking-tighter">{user?.type}</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto relative pb-28 md:pb-0 h-full w-full">
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full shadow-2xl z-[100] flex items-center justify-evenly px-2">
                    {flattenedItems.slice(0, 5).map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex flex-col items-center justify-center h-full relative w-12">
                                <div className={`relative z-10 p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-primary text-white -translate-y-4 shadow-xl scale-110' : 'text-gray-400'}`}>
                                    <item.icon size={20} />
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {toast && toast.visible && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] max-w-sm">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-primary-light text-white border-green-400/30' : toast.type === 'error' ? 'bg-red-500 text-white border-red-400/30' : 'bg-secondary text-white border-blue-400/30'}`}>
                        <span className="font-bold text-sm">{toast.message}</span>
                        <button onClick={onCloseToast} className="ml-auto"><X size={16} /></button>
                    </div>
                </div>
            )}

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="bg-white dark:bg-[#161b22] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-scale-up border dark:border-gray-700 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3">Quitter ?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm font-medium">Voulez-vous vraiment vous déconnecter ?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 transition-colors">Annuler</button>
                            <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20">Quitter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
