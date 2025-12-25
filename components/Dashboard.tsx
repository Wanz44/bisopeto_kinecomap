
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, GraduationCap, Leaf, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, Megaphone, MapPin, Clock, Search, ShieldCheck, Phone, Mail, 
    ShieldAlert, UserCheck, ShoppingBag, Battery, ChevronRight, Briefcase, Lock, 
    RefreshCw, Camera, PieChart as PieIcon, BarChart3, Calendar, Filter, Database,
    CheckCircle2, RefreshCcw, Star, Zap, History, LayoutGrid, Loader2, Info,
    Sparkles, ArrowRight, X, Image as ImageIcon, DollarSign, Globe, UserCircle,
    Eye, MousePointer2, ArrowUpRight, TrendingDown,
    // Fix: Added missing CreditCard import
    CreditCard
} from 'lucide-react';
import { 
    PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import { User, AppView, UserType, WasteReport, NotificationItem, UserPermission } from '../types';
import { UserAPI, ReportsAPI, AuditAPI, SettingsAPI } from '../services/api';
import { testSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onRefresh?: () => Promise<void>;
    notifications?: NotificationItem[];
}

// --- SUB-COMPONENTS ---

function AdminDashboard({ user, onChangeView, onToast }: DashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [recentAudit, setRecentAudit] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
    
    const hasPermission = (p: UserPermission) => user.permissions?.includes(p) || user.type === UserType.ADMIN;

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

            if (isLive) {
                const [usersData, reportsData] = await Promise.all([
                    UserAPI.getAll(),
                    ReportsAPI.getAll()
                ]);
                setAllUsers(usersData);
                setAllReports(reportsData);
                
                // Simulation logs audit pro
                setRecentAudit([
                    { id: 1, action: 'COLLECTE', user: 'Agent Jean', detail: 'Zone Limete nettoyée', time: 'Il y a 5 min' },
                    { id: 2, action: 'ALERTE', user: 'IA Biso Peto', detail: 'Tas critique détecté à Bandal', time: 'Il y a 12 min' },
                    { id: 3, action: 'PAIEMENT', user: 'Système', detail: 'Encaissement 28.000 FC - Gombe', time: 'Il y a 24 min' }
                ]);
            }
        } catch (e) {
            console.error("Dashboard Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    // Stats calculées dynamiquement
    const onlineUsers = useMemo(() => allUsers.filter(() => Math.random() > 0.7).slice(0, 5), [allUsers]);
    
    const chartData = useMemo(() => {
        const now = new Date();
        const data = [];
        const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            if (timeRange === 'day') d.setHours(now.getHours() - i);
            else d.setDate(now.getDate() - i);
            const label = timeRange === 'day' ? `${d.getHours()}h` : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            const count = allReports.filter(r => {
                const rDate = new Date(r.date);
                if (timeRange === 'day') return rDate.getHours() === d.getHours() && rDate.toDateString() === d.toDateString();
                return rDate.toDateString() === d.toDateString();
            }).length;
            data.push({ name: label, total: count });
        }
        return data;
    }, [allReports, timeRange]);

    const statusStats = [
        { name: 'Résolus', value: allReports.filter(r => r.status === 'resolved').length, color: '#00C853' },
        { name: 'En cours', value: allReports.filter(r => r.status === 'assigned' || r.status === 'pending').length, color: '#2962FF' },
        { name: 'Rejetés', value: allReports.filter(r => r.status === 'rejected').length, color: '#FF5252' }
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 animate-pulse">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calcul des indicateurs SIG...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32 max-w-[105rem] mx-auto">
            {/* --- TOP BAR: STATUS & CLOUD --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border shadow-sm ${isCloudSynced ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                            <div className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">{isCloudSynced ? 'Cloud Supabase Connecté' : 'Erreur de Synchronisation'}</span>
                        </div>
                        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-full flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-black uppercase text-gray-500">Node: Kinshasa/Gombe</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Tour de Contrôle</h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Live Users Bubble */}
                    <div className="hidden md:flex -space-x-3">
                        {onlineUsers.map((u, i) => (
                            <div key={i} className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border-2 border-[#F5F7FA] dark:border-gray-950 flex items-center justify-center text-xs font-black shadow-lg" title={u.firstName}>
                                {u.firstName[0]}
                            </div>
                        ))}
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white border-2 border-[#F5F7FA] dark:border-gray-950 flex items-center justify-center text-[10px] font-black shadow-lg">
                            +{Math.floor(Math.random() * 20)}
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-2xl shadow-xl border dark:border-gray-700 flex items-center gap-4 group">
                        <Clock className="w-5 h-5 text-blue-600 group-hover:rotate-12 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Local Time</span>
                            <span className="text-sm font-black dark:text-white font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- KEY PERFORMANCE INDICATORS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Alertes SIG', val: allReports.length, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', perm: 'manage_reports' },
                    { label: 'Membres Réseau', val: allUsers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', perm: 'manage_users' },
                    { label: 'Recette brute', val: '1.2M FC', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50', perm: 'view_finance' },
                    { label: 'Tonnage Mensuel', val: '45.2T', icon: Trash2, color: 'text-purple-600', bg: 'bg-purple-50', perm: 'manage_recovery' }
                ].map((kpi, i) => hasPermission(kpi.perm as UserPermission) && (
                    <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><kpi.icon size={80}/></div>
                        <div className={`w-12 h-12 ${kpi.bg} dark:bg-gray-800 ${kpi.color} rounded-2xl flex items-center justify-center mb-4 shadow-inner`}><kpi.icon size={24}/></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                        <div className="flex items-end gap-2 mt-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">{kpi.val}</h3>
                            <span className="text-[9px] font-black text-green-500 flex items-center mb-1"><TrendingUp size={10}/> +12%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MAIN ANALYTICS GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Traffic Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center"><Activity size={24}/></div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Flux des Signalements</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Activité SIG temps réel</p>
                            </div>
                        </div>
                        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                            {['day', 'week', 'month'].map(r => (
                                <button key={r} onClick={() => setTimeRange(r as any)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${timeRange === r ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorReportsAdm" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="total" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorReportsAdm)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Operations Pie Chart & Audit Log */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm flex flex-col">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Zap className="text-yellow-500" size={20}/> Taux de Succès</h3>
                        <div className="h-[200px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie data={statusStats} innerRadius="65%" outerRadius="90%" paddingAngle={10} dataKey="value" stroke="none">
                                        {statusStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black dark:text-white">{allReports.length}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total SIG</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-3">
                             {statusStats.map((s, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                     <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: s.color}}></div>
                                     <span className="text-[10px] font-black text-gray-400 uppercase">{s.name}</span>
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-blue-500"/> Audit Live</h3>
                            <button onClick={loadAllData} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><RefreshCw size={14}/></button>
                        </div>
                        <div className="space-y-5">
                            {recentAudit.map(log => (
                                <div key={log.id} className="flex gap-4 items-start group">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                        log.action === 'ALERTE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                        {log.action === 'ALERTE' ? <AlertTriangle size={14}/> : <UserCheck size={14}/>}
                                    </div>
                                    <div className="flex-1 min-w-0 border-b dark:border-gray-800 pb-4 group-last:border-none">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] font-black dark:text-white uppercase truncate">{log.user}</p>
                                            <span className="text-[8px] font-bold text-gray-400 whitespace-nowrap">{log.time}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{log.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM QUICK NAVIGATION --- */}
            <div className="bg-gray-900 dark:bg-black p-10 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><ShieldAlert size={200}/></div>
                 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-2xl font-black uppercase tracking-tighter">Accès<br/>Rapides</h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">Gérez l'ensemble des opérations Biso Peto via les modules dédiés.</p>
                    </div>
                    {[
                        { label: 'Utilisateurs', view: AppView.ADMIN_USERS, icon: Users, perm: 'manage_users' },
                        { label: 'Flotte GPS', view: AppView.ADMIN_VEHICLES, icon: Truck, perm: 'manage_fleet' },
                        { label: 'Alertes SIG', view: AppView.ADMIN_REPORTS, icon: MapPin, perm: 'manage_reports' },
                        { label: 'Finances', view: AppView.ADMIN_SUBSCRIPTIONS, icon: CreditCard, perm: 'view_finance' }
                    ].map((nav, i) => hasPermission(nav.perm as UserPermission) && (
                        <button key={i} onClick={() => onChangeView(nav.view)} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] hover:bg-primary transition-all flex flex-col items-center justify-center gap-4 group">
                            <div className="p-4 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><nav.icon size={24}/></div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{nav.label}</span>
                            <ArrowUpRight size={16} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all"/>
                        </button>
                    ))}
                 </div>
            </div>
        </div>
    );
}
