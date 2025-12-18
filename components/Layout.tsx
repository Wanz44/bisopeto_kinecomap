
import React, { useState, useEffect } from 'react';
// Fixed: Added AlertCircle to the imports
import { Home, Map as MapIcon, GraduationCap, User, LogOut, Settings, RotateCw, Loader2, Users, ClipboardList, Megaphone, PieChart, CreditCard, Truck, BookOpen, WifiOff, ShoppingBag, CheckCircle, AlertTriangle, AlertCircle, Info, X, Shield, Factory, Calendar, Camera } from 'lucide-react';
import { AppView, UserType, User as UserInterface } from '../types';

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

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, onRefresh, isRefreshing, user, unreadNotifications = 0, appLogo = './logo%20bisopeto.png', toast, onCloseToast }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const getNavItems = () => {
        const type = user?.type;

        if (type === UserType.ADMIN) {
            return [
                { view: AppView.DASHBOARD, icon: PieChart, label: 'Dashboard' },
                { view: AppView.ADMIN_USERS, icon: Users, label: 'Utilisateurs' },
                { view: AppView.REPORTING, icon: AlertTriangle, label: 'Incidents' },
                { view: AppView.ADMIN_VEHICLES, icon: Truck, label: 'Flotte' },
                { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
            ];
        }

        if (type === UserType.COLLECTOR) {
            return [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Missions' },
                { view: AppView.MAP, icon: MapIcon, label: 'Ma Carte' },
                { view: AppView.PROFILE, icon: User, label: 'Profil' },
            ];
        }

        return [
            { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
            { view: AppView.REPORTING, icon: Camera, label: 'Signaler' },
            { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
            { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Boutique' },
            { view: AppView.ACADEMY, icon: GraduationCap, label: 'Academy' },
            { view: AppView.PROFILE, icon: User, label: 'Profil' },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="w-full h-[100dvh] flex bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl border border-white/40 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-white/5 p-1.5 shrink-0 overflow-hidden">
                        <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#00C853] to-[#2962FF] tracking-tighter leading-none">BISO PETO</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Eco-Map</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-gradient-to-r from-[#00C853]/20 to-transparent text-[#00C853] dark:text-[#00FF94]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5'}`}>
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#00C853] rounded-r-full shadow-[0_0_15px_#00C853]"></div>}
                                <item.icon size={22} className={`relative z-10 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`relative z-10 font-bold tracking-wide text-sm ${isActive ? 'translate-x-1' : ''}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 mx-2">
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border border-transparent hover:border-red-100">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl"><LogOut size={18} /></div>
                        <span className="font-bold text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                <header className="h-[80px] px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 shrink-0 backdrop-blur-sm">
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="w-10 h-10 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border dark:border-gray-800 p-1">
                            <img src={appLogo} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00C853] to-[#2962FF]">BISO PETO</span>
                    </div>

                    <div className="hidden md:block">
                        <h1 className="font-black text-2xl text-gray-800 dark:text-white capitalize tracking-tight">
                            {navItems.find(n => n.view === currentView)?.label || 'Plateforme KIN ECO'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                        <button onClick={onRefresh} className={`p-3 rounded-2xl text-gray-500 dark:text-gray-300 bg-white/50 dark:bg-white/5 border dark:border-white/10 hover:bg-white ${isRefreshing ? 'animate-spin text-[#00C853]' : ''}`}><RotateCw size={20} /></button>
                        <div className="relative cursor-pointer bg-white/50 dark:bg-white/5 p-3 rounded-2xl border dark:border-white/10 hover:bg-white group" onClick={() => onChangeView(AppView.NOTIFICATIONS)}>
                            <div className="text-gray-700 dark:text-gray-200 group-hover:text-[#2962FF] transition-colors"><AlertCircle size={22} /></div>
                            {unreadNotifications > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-gray-900 animate-pulse">{unreadNotifications}</span>}
                        </div>

                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="pl-1 pr-1 md:pr-4 md:pl-1 py-1 rounded-full md:rounded-2xl bg-white/50 dark:bg-white/5 border dark:border-white/10 shadow-sm flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${user?.type === UserType.ADMIN ? 'bg-gray-900' : 'bg-[#00C853]'}`}><User size={18} /></div>
                                <div className="hidden md:block text-left mr-2">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user?.firstName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">{user?.type}</p>
                                </div>
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 top-14 w-56 bg-white dark:bg-[#111827] rounded-3xl shadow-2xl border dark:border-white/10 py-2 z-[110] animate-scale-up">
                                    <div onClick={() => { onChangeView(AppView.PROFILE); setIsProfileMenuOpen(false); }} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-gray-700 dark:text-gray-200 font-bold text-sm"><User size={18} className="text-blue-500" /> Mon Profil</div>
                                    <div onClick={() => { onChangeView(AppView.SETTINGS); setIsProfileMenuOpen(false); }} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-gray-700 dark:text-gray-200 font-bold text-sm"><Settings size={18} className="text-purple-500" /> Paramètres</div>
                                    <div className="my-1 border-t dark:border-gray-700/50"></div>
                                    <div onClick={() => { setIsProfileMenuOpen(false); setShowLogoutConfirm(true); }} className="px-5 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-red-500 font-bold text-sm"><LogOut size={18} /> Déconnexion</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto relative pb-28 md:pb-0 h-full w-full">
                    {children}
                </main>

                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl border dark:border-white/10 rounded-full shadow-2xl z-[100] flex items-center justify-evenly px-2">
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button key={item.view} onClick={() => onChangeView(item.view)} className="flex flex-col items-center justify-center h-full relative w-12">
                                <div className={`relative z-10 p-2.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#00C853] text-white -translate-y-4 shadow-lg scale-110' : 'text-gray-400'}`}>
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {toast && toast.visible && (
                <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] max-w-sm">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${toast.type === 'success' ? 'bg-[#00C853]/80 text-white border-green-400/30' : toast.type === 'error' ? 'bg-red-500/80 text-white border-red-400/30' : 'bg-[#2962FF]/80 text-white border-blue-400/30'}`}>
                        <span className="font-bold text-sm">{toast.message}</span>
                        <button onClick={onCloseToast} className="ml-auto"><X size={16} /></button>
                    </div>
                </div>
            )}

            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="bg-white dark:bg-[#161b22] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-scale-up border dark:border-gray-700">
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3 text-center">Déconnexion</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-sm font-medium">Voulez-vous vraiment vous déconnecter ?</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Annuler</button>
                            <button onClick={() => { setShowLogoutConfirm(false); onLogout(); }} className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white">Quitter</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
