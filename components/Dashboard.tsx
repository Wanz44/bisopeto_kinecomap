
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, GraduationCap, Leaf, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, Megaphone, MapPin, Clock, Search, ShieldCheck, Phone, Mail, 
    ShieldAlert, UserCheck, ShoppingBag, Battery, ChevronRight, Briefcase, Lock, 
    RefreshCw, Camera, PieChart as PieIcon, BarChart3, Calendar, Filter, Database,
    CheckCircle2, RefreshCcw, Star, Zap, History, LayoutGrid, Loader2, Info
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
            }
        } catch (e) {
            console.error("Dashboard Error:", e);
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

    return (
        <div className="p-4 md:p-8 space-y-6 animate-fade-in pb-32 max-w-[100rem] mx-auto">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 border ${isCloudSynced ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                            <Database className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{isCloudSynced ? 'Live SIG Connected' : 'SIG Offline'}</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none uppercase">Tour de Contrôle</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-sm border dark:border-gray-700 flex items-center gap-3">
                        <Clock className="w-4 h-4 text-[#2962FF]" />
                        <span className="text-xs font-black dark:text-white font-mono">{currentTime.toLocaleTimeString('fr-FR')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tight flex items-center gap-3"><TrendingUp className="w-5 h-5 text-primary" /> Flux Signalements</h3>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs><linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/><stop offset="95%" stopColor="#2962FF" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 'bold' }} />
                                <Area type="monotone" dataKey="total" stroke="#2962FF" strokeWidth={3} fillOpacity={1} fill="url(#colorReports)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-8">Efficacité Terrain</h3>
                    <div className="flex-1 w-full h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart><Pie data={statusStats} innerRadius="65%" outerRadius="90%" paddingAngle={8} dataKey="value" stroke="none">{statusStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></RechartsPieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black dark:text-white">{allReports.length}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Total SIG</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CitizenDashboard({ user, onChangeView }: DashboardProps) {
    const [myReports, setMyReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMyData = async () => {
            try {
                const data = await ReportsAPI.getAll(0, 20);
                setMyReports(data.filter(r => r.reporterId === user.id));
            } finally { setIsLoading(false); }
        };
        loadMyData();
    }, [user.id]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Mbote, {user.firstName}!</h1>
                    <div className="text-sm font-bold text-gray-500 mt-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><Leaf className="w-4 h-4" /></div> Kinshasa devient plus propre avec vous.
                    </div>
                </div>
                <div className="w-full sm:w-auto bg-white dark:bg-[#111827] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco Points</p>
                    <div className="text-4xl font-black text-[#2962FF] flex items-center justify-center gap-2"><Star size={24} className="text-yellow-500 fill-yellow-500" /> {user.points}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-[#2962FF] p-10 rounded-[3rem] shadow-2xl flex flex-col gap-8 transition-transform hover:scale-[1.02] active:scale-95 text-left">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform duration-500"><Camera className="w-32 h-32" /></div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-white"><Camera size={32} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Biso Peto Alert</h3>
                        <p className="text-white/70 text-[10px] font-black uppercase mt-3 tracking-widest">Signaler un tas de déchets</p>
                    </div>
                </button>
                
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tight flex items-center gap-3"><History size={20} className="text-blue-500"/> Mes Alertes</h3>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{myReports.length} total</span>
                    </div>
                    <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                        {myReports.length === 0 ? (
                            <div className="text-center py-10 opacity-30 font-black uppercase text-[10px]">Aucun signalement</div>
                        ) : myReports.map(r => (
                            <div key={r.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center gap-4 group">
                                <img src={r.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-[11px] uppercase dark:text-white truncate">{r.wasteType}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">{r.commune} • {new Date(r.date).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[7px] font-black uppercase text-white ${r.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`}>{r.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function PendingDashboard({ user, onRefresh }: DashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastCheck, setLastCheck] = useState(new Date());

    useEffect(() => {
        // Auto-check every 15 seconds to ensure the user isn't stuck if real-time drops
        const interval = setInterval(() => {
            handleRefresh(true);
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async (isAuto = false) => {
        if (onRefresh) {
            if (!isAuto) setIsRefreshing(true);
            await onRefresh();
            setLastCheck(new Date());
            if (!isAuto) setIsRefreshing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-8 text-center space-y-12 bg-[#F5F7FA] dark:bg-[#050505] animate-fade-in">
            <div className="relative">
                <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3.5rem] flex items-center justify-center text-orange-600 animate-float shadow-xl border border-orange-200 dark:border-orange-800/30">
                    <Lock size={64} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800">
                    <Loader2 className="animate-spin text-orange-500" size={24} />
                </div>
            </div>

            <div className="space-y-6 max-w-lg">
                <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter leading-tight">Mbote {user.firstName}! <br/><span className="text-orange-500 italic">Dossier en Analyse</span></h2>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    Votre profil est en cours de validation par nos agents SIG. Cette étape garantit la sécurité du réseau <strong>Biso Peto</strong>. <br/>
                    <span className="text-xs font-black uppercase tracking-widest mt-4 block opacity-50">Activation estimée : &lt; 24h</span>
                </p>
            </div>

            <div className="w-full max-w-sm space-y-4">
                <button 
                    onClick={() => handleRefresh()} 
                    disabled={isRefreshing} 
                    className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl transition-all hover:border-orange-500 group"
                >
                    <RefreshCcw className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} text-orange-500`} size={20} /> 
                    {isRefreshing ? 'Vérification...' : 'Actualiser manuellement'}
                </button>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernière vérification : {lastCheck.toLocaleTimeString()}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4 text-left max-w-md">
                <Info className="text-blue-500 shrink-0 mt-1" size={20} />
                <p className="text-[11px] text-blue-800 dark:text-blue-300 font-bold uppercase leading-relaxed">
                    Besoin d'aide ? Contactez notre support WhatsApp <br/> 
                    <span className="text-sm font-black">+243 85 229 1755</span>
                </p>
            </div>
        </div>
    );
}

function CollectorDashboard({ user, onChangeView }: DashboardProps) {
    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-orange-500/20"><Truck size={32} /></div>
                <div><h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Espace Collecte</h1><p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Opérateur: {user.firstName}</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center text-[#2962FF] transition-transform group-hover:scale-110 group-hover:rotate-6"><LayoutGrid size={40} /></div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Mes Missions</h3>
                </button>
                <button onClick={() => onChangeView(AppView.MAP)} className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-[2rem] flex items-center justify-center text-[#00C853] transition-transform group-hover:scale-110 group-hover:-rotate-6"><MapIcon size={40} /></div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Carte SIG Live</h3>
                </button>
            </div>
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = (props) => {
    if (props.user.type !== UserType.ADMIN && props.user.status === 'pending') return <PendingDashboard {...props} />;
    switch (props.user.type) {
        case UserType.ADMIN: return <AdminDashboard {...props} />;
        case UserType.COLLECTOR: return <CollectorDashboard {...props} />;
        default: return <CitizenDashboard {...props} />;
    }
};
