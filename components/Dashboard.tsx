
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, MapPin, Clock, ShieldCheck, 
    RefreshCw, Zap, History, Loader2, Sparkles, ArrowUpRight, 
    DollarSign, Database, Wifi, CreditCard, ShoppingBag, Bell, Lock, CheckCircle2,
    Camera, UserPlus, ChevronRight, UserCheck, Globe,
    Search, Check, Megaphone, ExternalLink, Play, Wallet, BookOpen, Heart,
    Layout as LayoutIcon, Gem
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { User, AppView, UserType, WasteReport, UserPermission, Payment, AdCampaign, CashBookEntry } from '../types';
import { UserAPI, ReportsAPI, PaymentsAPI, AdsAPI, CashBookAPI } from '../services/api';
import { supabase, testSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onRefresh?: () => Promise<void>;
}

function AdminDashboard({ user, onChangeView, onToast }: DashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [cashEntries, setCashEntries] = useState<CashBookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const hasPermission = (p: UserPermission) => user.permissions?.includes(p) || user.type === UserType.ADMIN;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        initDashboard();

        const channel = supabase?.channel('dashboard_realtime_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_book' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => refreshData())
            .subscribe();

        return () => {
            clearInterval(timer);
            if (channel) supabase?.removeChannel(channel);
        };
    }, []);

    const initDashboard = async () => {
        setIsLoading(true);
        const isLive = await testSupabaseConnection();
        setIsCloudSynced(isLive);
        await refreshData();
        setIsLoading(false);
    };

    const refreshData = async () => {
        try {
            const [usersData, reportsData, paymentsData, cashData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll(0, 200),
                PaymentsAPI.getAll(),
                CashBookAPI.getAll()
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);
            setAllPayments(paymentsData);
            setCashEntries(cashData);
        } catch (e) {
            console.error("Cloud Sync Error", e);
        }
    };

    const stats = useMemo(() => {
        const revenue = allPayments.reduce((acc, p) => acc + (p.amountFC || 0), 0);
        const tonnage = allUsers.reduce((acc, u) => acc + (u.totalTonnage || 0), 0);
        const activeAlerts = allReports.filter(r => r.status === 'pending' || r.status === 'assigned').length;
        const pendingUsers = allUsers.filter(u => u.status === 'pending').length;
        const onlineUsers = allUsers.filter(u => u.status === 'active').length;
        
        const inFlow = cashEntries.filter(e => e.type === 'in').reduce((sum, e) => sum + Number(e.amount), 0);
        const outFlow = cashEntries.filter(e => e.type === 'out').reduce((sum, e) => sum + Number(e.amount), 0);
        
        return {
            revenue: revenue,
            cashBalance: inFlow - outFlow,
            tonnage: tonnage,
            reports: activeAlerts,
            members: allUsers.length, 
            online: onlineUsers,      
            pendingUsers: pendingUsers,
            successRate: allReports.length > 0 ? Math.round((allReports.filter(r => r.status === 'resolved').length / allReports.length) * 100) : 0
        };
    }, [allUsers, allReports, allPayments, cashEntries]);

    const chartData = useMemo(() => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                name: days[d.getDay()],
                val: allReports.filter(r => new Date(r.date).toDateString() === d.toDateString()).length
            };
        });
    }, [allReports]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-transparent">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest animate-pulse">Initialisation SIG...</p>
            </div>
        );
    }

    return (
        <div className="px-5 py-6 md:px-10 md:py-8 space-y-8 animate-fade-in pb-10 max-w-[120rem] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[8px] font-bold uppercase tracking-widest">{isCloudSynced ? 'Biso Peto Cloud Connecté' : 'Mode Hors-ligne'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Cloud</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
                {[
                    { label: 'Utilisateurs Totaux', val: stats.members, icon: Users, color: 'text-blue-600', perm: 'manage_users', view: AppView.ADMIN_USERS },
                    { label: 'Solde Caisse (FC)', val: stats.cashBalance.toLocaleString(), icon: Wallet, color: 'text-blue-600', perm: 'view_finance', view: AppView.ADMIN_CASHBOOK, pulse: true },
                    { label: 'En Attente', val: stats.pendingUsers, icon: UserPlus, color: 'text-orange-600', perm: 'manage_users', view: AppView.ADMIN_USERS },
                    { label: 'Signalements Actifs', val: stats.reports, icon: AlertTriangle, color: 'text-red-600', perm: 'manage_reports', view: AppView.ADMIN_REPORTS },
                    { label: 'Recettes Mobile (FC)', val: stats.revenue.toLocaleString(), icon: CreditCard, color: 'text-green-600', perm: 'view_finance', view: AppView.ADMIN_SUBSCRIPTIONS },
                    { label: 'Tonnage Global', val: `${stats.tonnage}kg`, icon: Trash2, color: 'text-purple-600', perm: 'manage_recovery', view: AppView.ADMIN_RECOVERY }
                ].map((kpi, i) => hasPermission(kpi.perm as UserPermission) && (
                    <div key={i} onClick={() => kpi.view && onChangeView(kpi.view)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all hover:shadow-xl">
                        <div className={`w-11 h-11 bg-gray-50 dark:bg-gray-800 ${kpi.color} rounded-2xl flex items-center justify-center mb-4 shadow-inner relative`}>
                            <kpi.icon size={22}/>
                            {kpi.pulse && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping border-2 border-white dark:border-gray-900"></div>}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{kpi.label}</p>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none truncate">{kpi.val}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm space-y-6 overflow-hidden">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                        <button onClick={refreshData} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner hover:scale-110 active:scale-95 transition-all text-gray-400"><RefreshCw size={16}/></button>
                    </div>
                    <div className="h-[300px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '700', fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: '700', fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', fontWeight: 'bold'}} />
                                <Area type="monotone" dataKey="val" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorCloud)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm flex flex-col max-h-[440px]">
                    <h3 className="text-[10px] font-black dark:text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-blue-500"><History size={16} /> Flux Activité</h3>
                    <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pr-1">
                        {allReports.length === 0 ? (
                           <div className="py-20 text-center opacity-20"><History size={40} className="mx-auto" /></div>
                        ) : allReports.slice(0, 10).map(report => (
                            <div key={report.id} className="flex gap-4 items-start border-b dark:border-gray-800 pb-5 last:border-none group cursor-pointer">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${report.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {report.status === 'resolved' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[11px] font-black dark:text-white uppercase truncate tracking-tight">{report.wasteType}</p>
                                        <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap ml-2">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold truncate uppercase">{report.commune}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CitizenDashboard({ user, onChangeView }: DashboardProps) {
    const [myReports, setMyReports] = useState<WasteReport[]>([]);
    const [myAds, setMyAds] = useState<AdCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCloudSynced, setIsCloudSynced] = useState(false);

    useEffect(() => {
        const loadMyData = async () => {
            setIsLoading(true);
            const live = await testSupabaseConnection();
            setIsCloudSynced(live);
            try {
                if (user.id) {
                    const [reportsData, adsData] = await Promise.all([
                        ReportsAPI.getByUserId(user.id),
                        AdsAPI.getForUser(user.commune || 'all', user.type)
                    ]);
                    setMyReports(reportsData);
                    setMyAds(adsData);
                    
                    adsData.forEach(ad => AdsAPI.recordImpression(ad.id));
                }
            } catch(e) {
                console.error(e);
            } finally { 
                setIsLoading(false); 
            }
        };
        loadMyData();

        if (user.id && supabase) {
            const channel = supabase.channel(`citizen_reports_${user.id}`)
                .on('postgres_changes', { 
                    event: '*', 
                    schema: 'public', 
                    table: 'waste_reports',
                    filter: `reporter_id=eq.${user.id}`
                }, () => loadMyData())
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [user.id, user.commune, user.type]);

    const handleAdClick = (ad: AdCampaign) => {
        AdsAPI.recordClick(ad.id);
        if (ad.link) window.open(ad.link, '_blank');
    };

    const subConfig: Record<string, { label: string, color: string, desc: string }> = {
        standard: { label: 'Eco-Citoyen', color: 'from-blue-500 to-blue-700', desc: '1 collecte hebdomadaire' },
        plus: { label: 'Eco-Plus', color: 'from-green-500 to-green-700', desc: '2 collectes + Alerte SMS' },
        premium: { label: 'Eco-Premium', color: 'from-purple-500 to-purple-800', desc: 'Collectes Illimitées' },
        special: { label: 'Business Pro', color: 'from-gray-800 to-black', desc: 'Gestion Industrielle' }
    };

    const currentSub = subConfig[user.subscription] || subConfig.standard;

    return (
        <div className="px-5 py-8 md:px-10 md:py-10 space-y-10 animate-fade-in max-w-4xl mx-auto">
            <div className="flex flex-col gap-8">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{isCloudSynced ? 'Connecté' : 'Mode local'}</span>
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-[0.9] truncate">Mbote, <br className="sm:hidden"/> {user.firstName}!</h1>
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-6 flex items-center gap-2 leading-none"><MapPin size={12} className="text-primary"/> Commune de {user.commune}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white dark:bg-[#111827] p-8 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points Eco</p>
                            <div className="text-4xl font-black text-blue-600 flex items-center gap-3"><Zap size={26} className="text-yellow-500 fill-yellow-500" /> {user.points}</div>
                        </div>
                        <button onClick={() => onChangeView(AppView.PROFILE)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-white rounded-[1.8rem] group-hover:bg-primary group-hover:text-white transition-all shadow-inner"><ChevronRight size={28}/></button>
                    </div>

                    <div onClick={() => onChangeView(AppView.SUBSCRIPTION)} className={`relative overflow-hidden p-8 rounded-[3.5rem] text-white shadow-2xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all bg-gradient-to-br ${currentSub.color}`}>
                        <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12"><Gem size={90}/></div>
                        <div className="space-y-1 relative z-10">
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Plan {currentSub.label}</p>
                            <div className="text-2xl font-black uppercase tracking-tighter leading-none mt-1">{currentSub.desc}</div>
                            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[8px] font-black uppercase tracking-widest">Gérer l'abonnement</div>
                        </div>
                    </div>
                </div>
            </div>

            {myAds.length > 0 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between px-6">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Megaphone size={14}/> Bons Plans Localité</h4>
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Sponsorisé</span>
                    </div>
                    <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 px-1">
                        {myAds.map(ad => (
                            <div 
                                key={ad.id} 
                                onClick={() => handleAdClick(ad)}
                                className="snap-center shrink-0 w-[88%] sm:w-full max-w-md bg-white dark:bg-[#111827] rounded-[3rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-xl cursor-pointer relative group"
                            >
                                <div className="h-36 relative overflow-hidden">
                                    <img src={ad.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                                    <div className="absolute bottom-4 left-8 right-8">
                                        <p className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">{ad.partner}</p>
                                        <h5 className="text-white font-black uppercase text-base leading-tight truncate tracking-tight">{ad.title}</h5>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-primary px-8 py-16 rounded-[4rem] shadow-2xl shadow-green-500/20 flex flex-col gap-8 transition-all hover:scale-[1.02] active:scale-95 text-left border-8 border-white/10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700 text-white"><Camera className="w-56 h-56" /></div>
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center text-white shadow-inner relative z-10"><Camera size={44} /></div>
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-[0.9]">SIGNALER <br/> UN TAS</h3>
                        <p className="text-white/70 text-[11px] font-black uppercase mt-4 tracking-widest">+50 Eco-Points / alerte</p>
                    </div>
                </button>
                
                <div className="bg-white dark:bg-[#111827] p-10 rounded-[4rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col min-h-[480px]">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><History size={26} className="text-blue-500"/> Historique</h3>
                        {myReports.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{myReports.length} SIGNALÉS</span>}
                    </div>
                    
                    <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pr-1">
                        {isLoading ? (
                            <div className="py-24 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={40} /></div>
                        ) : myReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 opacity-10 font-black uppercase text-[12px] gap-6 tracking-[0.2em]">
                                <Search size={64} />
                                <span>Aucune Alerte</span>
                            </div>
                        ) : myReports.map(report => (
                            <div key={report.id} className="flex items-center gap-6 p-5 bg-gray-50 dark:bg-gray-800/40 rounded-[2.2rem] border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-800 transition-all group">
                                <div className="relative shrink-0">
                                    <img src={report.imageUrl} className="w-16 h-16 rounded-[1.5rem] object-cover shadow-lg group-hover:scale-105 transition-transform" />
                                    {report.status === 'resolved' && <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg"><Check size={10} strokeWidth={5}/></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-black dark:text-white uppercase truncate tracking-tight mb-1">{report.wasteType}</p>
                                    <p className="text-[10px] text-gray-400 font-black uppercase flex items-center gap-2"><CalendarDays size={12} /> {new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase text-white shadow-xl ${
                                    report.status === 'resolved' ? 'bg-green-500 shadow-green-500/20' : 
                                    report.status === 'assigned' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-orange-500 shadow-orange-500/20'
                                }`}>
                                    {report.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    if (props.user.type !== UserType.ADMIN && props.user.status === 'pending') {
        return (
            <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#050505]">
                {/* Header d'attente */}
                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center scroll-container no-scrollbar">
                    <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3.5rem] flex items-center justify-center text-orange-600 mb-12 border border-orange-200 animate-float shadow-2xl"><Clock size={64} className="animate-pulse" /></div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6 leading-[0.9]">Dossier <br/> en Analyse</h2>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-bold max-w-xs leading-relaxed mb-12">Mbote {props.user.firstName}! L'administration Biso Peto vérifie vos informations pour sécuriser le réseau.</p>
                    
                    <div className="w-full max-w-xs h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-16 shadow-inner">
                        <div className="h-full bg-orange-500 w-[70%] animate-pulse rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
                    </div>

                    {/* Conseils en attendant */}
                    <div className="w-full max-w-md space-y-5">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Le saviez-vous ?</p>
                        {[
                            { icon: BookOpen, title: "Tri sélectif", desc: "Séparez vos bouteilles plastiques pour gagner plus de points." },
                            { icon: Heart, title: "Impact Local", desc: "Un quartier propre réduit les risques de malaria." },
                            { icon: Zap, title: "Eco-Points", desc: "Bientôt, vous pourrez payer votre crédit SNEL via l'app." }
                        ].map((tip, i) => (
                            <div key={i} className="flex gap-5 p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-left items-start shadow-sm hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-inner"><tip.icon size={22}/></div>
                                <div>
                                    <h4 className="text-xs font-black dark:text-white uppercase tracking-tight">{tip.title}</h4>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed mt-2 uppercase">{tip.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return props.user.type === UserType.ADMIN ? <AdminDashboard {...props} /> : <CitizenDashboard {...props} />;
};

const CalendarDays = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
);
