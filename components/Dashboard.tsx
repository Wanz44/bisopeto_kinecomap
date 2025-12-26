
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, MapPin, Clock, ShieldCheck, 
    RefreshCw, Zap, History, Loader2, Sparkles, ArrowUpRight, 
    DollarSign, Database, Wifi, CreditCard, ShoppingBag, Bell, Lock, CheckCircle2,
    Camera, UserPlus, ChevronRight
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

        const channel = supabase?.channel('dashboard_counters')
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
        
        return {
            revenue: revenue,
            tonnage: tonnage,
            reports: activeAlerts,
            members: allUsers.length,
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
            {/* STATUS BAR */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{isCloudSynced ? 'Biso Peto Cloud Connecté' : 'Mode Hors-ligne'}</span>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full flex items-center gap-2">
                            <Wifi className="w-3 h-3 text-blue-500" />
                            <span className="text-[8px] font-black uppercase text-gray-400">Sync: Temps Réel</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Cloud</h1>
                </div>
                <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-black font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                </div>
            </div>

            {/* LIVE KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Inscriptions à Valider', raw: stats.pendingUsers, val: stats.pendingUsers, icon: UserPlus, color: 'text-red-600', perm: 'manage_users', view: AppView.ADMIN_USERS },
                    { label: 'Signalements Actifs', raw: stats.reports, val: stats.reports, icon: AlertTriangle, color: 'text-orange-600', perm: 'manage_reports', view: AppView.ADMIN_REPORTS },
                    { label: 'Recette Totale (FC)', raw: stats.revenue, val: stats.revenue.toLocaleString(), icon: DollarSign, color: 'text-green-600', perm: 'view_finance', view: AppView.ADMIN_SUBSCRIPTIONS },
                    { label: 'Tonnage Récupéré', raw: stats.tonnage, val: `${stats.tonnage}kg`, icon: Trash2, color: 'text-purple-600', perm: 'manage_recovery', view: AppView.ADMIN_RECOVERY }
                ].map((kpi, i) => hasPermission(kpi.perm as UserPermission) && (
                    <div key={i} onClick={() => kpi.view && onChangeView(kpi.view)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><kpi.icon size={80}/></div>
                        <div className={`w-12 h-12 bg-gray-50 dark:bg-gray-800 ${kpi.color} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}><kpi.icon size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none mt-1">{kpi.val}</h3>
                        {kpi.raw > 0 && kpi.icon === UserPlus && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                        )}
                    </div>
                ))}
            </div>

            {/* ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Activity size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Données Cloud des 7 derniers jours</p>
                            </div>
                        </div>
                        <button onClick={refreshData} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:rotate-180 transition-all duration-700 shadow-inner"><RefreshCw size={18}/></button>
                    </div>
                    <div className="h-[300px] w-full">
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
                                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                                <Area type="monotone" dataKey="val" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorCloud)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <History size={20} className="text-blue-500" />
                        <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Logs Cloud</h3>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-1">
                        {allReports.slice(0, 8).map(report => (
                            <div key={report.id} className="flex gap-4 items-start group border-b dark:border-gray-800 pb-4 last:border-none">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${report.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {report.status === 'resolved' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-[10px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                        <span className="text-[8px] font-bold text-gray-400">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-1">{report.commune}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Signalements', view: AppView.ADMIN_REPORTS, icon: AlertTriangle, perm: 'manage_reports' },
                    { label: 'Membres', view: AppView.ADMIN_USERS, icon: Users, perm: 'manage_users' },
                    { label: 'Paiements', view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, perm: 'view_finance' },
                    { label: 'Marketplace', view: AppView.ADMIN_MARKETPLACE, icon: ShoppingBag, perm: 'manage_marketplace' },
                    { label: 'Sécurité', view: AppView.ADMIN_PERMISSIONS, icon: Lock, perm: 'system_settings' },
                    { label: 'Alertes Push', view: AppView.NOTIFICATIONS, icon: Bell, perm: 'manage_communications' }
                ].map((act, i) => hasPermission(act.perm as UserPermission) && (
                    <button key={i} onClick={() => onChangeView(act.view)} className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-800 flex flex-col items-center gap-3 group hover:border-blue-500 transition-all shadow-sm active:scale-95">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><act.icon size={20}/></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white text-center">{act.label}</span>
                    </button>
                ))}
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

        // Écoute en temps réel de ses propres changements
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
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[7px] font-black uppercase tracking-widest">{isCloudSynced ? 'Connecté au Cloud SIG' : 'Mode local'}</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none truncate">Mbote, {user.firstName}!</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-primary-light border border-green-100 dark:border-green-800 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Sparkles size={10}/> Citoyen de {user.commune}
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco-Points</p>
                    <div className="text-5xl font-black text-blue-600 flex items-center justify-center gap-3"><Zap size={32} className="text-yellow-500 fill-yellow-500" /> {user.points}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-primary p-12 rounded-[3.5rem] shadow-2xl flex flex-col gap-10 transition-all hover:scale-[1.02] text-left border-4 border-white dark:border-gray-800">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-all duration-700 text-white"><Camera className="w-40 h-40" /></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-[2rem] flex items-center justify-center text-white shadow-xl"><Camera size={40} /></div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Signaler <br/> un tas</h3>
                </button>
                
                <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border dark:border-gray-800 shadow-sm flex flex-col overflow-hidden">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-8"><History size={24} className="text-blue-500"/> Mes Signalements Live</h3>
                    
                    <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="py-10 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>
                        ) : myReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 opacity-20 font-black uppercase text-xs">Aucun signalement trouvé</div>
                        ) : myReports.map(report => (
                            <div key={report.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-transparent hover:border-blue-100 transition-all">
                                <img src={report.imageUrl} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">{new Date(report.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase text-white ${
                                    report.status === 'resolved' ? 'bg-green-500' : 
                                    report.status === 'assigned' ? 'bg-blue-500' : 'bg-yellow-500'
                                }`}>
                                    {report.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    {myReports.length > 0 && (
                        <button className="w-full mt-6 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">Voir tout l'historique <ChevronRight size={14}/></button>
                    )}
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    if (props.user.type !== UserType.ADMIN && props.user.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#F5F7FA] dark:bg-gray-950">
                <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3.5rem] flex items-center justify-center text-orange-600 mb-8 border border-orange-200"><AlertTriangle size={64} /></div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Dossier en Analyse</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-sm leading-relaxed mb-8">Mbote {props.user.firstName}! Votre compte est en cours de validation par nos agents.</p>
            </div>
        );
    }
    return props.user.type === UserType.ADMIN ? <AdminDashboard {...props} /> : <CitizenDashboard {...props} />;
};
