
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

// --- LEAFLET SETUP FOR DASHBOARD ---
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const DashboardSearchBar = () => (
    <div className="relative mb-6 group z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00C853]/20 to-[#2962FF]/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative bg-white dark:bg-[#161b22] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#2962FF]/50">
            <div className="pl-4 text-gray-400">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Rechercher partout (Collectes, Aide, Academy)..." 
                className="w-full py-4 px-4 bg-transparent outline-none text-gray-800 dark:text-white font-medium placeholder-gray-400"
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

// --- PENDING ACCOUNT SCREEN ---
const PendingDashboard: React.FC<DashboardProps> = ({ user }) => {
    return (
        <div className="p-5 md:p-12 min-h-screen flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="bg-white dark:bg-[#161b22] p-10 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-white/5 max-w-xl">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <PhoneCall size={48} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Compte en cours de qualification</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed font-medium">
                    Mbote <span className="text-[#2962FF] font-bold">{user.firstName}</span> ! Pour garantir la sécurité de notre plateforme, un agent Bisopeto examine votre profil.
                    <br/><br/>
                    Nous vous appellerons au <span className="font-black text-gray-800 dark:text-white">{user.phone}</span> d'ici <span className="font-bold text-[#00C853]">24h maximum</span>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-3">
                        <ShieldCheck className="text-[#00C853]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Sécurité vérifiée</span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center gap-3">
                        <Clock className="text-[#2962FF]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Service Express</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CITIZEN DASHBOARD ---
const CitizenDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const referralCode = `KIN-${user.firstName.substring(0, 3).toUpperCase()}-${user.id ? user.id.slice(-4) : '2024'}`;
    const data = [ { name: 'Lun', uv: 0 }, { name: 'Mar', uv: 0 }, { name: 'Mer', uv: 0 }, { name: 'Jeu', uv: 0 }, { name: 'Ven', uv: 0 }, { name: 'Sam', uv: 0 }, { name: 'Dim', uv: 0 } ];

    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />
            <div className="bg-gradient-to-br from-[#00C853] via-[#009624] to-[#2962FF] rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Bonjour, {user.firstName}! 👋</h1>
                    <p className="opacity-90 mb-6 text-sm md:text-lg font-medium max-w-lg leading-relaxed">
                        Votre prochaine collecte est prévue <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg">aujourd'hui à 10:30</span>.
                    </p>
                    <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 bg-white text-[#00C853] px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-100 shadow-lg active:scale-95">
                        <Share2 size={14} /> Partager & Parrainer
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Trash2, label: 'Collectes', value: user.collections, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { icon: Recycle, label: 'Recyclage', value: '0%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: Star, label: 'Points', value: user.points, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { icon: Award, label: 'Badges', value: user.badges, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/60 dark:bg-[#161b22]/60 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center text-center group">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{stat.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg border border-white/40 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#00C853]" /> Volume collecté (kg)
                    </h3>
                    <div className="h-56 md:h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9CA3AF', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                                <Tooltip cursor={{fill: 'rgba(0, 200, 83, 0.1)', radius: 8}} />
                                <Bar dataKey="uv" radius={[6, 6, 6, 6]} barSize={32}>
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
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Calendar size={20} className="text-blue-500" /> Agenda
                        </h3>
                        <button onClick={() => onChangeView(AppView.PLANNING)} className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-[#00C853] transition-colors">Voir tout</button>
                    </div>
                    <div className="bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/40 dark:border-white/5 p-2 space-y-2">
                        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center group">
                            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mr-4 shrink-0">
                                <Trash2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white">Déchets ménagers</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1"><Clock size={12} /> Aujourd'hui, 10:30</p>
                            </div>
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-lg">À venir</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- BUSINESS DASHBOARD ---
const BusinessDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />
            <div className="bg-gradient-to-br from-[#2962FF] via-[#0044FF] to-[#001133] rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Mbote Entreprise! 🏢</h1>
                    <p className="opacity-90 mb-6 text-sm md:text-lg font-medium max-w-lg leading-relaxed">
                        Gestionnaire: <span className="font-bold">{user.firstName}</span>. Votre conformité environnementale est de <span className="font-bold text-green-400">92%</span>.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => onChangeView(AppView.PLANNING)} className="bg-white text-blue-700 px-6 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
                            <Calendar size={18} /> Gérer Passages
                        </button>
                    </div>
                </div>
                <div className="absolute right-[-10%] bottom-[-20%] opacity-10 rotate-12">
                    <Factory size={300} />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Weight, label: 'Total Volume (T)', value: '1.2', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: Recycle, label: 'Taux Tri', value: '78%', color: 'text-green-500', bg: 'bg-green-500/10' },
                    { icon: CreditCard, label: 'Factures', value: '0', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    { icon: Award, label: 'Certif. Eco', value: 'OR', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/60 dark:bg-[#161b22]/60 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                            <stat.icon size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{stat.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg border border-white/40 dark:border-white/5">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Prochains Enlèvements Industriels</h3>
                <div className="space-y-4">
                     {[1,2].map(i => (
                         <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                             <div className="flex items-center gap-4">
                                 <Truck className="text-blue-500" />
                                 <div>
                                     <p className="font-bold text-gray-800 dark:text-white">Collecte Grand Volume</p>
                                     <p className="text-xs text-gray-500">Demain à 08:00</p>
                                 </div>
                             </div>
                             <span className="text-xs font-bold text-blue-600">CONFIRMÉ</span>
                         </div>
                     ))}
                </div>
            </div>
        </div>
    );
};

// --- COLLECTOR DASHBOARD ---
const CollectorDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />
            <div className="bg-gradient-to-br from-[#FF6D00] to-[#E65100] rounded-[2rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Mbote, {user.firstName}! 🚛</h1>
                    <p className="opacity-90 mb-6 text-sm md:text-lg font-medium max-w-lg">
                        Vous avez <span className="font-bold">4 missions</span> en attente aujourd'hui dans la zone <span className="font-bold">{user.zone || 'Gombe'}</span>.
                    </p>
                    <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="bg-white text-orange-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                        <ClipboardList size={20} /> Voir mes tâches
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: Trash2, label: 'Collectes', value: user.collections, color: 'text-white', bg: 'bg-white/20' },
                    { icon: Weight, label: 'Volume (kg)', value: '450', color: 'text-white', bg: 'bg-white/20' },
                    { icon: MapPin, label: 'Arrêts', value: '12', color: 'text-white', bg: 'bg-white/20' },
                    { icon: Activity, label: 'Efficacité', value: '98%', color: 'text-white', bg: 'bg-white/20' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-orange-500/90 dark:bg-orange-600/20 backdrop-blur-xl p-5 rounded-[1.5rem] text-white">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}><stat.icon size={20} /></div>
                        <span className="text-2xl font-black tracking-tight">{stat.value}</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveData, setLiveData] = useState([
        { id: 1, type: 'alert', content: 'Système initialisé - En attente', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), user: 'System', status: 'info' },
    ]);
    useEffect(() => { const interval = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(interval); }, []);

    return (
        <div className="relative min-h-screen overflow-hidden">
            <div className="p-5 md:p-8 space-y-6 pb-24 md:pb-8">
                <DashboardSearchBar />
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2"><Cpu size={16} className="text-[#2962FF] animate-pulse" /><span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-widest">Command Center</span></div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">VUE GLOBALE</h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-3xl font-mono font-bold text-gray-800 dark:text-white">{currentTime.toLocaleTimeString()}</div>
                        <div className="flex items-center justify-end gap-2 text-green-500 text-xs font-bold uppercase mt-1"><span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span></span>Système Nominal</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white/80 dark:bg-[#111827]/80 p-5 rounded-[1.5rem] border dark:border-white/5 shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => onChangeView(AppView.ADMIN_USERS)}>
                        <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-[#00C853] w-fit mb-4"><Users size={20} /></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Utilisateurs</p>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white">1,240</h2>
                    </div>
                    <div className="bg-white/80 dark:bg-[#111827]/80 p-5 rounded-[1.5rem] border dark:border-white/5 shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => onChangeView(AppView.ADMIN_VEHICLES)}>
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-500 w-fit mb-4"><Truck size={20} /></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Flotte Active</p>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white">35/40</h2>
                    </div>
                    <div className="bg-white/80 dark:bg-[#111827]/80 p-5 rounded-[1.5rem] border dark:border-white/5 shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => onChangeView(AppView.ADMIN_SUBSCRIPTIONS)}>
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 w-fit mb-4"><DollarSign size={20} /></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Revenus (MTD)</p>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white">$12.4k</h2>
                    </div>
                    <div className="bg-white/80 dark:bg-[#111827]/80 p-5 rounded-[1.5rem] border dark:border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 w-fit mb-4"><AlertTriangle size={20} /></div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase mb-1">Incidents Ouverts</p>
                        <h2 className="text-3xl font-black text-gray-800 dark:text-white">2</h2>
                    </div>
                </div>
                
                <div className="bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Activity size={20} className="text-orange-500" /> Opérations Temps Réel</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-[10px] uppercase font-bold text-gray-400">
                                <tr><th className="p-4">Message</th><th className="p-4">Utilisateur</th><th className="p-4">Heure</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                                {liveData.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5"><td className="p-4 font-semibold text-gray-800 dark:text-white">{item.content}</td><td className="p-4 text-gray-500 dark:text-gray-400">{item.user}</td><td className="p-4 font-mono text-gray-400 text-xs">{item.time}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = (props) => {
    // Check if user is qualified
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
