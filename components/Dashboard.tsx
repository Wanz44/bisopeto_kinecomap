
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Trash2, Map as MapIcon, GraduationCap, Leaf, Users, TrendingUp, AlertTriangle, 
    Activity, Truck, Megaphone, MapPin, Clock, Search, ShieldCheck, Phone, Mail, 
    ShieldAlert, UserCheck, ShoppingBag, Battery, ChevronRight, Briefcase, Lock, 
    RefreshCw, Camera, PieChart as PieIcon, BarChart3, Calendar, Filter, Database,
    CheckCircle2, RefreshCcw, Star, Zap, History, LayoutGrid, Loader2, Info,
    Sparkles, ArrowRight, X, Image as ImageIcon
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
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);

    useEffect(() => {
        const loadMyData = async () => {
            try {
                const data = await ReportsAPI.getAll(0, 20);
                setMyReports(data.filter(r => r.reporterId === user.id));
            } finally { setIsLoading(false); }
        };
        loadMyData();
    }, [user.id]);

    const progressToNextBadge = (user.points % 500) / 500 * 100;

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            {/* Propreté de la zone */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-[2rem] text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={100} /></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md"><Activity size={24}/></div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">État de propreté : {user.commune}</p>
                        <p className="text-base font-black uppercase tracking-tight mt-1">Zone sous surveillance SIG</p>
                    </div>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase relative z-10">85% Clean</div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none truncate">Mbote, {user.firstName}!</h1>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-800 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                           <Sparkles size={10}/> Eco Citoyen {user.points > 1000 ? 'Expert' : 'Modèle'}
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl text-center relative group transition-all hover:scale-105">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco-Points</p>
                    <div className="text-5xl font-black text-[#2962FF] flex items-center justify-center gap-3"><Star size={32} className="text-yellow-500 fill-yellow-500 animate-spin-slow" /> {user.points}</div>
                    <div className="mt-4 w-40 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-primary" style={{width: `${progressToNextBadge}%`}}></div>
                    </div>
                    <p className="text-[7px] font-black text-gray-400 uppercase mt-2">Plus que {500 - (user.points % 500)} pts pour le badge suivant</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <button onClick={() => onChangeView(AppView.REPORTING)} className="relative group overflow-hidden bg-primary p-12 rounded-[3.5rem] shadow-2xl flex flex-col gap-10 transition-all hover:scale-[1.02] active:scale-95 text-left border-4 border-white dark:border-gray-800">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 group-hover:scale-125 transition-all duration-700 text-white"><Camera className="w-40 h-40" /></div>
                    <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-[2rem] flex items-center justify-center text-white shadow-xl"><Camera size={40} /></div>
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Signaler <br/> un tas</h3>
                        <div className="mt-4 flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em]">Lancer l'IA <ArrowRight size={14}/></div>
                    </div>
                </button>
                
                <div className="bg-white dark:bg-[#0a0a0a] p-10 rounded-[3.5rem] border dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3"><History size={24} className="text-blue-500"/> Mes Alertes</h3>
                        <span className="bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">{myReports.length} rapports</span>
                    </div>
                    <div className="flex-1 space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                        {myReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-20 font-black uppercase text-xs">Zéro signalement</div>
                        ) : myReports.map(r => (
                            <div key={r.id} onClick={() => setSelectedReport(r)} className="p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-[2.2rem] border border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all flex items-center gap-5 group cursor-pointer">
                                <img src={r.imageUrl} className="w-16 h-16 rounded-[1.2rem] object-cover border-2 border-white dark:border-gray-800 group-hover:scale-110 transition-transform" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-xs uppercase dark:text-white truncate tracking-tight">{r.wasteType}</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={8}/> {r.commune} • {new Date(r.date).toLocaleDateString()}</p>
                                </div>
                                <div className={`px-2.5 py-1 rounded-xl text-[7px] font-black uppercase text-white shadow-sm ${r.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`}>{r.status === 'resolved' ? 'Peto !' : 'En cours'}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODALE DETAIL SIGNALEMENT (CITOYEN) */}
            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedReport(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] w-full max-w-sm p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Détails de l'Alerte</h3>
                            <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><p className="text-[8px] font-black uppercase text-gray-400">Signalement</p><img src={selectedReport.imageUrl} className="aspect-square rounded-2xl object-cover border" /></div>
                                {selectedReport.proofUrl ? (
                                    <div className="space-y-1"><p className="text-[8px] font-black uppercase text-green-500">Collecte effectuée</p><img src={selectedReport.proofUrl} className="aspect-square rounded-2xl object-cover border-2 border-green-500" /></div>
                                ) : (
                                    <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-2 text-gray-300">
                                        <Truck size={24}/>
                                        <p className="text-[7px] font-black uppercase text-center">Camion en route</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl space-y-4">
                                <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Status Actuel</p><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${selectedReport.status === 'resolved' ? 'bg-green-500' : 'bg-orange-500'}`}>{selectedReport.status}</span></div>
                                <div><p className="text-[9px] font-black text-gray-400 uppercase mb-1">Localisation</p><p className="text-xs font-bold dark:text-white uppercase">{selectedReport.commune}</p></div>
                                {selectedReport.status === 'resolved' && (
                                    <div className="pt-3 border-t dark:border-gray-800 flex items-center gap-2 text-green-600">
                                        <Sparkles size={16}/>
                                        <p className="text-[10px] font-black uppercase tracking-tight">Points de civisme crédités !</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setSelectedReport(null)} className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Fermer</button>
                    </div>
                </div>
            )}
        </div>
    );
}

function PendingDashboard({ user, onRefresh }: DashboardProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastCheck, setLastCheck] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => { handleRefresh(true); }, 15000);
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
                <div className="w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-[3.5rem] flex items-center justify-center text-orange-600 animate-float shadow-xl border border-orange-200 dark:border-orange-800/30"><Lock size={64} /></div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-800"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
            </div>
            <div className="space-y-6 max-w-lg">
                <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter leading-tight">Mbote {user.firstName}! <br/><span className="text-orange-500 italic">Dossier en Analyse</span></h2>
                <p className="text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Votre profil est en cours de validation par nos agents SIG. Cette étape garantit la sécurité du réseau <strong>Biso Peto</strong>. <br/><span className="text-xs font-black uppercase tracking-widest mt-4 block opacity-50">Activation estimée : &lt; 24h</span></p>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => handleRefresh()} disabled={isRefreshing} className="w-full bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 text-gray-800 dark:text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl transition-all hover:border-orange-500 group">
                    <RefreshCcw className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} text-orange-500`} size={20} /> {isRefreshing ? 'Vérification...' : 'Actualiser manuellement'}
                </button>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernière vérification : {lastCheck.toLocaleTimeString()}</p>
            </div>
        </div>
    );
}

function CollectorDashboard({ user, onChangeView }: DashboardProps) {
    const [stats, setStats] = useState({ activeJobs: 0, completedToday: 0 });

    useEffect(() => {
        const loadStats = async () => {
            const all = await ReportsAPI.getAll();
            const myJobs = all.filter(r => r.assignedTo === user.id);
            setStats({
                activeJobs: myJobs.filter(r => r.status === 'assigned').length,
                completedToday: myJobs.filter(r => r.status === 'resolved' && new Date(r.date).toDateString() === new Date().toDateString()).length
            });
        };
        loadStats();
    }, [user.id]);

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-orange-500 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-orange-500/30 group transition-transform hover:rotate-6"><Truck size={40} /></div>
                <div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Mbote, Expert {user.firstName}!</h1>
                    <p className="text-xs font-black text-gray-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Terminal Opérationnel • {user.commune}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 text-center shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Missions</p>
                    <p className="text-3xl font-black text-blue-600 leading-none">{stats.activeJobs}</p>
                </div>
                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 text-center shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Complété (Jour)</p>
                    <p className="text-3xl font-black text-green-600 leading-none">{stats.completedToday}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white dark:bg-[#111827] p-12 rounded-[3.5rem] border dark:border-gray-800 shadow-xl flex flex-col items-center gap-8 group hover:shadow-2xl transition-all border-b-8 border-b-blue-600 active:translate-y-1">
                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-[2.2rem] flex items-center justify-center text-[#2962FF] transition-all group-hover:scale-110 group-hover:rotate-6 shadow-inner"><LayoutGrid size={48} /></div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Mes Missions</h3>
                </button>
                <button onClick={() => onChangeView(AppView.MAP)} className="bg-white dark:bg-[#111827] p-12 rounded-[3.5rem] border dark:border-gray-800 shadow-xl flex flex-col items-center gap-8 group hover:shadow-2xl transition-all border-b-8 border-b-green-600 active:translate-y-1">
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-[2.2rem] flex items-center justify-center text-[#00C853] transition-all group-hover:scale-110 group-hover:-rotate-6 shadow-inner"><MapIcon size={48} /></div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Carte SIG Live</h3>
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
