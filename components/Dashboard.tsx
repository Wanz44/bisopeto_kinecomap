
import React, { useState, useEffect } from 'react';
import { 
    Trash2, Recycle, Star, Award, Map as MapIcon, Calendar, CreditCard, 
    GraduationCap, Leaf, Users, User as UserIcon, TrendingUp, AlertTriangle, 
    Activity, Truck, CheckCircle, Navigation, Megaphone, Weight, Share2, 
    MapPin, ArrowRight, BarChart3, Clock, Search, Filter, DollarSign, 
    // Added missing Phone import
    ShieldCheck, PhoneCall, Phone, FileText, Download, Globe2, Wind, Sparkles, Plus,
    Mail, ShieldAlert
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, 
    PieChart, Pie, AreaChart, Area, CartesianGrid, YAxis
} from 'recharts';
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

// --- ÉCRAN D'ATTENTE (Processus de Qualification Professionnel) ---
const PendingDashboard: React.FC<DashboardProps> = ({ user }) => {
    return (
        <div className="p-5 md:p-12 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center animate-fade-in bg-gray-50 dark:bg-[#050505]">
            <div className="bg-white dark:bg-[#111827] p-8 md:p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-2xl w-full relative overflow-hidden">
                {/* Décoration d'arrière-plan */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C853]/10 blur-[60px] rounded-full -mr-10 -mt-10"></div>
                
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-[#00C853] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
                        <ShieldCheck size={48} />
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight">
                        Souscription Enregistrée !
                    </h1>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-6 rounded-3xl mb-8">
                        <p className="text-lg text-blue-900 dark:text-blue-200 font-bold leading-relaxed">
                            "Merci pour votre souscription. Notre équipe vous contactera sous peu pour finaliser votre abonnement à <span className="text-[#00C853]">Bisopeto</span>."
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-10">
                        <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm text-[#2962FF]">
                                    <PhoneCall size={20} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Lien Humain</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Un de nos agents vous appellera au <span className="font-bold text-gray-800 dark:text-white">{user.phone}</span> pour confirmer vos informations et vous présenter nos services.
                            </p>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm text-[#00C853]">
                                    <Mail size={20} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">Félicitations</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Après cet échange, vous recevrez un e-mail de bienvenue et votre accès complet à la plateforme sera activé.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Besoin d'aide ?</p>
                        <div className="flex gap-4">
                             <a href="tel:+243852291755" className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-transform active:scale-95 shadow-xl">
                                <Phone size={16} /> Nous appeler
                             </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CitizenDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const data = [ { name: 'Lun', uv: 0 }, { name: 'Mar', uv: 10 }, { name: 'Mer', uv: 5 }, { name: 'Jeu', uv: 8 }, { name: 'Ven', uv: 12 }, { name: 'Sam', uv: 20 }, { name: 'Dim', uv: 0 } ];

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
                    { icon: Recycle, label: 'Recyclage', value: '12kg', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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

const BusinessDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const wasteData = [
        { name: 'S1', volume: 450 },
        { name: 'S2', volume: 380 },
        { name: 'S3', volume: 520 },
        { name: 'S4', volume: 410 },
    ];

    const compositionData = [
        { name: 'Plastique', value: 400, color: '#2962FF' },
        { name: 'Papier/Carton', value: 300, color: '#00C853' },
        { name: 'Organique', value: 200, color: '#FFB300' },
        { name: 'Autres', value: 100, color: '#6B7280' },
    ];

    return (
        <div className="p-5 md:p-8 space-y-8 animate-fade-in pb-24 md:pb-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">Tableau de Bord Entreprise</h1>
                    <p className="text-gray-500 font-bold mt-1">Pilotage écologique & Reporting RSE</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="flex-1 md:flex-none bg-[#2962FF] text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        <Plus size={18} /> Demander un passage spécial
                    </button>
                    <button className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-300 shadow-sm">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tonnage Total', value: '1.24 T', sub: '+12% vs mois dernier', icon: Weight, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Empreinte Carbone', value: '-840 kg', sub: 'Équivalent CO2 évité', icon: Wind, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Taux Recyclage', value: '68%', sub: 'Objectif : 75%', icon: Recycle, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Budget Déchets', value: '450 $', sub: 'Paiement auto actif', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-[#2962FF] transition-all">
                        <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center mb-4`}>
                            <kpi.icon size={24} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{kpi.label}</h4>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{kpi.value}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 mt-2 uppercase flex items-center gap-1">
                            <Activity size={10} className="text-[#2962FF]" /> {kpi.sub}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                            <BarChart3 size={20} className="text-[#2962FF]" /> Courbe de Tonnage Mensuel
                        </h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={wasteData}>
                                <defs>
                                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2962FF" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 700, fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 700, fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="volume" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Composition Moyenne</h3>
                    <div className="flex-1 h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={compositionData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                                    {compositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = (props) => {
    // Si l'utilisateur n'est pas Admin et que son statut est 'pending', on affiche l'écran de verrouillage
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
                        <Activity size={18} className="text-[#2962FF] animate-pulse" />
                        <span className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Bisopeto Control Tower</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">GESTION</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Inscrits', value: '1,240', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'À Qualifier', value: '8', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { label: 'Flotte Active', value: '35/40', icon: Truck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Revenus MTD', value: '$12,400', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' }
                ].map((kpi, idx) => (
                    <div key={idx} onClick={() => kpi.label === 'À Qualifier' ? onChangeView(AppView.ADMIN_USERS) : null} className={`bg-white dark:bg-[#111827] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${kpi.label === 'À Qualifier' ? 'cursor-pointer hover:border-orange-500 hover:scale-[1.02]' : ''}`}>
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
                    <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white text-orange-600 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 transition-transform active:scale-95">Lancer ma tournée</button>
                </div>
            </div>
        </div>
    );
};
