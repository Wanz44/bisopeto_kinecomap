
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Plus, Megaphone, TrendingUp, Eye, MousePointer, Calendar, 
    DollarSign, PauseCircle, PlayCircle, Trash2, Building2, Mail, X, 
    Check, Image as ImageIcon, PieChart, Target, Activity, 
    ShieldCheck, Briefcase, Bot, Loader2, Link as LinkIcon, Smartphone,
    ChevronRight, ExternalLink, Globe, LayoutGrid, BarChart3
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { AdCampaign, Partner, UserType } from '../types';
import { AdsAPI, PartnersAPI } from '../services/api';
import { GoogleGenAI } from "@google/genai";

const KINSHASA_COMMUNES = ["Gombe", "Ngaliema", "Limete", "Bandalungwa", "Kintambo", "Lemba", "Victoire", "Matete", "Masina", "Nsele"];

interface AdminAdsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ onBack, onToast }) => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'partners' | 'analytics'>('campaigns');
    const [ads, setAds] = useState<AdCampaign[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    
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
        <div className="flex flex-col h-full bg-[#F0F2F5] dark:bg-[#050505] transition-colors duration-300 overflow-hidden">
            
            <div className="bg-[#1A237E] dark:bg-gray-900 p-8 text-white relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Megaphone size={200}/></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none">Régie Publicitaire</h2>
                            <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                <ShieldCheck size={12}/> Ad-Server Engine Enterprise
                            </p>
                        </div>
                    </div>

                    <button onClick={() => setShowCampaignModal(true)} className="bg-white text-[#1A237E] px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        <Plus size={18}/> Nouveau Slot Ad
                    </button>
                </div>

                <div className="mt-10 flex gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'campaigns', label: 'Inventaire Ads', icon: LayoutGrid },
                        { id: 'partners', label: 'Annonceurs', icon: Briefcase },
                        { id: 'analytics', label: 'ROI Analytics', icon: BarChart3 }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-[#1A237E] shadow-xl' : 'bg-white/5 text-blue-100 hover:bg-white/10'}`}
                        >
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar pb-32">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={40}/>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Chargement de l'inventaire...</p>
                    </div>
                ) : activeTab === 'campaigns' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-fade-in">
                        {ads.length === 0 ? (
                            <div className="col-span-full py-24 text-center bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <Megaphone size={64} className="mx-auto mb-4 text-gray-200" />
                                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Aucune campagne active</p>
                            </div>
                        ) : ads.map(ad => {
                            const ctr = ad.views > 0 ? ((ad.clicks / ad.views) * 100).toFixed(1) : "0";
                            return (
                                <div key={ad.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                                    <div className="h-44 relative overflow-hidden">
                                        <img src={ad.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={ad.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => handleToggleStatus(ad)} className={`p-2 rounded-xl backdrop-blur-md text-white ${ad.status === 'active' ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                                                {ad.status === 'active' ? <PauseCircle size={18}/> : <PlayCircle size={18}/>}
                                            </button>
                                            <button onClick={() => handleDeleteAd(ad.id)} className="p-2 rounded-xl bg-black/40 backdrop-blur-md text-white/60 hover:text-red-500"><Trash2 size={18}/></button>
                                        </div>
                                        <div className="absolute bottom-4 left-6 right-6">
                                            <h4 className="text-white font-bold uppercase text-base truncate leading-none mb-1">{ad.title}</h4>
                                            <p className="text-[10px] text-blue-300 font-medium uppercase tracking-widest flex items-center gap-1.5"><Building2 size={12}/> {ad.partner}</p>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-3 gap-3 mb-6">
                                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <p className="text-[8px] font-semibold text-gray-400 uppercase mb-1">Vues</p>
                                                <p className="text-sm font-bold dark:text-white">{(ad.views / 1000).toFixed(1)}k</p>
                                            </div>
                                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                                <p className="text-[8px] font-semibold text-gray-400 uppercase mb-1">Clicks</p>
                                                <p className="text-sm font-bold dark:text-white">{ad.clicks}</p>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl">
                                                <p className="text-[8px] font-semibold text-blue-400 uppercase mb-1">CTR</p>
                                                <p className="text-sm font-bold text-blue-600">{ctr}%</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t dark:border-gray-800">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest">Ciblage Géo</span>
                                                <span className="text-[10px] font-bold dark:text-white uppercase truncate">{ad.targetCommune === 'all' ? 'Tout Kinshasa' : ad.targetCommune}</span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-widest">Budget Consommé</span>
                                                <span className="text-[10px] font-bold text-green-600">${ad.spent.toFixed(1)} / ${ad.budget}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                        <Activity size={48} className="opacity-20" />
                        <p className="text-xs font-semibold uppercase tracking-[0.2em]">Module {activeTab} en cours de synchronisation...</p>
                    </div>
                )}
            </div>

            {showCampaignModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCampaignModal(false)}></div>
                    <div className="bg-white dark:bg-[#0d1117] rounded-[3rem] w-full max-w-5xl relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800 flex flex-col lg:flex-row overflow-hidden max-h-[95vh]">
                        
                        <div className="flex-1 p-8 lg:p-12 overflow-y-auto no-scrollbar border-r dark:border-gray-800">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Slot Publicitaire</h3>
                                <button type="button" onClick={() => setShowCampaignModal(false)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                            </div>
                            
                            <form onSubmit={handleCreateAd} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Annonceur Pro</label>
                                        <select required className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white shadow-inner" value={adForm.partner} onChange={e => setAdForm({...adForm, partner: e.target.value})}>
                                            <option value="">Sélectionner</option>
                                            {partners.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Budget Total ($)</label>
                                        <input type="number" required className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs dark:text-white shadow-inner" value={adForm.budget} onChange={e => setAdForm({...adForm, budget: Number(e.target.value)})} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Slogan Marketing</label>
                                        <button 
                                            type="button" 
                                            onClick={handleGenerateCopyIA} 
                                            disabled={isGeneratingIA}
                                            className="text-[9px] font-bold text-blue-500 uppercase flex items-center gap-1.5 hover:underline disabled:opacity-50"
                                        >
                                            {isGeneratingIA ? <Loader2 size={10} className="animate-spin"/> : <Bot size={10}/>}
                                            Générer par IA
                                        </button>
                                    </div>
                                    <input required className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white shadow-inner" placeholder="ex: Mbote Kinshasa! Profitez de..." value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Ciblage Géographique</label>
                                        <select className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-xs dark:text-white shadow-inner" value={adForm.targetCommune} onChange={e => setAdForm({...adForm, targetCommune: e.target.value})}>
                                            <option value="all">Tout Kinshasa</option>
                                            {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Profil Cible</label>
                                        <select className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-bold text-xs dark:text-white shadow-inner" value={adForm.targetUserType} onChange={e => setAdForm({...adForm, targetUserType: e.target.value as any})}>
                                            <option value="all">Tous</option>
                                            <option value={UserType.CITIZEN}>Citoyens</option>
                                            <option value={UserType.BUSINESS}>Entreprises</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Lien Image URL (HD)</label>
                                    <div className="relative">
                                        <ImageIcon size={18} className="absolute left-5 top-5 text-gray-400" />
                                        <input required className="w-full pl-14 pr-5 py-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-medium text-xs dark:text-white shadow-inner" placeholder="https://cloud.com/image.jpg" value={adForm.image} onChange={e => setAdForm({...adForm, image: e.target.value})} />
                                    </div>
                                </div>

                                <button disabled={isSaving} className="w-full py-6 bg-[#1A237E] text-white rounded-[2rem] font-bold uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSaving ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18}/>}
                                    Lancer la Campagne
                                </button>
                            </form>
                        </div>

                        <div className="hidden lg:flex w-[450px] bg-gray-100 dark:bg-[#050505] p-12 flex-col items-center justify-center border-l dark:border-gray-800 relative">
                             <div className="absolute top-8 left-10 flex items-center gap-2">
                                <Smartphone size={16} className="text-blue-600"/>
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Prévisualisation In-App</span>
                             </div>
                             
                             <button onClick={() => setShowCampaignModal(false)} className="absolute top-8 right-10 p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={20}/></button>

                             <div className="w-[300px] h-[600px] bg-white dark:bg-black rounded-[4rem] border-[12px] border-gray-900 dark:border-gray-800 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-20"></div>
                                
                                <div className="p-5 pt-12 space-y-6 opacity-40">
                                    <div className="h-4 w-28 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                                    <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-[1.5rem]"></div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>
                                    </div>
                                </div>
                                
                                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2">
                                    <div className="flex items-center justify-between px-3 mb-2">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Megaphone size={10} className="text-blue-600"/> Bons Plans {adForm.targetCommune === 'all' ? 'Kin' : adForm.targetCommune}</span>
                                        <span className="text-[7px] font-medium text-gray-300 uppercase">Sponsorisé</span>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-fade-in">
                                        <div className="h-36 bg-gray-50 dark:bg-gray-800 relative">
                                            {adForm.image ? (
                                                <img src={adForm.image} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={48}/></div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                                            <div className="absolute bottom-4 left-6 right-6">
                                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">{adForm.partner || 'Votre Marque'}</p>
                                                <h5 className="text-white font-bold uppercase text-[13px] leading-tight line-clamp-2">{adForm.title || 'Votre slogan apparaîtra ici'}</h5>
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
