
import React from 'react';
import { 
    LayoutDashboard, Map as MapIcon, ShoppingBag, 
    User as UserIcon, Bell, Settings as SettingsIcon,
    AlertTriangle, Truck, Users, RefreshCw, BarChart3, LogOut,
    PlusCircle, CreditCard, Layers, Share2
} from 'lucide-react';
import { User, AppView, UserType } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: AppView;
    onChangeView: (view: AppView) => void;
    onLogout: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
    user: User | null;
    unreadNotifications: number;
    appLogo: string;
    toast: { message: string; type: 'success' | 'error' | 'info'; visible: boolean };
    onCloseToast: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, currentView, onChangeView, onLogout, onRefresh, 
    isRefreshing, user, unreadNotifications, appLogo, toast, onCloseToast 
}) => {
    const isAdmin = user?.type === UserType.ADMIN;
    const isCollector = user?.type === UserType.COLLECTOR;

    const mainNavItems = [
        { view: AppView.DASHBOARD, icon: LayoutDashboard, label: 'Accueil' },
        { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
        { view: AppView.MARKETPLACE, icon: ShoppingBag, label: 'Marché' },
        { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' }
    ];

    const collectorItems = [
        { view: AppView.DASHBOARD, icon: LayoutDashboard, label: 'Accueil' },
        { view: AppView.COLLECTOR_JOBS, icon: Truck, label: 'Missions' },
        { view: AppView.MAP, icon: MapIcon, label: 'Carte' },
        { view: AppView.PROFILE, icon: UserIcon, label: 'Profil' }
    ];

    const adminItems = [
        { view: AppView.DASHBOARD, icon: BarChart3, label: 'Stats' },
        { view: AppView.ADMIN_REPORTS, icon: AlertTriangle, label: 'Alertes' },
        { view: AppView.ADMIN_USERS, icon: Users, label: 'Users' },
        { view: AppView.ADMIN_VEHICLES, icon: Truck, label: 'Flotte' },
        { view: AppView.ADMIN_ADS, icon: Share2, label: 'Ads' },
        { view: AppView.ADMIN_CASHBOOK, icon: CreditCard, label: 'Caisse' },
        { view: AppView.ADMIN_RECOVERY, icon: Layers, label: 'Récup' },
        { view: AppView.NOTIFICATIONS, icon: Bell, label: 'Notifs' },
        { view: AppView.SETTINGS, icon: SettingsIcon, label: 'Setti' }
    ];

    const navItems = isAdmin ? adminItems : (isCollector ? collectorItems : mainNavItems);

    const showGlobalHeader = ![AppView.LANDING, AppView.ONBOARDING, AppView.SPLASH].includes(currentView);

    return (
        <div className="h-screen w-screen bg-[#F5F7FA] dark:bg-[#050505] text-gray-900 dark:text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans selection:bg-primary/20">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* Desktop Global Header */}
                {showGlobalHeader && (
                    <header className={`hidden md:flex shrink-0 items-center justify-between px-10 h-24 bg-white/40 dark:bg-black/20 backdrop-blur-3xl border-b border-gray-100 dark:border-white/5 z-40 transition-all duration-500`}>
                        <div className="flex items-center gap-6">
                            <div className="relative group cursor-pointer" onClick={() => onChangeView(AppView.DASHBOARD)}>
                                <div className="absolute inset-x-[-15px] inset-y-[-10px] bg-primary/10 rounded-2xl scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500"></div>
                                <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain relative group-hover:rotate-6 transition-transform" />
                            </div>
                            <div className="h-10 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight leading-none text-gray-900 dark:text-white">Biso Peto</h1>
                                <p className="text-[10px] font-bold text-primary dark:text-primary-light uppercase tracking-[0.2em] mt-1.5 opacity-80">Kinshasa Propre</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={onRefresh} className={`p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-primary transition-all duration-500 shadow-sm hover:shadow-primary/10 active:scale-95 ${isRefreshing ? 'animate-spin text-primary' : ''}`}>
                                <RefreshCw size={20} />
                            </button>
                            <button onClick={() => onChangeView(AppView.NOTIFICATIONS)} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-primary transition-all duration-500 relative shadow-sm hover:shadow-primary/10 active:scale-95">
                                <Bell size={20} />
                                {unreadNotifications > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
                            </button>
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-100 dark:border-white/10">
                                <div className="text-right">
                                    <p className="text-xs font-black text-gray-900 dark:text-white leading-none uppercase">{user?.firstName} {user?.lastName}</p>
                                    <p className="text-[10px] font-bold text-gray-400 tracking-wider mt-1 uppercase">{user?.type}</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-primary/20">
                                    {user?.firstName?.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative h-full w-full no-scrollbar transition-all duration-500 scroll-container">
                    <div className={`${!showGlobalHeader ? 'pt-0' : 'pt-0'} ${user ? 'pb-[calc(7.5rem+env(safe-area-inset-bottom))]' : 'pb-0'} ${isAdmin ? 'lg:pb-28' : 'lg:pb-8'} h-full`}>
                        {children}
                    </div>
                </main>
                
                {user && (
                    <div className={`fixed bottom-6 inset-x-0 z-[100] flex justify-center px-6 mb-[env(safe-area-inset-bottom)] transition-all duration-500 animate-fade-in-up`}>
                        <nav className={`
                            flex items-center gap-1 md:gap-2 p-2 
                            bg-white/80 dark:bg-[#111827]/80 backdrop-blur-2xl 
                            border border-white/20 dark:border-white/10 
                            shadow-[0_20px_50px_rgba(0,0,0,0.3)] 
                            ${isAdmin ? 'rounded-[1.5rem] md:rounded-[2rem] px-3' : 'rounded-[2rem] w-full max-w-md justify-evenly lg:hidden'}
                        `}>
                            {/* Windows 11 Style Start Button for Admin */}
                            {isAdmin && (
                                <button 
                                    onClick={() => onChangeView(AppView.DASHBOARD)}
                                    className="p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-primary/10 hover:bg-primary/20 transition-all group shrink-0"
                                >
                                    <img src={appLogo} alt="Start" className="w-6 h-6 md:w-7 md:h-7 object-contain group-hover:scale-110 transition-transform" />
                                </button>
                            )}

                            <div className={`flex items-center ${isAdmin ? 'gap-1 md:gap-1.5 overflow-x-auto no-scrollbar max-w-[85vw] md:max-w-none' : 'w-full justify-evenly'}`}>
                                {navItems.map((item) => {
                                    const isActive = currentView === item.view;
                                    return (
                                        <button 
                                            key={item.view} 
                                            onClick={() => onChangeView(item.view)} 
                                            className={`
                                                flex flex-col items-center justify-center relative transition-all duration-300 group
                                                ${isAdmin ? 'p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-gray-100/50 dark:hover:bg-white/5' : 'flex-1'}
                                            `}
                                        >
                                            <div className={`
                                                relative z-10 transition-all duration-500 
                                                ${isActive ? (isAdmin ? 'text-primary scale-110' : 'bg-primary text-white -translate-y-5 shadow-2xl scale-110 shadow-primary/40 p-3.5 rounded-2xl') : 'text-gray-400 hover:text-primary/70'}
                                            `}>
                                                <item.icon size={isAdmin ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                                            </div>
                                            
                                            {/* Active Indicator (Windows 11 style) */}
                                            {isActive && isAdmin && (
                                                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(46,125,50,0.4)]" />
                                            )}
                                            
                                            {!isAdmin && (
                                                <span className={`absolute bottom-1.5 text-[7px] font-bold uppercase tracking-widest transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                                            )}

                                            {/* Tooltip for Admin Desktop */}
                                            {isAdmin && (
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10 shadow-xl hidden md:block uppercase tracking-wider">
                                                    {item.label}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Logout Button for Admin Taskbar */}
                            {isAdmin && (
                                <div className="ml-1 md:ml-2 pl-1 md:pl-2 border-l border-gray-200 dark:border-white/10 flex items-center">
                                    <button 
                                        onClick={onLogout}
                                        className="p-2.5 md:p-3 rounded-xl md:rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all shrink-0"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                )}
            </div>

            {/* Toast System */}
            {toast.visible && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] animate-fade-in-down">
                    <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-white/20 flex items-center gap-4 ${
                        toast.type === 'success' ? 'bg-green-500/90 text-white' : 
                        toast.type === 'error' ? 'bg-red-500/90 text-white' : 
                        'bg-blue-500/90 text-white'
                    }`}>
                        <p className="text-sm font-black uppercase tracking-tight">{toast.message}</p>
                        <button onClick={onCloseToast} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <PlusCircle className="rotate-45" size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
