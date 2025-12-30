
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, MapPin, Clock, ShieldCheck, 
    RefreshCw, Zap, History, Loader2, Sparkles, ArrowUpRight, 
    DollarSign, Database, Wifi, CreditCard, ShoppingBag, Bell, Lock, CheckCircle2,
    Camera, UserPlus, ChevronRight, UserCheck, Globe
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
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32 max-w-[120rem] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{isCloudSynced ? 'Biso Peto Cloud Connecté' : 'Mode Hors-ligne'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Cloud</h1>
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
                    <div key={i} onClick={() => kpi.view && onChangeView(kpi.view)} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
                        <div className={`w-10 h-10 bg-gray-50 dark:bg-gray-800 ${kpi.color} rounded-xl flex items-center justify-center mb-3 shadow-inner relative`}>
                            <kpi.icon size={20}/>
                            {kpi.pulse && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping border-2 border-white dark:border-gray-900"></div>}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{kpi.val}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                        <button onClick={refreshData} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-inner"><RefreshCw size={16}/></button>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                                <Area type="monotone" dataKey="val" stroke="#2962FF" strokeWidth={3} fillOpacity={1} fill="url(#colorCloud)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-xs font-black dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><History size={16} className="text-blue-500" /> Journal d'Activité</h3>
                    <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar">
                        {allReports.slice(0, 8).map(report => (
                            <div key={report.id} className="flex gap-4 items-start border-b dark:border-gray-800 pb-4 last:border-none">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${report.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {report.status === 'resolved' ? <CheckCircle2 size={16}/> : <Activity size={16}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[9px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                        <span className="text-[8px] font-bold text-gray-400">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate mt-1">{report.commune}</p>
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
            } finally { setIsLoading(false); }
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
        <div className="p-5 md:p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col gap-6">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[7px] font-black uppercase tracking-widest">{isCloudSynced ? 'Connecté' : 'Mode local'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none truncate">Mbote, {user.firstName}!</h1>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-2"><MapPin size={10} className="text-primary"/> Commune de {user.commune}</p>
                </div>
                
                <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Mon Solde</p>
                        <div className="text-4xl font-black text-blue-600 flex items-center gap-2"><Zap size={24} className="text-yellow-500 fill-yellow-500" /> {user.points}</div>
                    </div>
                    <button onClick={() => onChangeView(AppView.PROFILE)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ChevronRight size={20}/></button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-primary px-8 py-10 rounded-[3rem] shadow-2xl flex flex-col gap-6 transition-all hover:scale-[1.02] text-left border-4 border-white dark:border-gray-800">
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:rotate-12 transition-all duration-700 text-white"><Camera className="w-32 h-32" /></div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white shadow-xl"><Camera size={32} /></div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Signaler <br/> un tas de déchets</h3>
                </button>
                
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm flex flex-col min-h-[350px]">
                    <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-6"><History size={20} className="text-blue-500"/> Historique</h3>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="py-10 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>
                        ) : myReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-20 font-black uppercase text-[10px]">Aucun signalement</div>
                        ) : myReports.map(report => (
                            <div key={report.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                                <img src={report.imageUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                    <p className="text-[7px] text-gray-400 font-bold uppercase">{new Date(report.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[6px] font-black uppercase text-white ${
                                    report.status === 'resolved' ? 'bg-green-500' : 
                                    report.status === 'assigned' ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}>
                                    {report.status}
                                </span>
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
            <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-[#F5F7FA] dark:bg-gray-950">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-[2.5rem] flex items-center justify-center text-orange-600 mb-8 border border-orange-200"><AlertTriangle size={48} /></div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4 leading-tight">Dossier en attente de validation</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs leading-relaxed mb-10">Mbote {props.user.firstName}! Votre compte est en cours d'analyse par l'administration Biso Peto.</p>
            </div>
        );
    }
    return props.user.type === UserType.ADMIN ? <AdminDashboard {...props} /> : <CitizenDashboard {...props} />;
};
