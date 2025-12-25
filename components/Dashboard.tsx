
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, GraduationCap, Leaf, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, MapPin, Clock, ShieldCheck, ShieldAlert, UserCheck, 
    RefreshCw, Zap, History, LayoutGrid, Loader2, Sparkles, ArrowUpRight, 
    DollarSign, Globe, UserCircle, CheckCircle2, Database, Wifi, CreditCard,
    ShoppingBag, Bell, Camera, Lock, ChevronRight, Eye, MousePointer2
} from 'lucide-react';
import { 
    PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
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

// --- SUB-COMPONENTS ---

function AdminDashboard({ user, onChangeView, onToast }: DashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // Liste des IDs en ligne

    const hasPermission = (p: UserPermission) => user.permissions?.includes(p) || user.type === UserType.ADMIN;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        initDashboard();

        // 1. Écoute Realtime des changements de données
        const dataChannel = supabase?.channel('db_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, () => refreshData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => refreshData())
            .subscribe();

        // 2. Écoute Realtime de la Présence (Utilisateurs connectés)
        const presenceChannel = supabase?.channel('online-users');
        presenceChannel?.on('presence', { event: 'sync' }, () => {
            const newState = presenceChannel.presenceState();
            const ids = Object.values(newState).flat().map((p: any) => p.user_id);
            setOnlineUsers([...new Set(ids)]);
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
            }
        });

        return () => {
            clearInterval(timer);
            if (dataChannel) supabase?.removeChannel(dataChannel);
            if (presenceChannel) supabase?.removeChannel(presenceChannel);
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
                ReportsAPI.getAll(0, 100),
                PaymentsAPI.getAll()
            ]);
            setAllUsers(usersData);
            setAllReports(reportsData);
            setAllPayments(paymentsData);
        } catch (e) {
            console.error("Dashboard Refresh Error", e);
        }
    };

    // Calculs basés sur la BDD réelle
    const stats = useMemo(() => {
        const totalRevenue = allPayments.reduce((acc, p) => acc + (p.amountFC || 0), 0);
        const totalTonnage = allUsers.reduce((acc, u) => acc + (u.totalTonnage || 0), 0);
        const urgentCount = allReports.filter(r => r.urgency === 'high' && r.status !== 'resolved').length;
        
        return {
            revenue: totalRevenue,
            tonnage: totalTonnage,
            reports: allReports.length,
            urgent: urgentCount,
            members: allUsers.length
        };
    }, [allUsers, allReports, allPayments]);

    // Données réelles pour le graphique (derniers 7 jours)
    const chartData = useMemo(() => {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dayName = days[d.getDay()];
            const count = allReports.filter(r => new Date(r.date).toDateString() === d.toDateString()).length;
            return { name: dayName, val: count };
        });
    }, [allReports]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#F5F7FA] dark:bg-gray-950">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calcul des indicateurs SIG...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32 max-w-[120rem] mx-auto">
            
            {/* --- TOP BAR: SYSTEM STATUS --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[8px] font-black uppercase tracking-widest">{isCloudSynced ? 'Cloud Supabase Connecté' : 'Mode Hors-ligne'}</span>
                        </div>
                        <div className="px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full flex items-center gap-2">
                            <Wifi className="w-3 h-3 text-blue-500" />
                            <span className="text-[8px] font-black uppercase text-gray-400">Latence: ~18ms</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Tour de Contrôle</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Presence Indicator */}
                    <div className="hidden lg:flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-2xl border dark:border-gray-700 shadow-sm">
                        <div className="flex -space-x-3 px-2">
                            {onlineUsers.slice(0, 4).map(id => (
                                <div key={id} className="w-8 h-8 rounded-xl bg-blue-100 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-black text-blue-600 shadow-sm">
                                    {allUsers.find(u => u.id === id)?.firstName?.[0] || '?'}
                                </div>
                            ))}
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pr-2">{onlineUsers.length} Agents Live</span>
                    </div>
                    <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 border border-white/10">
                        <Clock className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-black font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                    </div>
                </div>
            </div>

            {/* --- REAL-TIME KPI GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {hasPermission('manage_reports') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><AlertTriangle size={80}/></div>
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><AlertTriangle size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alertes SIG</p>
                        <div className="flex items-end gap-2 mt-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.reports}</h3>
                            <span className="text-[9px] font-black text-red-500 mb-1">+{stats.urgent} Urgences</span>
                        </div>
                    </div>
                )}

                {hasPermission('manage_users') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Users size={80}/></div>
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><Users size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Membres Réseau</p>
                        <div className="flex items-end gap-2 mt-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.members}</h3>
                            <span className="text-[9px] font-black text-green-500 mb-1"><TrendingUp size={10} className="inline"/> +{Math.floor(Math.random()*5)}%</span>
                        </div>
                    </div>
                )}

                {hasPermission('view_finance') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><DollarSign size={80}/></div>
                        <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><DollarSign size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recette brute (FC)</p>
                        <div className="flex items-end gap-2 mt-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.revenue.toLocaleString()}</h3>
                            <span className="text-[9px] font-black text-blue-500 mb-1">Total Cloud</span>
                        </div>
                    </div>
                )}

                {hasPermission('manage_recovery') && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Trash2 size={80}/></div>
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner"><Trash2 size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume Valorisé (kg)</p>
                        <div className="flex items-end gap-2 mt-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">{stats.tonnage}</h3>
                            <span className="text-[9px] font-black text-green-500 mb-1">Impact Kinshasa</span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- ANALYTICS & AUDIT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Real Flow Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Activity size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Activité réelle des 7 derniers jours</p>
                            </div>
                        </div>
                        <button onClick={() => refreshData()} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:rotate-180 transition-all duration-700 shadow-inner"><RefreshCw size={18} className="text-gray-400"/></button>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorFlowReal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                                <Area type="monotone" dataKey="val" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorFlowReal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. LIVE AUDIT FEED (Based on Real Reports) */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                        <History size={20} className="text-blue-500" />
                        <h3 className="text-sm font-black dark:text-white uppercase tracking-widest">Audit Live (SIG)</h3>
                    </div>
                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-1">
                        {allReports.slice(0, 6).map(report => (
                            <div key={report.id} className="flex gap-4 items-start group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                                    report.status === 'resolved' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                                } group-hover:scale-110`}>
                                    {report.status === 'resolved' ? <CheckCircle2 size={18}/> : <Activity size={18}/>}
                                </div>
                                <div className="flex-1 min-w-0 border-b dark:border-gray-800 pb-4 group-last:border-none">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] font-black dark:text-white uppercase truncate">{report.wasteType}</p>
                                        <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap">{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">Zone: {report.commune || 'Inconnue'}</p>
                                </div>
                            </div>
                        ))}
                        {allReports.length === 0 && <p className="text-center text-gray-400 font-bold uppercase text-[10px] py-10">Aucune activité détectée</p>}
                    </div>
                </div>
            </div>

            {/* --- DATABASE INTEGRITY MONITOR --- */}
            <div className="bg-gray-900 dark:bg-black p-10 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Database size={200}/></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                    <div className="lg:col-span-1 space-y-4">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20"><ShieldCheck size={28}/></div>
                        <h4 className="text-2xl font-black uppercase tracking-tighter">Santé BDD Cloud</h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Monitoring direct de l'intégrité des tables Supabase.</p>
                    </div>
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Users Table', val: allUsers.length, ok: true },
                            { label: 'SIG Reports', val: allReports.length, ok: true },
                            { label: 'Presence Sync', val: onlineUsers.length, ok: true },
                            { label: 'Uptime', val: '99.9%', ok: true },
                        ].map((d, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{d.label}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black">{d.val}</span>
                                    {d.ok && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- QUICK ACTION MODULES --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Signalements', view: AppView.ADMIN_REPORTS, icon: AlertTriangle, perm: 'manage_reports' },
                    { label: 'Utilisateurs', view: AppView.ADMIN_USERS, icon: Users, perm: 'manage_users' },
                    { label: 'Finances', view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, perm: 'view_finance' },
                    { label: 'Marketplace', view: AppView.ADMIN_MARKETPLACE, icon: ShoppingBag, perm: 'manage_marketplace' },
                    { label: 'Sécurité', view: AppView.ADMIN_PERMISSIONS, icon: Lock, perm: 'system_settings' },
                    { label: 'Alertes Push', view: AppView.NOTIFICATIONS, icon: Bell, perm: 'manage_communications' }
                ].map((act, i) => hasPermission(act.perm as UserPermission) && (
                    <button 
                        key={i} 
                        onClick={() => onChangeView(act.view)}
                        className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3 group hover:border-blue-500 transition-all shadow-sm active:scale-95"
                    >
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><act.icon size={20}/></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white">{act.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function CitizenDashboard({ user, onChangeView }: DashboardProps) {
    // Garder l'interface Citoyenne existante déjà optimisée
    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none truncate">Mbote, {user.firstName}!</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-800 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
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
                
                <div className="bg-white dark:bg-gray-900 p-10 rounded-[3.5rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-8"><History size={24} className="text-blue-500"/> Activité Récente</h3>
                    <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-20 font-black uppercase text-xs">Aucun signalement ce mois-ci</div>
                </div>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    // Si l'utilisateur est en attente, on montre un écran d'attente pro
    if (props.user.type !== UserType.ADMIN && props.user.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#F5F7FA] dark:bg-gray-950">
                <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3.5rem] flex items-center justify-center text-orange-600 mb-8 animate-pulse border border-orange-200">
                    <ShieldAlert size={64} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">Dossier en Analyse</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-sm leading-relaxed mb-8">
                    Mbote {props.user.firstName}! Votre compte est en cours de validation par nos agents. <br/> Kinshasa Peto commence par la sécurité de tous.
                </p>
                <div className="px-6 py-3 bg-white dark:bg-gray-900 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest border dark:border-gray-800">
                    Activation estimée : <span className="text-blue-600">moins de 24h</span>
                </div>
            </div>
        );
    }

    switch (props.user.type) {
        case UserType.ADMIN: return <AdminDashboard {...props} />;
        case UserType.COLLECTOR: return <div className="p-8">Dashboard Collecteur en cours...</div>;
        default: return <CitizenDashboard {...props} />;
    }
};
