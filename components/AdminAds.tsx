
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Plus, Megaphone, TrendingUp, Eye, MousePointer, Calendar, 
    DollarSign, PauseCircle, PlayCircle, Trash2, BarChart3, Filter, 
    Upload, Building2, Mail, Phone, MoreVertical, Edit2, User, X, 
    // Add CheckCircle2 to imports
    Check, Image as ImageIcon, PieChart, Target, MapPin, Activity, 
    ArrowUpRight, Download, Zap, ShieldCheck, Clock, Layers, Briefcase,
    CheckCircle2
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { AdCampaign, Partner } from '../types';
import { AdsAPI, PartnersAPI } from '../services/api';

const KINSHASA_COMMUNES = ["Gombe", "Ngaliema", "Limete", "Bandalungwa", "Kintambo", "Lemba", "Victoire", "Matete"];

const MOCK_PERF_DATA = [
    { day: 'Lun', views: 400, clicks: 24 },
    { day: 'Mar', views: 300, clicks: 18 },
    { day: 'Mer', views: 600, clicks: 42 },
    { day: 'Jeu', views: 800, clicks: 56 },
    { day: 'Ven', views: 700, clicks: 48 },
    { day: 'Sam', views: 1100, clicks: 82 },
    { day: 'Dim', views: 1200, clicks: 94 },
];

export const AdminAds: React.FC<AdminAdsProps> = ({ onBack, onToast }) => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'partners' | 'analytics'>('campaigns');
    const [ads, setAds] = useState<AdCampaign[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'ended'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail / Modal states
    const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [p, a] = await Promise.all([PartnersAPI.getAll(), AdsAPI.getAll()]);
            setPartners(p);
            setAds(a);
        } catch (e) {
            onToast?.("Erreur de chargement Cloud", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Enterprise Calculations ---
    const globalStats = useMemo(() => {
        const totalViews = ads.reduce((acc, ad) => acc + (ad.views || 0), 0);
        const totalClicks = ads.reduce((acc, ad) => acc + (ad.clicks || 0), 0);
        const totalSpend = ads.reduce((acc, ad) => acc + (ad.spent || 0), 0);
        const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0";
        return { totalViews, totalClicks, totalSpend, ctr };
    }, [ads]);

    const handleToggleStatus = async (ad: AdCampaign) => {
        const newStatus = ad.status === 'active' ? 'paused' : 'active';
        try {
            await AdsAPI.updateStatus(ad.id, newStatus);
            setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
            onToast?.(`Campagne ${newStatus === 'active' ? 'activée' : 'suspendue'}`, "success");
        } catch (e) {
            onToast?.("Erreur lors de la mise à jour", "error");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!window.confirm("Supprimer cette campagne ? Les données analytics seront perdues.")) return;
        try {
            await AdsAPI.delete(id);
            setAds(prev => prev.filter(a => a.id !== id));
            onToast?.("Campagne supprimée définitivement", "success");
        } catch (e) {
            onToast?.("Erreur suppression", "error");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            
            {/* --- REGIE HEADER --- */}
            <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Régie Publicitaire</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Activity size={12} className="text-blue-500"/> Console Ad-Manager Enterprise
                            </p>
                        </div>
                    </div>

                    {/* Global Performance KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-3xl">
                        {[
                            { label: 'Revenu Total', val: `$${globalStats.totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
                            { label: 'Portée (Impressions)', val: `${(globalStats.totalViews / 1000).toFixed(1)}k`, icon: Eye, color: 'text-blue-600' },
                            { label: 'Efficacité (CTR)', val: `${globalStats.ctr}%`, icon: MousePointer, color: 'text-purple-600' },
                            { label: 'Partenaires', val: partners.length, icon: Building2, color: 'text-orange-600' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border dark:border-gray-700/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <kpi.icon size={12} className={kpi.color} />
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                                </div>
                                <p className="text-lg font-black dark:text-white leading-none">{kpi.val}</p>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setShowCampaignModal(true)} className="bg-[#2962FF] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Plus size={18}/> Créer Campagne
                    </button>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
                    {[
                        { id: 'campaigns', label: 'Campagnes', icon: Megaphone },
                        { id: 'partners', label: 'Annonceurs', icon: Briefcase },
                        { id: 'analytics', label: 'Rapports Globaux', icon: PieChart }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-400'}`}
                        >
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar pb-32">
                
                {activeTab === 'campaigns' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                        {ads.length === 0 ? (
                            <div className="col-span-full py-20 text-center opacity-30">
                                <Megaphone size={64} className="mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Aucune campagne configurée</p>
                            </div>
                        ) : ads.map(ad => {
                            const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : "0";
                            return (
                                <div key={ad.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-gray-50 dark:border-gray-800 overflow-hidden group hover:border-blue-500 transition-all shadow-sm">
                                    <div className="h-40 relative overflow-hidden">
                                        <img src={ad.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => handleToggleStatus(ad)} className={`p-2 rounded-xl backdrop-blur-md text-white transition-all ${ad.status === 'active' ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                                                {ad.status === 'active' ? <PauseCircle size={18}/> : <PlayCircle size={18}/>}
                                            </button>
                                            <button onClick={() => handleDeleteAd(ad.id)} className="p-2 rounded-xl bg-black/40 backdrop-blur-md text-white/60 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="absolute bottom-4 left-6 right-6">
                                            <h4 className="text-white font-black uppercase tracking-tight truncate">{ad.title}</h4>
                                            <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest flex items-center gap-1"><Building2 size={10}/> {ad.partner}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Vues</p>
                                                <p className="text-xs font-black dark:text-white">{(ad.views / 1000).toFixed(1)}k</p>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Clics</p>
                                                <p className="text-xs font-black dark:text-white">{ad.clicks}</p>
                                            </div>
                                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                                <p className="text-[7px] font-black text-blue-400 uppercase mb-1">CTR</p>
                                                <p className="text-xs font-black text-blue-600">{ctr}%</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[8px] font-black text-gray-400 uppercase">Utilisation Budget</span>
                                                <span className="text-[10px] font-black dark:text-white">${ad.spent} / ${ad.budget}</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${ad.spent/ad.budget > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(ad.spent / ad.budget) * 100}%` }}></div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => setSelectedCampaign(ad)}
                                            className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                                        >
                                            Ouvrir Analytics détaillés
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'partners' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {partners.map(p => (
                            <div key={p.id} className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center group relative">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2rem] overflow-hidden mb-6 p-2 flex items-center justify-center border-2 border-transparent group-hover:border-blue-500 transition-all">
                                    <img src={p.logo} alt={p.name} className="max-w-full max-h-full object-contain" />
                                </div>
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter mb-1">{p.name}</h3>
                                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-6">{p.industry}</span>
                                
                                <div className="w-full grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                        <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Campagnes</p>
                                        <p className="text-sm font-black dark:text-white">{p.activeCampaigns}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                                        <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Total Investi</p>
                                        <p className="text-sm font-black text-green-600">${p.totalBudget.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full">
                                    <a href={`mailto:${p.email}`} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-50 hover:text-white transition-all flex items-center justify-center gap-2"><Mail size={14}/> Contact</a>
                                    <button className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Activity className="text-blue-500"/> Trafic Publicitaire Global</h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_PERF_DATA}>
                                        <defs>
                                            <linearGradient id="colorViewsAdm" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.05)" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                                        <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)'}} />
                                        <Area type="monotone" dataKey="views" stroke="#2962FF" strokeWidth={4} fillOpacity={1} fill="url(#colorViewsAdm)" />
                                        <Area type="monotone" dataKey="clicks" stroke="#00C853" strokeWidth={4} fill="transparent" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Répartition par Secteur</h4>
                                <div className="h-64 flex items-center justify-center">
                                    <div className="text-center opacity-30"><PieChart size={64} className="mx-auto mb-2"/><p className="text-[10px] font-black uppercase">Data Engine en cours...</p></div>
                                </div>
                             </div>
                             <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Top Zones de Portée (Communes)</h4>
                                <div className="space-y-4">
                                    {['Ngaliema', 'Gombe', 'Limete', 'Bandal'].map((commune, i) => (
                                        <div key={commune} className="flex items-center gap-4">
                                            <span className="text-[10px] font-black text-gray-500 w-20">{commune}</span>
                                            <div className="flex-1 h-3 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${90 - (i*15)}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-black dark:text-white">{90 - (i*15)}k</span>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- DRAWER DÉTAILLÉ (Enterprise Analytics) --- */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCampaign(null)}></div>
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col border-l dark:border-gray-800 overflow-hidden">
                        <div className="p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl p-2 border-2 border-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
                                    <img src={selectedCampaign.image} className="w-full h-full object-cover rounded-lg" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{selectedCampaign.title}</h3>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <CheckCircle2 size={12}/> Campagne certifiée active
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
                            {/* Detailed Graph */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-2">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance Hebdomadaire</h4>
                                    <div className="flex gap-4 text-[9px] font-black uppercase">
                                        <span className="flex items-center gap-1.5 text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Vues</span>
                                        <span className="flex items-center gap-1.5 text-green-500"><div className="w-2 h-2 rounded-full bg-green-500"></div> Clics</span>
                                    </div>
                                </div>
                                <div className="h-64 bg-gray-50 dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-inner">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={MOCK_PERF_DATA}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: '900', fill: '#94a3b8'}} />
                                            <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                                            <Bar dataKey="views" fill="#2962FF" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="clicks" fill="#00C853" radius={[4, 4, 0, 0]} barSize={10} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 space-y-4">
                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> Ciblage Zones</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {['Limete', 'Gombe', 'Ngaliema'].map(c => (
                                            <span key={c} className="px-3 py-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-[8px] font-black uppercase dark:text-white">{c}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 space-y-4">
                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Calendrier</h5>
                                    <div>
                                        <p className="text-[10px] font-black dark:text-white uppercase leading-none">{selectedCampaign.startDate}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Date Lancement</p>
                                    </div>
                                    <div className="pt-2 border-t dark:border-gray-800">
                                        <p className="text-[10px] font-black dark:text-white uppercase leading-none">{selectedCampaign.endDate}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Échéance Prévue</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><DollarSign size={150}/></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4 text-white">Bilan Financier Campagne</p>
                                    <div className="flex items-end gap-3 mb-8">
                                        <span className="text-5xl font-black tracking-tighter leading-none">${selectedCampaign.spent}</span>
                                        <span className="text-sm font-black uppercase opacity-60 mb-1.5">consommés sur ${selectedCampaign.budget}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 border-t border-white/20 pt-6">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">CPC Moyen</p>
                                            <p className="text-xl font-black">${(selectedCampaign.spent / selectedCampaign.clicks || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Estimation Portée</p>
                                            <p className="text-xl font-black">{(selectedCampaign.views / 1000).toFixed(1)}k pers.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 flex gap-4 shrink-0 shadow-2xl">
                             <button className="flex-1 py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3"><Download size={18}/> Rapport CSV</button>
                             <button onClick={() => setSelectedCampaign(null)} className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl"><X size={24}/></button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CRÉATION CAMPAGNE --- */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCampaignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-xl p-10 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Nouvelle Diffusion</h3>
                            <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Annonceur</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white">
                                        <option value="">Sélectionner un partenaire</option>
                                        {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de média</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white">
                                        <option>Bannière Dashboard</option>
                                        <option>Splash Screen</option>
                                        <option>Notif Push Sponsorisée</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Titre de la campagne</label>
                                <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" placeholder="ex: Sensibilisation Plastique 2025" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Budget Initial ($)</label>
                                    <input type="number" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" placeholder="1000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone de Ciblage</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white">
                                        <option>Tout Kinshasa</option>
                                        {KINSHASA_COMMUNES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-50 transition-colors">
                                <ImageIcon size={32} className="text-gray-300" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Glisser l'image créative (HD)</span>
                            </div>

                            <button className="w-full py-5 bg-[#2962FF] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                <ShieldCheck size={20}/> Valider et Mettre en Ligne
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AdminAdsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}
