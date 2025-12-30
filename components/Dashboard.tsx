import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, MapPin, Clock, ShieldCheck, 
    RefreshCw, Zap, History, Loader2, Sparkles, ArrowUpRight, 
    DollarSign, Database, Wifi, CreditCard, ShoppingBag, Bell, Lock, CheckCircle2,
    Camera, UserPlus, ChevronRight, UserCheck, Globe,
    // Fix: Added missing Search and Check icons
    Search, Check
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { User, AppView, UserType, WasteReport, UserPermission, Payment } from '../types';
import { UserAPI, ReportsAPI, PaymentsAPI } from '../services/api';
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
    const [isLoading, setIsLoading] = useState(true);

    const hasPermission = (p: UserPermission) => user.permissions?.includes(p) || user.type === UserType.ADMIN;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        initDashboard();

        const channel = supabase?.channel('dashboard_realtime_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => refreshData())
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
            const [usersData, reportsData, paymentsData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll(0, 200),
                PaymentsAPI.getAll()
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);
            setAllPayments(paymentsData);
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
        
        return {
            revenue: revenue,
            tonnage: tonnage,
            reports: activeAlerts,
            members: allUsers.length, 
            online: onlineUsers,      
            pendingUsers: pendingUsers,
            successRate: allReports.length > 0 ? Math.round((allReports.filter(r => r.status === 'resolved').length / allReports.length) * 100) : 0
        };
    }, [allUsers, allReports, allPayments]);

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
            <div className="flex flex-col items-center justify-center h-full bg-[#F5F7FA] dark:bg-gray-950">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Lecture des flux Cloud...</p>
            </div>
        );
    }

    return (
        <div className="p-5 md:p-10 space-y-8 animate-fade-in pb-32 max-w-[120rem] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{isCloudSynced ? 'Biso Peto Cloud Connecté' : 'Mode Hors-ligne'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Cloud</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
                {[
                    { label: 'Utilisateurs Totaux', val: stats.members, icon: Users, color: 'text-blue-600', perm: 'manage_users', view: AppView.ADMIN_USERS },
                    { label: 'Utilisateurs Connectés', val: stats.online, icon: Globe, color: 'text-green-500', perm: 'manage_users', view: AppView.ADMIN_USERS, pulse: true },
                    { label: 'Inscriptions en Attente', val: stats.pendingUsers, icon: UserPlus, color: 'text-orange-600', perm: 'manage_users', view: AppView.ADMIN_USERS },
                    { label: 'Signalements Actifs', val: stats.reports, icon: AlertTriangle, color: 'text-red-600', perm: 'manage_reports', view: AppView.ADMIN_REPORTS },
                    { label: 'Chiffre d\'Affaires (FC)', val: stats.revenue.toLocaleString(), icon: DollarSign, color: 'text-green-600', perm: 'view_finance', view: AppView.ADMIN_SUBSCRIPTIONS },
                    { label: 'Tonnage Global', val: `${stats.tonnage}kg`, icon: Trash2, color: 'text-purple-600', perm: 'manage_recovery', view: AppView.ADMIN_RECOVERY }
                ].map((kpi, i) => hasPermission(kpi.perm as UserPermission) && (
                    <div key={i} onClick={() => kpi.view && onChangeView(kpi.view)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
                        <div className={`w-10 h-10 bg-gray-50 dark:bg-gray-800 ${kpi.color} rounded-2xl flex items-center justify-center mb-3 shadow-inner relative`}>
                            <kpi.icon size={20}/>
                            {kpi.pulse && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping border-2 border-white dark:border-gray-900"></div>}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{kpi.val}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                        <button onClick={refreshData} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-inner hover:scale-110 active:scale-95 transition-all"><RefreshCw size={16}/></button>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)'}} />
                                <Area type="monotone" dataKey="val" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorCloud)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-xs font-black dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><History size={16} className="text-blue-500" /> Journal d'Activité</h3>
                    <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar">
                        {allReports.slice(0, 10).map(report => (
                            <div key={report.id} className="flex gap-4 items-start border-b dark:border-gray-800 pb-4 last:border-none group">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${report.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {report.status === 'resolved' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                        <span className="text-[8px] font-bold text-gray-400">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate mt-1">{report.commune}</p>
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
    const [isLoading, setIsLoading] = useState(true);
    const [isCloudSynced, setIsCloudSynced] = useState(false);

    useEffect(() => {
        const loadMyData = async () => {
            setIsLoading(true);
            const live = await testSupabaseConnection();
            setIsCloudSynced(live);
            try {
                if (user.id) {
                    const data = await ReportsAPI.getByUserId(user.id);
                    setMyReports(data);
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
    }, [user.id]);

    return (
        <div className="p-5 md:p-10 space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="flex flex-col gap-6">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{isCloudSynced ? 'Connecté' : 'Mode local'}</span>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight truncate">Mbote, <br className="sm:hidden"/> {user.firstName}!</h1>
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2 leading-none"><MapPin size={12} className="text-primary"/> Commune de {user.commune}</p>
                </div>
                
                <div className="w-full bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points Eco accumulés</p>
                        <div className="text-5xl font-black text-blue-600 flex items-center gap-3"><Zap size={28} className="text-yellow-500 fill-yellow-500" /> {user.points}</div>
                    </div>
                    <button onClick={() => onChangeView(AppView.PROFILE)} className="p-4 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-white rounded-3xl group-hover:bg-primary group-hover:text-white transition-all"><ChevronRight size={24}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-primary px-8 py-12 rounded-[3.5rem] shadow-2xl shadow-green-500/20 flex flex-col gap-6 transition-all hover:scale-[1.02] active:scale-95 text-left border-4 border-white/20">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700 text-white"><Camera className="w-48 h-48" /></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-white shadow-inner relative z-10"><Camera size={38} /></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">SIGNALER <br/> UN TAS</h3>
                        <p className="text-white/60 text-[10px] font-black uppercase mt-2 tracking-widest">+50 Points Eco par collecte</p>
                    </div>
                </button>
                
                <div className="bg-white dark:bg-[#111827] p-8 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col min-h-[420px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><History size={24} className="text-blue-500"/> Historique</h3>
                        {myReports.length > 0 && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{myReports.length} signalements</span>}
                    </div>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar scroll-container pr-1">
                        {isLoading ? (
                            <div className="py-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={32} /></div>
                        ) : myReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 font-black uppercase text-[11px] gap-4">
                                <Search size={48} />
                                <span>Aucun signalement</span>
                            </div>
                        ) : myReports.map(report => (
                            <div key={report.id} className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-800 transition-all group">
                                <div className="relative shrink-0">
                                    <img src={report.imageUrl} className="w-14 h-14 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform" />
                                    {report.status === 'resolved' && <div className="absolute -top-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white"><Check size={8} strokeWidth={5}/></div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black dark:text-white uppercase truncate tracking-tight">{report.wasteType}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1.5"><CalendarDays size={10} /> {new Date(report.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase text-white shadow-sm ${
                                    report.status === 'resolved' ? 'bg-green-500' : 
                                    report.status === 'assigned' ? 'bg-blue-500' : 'bg-yellow-500'
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
            <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-[#F8FAFC] dark:bg-[#050505]">
                <div className="w-28 h-28 bg-orange-100 dark:bg-orange-900/20 rounded-[3rem] flex items-center justify-center text-orange-600 mb-10 border border-orange-200 animate-float"><AlertTriangle size={56} /></div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 leading-tight">Dossier en attente</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-xs leading-relaxed mb-12">Mbote {props.user.firstName}! Votre compte est en cours d'analyse par l'administration Biso Peto pour garantir la sécurité du réseau.</p>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full max-w-xs overflow-hidden"><div className="h-full bg-orange-500 w-[60%] animate-pulse"></div></div>
            </div>
        );
    }
    return props.user.type === UserType.ADMIN ? <AdminDashboard {...props} /> : <CitizenDashboard {...props} />;
};

// Internal icon component helper
const CalendarDays = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
);