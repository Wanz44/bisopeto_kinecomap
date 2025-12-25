
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, GraduationCap, Leaf, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, Megaphone, MapPin, Clock, Search, ShieldCheck, Phone, Mail, 
    ShieldAlert, UserCheck, ShoppingBag, Battery, ChevronRight, Briefcase, Lock, 
    RefreshCw, Camera, PieChart as PieIcon, BarChart3, Calendar, Filter, Database,
    CheckCircle2, RefreshCcw
} from 'lucide-react';
import { 
    PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend
} from 'recharts';
import { User, AppView, UserType, WasteReport, NotificationItem } from '../types';
import { UserAPI, ReportsAPI } from '../services/api';
import { testSupabaseConnection } from '../services/supabaseClient';

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onRefresh?: () => Promise<void>;
    notifications?: NotificationItem[];
}

// --- SUB-COMPONENTS ---

function AdminDashboard({ onChangeView, onToast }: DashboardProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCloudSynced, setIsCloudSynced] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
    
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
            } else {
                if (onToast) onToast("Connexion à la base de données impossible", "error");
            }
        } catch (e) {
            console.error("Dashboard Load Error:", e);
            if (onToast) onToast("Erreur de synchronisation Cloud", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const chartData = useMemo(() => {
        const now = new Date();
        const data = [];
        const days = timeRange === 'day' ? 24 : timeRange === 'week' ? 7 : 30;

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            if (timeRange === 'day') d.setHours(now.getHours() - i);
            else d.setDate(now.getDate() - i);

            const label = timeRange === 'day' 
                ? `${d.getHours()}h` 
                : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

            const count = allReports.filter(r => {
                const rDate = new Date(r.date);
                if (timeRange === 'day') return rDate.getHours() === d.getHours() && rDate.toDateString() === d.toDateString();
                return rDate.toDateString() === d.toDateString();
            }).length;

            data.push({ name: label, total: count });
        }
        return data;
    }, [allReports, timeRange]);

    const communeStats = useMemo(() => {
        const communes = ['Gombe', 'Limete', 'Ngaliema', 'Kintambo', 'Bandal'];
        return communes.map(name => ({
            name,
            val: allReports.filter(r => r.commune === name).length
        })).sort((a, b) => b.val - a.val);
    }, [allReports]);

    const statusStats = [
        { name: 'Résolus', value: allReports.filter(r => r.status === 'resolved').length, color: '#00C853' },
        { name: 'En cours', value: allReports.filter(r => r.status === 'assigned' || r.status === 'pending').length, color: '#2962FF' },
        { name: 'Rejetés', value: allReports.filter(r => r.status === 'rejected').length, color: '#FF5252' }
    ];

    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    const todayReports = allReports.filter(r => new Date(r.date).toDateString() === new Date().toDateString());
    
    const zoneData = useMemo(() => {
        const communes = ['Gombe', 'Limete', 'Ngaliema', 'Kintambo'];
        return communes.map(name => {
            const zoneReports = allReports.filter(r => r.commune === name);
            const resolved = zoneReports.filter(r => r.status === 'resolved').length;
            const efficiency = zoneReports.length > 0 ? Math.round((resolved / zoneReports.length) * 100) : 0;
            return { name, efficiency, count: zoneReports.length };
        });
    }, [allReports]);

    const STATS_CARDS = [
        { label: 'Alertes Jour', value: todayReports.length.toString(), trend: 'Action Requis', icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50', targetView: AppView.ADMIN_REPORTS },
        { label: 'Files KYC', value: pendingUsers.length.toString(), trend: pendingUsers.length > 0 ? 'PRIORITAIRE' : 'À Jour', icon: UserCheck, color: 'text-[#FBC02D]', bg: 'bg-yellow-50', targetView: AppView.ADMIN_USERS, urgent: pendingUsers.length > 0 },
        { label: 'Incidents SIG', value: allReports.length.toString(), trend: 'Total', icon: Trash2, color: 'text-green-600', bg: 'bg-green-50', targetView: AppView.ADMIN_REPORTS },
        { label: 'Membres', value: allUsers.length.toString(), trend: 'Réseau', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50', targetView: AppView.ADMIN_USERS }
    ];

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-40 md:pb-8 max-w-[1600px] mx-auto">
            {/* Header / Connection Health */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${isCloudSynced ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'} transition-all`}>
                            <Database size={12} className={isCloudSynced ? 'animate-pulse' : ''} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isCloudSynced ? 'Cloud Supabase Connecté' : 'Erreur de Connexion BDD'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Tour de Contrôle</h1>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={loadAllData} className="flex-1 sm:flex-none p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 hover:bg-gray-50 transition-all flex justify-center">
                        <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''} text-blue-500`} />
                    </button>
                    <div className="flex-1 sm:flex-none bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center justify-center gap-3">
                        <Clock size={16} className="text-[#2962FF]" />
                        <span className="text-sm font-black dark:text-white font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid - 1 col on mobile, 2 on tablet, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {STATS_CARDS.map((stat, idx) => (
                    <div key={idx} onClick={() => onChangeView(stat.targetView)} className={`bg-white dark:bg-[#111827] p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border-2 transition-all active:scale-95 cursor-pointer relative overflow-hidden group shadow-sm ${stat.urgent ? 'border-orange-400 animate-pulse-slow shadow-orange-100' : 'border-gray-100 dark:border-gray-800 hover:border-primary'}`}>
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${stat.bg} dark:bg-white/5 ${stat.color} flex items-center justify-center mb-4 md:mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                            <stat.icon size={20} md={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <div className="flex items-end gap-3">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</h2>
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${stat.urgent ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ANALYTICS SECTION */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                {/* Evolution Chart */}
                <div className="xl:col-span-2 bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <TrendingUp className="text-primary" /> Flux Signalements
                            </h3>
                            <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase mt-1">Analyse des incidents SIG</p>
                        </div>
                        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-xl md:rounded-2xl border dark:border-gray-700 w-fit">
                            {[
                                { id: 'day', label: '24h' },
                                { id: 'week', label: '7j' },
                                { id: 'month', label: '30j' }
                            ].map(t => (
                                <button key={t.id} onClick={() => setTimeRange(t.id as any)} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all ${timeRange === t.id ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}>{t.label}</button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[250px] md:h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                </linearGradient>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }} 
                                />
                                <Area type="monotone" dataKey="total" stroke="#2962FF" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Efficiency Stats */}
                <div className="bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8 w-full">Efficacité Terrain</h3>
                    <div className="flex-1 w-full h-[200px] md:h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                                <Pie 
                                    data={statusStats} 
                                    innerRadius={60} 
                                    outerRadius={85} 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl md:text-3xl font-black dark:text-white">{allReports.length}</span>
                            <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Total SIG</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full mt-6">
                        {statusStats.map(s => (
                            <div key={s.name} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                                    <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase">{s.name}</span>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white text-sm">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row - Grids stack on small screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Top Communes</h3>
                        <BarChart3 size={20} className="text-gray-400" />
                    </div>
                    <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={communeStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'black', fill: '#94a3b8'}} width={70} />
                                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} />
                                <Bar dataKey="val" fill="#00C853" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col group overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Zones Live</h3>
                        <PieIcon size={24} className="text-blue-500" />
                    </div>
                    <div className="flex-1 space-y-6 md:space-y-8 overflow-y-auto no-scrollbar">
                        {zoneData.map((zone, i) => (
                            <div key={i} className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] md:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">{zone.name}</span>
                                    <span className={`text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded ${zone.efficiency > 70 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{zone.efficiency}%</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${zone.efficiency > 70 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${zone.efficiency}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* KYC Section */}
            <div className="bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-2 border-orange-100 dark:border-orange-900/40 shadow-2xl flex flex-col relative overflow-hidden group mb-10">
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg animate-bounce"><UserCheck size={20} md={24} /></div>
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Qualification Réseau</h3>
                            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-1">Files KYC prioritaires</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[300px] md:max-h-[400px] relative z-10">
                    {pendingUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">Aucun dossier en attente.</div>
                    ) : (
                        pendingUsers.map(u => (
                            <div key={u.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 md:p-5 bg-orange-50/30 dark:bg-orange-900/10 rounded-3xl md:rounded-[2.2rem] border-2 border-transparent hover:border-orange-200 transition-all group">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white dark:bg-gray-800 text-orange-600 rounded-2xl md:rounded-3xl flex items-center justify-center font-black text-xl md:text-2xl shrink-0 shadow-sm">{u.firstName[0]}</div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <p className="text-sm md:text-base font-black dark:text-white uppercase truncate">{u.firstName} {u.lastName}</p>
                                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold flex items-center justify-center sm:justify-start gap-1.5 mt-1 uppercase"><MapPin size={10} md={12}/> {u.commune}</span>
                                </div>
                                <button onClick={() => onChangeView(AppView.ADMIN_USERS)} className="w-full sm:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest">Analyser</button>
                            </div>
                        ))
                    )}
                </div>
                {pendingUsers.length > 0 && (
                    <button onClick={() => onChangeView(AppView.ADMIN_USERS)} className="mt-8 w-full py-4 md:py-5 bg-[#2962FF] text-white rounded-2xl md:rounded-[1.8rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">Annuaire Complet <ChevronRight size={16} md={18}/></button>
                )}
            </div>
        </div>
    );
}

function PendingDashboard({ user, onRefresh }: DashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await new Promise(r => setTimeout(r, 800));
            await onRefresh();
            setIsRefreshing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 md:p-12 text-center space-y-8 animate-fade-in bg-[#F5F7FA] dark:bg-[#050505]">
            <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center text-orange-600 shadow-2xl relative z-10 animate-float"><Lock size={48} md={64} /></div>
                <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-20 animate-pulse"></div>
            </div>
            <div className="space-y-4 max-w-lg">
                <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-800">
                    <ShieldAlert size={12} /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Accès Restreint</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">Vérification en cours</h2>
                <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Mbote {user.firstName}! Votre demande d'adhésion est en cours de validation par nos administrateurs.</p>
            </div>
            
            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="w-full bg-white dark:bg-gray-900 border-2 border-orange-100 dark:border-orange-900/40 text-orange-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-sm hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCcw size={16} md={18} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? 'Vérification...' : 'Vérifier mon statut'}
                </button>
                <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                    <CheckCircle2 size={10} className="text-green-500" /> Activation automatique dès validation
                </div>
            </div>
        </div>
    );
}

function CollectorDashboard({ user, onChangeView }: DashboardProps) {
    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-32 md:pb-8">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20"><Truck size={28} md={32} /></div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Espace Collecte</h1>
                    <p className="text-xs md:text-sm font-bold text-gray-400 mt-1">Prêt pour votre mission, {user.firstName}?</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4 md:gap-6 group hover:shadow-xl transition-all">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-[#2962FF] transition-transform group-hover:scale-110 group-hover:rotate-6"><Activity size={32} md={36} /></div>
                    <h3 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Missions du jour</h3>
                </button>
                <button onClick={() => onChangeView(AppView.MAP)} className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-4 md:gap-6 group hover:shadow-xl transition-all">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110 group-hover:-rotate-6"><MapIcon size={32} md={36} /></div>
                    <h3 className="text-base md:text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Carte SIG Live</h3>
                </button>
            </div>
        </div>
    );
}

function BusinessDashboard({ user }: DashboardProps) {
    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-32 md:pb-8">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20"><Briefcase size={28} md={32} /></div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">{user.companyName || 'Espace Entreprise'}</h1>
                    <p className="text-xs md:text-sm font-bold text-gray-400 mt-1">Pilotage RSE & Gestion des Déchets</p>
                </div>
            </div>
        </div>
    );
}

function CitizenDashboard({ user, onChangeView }: DashboardProps) {
    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-32 md:pb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Mbote, {user.firstName}!</h1>
                    <div className="text-xs md:text-sm font-bold text-gray-500 mt-3 flex items-center gap-2">
                        <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Leaf size={10} /></div> Kinshasa devient plus propre grâce à vous.
                    </div>
                </div>
                <div className="w-full sm:w-auto bg-white dark:bg-[#111827] p-4 md:p-5 rounded-[1.8rem] md:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center min-w-[120px]">
                    <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco Points</p>
                    <div className="text-2xl md:text-3xl font-black text-[#2962FF]">{user.points}</div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-[#2962FF] p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-blue-500/20 flex flex-col gap-6 md:gap-8 transition-transform hover:scale-[1.02] active:scale-95 text-left">
                    <div className="absolute top-0 right-0 p-6 md:p-8 opacity-20 group-hover:rotate-12 transition-transform duration-500"><Camera size={100} md={120} /></div>
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur rounded-xl md:rounded-2xl flex items-center justify-center text-white"><Camera size={24} md={28} /></div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none">Biso Peto Alert</h3>
                        <p className="text-white/70 text-[10px] md:text-xs font-bold uppercase mt-2 tracking-widest">Signaler des déchets maintenant</p>
                    </div>
                </button>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button onClick={() => onChangeView(AppView.ACADEMY)} className="bg-white dark:bg-[#111827] p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-3 md:gap-4 group hover:shadow-lg transition-all">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 dark:bg-green-900/20 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110"><GraduationCap size={28} md={32} /></div>
                        <span className="text-[8px] md:text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest text-center leading-tight">Eco Academy</span>
                    </button>
                    <button onClick={() => onChangeView(AppView.MARKETPLACE)} className="bg-white dark:bg-[#111827] p-4 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-3 md:gap-4 group hover:shadow-lg transition-all">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-50 dark:bg-purple-900/20 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110"><ShoppingBag size={28} md={32} /></div>
                        <span className="text-[8px] md:text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest text-center leading-tight">Boutique</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- MAIN EXPORT ---

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
