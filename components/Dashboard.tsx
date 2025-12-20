
import React, { useState, useEffect } from 'react';
import { 
    Trash2, Recycle, Star, Award, Map as MapIcon, Calendar, CreditCard, 
    GraduationCap, Leaf, Users, User as UserIcon, TrendingUp, AlertTriangle, 
    Activity, Truck, CheckCircle, Navigation, Megaphone, Weight, Share2, 
    MapPin, ArrowUpRight, BarChart3, Clock, Search, Filter, DollarSign, 
    ShieldCheck, PhoneCall, Phone, FileText, Download, Globe2, Wind, Sparkles, Plus,
    Mail, ShieldAlert, Siren, Zap, Target, UserCheck, ShoppingBag, MessageSquare, Battery,
    ArrowDownRight, ChevronRight, Briefcase, Factory, ShieldEllipsis, History, FileCheck,
    X, ClipboardList, Camera, Package, Cloud, CloudOff
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area, CartesianGrid, YAxis, Legend
} from 'recharts';
import { User, AppView, UserType, WasteReport, MarketplaceItem, AdCampaign } from '../types';
import { UserAPI, ReportsAPI, MarketplaceAPI, AdsAPI, NotificationsAPI } from '../services/api';
import { isSupabaseConfigured, testSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
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

const AdminDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [allMarketplace, setAllMarketplace] = useState<MarketplaceItem[]>([]);
    const [allNotifications, setAllNotifications] = useState<any[]>([]);
    
    const [searchResults, setSearchResults] = useState<{
        users: User[],
        reports: WasteReport[],
        marketplace: MarketplaceItem[]
    }>({ users: [], reports: [], marketplace: [] });
    
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        loadAllData();
        return () => clearInterval(timer);
    }, []);

    const loadAllData = async () => {
        try {
            const isLive = await testSupabaseConnection();
            setIsCloudSynced(isLive);

            const [usersData, reportsData, marketplaceData, notifsData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll(),
                MarketplaceAPI.getAll(),
                NotificationsAPI.getAll(user.id || '', true)
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);
            setAllMarketplace(marketplaceData);
            setAllNotifications(notifsData);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim().length > 1) {
            setIsSearching(true);
            const lowerQuery = query.toLowerCase();
            
            const filteredUsers = allUsers.filter(u => 
                `${u.firstName} ${u.lastName}`.toLowerCase().includes(lowerQuery) ||
                u.email?.toLowerCase().includes(lowerQuery) ||
                u.phone.includes(lowerQuery) ||
                u.commune?.toLowerCase().includes(lowerQuery)
            ).slice(0, 3);

            const filteredReports = allReports.filter(r => 
                r.wasteType.toLowerCase().includes(lowerQuery) ||
                r.status.toLowerCase().includes(lowerQuery) ||
                r.urgency.toLowerCase().includes(lowerQuery) ||
                r.commune?.toLowerCase().includes(lowerQuery) ||
                r.comment.toLowerCase().includes(lowerQuery)
            ).slice(0, 3);

            setSearchResults({
                users: filteredUsers,
                reports: filteredReports,
                marketplace: []
            });
        } else {
            setIsSearching(false);
            setSearchResults({ users: [], reports: [], marketplace: [] });
        }
    };

    const countReportsToday = allReports.filter(r => {
        const d = new Date(r.date);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    }).length;

    const countPendingUsers = allUsers.filter(u => u.status === 'pending').length;
    const countInterventions = allReports.filter(r => r.status === 'resolved').length;
    const totalUsersCount = allUsers.length;

    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8 max-w-[1600px] mx-auto">
            {/* Sync Header */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between mb-4 transition-all ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                <div className="flex items-center gap-3">
                    {isCloudSynced ? <Cloud size={20} className="animate-pulse" /> : <CloudOff size={20} />}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Base de données Cloud Supabase</p>
                        <p className="text-sm font-bold">{isCloudSynced ? 'Synchronisé et opérationnel' : 'Synchronisation échouée - Mode local uniquement'}</p>
                    </div>
                </div>
                {!isCloudSynced && (
                    <button onClick={loadAllData} className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700">Réessayer Sync</button>
                )}
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="w-full xl:w-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Biso Peto Control Tower • Live</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Vue Stratégique</h1>
                    
                    <div className="relative w-full max-w-xl mt-6 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2962FF] transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Rechercher utilisateurs ou incidents..."
                            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-[#2962FF] outline-none font-bold text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                    <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm border dark:border-gray-700 hidden md:flex items-center gap-3">
                        <Clock size={16} className="text-[#2962FF]" />
                        <span className="text-sm font-black dark:text-white font-mono">
                            {currentTime.toLocaleTimeString('fr-FR')}
                        </span>
                    </div>
                    <button onClick={() => onChangeView(AppView.ADMIN_REPORTS)} className="bg-[#2962FF] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
                        SIG Temps Réel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Alertes Jour', value: countReportsToday.toString(), trend: countReportsToday > 0 ? '+100%' : '0%', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Dossiers à Valider', value: countPendingUsers.toString(), trend: countPendingUsers > 0 ? 'CRITIQUE' : 'OK', icon: UserCheck, color: 'text-[#FBC02D]', bg: 'bg-yellow-50' },
                    { label: 'Collectes Finies', value: countInterventions.toString(), trend: 'TOTAL', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Utilisateurs Totaux', value: totalUsersCount.toString(), trend: 'RÉSEAU', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((stat, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => stat.label === 'Dossiers à Valider' ? onChangeView(AppView.ADMIN_USERS) : undefined}
                        className={`bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer`}
                    >
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} dark:bg-white/5 ${stat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h2>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500`}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Flux des Notifications Admin</h3>
                    <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                        {allNotifications.filter(n => n.targetUserId === 'ADMIN').length === 0 ? (
                            <p className="text-gray-400 font-bold uppercase text-xs italic text-center py-20">Aucun message de validation en attente.</p>
                        ) : (
                            allNotifications.filter(n => n.targetUserId === 'ADMIN').map((notif, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 animate-fade-in">
                                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle size={18}/></div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black dark:text-white uppercase">{notif.title}</p>
                                        <p className="text-[10px] text-gray-500 font-bold mt-1 leading-relaxed">{notif.message}</p>
                                    </div>
                                    <button onClick={() => onChangeView(AppView.ADMIN_USERS)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><ChevronRight/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Performance Communes</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                        {ZONE_PERFORMANCE.map((zone, i) => {
                             const reportsInZone = allReports.filter(r => r.commune === zone.name).length;
                             const resolvedInZone = allReports.filter(r => r.commune === zone.name && r.status === 'resolved').length;
                             const efficiency = reportsInZone > 0 ? Math.round((resolvedInZone / reportsInZone) * 100) : 0;
                             
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{zone.name}</span>
                                        <span className={`text-[10px] font-black ${efficiency > 0 ? 'text-green-500' : 'text-gray-400'}`}>{efficiency}% Résolu</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${efficiency > 80 ? 'bg-[#00C853]' : 'bg-[#2962FF]'}`} 
                                            style={{ width: `${efficiency}%` }}
                                        ></div>
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

const PendingDashboard: React.FC<DashboardProps> = ({ user }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-[2.5rem] flex items-center justify-center text-orange-600 shadow-xl">
                <Clock size={48} className="animate-pulse" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Compte en attente</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto leading-relaxed">
                    Mbote {user.firstName}! Votre demande d'accès est en cours de validation par nos équipes d'assainissement. Vous recevrez une notification dès que votre compte sera actif.
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
