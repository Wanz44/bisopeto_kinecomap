
import React, { useState, useEffect } from 'react';
import { Home, Map as MapIcon, GraduationCap, User, LogOut, Settings, RotateCw, Loader2, Users, ClipboardList, Megaphone, PieChart, CreditCard, Truck, BookOpen, WifiOff, ShoppingBag, CheckCircle, AlertCircle, Info, X, Shield } from 'lucide-react';
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
    // Toast Props
    toast?: { message: string; type: 'success' | 'error' | 'info'; visible: boolean };
    onCloseToast?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onLogout, onRefresh, isRefreshing, user, unreadNotifications = 0, appLogo = './logo.png', toast, onCloseToast }) => {
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const toggleProfileMenu = () => setIsProfileMenuOpen(!isProfileMenuOpen);

    const handleLogoutClick = () => {
        setIsProfileMenuOpen(false); 
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    // Définition des menus selon le rôle
    const getNavItems = () => {
        const type = user?.type;

        // Menu Admin
        if (type === UserType.ADMIN) {
            return [
                { view: AppView.DASHBOARD, icon: PieChart, label: 'Dashboard' },
                { view: AppView.ADMIN_USERS, icon: Users, label: 'Utilisateurs' },
                { view: AppView.ADMIN_PERMISSIONS, icon: Shield, label: 'Permissions' },
                { view: AppView.ADMIN_ADS, icon: Megaphone, label: 'Publicité' },
                { view: AppView.ADMIN_VEHICLES, icon: Truck, label: 'Flotte' },
                { view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, label: 'Système' },
                { view: AppView.ADMIN_ACADEMY, icon: BookOpen, label: 'Academy' },
                { view: AppView.MAP, icon: MapIcon, label: 'Supervision' },
            ];
        }

        // Menu Collecteur
        if (type === UserType.COLLECTOR) {
            return [
                { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
                { view: AppView.COLLECTOR_JOBS, icon: ClipboardList, label: 'Tâches' },
                { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Achats' }, 
                { view: AppView.PROFILE, icon: User, label: 'Profil' },
            ];
        }

        // Menu Citoyen / Entreprise (Défaut)
        return [
            { view: AppView.DASHBOARD, icon: Home, label: 'Accueil' },
            { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Vendre' }, 
            { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
            { view: AppView.ACADEMY, icon: GraduationCap, label: 'Academy' },
            { view: AppView.PROFILE, icon: User, label: 'Profil' },
        ];
    };

    const navItems = getNavItems();

    return (
        <div className="w-full h-[100dvh] flex bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative font-sans">
            
            {/* Background Ambient Glow (Futuristic) */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00C853]/10 dark:bg-[#00C853]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2962FF]/10 dark:bg-[#2962FF]/20 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* --- FUTURISTIC FLOATING SIDEBAR (Desktop) --- */}
            <aside className="hidden md:flex flex-col w-72 h-[calc(100vh-3rem)] m-6 rounded-[2.5rem] bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl border border-white/40 dark:border-white/5 shadow-2xl transition-all duration-300 relative z-50 shrink-0">
                <div className="p-8 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#00C853] to-[#2962FF] rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 p-0.5 shrink-0 animate-float">
                         <div className="bg-white dark:bg-black w-full h-full rounded-[14px] flex items-center justify-center">
                            <img src={appLogo} alt="Logo" className="w-8 h-8 object-contain" />
                         </div>
                    </div>
                    <div>
                        <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-[#00C853] to-[#2962FF] tracking-tighter">KIN ECO</span>
                    </div>
                </div>

                <div className="px-8 mb-4">
                    <div className="text-[10px] font-black text-gray-400/80 uppercase tracking-[0.2em]">
                        {user?.type === UserType.ADMIN ? 'Command Center' : user?.type === UserType.COLLECTOR ? 'Workspace' : 'Menu Principal'}
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto no-scrollbar">
                    {navItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button
                                key={item.view}
                                onClick={() => onChangeView(item.view)}
                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                                    isActive 
                                    ? 'bg-gradient-to-r from-[#00C853]/20 to-transparent text-[#00C853] dark:text-[#00FF94]' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5'
                                }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#00C853] rounded-r-full shadow-[0_0_15px_#00C853]"></div>
                                )}
                                <item.icon 
                                    size={22} 
                                    className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(0,200,83,0.6)]' : 'group-hover:scale-110'}`} 
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span className={`relative z-10 font-bold tracking-wide text-sm ${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 mx-2">
                    <button 
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
                    >
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl group-hover:scale-110 transition-transform shadow-inner">
                            <LogOut size={18} />
                        </div>
                        <span className="font-bold text-sm">Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
                
                {/* Offline Banner */}
                {!isOnline && (
                    <div className="bg-red-500/90 backdrop-blur-md text-white text-xs font-bold py-2 px-4 text-center shadow-lg animate-fade-in flex items-center justify-center gap-2 relative z-[60] safe-pt">
                        <WifiOff size={14} />
                        Système Hors Ligne - Fonctionnalités limitées
                    </div>
                )}

                {/* Glass Header - Sticky */}
                <header 
                    className={`h-[80px] px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors duration-300 shrink-0 safe-pt backdrop-blur-sm ${
                        currentView === AppView.DASHBOARD ? 'flex' : 'hidden md:flex'
                    }`}
                >
                    {/* Mobile Logo */}
                    <div className="flex items-center gap-3 md:hidden">
                        <div className="w-10 h-10 bg-white dark:bg-black rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 overflow-hidden border border-gray-100 dark:border-gray-800 shrink-0">
                                <img src={appLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        </div>
                        <span className="font-black text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-[#00C853] to-[#2962FF]">KIN ECO</span>
                    </div>

                    {/* Desktop Title */}
                    <div className="hidden md:block">
                            <h1 className="font-black text-2xl text-gray-800 dark:text-white capitalize tracking-tight flex items-center gap-2">
                                {currentView === AppView.DASHBOARD ? (user?.type === UserType.ADMIN ? 'Vue Globale' : 'Tableau de bord') : 
                                    currentView === AppView.MAP ? 'Supervision Cartographique' :
                                    currentView === AppView.MARKETPLACE ? 'Eco Marketplace' :
                                    currentView === AppView.ACADEMY ? 'Eco Academy' :
                                    currentView === AppView.PROFILE ? 'Mon Profil' : 
                                    currentView === AppView.SETTINGS ? 'Paramètres Système' : 
                                    currentView === AppView.ADMIN_USERS ? 'Gestion Utilisateurs' :
                                    currentView === AppView.ADMIN_PERMISSIONS ? 'Gestion Permissions & Rôles' :
                                    currentView === AppView.ADMIN_ADS ? 'Publicités & Partenaires' :
                                    currentView === AppView.ADMIN_SUBSCRIPTIONS ? 'Configuration & Finance' :
                                    currentView === AppView.ADMIN_VEHICLES ? 'Flotte & Télémétrie' :
                                    currentView === AppView.ADMIN_ACADEMY ? 'Contenu Éducatif' :
                                    currentView === AppView.COLLECTOR_JOBS ? 'Missions du Jour' :
                                    'KIN ECO-MAP'}
                            </h1>
                            <p className="text-xs text-gray-400 font-medium mt-0.5 tracking-wide">Bienvenue dans le futur de la gestion écologique.</p>
                    </div>
                    
                    <div className="flex items-center gap-4 ml-auto">
                        <button 
                            onClick={onRefresh}
                            className={`p-3 rounded-2xl text-gray-500 dark:text-gray-300 bg-white/50 dark:bg-white/5 shadow-sm border border-white/20 dark:border-white/10 hover:bg-white hover:shadow-md transition-all ${isRefreshing ? 'animate-spin text-[#00C853]' : ''} ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isRefreshing || !isOnline}
                            title="Actualiser"
                        >
                            {isRefreshing ? <Loader2 size={20} /> : <RotateCw size={20} />}
                        </button>

                        <div 
                            className="relative cursor-pointer bg-white/50 dark:bg-white/5 p-3 rounded-2xl shadow-sm border border-white/20 dark:border-white/10 hover:bg-white hover:shadow-md transition-all group" 
                            onClick={() => onChangeView(AppView.NOTIFICATIONS)}
                        >
                            <div className="text-gray-700 dark:text-gray-200 group-hover:text-[#2962FF] transition-colors">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                            </div>
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-[0_0_10px_#ef4444] border-2 border-white dark:border-gray-900 animate-pulse">
                                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                </span>
                            )}
                        </div>

                        <div className="relative">
                            <button 
                                onClick={toggleProfileMenu}
                                className="pl-1 pr-1 md:pr-4 md:pl-1 py-1 rounded-full md:rounded-2xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3 backdrop-blur-sm"
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg transform transition-transform ${
                                    user?.type === UserType.ADMIN ? 'bg-gray-900 shadow-gray-500/30' :
                                    user?.type === UserType.COLLECTOR ? 'bg-[#2962FF] shadow-blue-500/30' :
                                    'bg-[#00C853] shadow-green-500/30'
                                }`}>
                                    <User size={18} />
                                </div>
                                <div className="hidden md:block text-left mr-2">
                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{user?.firstName}</p>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mt-0.5">{user?.type}</p>
                                </div>
                            </button>

                            {isProfileMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-14 w-56 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 py-2 z-20 animate-scale-up origin-top-right ring-1 ring-black/5">
                                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 mb-1 md:hidden">
                                            <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user?.type}</p>
                                        </div>
                                        <div 
                                            onClick={() => { onChangeView(AppView.PROFILE); setIsProfileMenuOpen(false); }}
                                            className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-gray-700 dark:text-gray-200 font-bold text-sm transition-colors"
                                        >
                                            <User size={18} className="text-blue-500" /> Mon Profil
                                        </div>
                                        <div 
                                            onClick={() => { onChangeView(AppView.SETTINGS); setIsProfileMenuOpen(false); }}
                                            className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer text-gray-700 dark:text-gray-200 font-bold text-sm transition-colors"
                                        >
                                            <Settings size={18} className="text-purple-500" /> Paramètres
                                        </div>
                                        <div className="my-1 border-t border-gray-100 dark:border-gray-700/50"></div>
                                        <div 
                                            onClick={handleLogoutClick}
                                            className="px-5 py-3 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-red-500 font-bold text-sm transition-colors rounded-b-3xl"
                                        >
                                            <LogOut size={18} /> Déconnexion
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto relative transition-colors duration-300 pb-28 md:pb-0 h-full w-full">
                    {/* Container */}
                    <div className="w-full h-full mx-auto">
                        {children}
                    </div>
                </main>

                {/* --- FUTURISTIC MOBILE FLOATING PILL NAVIGATION --- */}
                <nav className="md:hidden fixed bottom-6 inset-x-6 h-16 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-2xl shadow-black/20 z-[100] flex items-center justify-evenly px-2 safe-pb">
                    {navItems.map((item) => {
                        const isActive = currentView === item.view;
                        return (
                            <button
                                key={item.view}
                                onClick={() => onChangeView(item.view)}
                                className="flex flex-col items-center justify-center h-full relative group w-12"
                            >
                                <div className={`relative z-10 p-2.5 rounded-full transition-all duration-300 ease-out ${
                                    isActive 
                                    ? 'bg-gradient-to-br from-[#00C853] to-[#009624] text-white -translate-y-6 shadow-[0_8px_16px_rgba(0,200,83,0.4)] scale-110 ring-4 ring-[#F5F7FA] dark:ring-[#050505]' 
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}>
                                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                
                                {/* Label for active item on mobile */}
                                <span className={`absolute bottom-2 text-[10px] font-bold text-gray-800 dark:text-white transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* --- GLOBAL TOAST NOTIFICATION (Glass Style) --- */}
            {toast && toast.visible && (
                <div className="fixed top-24 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[9999] animate-fade-in-up w-[90%] max-w-sm safe-pt">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${
                        toast.type === 'success' ? 'bg-[#00C853]/80 text-white border-green-400/30 shadow-green-500/20' :
                        toast.type === 'error' ? 'bg-red-500/80 text-white border-red-400/30 shadow-red-500/20' :
                        'bg-[#2962FF]/80 text-white border-blue-400/30 shadow-blue-500/20'
                    }`}>
                        <div className={`p-2 rounded-full bg-white/20 shrink-0`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> : 
                             toast.type === 'error' ? <AlertCircle size={20} /> : 
                             <Info size={20} />}
                        </div>
                        <span className="font-bold text-sm tracking-wide">{toast.message}</span>
                        <button onClick={onCloseToast} className="ml-auto hover:bg-white/20 rounded-full p-1 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Global Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 safe-pb safe-pt">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="bg-white dark:bg-[#161b22] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative z-10 animate-scale-up border border-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto shadow-inner">
                            <LogOut size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-3 text-center">Déconnexion</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 text-center text-sm font-medium leading-relaxed">
                            Voulez-vous vraiment vous déconnecter de votre session KIN ECO-MAP ?
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={confirmLogout}
                                className="flex-1 py-4 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
