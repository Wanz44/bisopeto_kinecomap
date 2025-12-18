
import React, { useState, useEffect } from 'react';
import { 
    Trash2, 
    Recycle, 
    Star, 
    Award, 
    Map as MapIcon, 
    Calendar, 
    CreditCard, 
    GraduationCap, 
    Leaf,
    Users,
    User as UserIcon,
    TrendingUp,
    AlertTriangle,
    Activity,
    Truck,
    CheckCircle,
    Navigation,
    Megaphone,
    Weight,
    Share2,
    MapPin,
    ArrowRight,
    Server,
    Database,
    Wifi,
    Globe,
    BookOpen,
    Copy,
    X,
    Smartphone,
    BarChart3,
    MousePointer,
    Eye,
    ListFilter,
    Plus,
    Upload,
    Building2,
    Mail,
    Phone,
    Edit2,
    Cpu,
    Zap,
    Clock,
    Search,
    Filter,
    DollarSign,
    ShieldAlert,
    HardDrive,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Minus,
    ClipboardList,
    ShoppingBag,
    Factory,
    PhoneCall,
    ShieldCheck
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, Legend, AreaChart, Area, CartesianGrid, YAxis,
    RadialBarChart, RadialBar, LineChart, Line
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { User, AppView, UserType } from '../types';

const DashboardSearchBar = () => (
    <div className="relative mb-6 group z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00C853]/20 to-[#2962FF]/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative bg-white dark:bg-[#1A1F2E] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#2962FF]/50">
            <div className="pl-4 text-gray-400">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Rechercher partout (Collectes, Aide, Academy)..." 
                className="w-full py-4 px-4 bg-transparent outline-none text-gray-900 dark:text-gray-100 font-medium placeholder-gray-400 dark:placeholder-gray-500"
            />
            <button className="pr-4 text-[#2962FF] font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 p-2 rounded-lg mr-2 transition-colors flex items-center gap-2">
                <Filter size={16} />
            </button>
        </div>
    </div>
);

interface DashboardProps {
    user: User;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const PendingDashboard: React.FC<DashboardProps> = ({ user }) => {
    return (
        <div className="p-5 md:p-12 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="bg-white dark:bg-[#111827] p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-xl">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <PhoneCall size={48} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Qualification en cours</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                    Mbote <span className="text-[#2962FF] font-black">{user.firstName}</span> ! Votre profil est en cours de validation par nos agents Bisopeto.
                    <br/><br/>
                    Nous vous contacterons au <span className="font-black text-gray-900 dark:text-white underline decoration-[#00C853] decoration-2">{user.phone}</span> sous 24h.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                        <ShieldCheck className="text-[#00C853]" />
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Identité Vérifiée</span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center gap-3 border border-gray-100 dark:border-gray-700">
                        <Clock className="text-[#2962FF]" />
                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Service Express</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CitizenDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const data = [ { name: 'Lun', uv: 0 }, { name: 'Mar', uv: 0 }, { name: 'Mer', uv: 0 }, { name: 'Jeu', uv: 0 }, { name: 'Ven', uv: 0 }, { name: 'Sam', uv: 0 }, { name: 'Dim', uv: 0 } ];

    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />
            <div className="bg-gradient-to-br from-[#00C853] via-[#009624] to-[#2962FF] rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tighter leading-none">Mbote, {user.firstName}! 👋</h1>
                    <p className="opacity-95 mb-8 text-sm md:text-xl font-bold max-w-lg leading-snug">
                        Votre prochaine collecte est prévue <span className="text-white bg-black/30 px-3 py-1 rounded-xl">aujourd'hui à 10:30</span>.
                    </p>
                    <button className="flex items-center gap-2 bg-white text-[#009624] px-6 py-3 rounded-2xl font-black text-sm transition-all hover:bg-gray-100 shadow-xl active:scale-95">
                        <Share2 size={16} /> Parrainer un voisin
                    </button>
                </div>
                <div className="absolute right-[-5%] bottom-[-10%] opacity-10 rotate-12 group-hover:rotate-6 transition-transform duration-700">
                    <Leaf size={300} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Trash2, label: 'Collectes', value: user.collections, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { icon: Recycle, label: 'Recyclage', value: '0%', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { icon: Star, label: 'Points', value: user.points, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                    { icon: Award, label: 'Badges', value: user.badges, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111827] p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center group hover:shadow-lg transition-all">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                        <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{stat.value}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-2">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#111827] p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tight">
                        <BarChart3 size={20} className="text-[#00C853]" /> Volume collecté (kg)
                    </h3>
                    <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6B7280', fontWeight: 700}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: 'rgba(0, 200, 83, 0.05)', radius: 8}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                <Bar dataKey="uv" radius={[8, 8, 8, 8]} barSize={35}>
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#00C853' : '#B9F6CA'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            <Calendar size={20} className="text-[#2962FF]" /> Mon Agenda
                        </h3>
                        <button onClick={() => onChangeView(AppView.PLANNING)} className="text-[#00C853] dark:text-green-400 text-xs font-black uppercase tracking-widest hover:underline">Détails</button>
                    </div>
                    <div className="bg-white dark:bg-[#111827] rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 p-3 space-y-3">
                        <div className="p-5 rounded-[1.5rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex items-center group">
                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-700 text-[#00C853] flex items-center justify-center mr-5 shrink-0 shadow-sm">
                                <Trash2 size={26} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-gray-900 dark:text-white text-lg leading-tight">Déchets ménagers</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 flex items-center gap-1.5"><Clock size={14} className="text-[#2962FF]" /> Aujourd'hui, 10:30</p>
                            </div>
                            <span className="bg-[#FFEB3B] text-gray-900 text-[10px] uppercase font-black px-3 py-2 rounded-xl shadow-sm">Confirmé</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... Les autres dashboards (Business, Collector, Admin) suivent une structure de couleurs similaire améliorée ...

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
    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />
            <div className="flex justify-between items-end mb-4 border-b dark:border-gray-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Cpu size={18} className="text-[#2962FF] animate-pulse" />
                        <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Eco Command Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">PILOTAGE</h1>
                </div>
                <div className="hidden md:block text-right">
                    <div className="text-sm font-bold text-green-500 flex items-center justify-end gap-2 uppercase">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        Système en ligne
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Utilisateurs', value: '1,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Flotte Active', value: '35/40', icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Revenus MTD', value: '$12,400', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Alertes', value: '2', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111827] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                        <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
                            <kpi.icon size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{kpi.value}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CollectorDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-2 tracking-tighter">Mbote, {user.firstName}!</h1>
                    <p className="text-white/90 text-lg font-bold mb-8">Vous avez <span className="bg-white/20 px-2 py-0.5 rounded-lg">4 missions</span> à Gombe aujourd'hui.</p>
                    <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10">Lancer ma tournée</button>
                </div>
            </div>
        </div>
    );
};

const BusinessDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <div className="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10 shadow-sm">
                <div className="max-w-md">
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">Mbote Entreprise! 🏢</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-bold text-lg leading-relaxed mb-8">Votre impact écologique : <span className="text-[#00C853]">1.2 Tonnes collectées</span> ce mois-ci.</p>
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="bg-[#2962FF] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-transform active:scale-95">Passage spécial</button>
                </div>
                <div className="w-full md:w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] flex items-center justify-center text-[#2962FF] animate-pulse">
                    <Factory size={120} />
                </div>
            </div>
        </div>
    );
};
