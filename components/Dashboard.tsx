
import React, { useState, useEffect } from 'react';
/* Added Search and other icons if missing */
import { 
    Trash2, Recycle, Star, Award, Map as MapIcon, Calendar, CreditCard, 
    GraduationCap, Leaf, Users, User as UserIcon, TrendingUp, AlertTriangle, 
    Activity, Truck, CheckCircle, Navigation, Megaphone, Weight, Share2, 
    MapPin, ArrowUpRight, BarChart3, Clock, Search, Filter, DollarSign, 
    ShieldCheck, PhoneCall, Phone, FileText, Download, Globe2, Wind, Sparkles, Plus,
    Mail, ShieldAlert, Siren, Zap, Target, UserCheck, ShoppingBag, MessageSquare, Battery,
    ArrowDownRight, ChevronRight, Briefcase, Factory, ShieldEllipsis, History, FileCheck,
    X, ClipboardList, Camera, Package
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area, CartesianGrid, YAxis, Legend
} from 'recharts';
import { User, AppView, UserType, WasteReport, MarketplaceItem } from '../types';
import { UserAPI, ReportsAPI, MarketplaceAPI } from '../services/api';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Mock data pour les graphiques de performance par zone
const ZONE_PERFORMANCE = [
    { name: 'Gombe', active: 45, reports: 12, cleaned: 38 },
    { name: 'Limete', active: 32, reports: 28, cleaned: 15 },
    { name: 'Ngaliema', active: 58, reports: 42, cleaned: 40 },
    { name: 'Kintambo', active: 15, reports: 8, cleaned: 7 },
];

// Mock data pour les graphiques Business
const BUSINESS_TONNAGE_DATA = [
    { name: 'Lun', plastique: 45, organique: 120, metal: 30 },
    { name: 'Mar', plastique: 52, organique: 110, metal: 25 },
    { name: 'Mer', plastique: 48, organique: 140, metal: 40 },
    { name: 'Jeu', plastique: 70, organique: 130, metal: 35 },
    { name: 'Ven', plastique: 65, organique: 160, metal: 50 },
    { name: 'Sam', plastique: 40, organique: 90, metal: 20 },
    { name: 'Dim', plastique: 10, organique: 20, metal: 5 },
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
    
    // Global data states
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [allMarketplace, setAllMarketplace] = useState<MarketplaceItem[]>([]);
    
    // Filtered search results
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
            const [usersData, reportsData, marketplaceData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll(),
                MarketplaceAPI.getAll()
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);
            setAllMarketplace(marketplaceData);
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

            const filteredMarketplace = allMarketplace.filter(m => 
                m.title.toLowerCase().includes(lowerQuery) ||
                m.sellerName.toLowerCase().includes(lowerQuery) ||
                m.category.toLowerCase().includes(lowerQuery) ||
                m.description.toLowerCase().includes(lowerQuery)
            ).slice(0, 3);

            setSearchResults({
                users: filteredUsers,
                reports: filteredReports,
                marketplace: filteredMarketplace
            });
        } else {
            setIsSearching(false);
            setSearchResults({ users: [], reports: [], marketplace: [] });
        }
    };

    const hasAnyResults = searchResults.users.length > 0 || searchResults.reports.length > 0 || searchResults.marketplace.length > 0;

    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8 max-w-[1600px] mx-auto">
            {/* Real-time Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="w-full xl:w-auto">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Biso Peto Control Tower • Live</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Vue Stratégique</h1>
                    
                    {/* Expanded Global Search Bar */}
                    <div className="relative w-full max-w-xl mt-6 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#2962FF] transition-colors">
                            <Search size={20} />
                        </div>
                        <input 
                            type="text"
                            placeholder="Rechercher utilisateurs, signalements ou annonces..."
                            className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-[#2962FF] outline-none font-bold text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => handleSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        )}

                        {/* Results Dropdown */}
                        {isSearching && hasAnyResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] overflow-hidden animate-scale-up max-h-[450px] overflow-y-auto no-scrollbar">
                                <div className="p-2 space-y-4">
                                    {/* Section: Utilisateurs */}
                                    {searchResults.users.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Users size={12} /> Utilisateurs
                                            </p>
                                            {searchResults.users.map((result) => (
                                                <button 
                                                    key={result.id}
                                                    onClick={() => onChangeView(AppView.ADMIN_USERS)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-black">
                                                            {result.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black dark:text-white leading-none">{result.firstName} {result.lastName}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{result.type} • {result.commune || 'Kinshasa'}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Section: Signalements */}
                                    {searchResults.reports.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <AlertTriangle size={12} /> Signalements
                                            </p>
                                            {searchResults.reports.map((report) => (
                                                <button 
                                                    key={report.id}
                                                    onClick={() => onChangeView(AppView.ADMIN_REPORTS)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 overflow-hidden rounded-lg shadow-inner bg-gray-100 dark:bg-gray-700">
                                                            <img src={report.imageUrl} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black dark:text-white leading-none uppercase tracking-tight">{report.wasteType}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                                    {report.urgency}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase">{report.status} • {report.commune || 'KSH'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Section: Marketplace */}
                                    {searchResults.marketplace.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="px-3 py-1 text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <Package size={12} /> Marketplace
                                            </p>
                                            {searchResults.marketplace.map((item) => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => onChangeView(AppView.ADMIN_MARKETPLACE)}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 overflow-hidden rounded-lg shadow-inner bg-gray-100 dark:bg-gray-700">
                                                            <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black dark:text-white leading-none truncate max-w-[200px]">{item.title}</p>
                                                            <p className="text-[10px] text-[#00C853] font-black mt-1 uppercase">{item.price.toLocaleString()} FC • Par {item.sellerName}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t dark:border-gray-700">
                                        <p className="text-center text-[9px] font-black text-gray-400 uppercase py-2">Fin des résultats</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isSearching && !hasAnyResults && searchQuery.length > 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[100] p-8 text-center animate-scale-up">
                                <Search size={40} className="mx-auto text-gray-200 mb-3" />
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
                                    Aucune correspondance pour "{searchQuery}"
                                </p>
                            </div>
                        )}
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
                        Gérer les Interventions
                    </button>
                </div>
            </div>

            {/* Critical Alerts Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20 animate-bounce">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-red-800 dark:text-red-400 uppercase">Alertes Critiques</p>
                            <p className="text-sm font-bold text-red-600/80 dark:text-red-300">8 signalements urgents sans collecteur</p>
                        </div>
                    </div>
                    <button onClick={() => onChangeView(AppView.ADMIN_REPORTS)} className="p-2 hover:bg-red-100 dark:hover:bg-red-800 rounded-xl transition-colors"><ChevronRight size={20} className="text-red-500" /></button>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
                            <Truck size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-orange-800 dark:text-orange-400 uppercase">Monitoring Flotte</p>
                            <p className="text-sm font-bold text-orange-600/80 dark:text-orange-300">3 collecteurs inactifs depuis 1h</p>
                        </div>
                    </div>
                    <button onClick={() => onChangeView(AppView.ADMIN_VEHICLES)} className="p-2 hover:bg-orange-100 dark:hover:bg-orange-800 rounded-xl transition-colors"><ChevronRight size={20} className="text-orange-500" /></button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Signalements Jour', value: '42', trend: '+12%', sub: 'vs hier', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Abonnements MTD', value: '128', trend: '+18%', sub: 'Nouveaux', icon: CreditCard, color: 'text-[#00C853]', bg: 'bg-green-50' },
                    { label: 'Interventions', value: '312', trend: '94%', sub: 'Taux Succès', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Utilisateurs Totaux', value: '2.4k', trend: '+5%', sub: 'Croissance', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} dark:bg-white/5 ${stat.color} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                            <stat.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h2>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{stat.trend}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 mt-2">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {/* Visual Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution des Activités */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Activité Hebdomadaire</h3>
                            <p className="text-xs font-bold text-gray-400">Signalements vs Collectes finalisées</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="text-[10px] font-black uppercase px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">7 Jours</button>
                            <button className="text-[10px] font-black uppercase px-3 py-1 text-gray-400">30 Jours</button>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[{name: 'Lun', r: 12, c: 10}, {name: 'Mar', r: 18, c: 15}, {name: 'Mer', r: 25, c: 20}, {name: 'Jeu', r: 42, c: 38}, {name: 'Ven', r: 35, c: 30}, {name: 'Sam', r: 15, c: 25}, {name: 'Dim', r: 8, c: 10}]}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCleaned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C853" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 700, fontSize: 10}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="r" name="Signalements" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorReports)" />
                                <Area type="monotone" dataKey="c" name="Collectes" stroke="#00C853" strokeWidth={4} fillOpacity={1} fill="url(#colorCleaned)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performance par Zone */}
                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Efficacité par Commune</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
                        {ZONE_PERFORMANCE.map((zone, i) => {
                            const efficiency = Math.round((zone.cleaned / zone.reports) * 100);
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{zone.name}</span>
                                        <span className={`text-[10px] font-black ${efficiency > 80 ? 'text-green-500' : 'text-orange-500'}`}>{efficiency}% Résolu</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${efficiency > 80 ? 'bg-[#00C853]' : 'bg-[#2962FF]'}`} 
                                            style={{ width: `${efficiency}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex gap-4 text-[9px] font-bold text-gray-400 uppercase">
                                        <span>{zone.reports} Alertes</span>
                                        <span>{zone.active} Citoyens actifs</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => onChangeView(AppView.MAP)} className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#2962FF] hover:text-[#2962FF] transition-all">Voir Carte Analytique</button>
                </div>
            </div>

            {/* User Roles Quick Access */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { type: UserType.ADMIN, label: 'Admins', count: 4, icon: ShieldAlert, color: 'bg-gray-900' },
                    { type: UserType.COLLECTOR, label: 'Collecteurs', count: 28, icon: Truck, color: 'bg-orange-500' },
                    { type: UserType.BUSINESS, label: 'Entreprises', count: 156, icon: Briefcase, color: 'bg-blue-600' },
                    { type: UserType.CITIZEN, label: 'Citoyens', count: '2.2k', icon: Users, color: 'bg-[#00C853]' }
                ].map((role, idx) => (
                    <div key={idx} onClick={() => onChangeView(AppView.ADMIN_USERS)} className="bg-white dark:bg-[#111827] p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center gap-4 group">
                        <div className={`w-12 h-12 ${role.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform`}>
                            <role.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">{role.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{role.count}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Sub-components remaining the same as they were provided in the prompt context
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
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Rôle demandé</p>
                <p className="text-sm font-black text-blue-600 uppercase">{user.type}</p>
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
                <button 
                    onClick={() => onChangeView(AppView.COLLECTOR_JOBS)}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all"
                >
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center text-[#2962FF] transition-transform group-hover:scale-110 group-hover:rotate-6">
                        <ClipboardList size={36} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Missions du jour</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">Voir planning</p>
                    </div>
                </button>

                <button 
                    onClick={() => onChangeView(AppView.MAP)}
                    className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all"
                >
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
                <div className="flex gap-3">
                    <button className="bg-white dark:bg-gray-800 p-3 rounded-2xl border dark:border-gray-700 shadow-sm text-gray-500"><Download size={20} /></button>
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="bg-[#2962FF] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Commander Passage</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tonnage Total', value: `${user.totalTonnage || 0}T`, icon: Weight, color: 'text-blue-600' },
                    { label: 'Impact CO2', value: `${user.co2Saved || 0}T`, icon: Leaf, color: 'text-green-600' },
                    { label: 'Taux Recyclage', value: `${user.recyclingRate || 0}%`, icon: Recycle, color: 'text-purple-600' },
                    { label: 'Points Eco', value: user.points.toString(), icon: Star, color: 'text-orange-600' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 ${stat.color} flex items-center justify-center mb-4`}>
                            <stat.icon size={20} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h2>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Flux de Déchets (Mensuel)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={BUSINESS_TONNAGE_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 700, fontSize: 10}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="organique" name="Organique" fill="#00C853" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="plastique" name="Plastique" fill="#2962FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6">Missions en cours</h3>
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Truck size={18}/></div>
                                    <div>
                                        <p className="text-sm font-black dark:text-white">Collecte hebdomadaire</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">En route • Camion #BP-0{i}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">10:30</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="w-full mt-8 py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#2962FF] hover:text-[#2962FF] transition-all">Consulter l'historique</button>
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
                <button 
                    onClick={() => onChangeView(AppView.REPORTING)}
                    className="relative group overflow-hidden bg-[#2962FF] p-8 rounded-[3rem] shadow-2xl shadow-blue-500/20 flex flex-col gap-8 transition-transform hover:scale-[1.02] active:scale-95"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-500">
                        <Camera size={120} />
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white">
                        <Camera size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Biso Peto Alert</h3>
                        <p className="text-white/70 text-xs font-bold uppercase mt-2 tracking-widest">Signaler des déchets maintenant</p>
                    </div>
                </button>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => onChangeView(AppView.ACADEMY)}
                        className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4 group hover:shadow-lg transition-all"
                    >
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-[1.5rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110">
                            <GraduationCap size={32} />
                        </div>
                        <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Eco Academy</span>
                    </button>
                    <button 
                        onClick={() => onChangeView(AppView.MARKETPLACE)}
                        className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-4 group hover:shadow-lg transition-all"
                    >
                        <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-[1.5rem] flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                            <ShoppingBag size={32} />
                        </div>
                        <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Marketplace</span>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Prochaines Collectes</h3>
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="text-[10px] font-black uppercase text-[#2962FF] hover:underline">Voir Tout</button>
                </div>
                <div className="space-y-4">
                    {[
                        { title: 'Déchets Ménagers', time: 'Mardi • 10:30', icon: Trash2, color: 'text-green-600', bg: 'bg-green-50' },
                        { title: 'Recyclage Plastique', time: 'Jeudi • 14:00', icon: Recycle, color: 'text-blue-600', bg: 'bg-blue-50' }
                    ].map((job, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${job.bg} dark:bg-white/5 ${job.color} rounded-2xl flex items-center justify-center`}>
                                    <job.icon size={24} />
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{job.title}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{job.time}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
