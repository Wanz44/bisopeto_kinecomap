
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Plus, Megaphone, TrendingUp, Eye, MousePointer, Calendar, 
    DollarSign, PauseCircle, PlayCircle, Trash2, BarChart3, Filter, 
    Upload, Building2, Mail, Phone, MoreVertical, Edit2, User, X, 
    Check, Image as ImageIcon, PieChart, Target, MapPin, Activity, 
    ArrowUpRight, Download, Zap, ShieldCheck, Clock, Layers, Briefcase,
    CheckCircle2, Bot, Loader2, Sparkles, Link as LinkIcon, Smartphone,
    ChevronRight, ExternalLink
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { AdCampaign, Partner, UserType } from '../types';
import { AdsAPI, PartnersAPI } from '../services/api';
import { GoogleGenAI } from "@google/genai";

const KINSHASA_COMMUNES = ["Gombe", "Ngaliema", "Limete", "Bandalungwa", "Kintambo", "Lemba", "Victoire", "Matete", "Masina", "Nsele"];

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
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    
    const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [adForm, setAdForm] = useState<Partial<AdCampaign>>({
        title: '',
        partner: '',
        status: 'active',
        budget: 500,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        image: '',
        targetCommune: 'all',
        targetUserType: 'all' as any,
        link: ''
    });

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

    const globalStats = useMemo(() => {
        const totalViews = ads.reduce((acc, ad) => acc + (ad.views || 0), 0);
        const totalClicks = ads.reduce((acc, ad) => acc + (ad.clicks || 0), 0);
        const totalSpend = ads.reduce((acc, ad) => acc + (ad.spent || 0), 0);
        const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0";
        return { totalViews, totalClicks, totalSpend, ctr };
    }, [ads]);

    const handleGenerateCopyIA = async () => {
        if (!adForm.partner) {
            onToast?.("Sélectionnez d'abord un annonceur", "info");
            return;
        }
        setIsGeneratingIA(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Génère une accroche publicitaire courte (max 60 caractères) pour un partenaire de Biso Peto nommé "${adForm.partner}". Le style doit être professionnel mais kinois (mélange français/lingala). Réponds uniquement par le texte brut sans guillemets.`,
            });
            setAdForm({ ...adForm, title: response.text.replace(/"/g, '') });
            onToast?.("Slogan IA généré !", "success");
        } catch (e) {
            onToast?.("IA indisponible", "error");
        } finally {
            setIsGeneratingIA(false);
        }
    };

    const handleCreateAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adForm.partner || !adForm.title) return;
        setIsSaving(true);
        try {
            const created = await AdsAPI.add(adForm as AdCampaign);
            setAds([created, ...ads]);
            setShowCampaignModal(false);
            onToast?.("Campagne enterprise publiée", "success");
        } catch (e) {
            onToast?.("Erreur lors de la création", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async (ad: AdCampaign) => {
        const newStatus = ad.status === 'active' ? 'paused' : 'active';
        try {
            await AdsAPI.updateStatus(ad.id, newStatus);
            setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
            onToast?.(`Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`, "success");
        } catch (e) {
            onToast?.("Erreur mise à jour", "error");
        }
    };

    const handleDeleteAd = async (id: string) => {
        if (!window.confirm("Supprimer cette campagne ?")) return;
        try {
            await AdsAPI.delete(id);
            setAds(prev => prev.filter(a => a.id !== id));
            onToast?.("Campagne supprimée", "success");
        } catch (e) {
            onToast?.("Erreur suppression", "error");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            
            <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Régie</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Activity size={12} className="text-blue-500"/> Ad-Server Engine Enterprise
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-3xl">
                        {[
                            { label: 'Impressions', val: `${(globalStats.totalViews / 1000).toFixed(1)}k`, icon: Eye, color: 'text-blue-600' },
                            { label: 'Efficacité (CTR)', val: `${globalStats.ctr}%`, icon: MousePointer, color: 'text-purple-600' },
                            { label: 'Budget Total', val: `$${globalStats.totalSpend.toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
                            { label: 'Annonceurs', val: partners.length, icon: Building2, color: 'text-orange-600' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border dark:border-gray-700/50 shadow-inner">
                                <div className="flex items-center gap-2 mb-1">
                                    <kpi.icon size={12} className={kpi.color} />
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                                </div>
                                <p className="text-lg font-black dark:text-white leading-none">{kpi.val}</p>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setShowCampaignModal(true)} className="bg-[#2962FF] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                        <Plus size={18}/> Nouvelle Campagne
                    </button>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
                    {[
                        { id: 'campaigns', label: 'Matrice Publicitaire', icon: Megaphone },
                        { id: 'partners', label: 'Annonceurs Pros', icon: Briefcase },
                        { id: 'analytics', label: 'ROI Analytics', icon: PieChart }
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

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar pb-32">
                
                {activeTab === 'campaigns' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                        {ads.length === 0 ? (
                            <div className="col-span-full py-20 text-center opacity-30">
                                <Megaphone size={64} className="mx-auto mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Flux publicitaire vide</p>
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
                                            <h4 className="text-white font-black uppercase tracking-tight truncate leading-none">{ad.title}</h4>
                                            <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1.5"><Building2 size={10}/> {ad.partner}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Vues</p>
                                                <p className="text-xs font-black dark:text-white">{(ad.views / 1000).toFixed(1)}k</p>
                                            </div>
                                            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                <p className="text-[7px] font-black text-gray-400 uppercase mb-1">Clicks</p>
                                                <p className="text-xs font-black dark:text-white">{ad.clicks}</p>
                                            </div>
                                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                                                <p className="text-[7px] font-black text-blue-400 uppercase mb-1">CTR</p>
                                                <p className="text-xs font-black text-blue-600">{ctr}%</p>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Ciblage</span>
                                                <span className="text-[9px] font-black dark:text-white uppercase truncate max-w-[150px]">{ad.targetCommune} • {ad.targetUserType}</span>
                                            </div>
                                            <button onClick={() => setSelectedCampaign(ad)} className="text-[9px] font-black text-blue-500 uppercase hover:underline">ROI Stats</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL CRÉATION CAMPAGNE ENTERPRISE AVEC LIVE PREVIEW */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCampaignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-5xl relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800 flex flex-col md:flex-row overflow-hidden max-h-[95vh]">
                        
                        {/* 1. Formulaire à gauche */}
                        <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar border-r dark:border-gray-800">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Slot Publicitaire</h3>
                                <button type="button" onClick={() => setShowCampaignModal(false)} className="p-2 md:hidden hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
                            </div>
                            
                            <form onSubmit={handleCreateAd} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Annonceur Pro</label>
                                        <select required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white" value={adForm.partner} onChange={e => setAdForm({...adForm, partner: e.target.value})}>
                                            <option value="">Sélectionner</option>
                                            {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Format</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-xs dark:text-white">
                                            <option>Carousel Citoyen</option>
                                            <option>Notif Sponsorisée</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Slogan Marketing</label>
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateCopyIA} 
                                            disabled={isGeneratingIA}
                                            className="text-[9px] font-black text-blue-500 uppercase flex items-center gap-1.5 hover:underline disabled:opacity-50"
                                        >
                                            {isGeneratingIA ? <Loader2 size={10} className="animate-spin"/> : <Bot size={10}/>}
                                            Suggérer par IA
                                        </button>
                                    </div>
                                    <input required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" placeholder="ex: Mbote Kinshasa! Profitez de..." value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ciblage Géo</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-black text-xs dark:text-white" value={adForm.targetCommune} onChange={e => setAdForm({...adForm, targetCommune: e.target.value})}>
                                            <option value="all">Tout Kinshasa</option>
                                            {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profil Cible</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-black text-xs dark:text-white" value={adForm.targetUserType} onChange={e => setAdForm({...adForm, targetUserType: e.target.value as any})}>
                                            <option value="all">Tous</option>
                                            <option value={UserType.CITIZEN}>Citoyens</option>
                                            <option value={UserType.BUSINESS}>Entreprises</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Image URL (Lien Cloud)</label>
                                    <div className="relative">
                                        <ImageIcon size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input required className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white shadow-inner" placeholder="https://..." value={adForm.image} onChange={e => setAdForm({...adForm, image: e.target.value})} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lien de Destination</label>
                                    <div className="relative">
                                        <LinkIcon size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white shadow-inner" placeholder="https://site-annonceur.com" value={adForm.link} onChange={e => setAdForm({...adForm, link: e.target.value})} />
                                    </div>
                                </div>

                                <button disabled={isSaving} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSaving ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18}/>}
                                    {isSaving ? "Synchronisation..." : "Valider et Diffuser"}
                                </button>
                            </form>
                        </div>

                        {/* 2. Prévisualisation Live à droite */}
                        <div className="hidden md:flex w-[400px] bg-gray-50 dark:bg-gray-900 p-12 flex-col items-center justify-center gap-8 border-l dark:border-gray-800 relative">
                             <div className="absolute top-8 left-8 flex items-center gap-2">
                                <Smartphone size={16} className="text-blue-500"/>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prévisualisation mobile</span>
                             </div>
                             
                             <button onClick={() => setShowCampaignModal(false)} className="absolute top-8 right-8 p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={20}/></button>

                             {/* Le téléphone simulé */}
                             <div className="w-[280px] h-[580px] bg-white dark:bg-black rounded-[3.5rem] border-[10px] border-gray-900 dark:border-gray-800 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-20"></div>
                                <div className="p-4 pt-10 space-y-6 opacity-40">
                                    <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                    <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                    </div>
                                </div>
                                
                                {/* L'annonce injectée */}
                                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 animate-bounce-slow">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2 px-2"><Megaphone size={10} className="text-blue-500"/> Bons Plans {adForm.targetCommune === 'all' ? 'Kinshasa' : adForm.targetCommune}</p>
                                    <div className="bg-white dark:bg-gray-900 rounded-[2.2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                        <div className="h-32 bg-gray-200 dark:bg-gray-800 relative">
                                            {adForm.image ? (
                                                <img src={adForm.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400"><ImageIcon size={40}/></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                            <div className="absolute bottom-3 left-6 right-6">
                                                <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest mb-1">{adForm.partner || 'Annonceur'}</p>
                                                <h5 className="text-white font-black uppercase text-sm leading-tight truncate">{adForm.title || 'Votre slogan apparaîtra ici'}</h5>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                             </div>
                        </div>
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
