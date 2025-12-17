
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
    Minus
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

// Reusable Search Bar Component
const DashboardSearchBar = () => (
    <div className="relative mb-6 group z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00C853]/20 to-[#2962FF]/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative bg-white dark:bg-[#161b22] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#2962FF]/50">
            <div className="pl-4 text-gray-400">
                <Search size={20} />
            </div>
            <input 
                type="text" 
                placeholder="Rechercher partout (Utilisateurs, Transactions, Alertes)..." 
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

// --- CITIZEN DASHBOARD ---
const CitizenDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const referralCode = `KIN-${user.firstName.substring(0, 3).toUpperCase()}-${user.id ? user.id.slice(-4) : '2024'}`;

    const data = [
      { name: 'Lun', uv: 2 },
      { name: 'Mar', uv: 1 },
      { name: 'Mer', uv: 3 },
      { name: 'Jeu', uv: 0 },
      { name: 'Ven', uv: 2 },
      { name: 'Sam', uv: 4 },
      { name: 'Dim', uv: 1 },
    ];

    const handleReferralShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Rejoins KIN ECO-MAP',
                text: `Salut ! Utilise mon code de parrainage ${referralCode} pour gagner 50 points gratuits sur KIN ECO-MAP. Ensemble rendons Kinshasa propre ! 🚛🇨🇩`,
                url: 'https://kinecomap.cd/invite',
            }).catch((error) => console.log('Error sharing', error));
        } else {
            alert(`Lien copié : https://kinecomap.cd/invite?code=${referralCode}`);
        }
        setShowShareModal(false);
    };

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-5 md:p-8 space-y-6 animate-fade-in pb-24 md:pb-8">
            <DashboardSearchBar />

            {/* Welcome Card */}
            <div className="bg-gradient-to-br from-[#00C853] via-[#009624] to-[#2962FF] rounded-[2rem] p-6 md:p-10 text-white shadow-2xl shadow-green-500/20 relative overflow-hidden group">
                <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">Bonjour, {user.firstName}! 👋</h1>
                            <p className="opacity-90 mb-6 text-sm md:text-lg font-medium max-w-lg leading-relaxed">
                                Votre prochaine collecte est prévue <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-lg">aujourd'hui à 10:30</span>.
                            </p>
                        </div>
                        <div className="hidden md:block p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                            <Leaf size={32} className="text-white animate-pulse-slow" />
                        </div>
                    </div>
                    
                    <div className="max-w-md bg-black/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Propreté Quartier</span>
                            <span className="text-xl font-black">0%</span>
                        </div>
                        <div className="bg-black/20 h-3 rounded-full overflow-hidden backdrop-blur-sm">
                            <div className="bg-white h-full rounded-full w-0 shadow-[0_0_15px_rgba(255,255,255,0.8)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <div className="flex justify-end mt-3">
                            <button 
                                onClick={() => setShowShareModal(true)}
                                className="flex items-center gap-2 bg-white text-[#00C853] px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-gray-100 shadow-lg active:scale-95"
                            >
                                <Share2 size={14} /> Partager & Parrainer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { icon: Trash2, label: 'Collectes', value: user.collections, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { icon: Recycle, label: 'Recyclage', value: '85%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { icon: Star, label: 'Points', value: user.points, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { icon: Award, label: 'Badges', value: user.badges, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/60 dark:bg-[#161b22]/60 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center text-center hover:shadow-xl hover:border-gray-200 dark:hover:border-gray-700 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                            <stat.icon size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">{stat.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-lg border border-white/40 dark:border-white/5">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#00C853]" />
                        Volume collecté (kg)
                    </h3>
                    <div className="h-56 md:h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#9CA3AF', fontWeight: 600}} axisLine={false} tickLine={false} dy={10} />
                                <Tooltip cursor={{fill: 'rgba(0, 200, 83, 0.1)', radius: 8}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000', padding: '12px' }} />
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
                            <Calendar size={20} className="text-blue-500" />
                            Agenda
                        </h3>
                        <button onClick={() => onChangeView(AppView.PLANNING)} className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider hover:text-[#00C853] transition-colors">Voir tout</button>
                    </div>
                    <div className="bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/40 dark:border-white/5 overflow-hidden flex-1 p-2 space-y-2">
                        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center hover:shadow-md transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mr-4 shrink-0 group-hover:scale-105 transition-transform">
                                <Trash2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white">Déchets ménagers</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1">
                                    <Clock size={12} /> Aujourd'hui, 10:30
                                </p>
                            </div>
                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] uppercase font-black px-3 py-1.5 rounded-lg tracking-wider">À venir</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-transparent flex items-center hover:bg-white dark:hover:bg-white/10 transition-all group">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-4 shrink-0 group-hover:scale-105 transition-transform">
                                <Recycle size={24} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white">Recyclables</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1">
                                    <Clock size={12} /> Mercredi, 14:00
                                </p>
                            </div>
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] uppercase font-black px-3 py-1.5 rounded-lg tracking-wider">Prévu</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 px-2">Actions Rapides</h3>
                <div className="grid grid-cols-4 gap-3 md:gap-4">
                    <button onClick={() => onChangeView(AppView.MAP)} className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1f2937] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-green-600 dark:text-green-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform shadow-inner">
                            <MapIcon size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Carte</span>
                    </button>
                    <button onClick={() => onChangeView(AppView.PLANNING)} className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1f2937] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform shadow-inner">
                            <Calendar size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Planning</span>
                    </button>
                    <button onClick={() => onChangeView(AppView.SUBSCRIPTION)} className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1f2937] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform shadow-inner">
                            <CreditCard size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Payer</span>
                    </button>
                    <button onClick={() => onChangeView(AppView.ACADEMY)} className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-white/5 flex flex-col items-center justify-center hover:bg-white dark:hover:bg-[#1f2937] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-700 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform shadow-inner">
                            <GraduationCap size={24} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">École</span>
                    </button>
                </div>
            </div>

            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-lg" onClick={() => setShowShareModal(false)}></div>
                    <div className="bg-white dark:bg-[#161b22] w-full max-w-sm rounded-[2rem] p-6 relative z-10 shadow-2xl animate-scale-up border border-white/20 dark:border-white/10">
                        <button onClick={() => setShowShareModal(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>

                        <div className="text-center mb-8 mt-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Users size={32} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Invitez & Gagnez</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                Aidez votre communauté à devenir plus propre et gagnez des points éco.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 dark:bg-[#0d1117] p-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-3 relative z-10">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Votre Code</span>
                                    <span className="text-xs font-bold text-[#00C853] bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">+50 pts</span>
                                </div>
                                <div className="flex gap-2 relative z-10">
                                    <div className="flex-1 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-600 rounded-xl flex items-center justify-center font-mono font-bold text-gray-800 dark:text-white text-lg tracking-widest h-12 shadow-sm">
                                        {referralCode}
                                    </div>
                                    <button 
                                        onClick={copyCode}
                                        className="bg-[#2962FF] text-white w-12 h-12 rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center"
                                    >
                                        {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleReferralShare}
                                className="w-full py-4 bg-gradient-to-r from-[#2962FF] to-[#3D5AFE] text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                            >
                                <Share2 size={18} /> Envoyer à un ami
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
    // Simplified State - RESET TO ZERO
    const [currentTime, setCurrentTime] = useState(new Date());
    const [liveData, setLiveData] = useState([
        { id: 1, type: 'alert', content: 'Système initialisé - En attente', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), user: 'System', status: 'info' },
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // RESET TO ZERO
    const analyticsData = [
        { name: 'Lun', revenue: 0, users: 0 },
        { name: 'Mar', revenue: 0, users: 0 },
        { name: 'Mer', revenue: 0, users: 0 },
        { name: 'Jeu', revenue: 0, users: 0 },
        { name: 'Ven', revenue: 0, users: 0 },
        { name: 'Sam', revenue: 0, users: 0 },
        { name: 'Dim', revenue: 0, users: 0 },
    ];

    return (
        <div className="relative min-h-screen bg-[#F5F7FA] dark:bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50"></div>
            
            <div className="relative z-10 p-5 md:p-8 space-y-6 pb-24 md:pb-8">
                <DashboardSearchBar />

                {/* HUD Header */}
                <div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-white/10 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Cpu size={16} className="text-[#2962FF] animate-pulse" />
                            <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Command Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">VUE GLOBALE</h1>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="text-3xl font-mono font-bold text-gray-800 dark:text-white">
                            {currentTime.toLocaleTimeString()}
                        </div>
                        <div className="flex items-center justify-end gap-2 text-green-500 text-xs font-bold uppercase tracking-wider mt-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                            </span>
                            Système Nominal
                        </div>
                    </div>
                </div>

                {/* Stats Cards - Futuristic Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/40 dark:border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#2962FF]">
                                <DollarSign size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-500/10 px-2 py-1 rounded-lg">
                                <Minus size={12} /> 0%
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Revenus (Mensuel)</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">$0.00</h2>
                        </div>
                    </div>

                    {/* Users Card */}
                    <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/40 dark:border-white/5 shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => onChangeView(AppView.ADMIN_USERS)}>
                        <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-[#00C853]">
                                <Users size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-500/10 px-2 py-1 rounded-lg">
                                0 ajd
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Utilisateurs Actifs</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">0</h2>
                        </div>
                    </div>

                    {/* Fleet Card */}
                    <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/40 dark:border-white/5 shadow-xl relative overflow-hidden group cursor-pointer" onClick={() => onChangeView(AppView.ADMIN_VEHICLES)}>
                        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-500">
                                <Truck size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-500/10 px-2 py-1 rounded-lg">
                                <AlertTriangle size={12} /> 0 Maint.
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Flotte Active</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">0<span className="text-lg text-gray-400 font-medium">/35</span></h2>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-purple-500 h-full w-[0%] rounded-full"></div>
                        </div>
                    </div>

                    {/* System Health */}
                    <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/40 dark:border-white/5 shadow-xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl text-cyan-500">
                                <Server size={20} />
                            </div>
                            <span className="text-xs font-bold text-cyan-500 flex items-center gap-1 bg-cyan-500/10 px-2 py-1 rounded-lg animate-pulse">
                                0ms
                            </span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Charge Système</p>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">0%</h2>
                        </div>
                        <div className="flex gap-1 mt-3">
                            {[1,2,3,4,5,6,7,8,9,10].map(i => (
                                <div key={i} className={`flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700`}></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <Activity size={20} className="text-[#2962FF]" />
                                Performance Financière
                            </h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-white dark:bg-white/10 rounded-lg text-xs font-bold text-gray-600 dark:text-white shadow-sm border border-gray-100 dark:border-white/5">Semaine</button>
                                <button className="px-3 py-1 bg-transparent rounded-lg text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-white">Mois</button>
                            </div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00C853" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                                            color: '#fff',
                                            padding: '12px'
                                        }} 
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#2962FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="users" stroke="#00C853" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Management Grid */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-[#2962FF] p-6 rounded-[2rem] text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => onChangeView(AppView.ADMIN_USERS)}>
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Users size={100} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-1">Gérer Users</h3>
                                <p className="opacity-80 text-sm mb-4">Accès, rôles & permissions</p>
                                <div className="bg-white/20 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center">
                                    <ArrowUpRight size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl flex flex-col justify-between">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4">Raccourcis</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => onChangeView(AppView.ADMIN_VEHICLES)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <Truck size={20} className="text-purple-500 mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Flotte</span>
                                </button>
                                <button onClick={() => onChangeView(AppView.ADMIN_SUBSCRIPTIONS)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <CreditCard size={20} className="text-green-500 mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Finance</span>
                                </button>
                                <button onClick={() => onChangeView(AppView.ADMIN_ADS)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <Megaphone size={20} className="text-orange-500 mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Pubs</span>
                                </button>
                                <button onClick={() => onChangeView(AppView.ADMIN_ACADEMY)} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                    <BookOpen size={20} className="text-blue-500 mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Ecole</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Data Feed Table */}
                <div className="bg-white/70 dark:bg-[#111827]/70 backdrop-blur-2xl rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-orange-500" /> Live Operations
                        </h3>
                        <div className="flex gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Temps Réel</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 dark:bg-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 rounded-tl-2xl">Type</th>
                                    <th className="p-4">Message</th>
                                    <th className="p-4">Utilisateur</th>
                                    <th className="p-4">Heure</th>
                                    <th className="p-4 text-center rounded-tr-2xl">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
                                {liveData.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                item.type === 'tx' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                                                item.type === 'alert' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                                                'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                                            }`}>
                                                {item.type === 'tx' ? <DollarSign size={14} /> : item.type === 'alert' ? <AlertTriangle size={14} /> : <UserIcon size={14} />}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800 dark:text-white">{item.content}</td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">{item.user}</td>
                                        <td className="p-4 font-mono text-gray-400 text-xs">{item.time}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                                item.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                item.status === 'warning' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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

             {/* Status Card */}
             <div className="bg-[#2962FF] rounded-[2rem] p-8 text-white shadow-2xl shadow-blue-500/30 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="mb-4 md:mb-0 relative z-10 w-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
                            <span className="text-sm font-bold uppercase tracking-wider opacity-90">En Service</span>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold">
                            {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Zone: {user.zone || 'Gombe-Nord'}</h1>
                    <p className="opacity-80 font-medium text-sm">Véhicule: {user.vehicleType || 'Camion Benne 04'}</p>
                </div>
                
                <div className="flex gap-3 w-full md:w-auto relative z-10 mt-4 md:mt-0">
                    <button className="flex-1 md:flex-none bg-white/20 backdrop-blur-md border border-white/30 py-3 px-6 rounded-xl font-bold hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
                        <Clock size={18} /> Pause
                    </button>
                    <button className="flex-1 md:flex-none bg-red-500 py-3 px-6 rounded-xl font-bold shadow-lg hover:bg-red-600 transition-colors shadow-red-600/30 flex items-center justify-center gap-2">
                        <Zap size={18} /> Fin
                    </button>
                </div>
            </div>

            {/* Daily Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Missions</div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white">12<span className="text-gray-400 text-sm font-normal">/15</span></div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500 w-[80%]"></div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Poids (kg)</div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white">850</div>
                    <div className="text-xs text-green-500 font-bold mt-1">+12% vs Hier</div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Distance</div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white">42<span className="text-sm font-normal">km</span></div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="text-gray-500 text-xs font-bold uppercase mb-1">Signalements</div>
                    <div className="text-2xl font-black text-gray-800 dark:text-white">3</div>
                    <div className="text-xs text-orange-500 font-bold mt-1">À vérifier</div>
                </div>
            </div>

            {/* Tasks / Route Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <MapPin size={20} className="text-[#00C853]" /> Prochaines Collectes
                    </h3>
                    <button onClick={() => onChangeView(AppView.COLLECTOR_JOBS)} className="text-blue-600 font-bold text-xs uppercase hover:underline">Voir tout</button>
                </div>
                <div className="space-y-3">
                    {[
                        { time: '14:30', name: 'Résidence Kinois', address: 'Av. de la Paix 12', status: 'next' },
                        { time: '15:00', name: 'Marché Liberté', address: 'Entrée Sud', status: 'pending' },
                        { time: '15:45', name: 'Hôtel Fleuve', address: 'Gombe', status: 'pending' },
                    ].map((job, idx) => (
                        <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border ${job.status === 'next' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-gray-700/30 border-transparent'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${job.status === 'next' ? 'bg-[#2962FF] text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                                {job.time}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{job.name}</h4>
                                <p className="text-xs text-gray-500">{job.address}</p>
                            </div>
                            {job.status === 'next' && (
                                <button className="p-2 bg-white dark:bg-gray-800 rounded-lg text-blue-600 shadow-sm">
                                    <Navigation size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = (props) => {
    switch (props.user.type) {
        case UserType.ADMIN:
            return <AdminDashboard {...props} />;
        case UserType.COLLECTOR:
            return <CollectorDashboard {...props} />;
        default:
            return <CitizenDashboard {...props} />;
    }
};
