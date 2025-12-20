
import React, { useState, useEffect } from 'react';
import { 
    Trash2, Recycle, Star, Award, Map as MapIcon, Calendar, CreditCard, 
    GraduationCap, Leaf, Users, User as UserIcon, TrendingUp, AlertTriangle, 
    Activity, Truck, CheckCircle, Navigation, Megaphone, Weight, Share2, 
    MapPin, ArrowUpRight, BarChart3, Clock, Search, Filter, DollarSign, 
    ShieldCheck, PhoneCall, Phone, FileText, Download, Globe2, Wind, Sparkles, Plus,
    Mail, ShieldAlert, Siren, Zap, Target, UserCheck, ShoppingBag, MessageSquare, Battery,
    ArrowDownRight, ChevronRight, Briefcase, Factory, ShieldEllipsis, History, FileCheck,
    X, ClipboardList, Camera, Package, Cloud, CloudOff, UserPlus, Bell, Lock
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area, CartesianGrid, YAxis, Legend
} from 'recharts';
import { User, AppView, UserType, WasteReport, MarketplaceItem, AdCampaign, NotificationItem } from '../types';
import { UserAPI, ReportsAPI, MarketplaceAPI, AdsAPI, NotificationsAPI } from '../services/api';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    notifications?: NotificationItem[];
}

const ZONE_PERFORMANCE = [
    { name: 'Gombe', active: 45, reports: 12, cleaned: 10 },
    { name: 'Limete', active: 32, reports: 28, cleaned: 15 },
    { name: 'Ngaliema', active: 58, reports: 42, cleaned: 40 },
    { name: 'Kintambo', active: 15, reports: 8, cleaned: 7 },
];

export const Dashboard: React.FC<DashboardProps> = (props) => {
    if (props.user.type !== UserType.ADMIN && props.user.status === 'pending') {
        return <PendingDashboard {...props} />;
    }

    switch (props.user.type) {
        case UserType.ADMIN: return <AdminDashboard {...props} />;
        case UserType.COLLECTOR: return <CollectorDashboard {...props} />;
        case UserType.BUSINESS: return <BusinessDashboard {...props} />;
        default: return <CitizenDashboard {...props} />;
    }
};

const AdminDashboard: React.FC<DashboardProps> = ({ user, onChangeView, onToast }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        loadAllData();
        return () => clearInterval(timer);
    }, []);

    const loadAllData = async () => {
        setIsLoading(true);
        try {
            const isLive = await testSupabaseConnection();
            setIsCloudSynced(isLive);

            const [usersData, reportsData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll()
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);

            // Notification Admin Toast persistante au chargement
            const pending = usersData.filter(u => u.status === 'pending');
            if (pending.length > 0 && onToast) {
                onToast(`Réseau : ${pending.length} dossiers d'assainissement en attente de validation.`, "info");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const countReportsToday = allReports.filter(r => {
        const d = new Date(r.date);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    }).length;

    const STATS_CARDS = [
        { 
            label: 'Alertes Jour', 
            value: countReportsToday.toString(), 
            trend: countReportsToday > 0 ? 'Urgent' : 'OK', 
            icon: Megaphone, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            targetView: AppView.ADMIN_REPORTS 
        },
        { 
            label: 'À Valider', 
            value: pendingUsers.length.toString(), 
            trend: pendingUsers.length > 0 ? 'CRITIQUE' : 'À Jour', 
            icon: UserCheck, 
            color: 'text-[#FBC02D]', 
            bg: 'bg-yellow-50',
            targetView: AppView.ADMIN_USERS,
            urgent: pendingUsers.length > 0
        },
        { 
            label: 'Collectes Finies', 
            value: allReports.filter(r => r.status === 'resolved').length.toString(), 
            trend: 'Total', 
            icon: CheckCircle, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50',
            targetView: AppView.ADMIN_REPORTS 
        },
        { 
            label: 'Utilisateurs', 
            value: allUsers.length.toString(), 
            trend: 'Inscrits', 
            icon: Users, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50',
            targetView: AppView.ADMIN_USERS 
        }
    ];

    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8 max-w-[1600px] mx-auto">
            {/* Sync Header */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                <div className="flex items-center gap-3">
                    {isCloudSynced ? <Cloud size={20} className="animate-pulse" /> : <CloudOff size={20} />}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Base de données Cloud Supabase</p>
                        <p className="text-sm font-bold">{isCloudSynced ? 'Synchronisé - Temps Réel' : 'Mode local uniquement'}</p>
                    </div>
                </div>
                <button onClick={loadAllData} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Biso Peto Control Tower • Live</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Vue Stratégique</h1>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center gap-3">
                    <Clock size={16} className="text-[#2962FF]" />
                    <span className="text-sm font-black dark:text-white font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STATS_CARDS.map((stat, idx) => (
                    <div key={idx} onClick={() => onChangeView(stat.targetView)} className={`bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border-2 transition-all active:scale-95 cursor-pointer relative overflow-hidden group shadow-sm ${stat.urgent ? 'border-orange-500 animate-pulse bg-orange-50/20 shadow-orange-200' : 'border-gray-100 dark:border-gray-800 hover:border-primary'}`}>
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} dark:bg-white/5 ${stat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h2>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${stat.urgent ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section Spéciale "Validation d'Assainissement" (Auparavant REFACTORED) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[3rem] border-2 border-orange-200 dark:border-orange-900/40 shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-orange-500 rotate-12"><ShieldAlert size={120} /></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <Siren size={24} className="text-orange-500" />
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Validation d'Assainissement</h3>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg shadow-orange-500/20">
                           <Bell size={12} className="animate-bounce" /> {pendingUsers.length} comptes critiques
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[400px] relative z-10">
                        {pendingUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <ShieldCheck size={48} className="text-green-500 mb-4 opacity-20" />
                                <p className="text-gray-400 font-bold uppercase text-xs italic">Aucun dossier en attente de validation.</p>
                            </div>
                        ) : (
                            pendingUsers.map((pendingUser, i) => (
                                <div key={pendingUser.id || i} className="flex items-center gap-4 p-5 bg-orange-50/50 dark:bg-orange-900/10 rounded-[2rem] border-2 border-transparent hover:border-orange-200 transition-all group animate-fade-in">
                                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm">{pendingUser.firstName[0]}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black dark:text-white uppercase truncate">{pendingUser.firstName} {pendingUser.lastName}</p>
                                            <span className="text-[8px] bg-white text-orange-600 px-2 py-0.5 rounded-md font-black uppercase shadow-sm">{pendingUser.type}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><MapPin size={10}/> {pendingUser.commune || 'Ksh'}</span>
                                            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><Phone size={10}/> {pendingUser.phone}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => onChangeView(AppView.ADMIN_USERS)} 
                                        className="bg-orange-500 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-orange-500/20 font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Qualifier
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    {pendingUsers.length > 0 && (
                        <button 
                            onClick={() => onChangeView(AppView.ADMIN_USERS)}
                            className="mt-6 w-full py-4 bg-gray-900 text-white dark:bg-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-all"
                        >
                            Ouvrir l'annuaire complet
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Efficacité Zones</h3>
                        <PieChart size={20} className="text-blue-500" />
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                        {ZONE_PERFORMANCE.map((zone, i) => {
                             const reportsInZone = allReports.filter(r => r.commune === zone.name).length;
                             const resolvedInZone = allReports.filter(r => r.commune === zone.name && r.status === 'resolved').length;
                             const efficiency = reportsInZone > 0 ? Math.round((resolvedInZone / reportsInZone) * 100) : 0;
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{zone.name}</span>
                                        <span className={`text-[10px] font-black ${efficiency > 70 ? 'text-green-500' : 'text-orange-500'}`}>{efficiency}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${efficiency > 70 ? 'bg-[#00C853]' : 'bg-orange-500'}`} style={{ width: `${efficiency}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

const PendingDashboard: React.FC<DashboardProps> = ({ user }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-8 md:p-12 text-center space-y-10 animate-fade-in bg-[#F5F7FA] dark:bg-[#050505]">
            <div className="relative">
                <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3rem] flex items-center justify-center text-orange-600 shadow-2xl relative z-10 animate-float">
                    <Lock size={64} />
                </div>
                <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-20 animate-pulse"></div>
            </div>
            
            <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-2 rounded-full border border-orange-100 dark:border-orange-800">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sécurité Biso Peto • Accès Restreint</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Vérification en cours</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Mbote {user.firstName}! Votre demande d'adhésion au réseau Biso Peto a bien été reçue. 
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 text-left">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center shrink-0"><Mail size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etape 1</p>
                        <p className="text-sm font-black dark:text-white uppercase">Email de confirmation envoyé</p>
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 text-left opacity-60">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 animate-pulse"><UserCheck size={24}/></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etape 2</p>
                        <p className="text-sm font-black dark:text-white uppercase">Qualification du profil par Admin</p>
                    </div>
                </div>
            </div>

            <div className="bg-orange-50/50 dark:bg-orange-900/5 border border-orange-100/50 dark:border-orange-900/20 p-6 rounded-[2rem] max-w-md">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-loose">
                    Pour des raisons de sécurité et de traçabilité des déchets, chaque compte doit être validé manuellement. Vous recevrez une notification dès que votre zone sera activée.
                </p>
            </div>
        </div>
    );
};

const CollectorDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
                    <Truck size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Espace Collecte</h1>
                    <p className="text-sm font-bold text-gray-400 mt-1">Prêt pour votre mission, {user.firstName}?</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center text-[#2962FF] transition-transform group-hover:scale-110 group-hover:rotate-6">
                        <ClipboardList size={36} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Missions du jour</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Voir planning</p>
                    </div>
                </button>
                <button onClick={() => onChangeView(AppView.MAP)} className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-[2rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110 group-hover:-rotate-6">
                        <MapIcon size={36} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Carte temps réel</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Itinéraires & SIG</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const BusinessDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                        <Briefcase size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{user.companyName || 'Espace Entreprise'}</h1>
                        <p className="text-sm font-bold text-gray-400 mt-1">Pilotage RSE & Gestion des Déchets</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CitizenDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Mbote, {user.firstName}!</h1>
                    <p className="text-sm font-bold text-gray-500 mt-3 flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Leaf size={12} /></div> 
                        Kinshasa devient plus propre grâce à vous.
                    </p>
                </div>
                <div className="bg-white dark:bg-[#111827] p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center min-w-[120px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco Points</p>
                    <div className="text-3xl font-black text-[#2962FF]">{user.points}</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-[#2962FF] p-8 rounded-[3rem] shadow-2xl shadow-blue-500/20 flex flex-col gap-8 transition-transform hover:scale-[1.02] active:scale-95">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-500"><Camera size={120} /></div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white"><Camera size={28} /></div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Biso Peto Alert</h3>
                        <p className="text-white/70 text-xs font-bold uppercase mt-2 tracking-widest">Signaler des déchets maintenant</p>
                    </div>
                </button>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => onChangeView(AppView.ACADEMY)} className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4 group hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-[1.5rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110"><GraduationCap size={32} /></div>
                        <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Eco Academy</span>
                    </button>
                    <button onClick={() => onChangeView(AppView.MARKETPLACE)} className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4 group hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-[1.5rem] flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110"><ShoppingBag size={32} /></div>
                        <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Marketplace</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
