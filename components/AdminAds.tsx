
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, Megaphone, TrendingUp, Eye, MousePointer, Calendar, DollarSign, PauseCircle, PlayCircle, Trash2, BarChart3, Filter, ListFilter, Upload, Building2, Mail, Phone, MoreVertical, Edit2, User, X, Check, Image as ImageIcon, PieChart } from 'lucide-react';
import { AdCampaign, Partner } from '../types';
import { AdsAPI, PartnersAPI } from '../services/api';

interface AdminAdsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminAds: React.FC<AdminAdsProps> = ({ onBack, onToast }) => {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'partners'>('campaigns');
    
    // Ads State
    const [ads, setAds] = useState<AdCampaign[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'ended'>('all');
    const [sortBy, setSortBy] = useState<'startDate' | 'endDate'>('startDate');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);
    
    // Campaign Modal State
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [newCampaign, setNewCampaign] = useState<Partial<AdCampaign>>({
        status: 'active',
        budget: 1000,
        spent: 0,
        views: 0,
        clicks: 0
    });

    // Partners State
    const [partners, setPartners] = useState<Partner[]>([]);
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [isEditingPartner, setIsEditingPartner] = useState(false);
    const [currentPartner, setCurrentPartner] = useState<Partial<Partner>>({});
    
    const partnerFileInputRef = useRef<HTMLInputElement>(null);

    // Initial Data Load
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const p = await PartnersAPI.getAll();
        setPartners(p);
        const a = await AdsAPI.getAll();
        setAds(a);
    };

    // --- Campaign Logic ---
    const handleToggleStatus = async (id: string) => {
        const ad = ads.find(a => a.id === id);
        if (!ad) return;
        const newStatus = ad.status === 'active' ? 'paused' : 'active';
        
        await AdsAPI.updateStatus(id, newStatus);
        
        setAds(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
        if (onToast) onToast(`Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`, "info");
    };

    const handleDeleteAd = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
            await AdsAPI.delete(id);
            setAds(prev => prev.filter(ad => ad.id !== id));
            if (onToast) onToast("Campagne supprimée", "success");
        }
    };

    const handleSaveCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        const campaign: AdCampaign = {
            id: '',
            title: newCampaign.title || 'Nouvelle Campagne',
            partner: newCampaign.partner || 'Partenaire Inconnu',
            status: newCampaign.status || 'active',
            views: 0,
            clicks: 0,
            budget: newCampaign.budget || 1000,
            spent: 0,
            startDate: newCampaign.startDate || new Date().toLocaleDateString('fr-FR'),
            endDate: newCampaign.endDate || new Date(Date.now() + 86400000 * 30).toLocaleDateString('fr-FR'),
            image: newCampaign.image || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80'
        };
        
        const created = await AdsAPI.add(campaign);
        setAds([created, ...ads]);
        setShowCampaignModal(false);
        setNewCampaign({ status: 'active', budget: 1000, spent: 0, views: 0, clicks: 0 });
        if (onToast) onToast("Campagne publicitaire créée avec succès", "success");
    };

    // Helper pour convertir "JJ/MM/AAAA" en objet Date pour comparaison
    const parseFrenchDate = (dateStr: string) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    const filteredAds = ads
        .filter(ad => statusFilter === 'all' || ad.status === statusFilter)
        .filter(ad => {
            // Logique de filtrage par date
            if (!dateStart && !dateEnd) return true;

            const adStart = parseFrenchDate(ad.startDate);
            const adEnd = parseFrenchDate(ad.endDate);
            
            // Les inputs date retournent YYYY-MM-DD
            const filterStart = dateStart ? new Date(dateStart) : null;
            const filterEnd = dateEnd ? new Date(dateEnd) : null;

            // Vérifier chevauchement des périodes
            // La campagne est valide si elle se termine après le début du filtre ET commence avant la fin du filtre
            if (filterStart && adEnd && adEnd < filterStart) return false;
            if (filterEnd && adStart && adStart > filterEnd) return false;

            return true;
        })
        .sort((a, b) => {
            const dateA = parseFrenchDate(a[sortBy]);
            const dateB = parseFrenchDate(b[sortBy]);
            if (dateA && dateB) return dateB.getTime() - dateA.getTime();
            return 0; 
        });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'paused': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'ended': return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
            default: return 'bg-gray-100';
        }
    };

    // --- Partner Logic ---
    const handleSavePartner = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isEditingPartner && currentPartner.id) {
            await PartnersAPI.update(currentPartner as Partner);
            setPartners(prev => prev.map(p => p.id === currentPartner.id ? { ...p, ...currentPartner } as Partner : p));
            if (onToast) onToast("Partenaire mis à jour", "success");
        } else {
            const newPartner: Partner = {
                id: '',
                name: currentPartner.name || 'Nouveau Partenaire',
                industry: currentPartner.industry || 'Autre',
                contactName: currentPartner.contactName || '',
                email: currentPartner.email || '',
                phone: currentPartner.phone || '',
                activeCampaigns: 0,
                totalBudget: 0,
                logo: currentPartner.logo || `https://ui-avatars.com/api/?name=${(currentPartner.name || 'N').substring(0,2)}&background=random&color=fff`,
                status: 'active'
            };
            const created = await PartnersAPI.add(newPartner);
            setPartners([...partners, created]);
            if (onToast) onToast("Nouveau partenaire ajouté", "success");
        }
        setShowPartnerModal(false);
        setCurrentPartner({});
    };

    const handleDeletePartner = async (id: string) => {
        if (confirm('Supprimer ce partenaire ? Cela archivera toutes ses campagnes.')) {
            await PartnersAPI.delete(id);
            setPartners(prev => prev.filter(p => p.id !== id));
            if (onToast) onToast("Partenaire supprimé", "success");
        }
    };

    const openPartnerModal = (partner?: Partner) => {
        if (partner) {
            setCurrentPartner(partner);
            setIsEditingPartner(true);
        } else {
            setCurrentPartner({});
            setIsEditingPartner(false);
        }
        setShowPartnerModal(true);
    };

    const handlePartnerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCurrentPartner(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Publicités & Partenaires</h2>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('campaigns')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'campaigns' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Megaphone size={16} /> Campagnes
                    </button>
                    <button 
                        onClick={() => setActiveTab('partners')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'partners' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Building2 size={16} /> Partenaires
                    </button>
                </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
                
                {/* === CAMPAIGNS VIEW === */}
                {activeTab === 'campaigns' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                        <DollarSign size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">0% <TrendingUp size={12} /></span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">$0.00</h3>
                                <p className="text-xs text-gray-500">Revenus Publicitaires</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                                        <Eye size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">0% <TrendingUp size={12} /></span>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">0</h3>
                                <p className="text-xs text-gray-500">Impressions Totales</p>
                            </div>

                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg">
                                        <Megaphone size={20} />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{ads.filter(a => a.status === 'active').length}</h3>
                                <p className="text-xs text-gray-500">Campagnes Actives</p>
                            </div>
                        </div>

                        {/* Combined Filter Toolbar */}
                        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="flex w-full xl:w-auto p-1 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'all', label: 'Tous' },
                                    { id: 'active', label: 'Actifs' },
                                    { id: 'paused', label: 'En Pause' },
                                    { id: 'ended', label: 'Terminés' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setStatusFilter(filter.id as any)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                                            statusFilter === filter.id 
                                            ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center">
                                {/* Date Filters Integrated */}
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600 w-full sm:w-auto">
                                    <Calendar size={16} className="text-gray-400 shrink-0" />
                                    <input 
                                        type="date" 
                                        value={dateStart}
                                        onChange={(e) => setDateStart(e.target.value)}
                                        className="bg-transparent text-sm font-semibold text-gray-800 dark:text-white outline-none w-28 lg:w-auto"
                                        title="Date de début"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input 
                                        type="date" 
                                        value={dateEnd}
                                        onChange={(e) => setDateEnd(e.target.value)}
                                        className="bg-transparent text-sm font-semibold text-gray-800 dark:text-white outline-none w-28 lg:w-auto"
                                        title="Date de fin"
                                    />
                                    {(dateStart || dateEnd) && (
                                        <button onClick={() => { setDateStart(''); setDateEnd(''); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full ml-1">
                                            <X size={14} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>

                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="w-full sm:w-auto bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    >
                                        <option value="startDate">Date de début</option>
                                        <option value="endDate">Date de fin</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                         {/* Quick Actions */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Actions Rapides</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setShowCampaignModal(true)}
                                    className="flex items-center justify-center gap-3 py-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all hover:border-blue-300 dark:hover:border-blue-700 group"
                                >
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full group-hover:scale-110 transition-transform">
                                        <Plus size={20} />
                                    </div>
                                    Créer une nouvelle campagne
                                </button>
                                <button 
                                    onClick={() => alert("Importation bientôt disponible")}
                                    className="flex items-center justify-center gap-3 py-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-750 transition-all hover:border-gray-300 dark:hover:border-gray-600 group"
                                >
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform">
                                        <Upload size={20} />
                                    </div>
                                    Importer des campagnes
                                </button>
                            </div>
                        </div>

                        {/* Ads List */}
                        <div className="space-y-4">
                             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">Liste des campagnes ({filteredAds.length})</h3>
                            {filteredAds.length === 0 && (
                                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <Filter size={40} className="mx-auto text-gray-300 mb-3" />
                                    <p className="text-gray-500">Aucune campagne ne correspond aux filtres.</p>
                                </div>
                            )}
                            {filteredAds.map(ad => (
                                <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                                    <div className="w-full md:w-48 h-32 md:h-auto bg-gray-200 relative shrink-0">
                                        <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-white text-[10px] font-bold">APERÇU</div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-lg text-gray-800 dark:text-white">{ad.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(ad.status)}`}>{ad.status === 'active' ? 'Actif' : ad.status === 'paused' ? 'En Pause' : 'Terminé'}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 flex items-center gap-1"><BarChart3 size={14} /> {ad.partner}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleToggleStatus(ad.id)} className={`p-2 rounded-full transition-colors ${ad.status === 'active' ? 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50' : 'text-green-500 hover:bg-green-50'}`}>
                                                    {ad.status === 'active' ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                                                </button>
                                                <button onClick={() => handleDeleteAd(ad.id)} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs">Vues</span>
                                                <div className="font-bold text-gray-800 dark:text-white flex items-center gap-1"><Eye size={14} className="text-blue-500" /> {(ad.views / 1000).toFixed(1)}k</div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs">Clics</span>
                                                <div className="font-bold text-gray-800 dark:text-white flex items-center gap-1"><MousePointer size={14} className="text-purple-500" /> {ad.clicks}</div>
                                            </div>
                                            <div className="flex flex-col md:col-span-2">
                                                <div className="flex justify-between items-end mb-1">
                                                    <span className="text-gray-400 text-xs">Budget Utilisé</span>
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">${ad.spent} / ${ad.budget}</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${ad.spent / ad.budget > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(ad.spent / ad.budget) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span className={sortBy === 'startDate' ? 'text-blue-600 font-medium' : ''}>Début: {ad.startDate}</span>
                                                <span className="mx-1">-</span>
                                                <span className={sortBy === 'endDate' ? 'text-blue-600 font-medium' : ''}>Fin: {ad.endDate}</span>
                                            </div>
                                            <button onClick={() => setSelectedCampaign(ad)} className="text-blue-600 hover:underline">Voir détails</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* === PARTNERS VIEW === */}
                {activeTab === 'partners' && (
                    <div className="space-y-6 animate-fade-in">
                         <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">
                                Partenaires ({partners.length})
                            </h3>
                            <button 
                                onClick={() => openPartnerModal()}
                                className="bg-[#2962FF] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                            >
                                <Plus size={18} /> Nouveau Partenaire
                            </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {partners.map(partner => (
                                <div key={partner.id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                                                <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{partner.name}</h4>
                                                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded-full font-medium inline-block mt-1">
                                                    {partner.industry}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openPartnerModal(partner)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeletePartner(partner.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <User size={14} className="text-gray-400" />
                                            <span className="font-medium">{partner.contactName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <Mail size={14} className="text-gray-400" />
                                            <span>{partner.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{partner.phone}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400">Campagnes Actives</p>
                                            <p className="font-bold text-gray-800 dark:text-white">{partner.activeCampaigns}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">Budget Total</p>
                                            <p className="font-bold text-gray-800 dark:text-white">${partner.totalBudget.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Card (Empty State-ish) */}
                            <button 
                                onClick={() => openPartnerModal()}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-[#2962FF] hover:border-[#2962FF] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all min-h-[250px] group"
                            >
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                                    <Plus size={32} />
                                </div>
                                <span className="font-bold text-sm">Ajouter un partenaire</span>
                            </button>
                         </div>
                    </div>
                )}

            </div>

            {/* PARTNER MODAL */}
            {showPartnerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPartnerModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{isEditingPartner ? 'Modifier Partenaire' : 'Nouveau Partenaire'}</h3>
                            <button onClick={() => setShowPartnerModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePartner} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de l'entreprise</label>
                                <div className="relative">
                                    <Building2 size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={currentPartner.name || ''}
                                        onChange={e => setCurrentPartner({...currentPartner, name: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Industrie</label>
                                    <select 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={currentPartner.industry || ''}
                                        onChange={e => setCurrentPartner({...currentPartner, industry: e.target.value})}
                                    >
                                        <option value="">Choisir...</option>
                                        <option>Gouvernement</option>
                                        <option>Industrie</option>
                                        <option>Commerce</option>
                                        <option>Technologie</option>
                                        <option>ONG</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Principal</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={currentPartner.contactName || ''}
                                        onChange={e => setCurrentPartner({...currentPartner, contactName: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input 
                                        type="email" 
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={currentPartner.email || ''}
                                        onChange={e => setCurrentPartner({...currentPartner, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                                    <input 
                                        type="tel" 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={currentPartner.phone || ''}
                                        onChange={e => setCurrentPartner({...currentPartner, phone: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                                    <div className="flex gap-4 items-start">
                                        <div 
                                            onClick={() => partnerFileInputRef.current?.click()}
                                            className="w-32 h-32 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative overflow-hidden bg-gray-50 dark:bg-gray-800 shrink-0"
                                        >
                                            {currentPartner.logo ? (
                                                <>
                                                    <img 
                                                        src={currentPartner.logo} 
                                                        alt="Logo" 
                                                        className="w-full h-full object-contain" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold text-xs">
                                                        Modifier
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center p-2">
                                                    <Upload size={24} className="mx-auto text-gray-400 mb-1" />
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Uploader</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 space-y-3">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Format recommandé : PNG Transparent, 512x512px.
                                                Cliquez sur le carré pour uploader un fichier local.
                                            </p>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Ou via URL</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF] text-sm"
                                                    placeholder="https://..."
                                                    value={currentPartner.logo || ''}
                                                    onChange={e => setCurrentPartner({...currentPartner, logo: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={partnerFileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handlePartnerLogoUpload}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3.5 mt-4 bg-[#2962FF] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={20} /> Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CAMPAIGN MODAL */}
            {showCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCampaignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Nouvelle Campagne</h3>
                            <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCampaign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre de la campagne</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    value={newCampaign.title || ''}
                                    onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                                    placeholder="Ex: Sensibilisation Tri 2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Partenaire</label>
                                <select 
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    value={newCampaign.partner || ''}
                                    onChange={e => setNewCampaign({...newCampaign, partner: e.target.value})}
                                >
                                    <option value="">Sélectionner un partenaire</option>
                                    {partners.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        value={newCampaign.budget}
                                        onChange={e => setNewCampaign({...newCampaign, budget: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image (URL)</label>
                                    <div className="relative">
                                        <ImageIcon size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                            value={newCampaign.image || ''}
                                            onChange={e => setNewCampaign({...newCampaign, image: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {newCampaign.image && (
                                        <div className="mt-2 relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 h-24 bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={newCampaign.image}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                Aperçu
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Début</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        onChange={e => setNewCampaign({...newCampaign, startDate: new Date(e.target.value).toLocaleDateString('fr-FR')})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Fin</label>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                        onChange={e => setNewCampaign({...newCampaign, endDate: new Date(e.target.value).toLocaleDateString('fr-FR')})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                className="w-full py-3.5 mt-4 bg-[#00C853] hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Megaphone size={20} /> Lancer la campagne
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaign Details Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCampaign(null)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl animate-fade-in-up">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedCampaign.title}</h3>
                                <p className="text-sm text-gray-500">{selectedCampaign.partner}</p>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Image */}
                        <div className="w-full h-40 bg-gray-200 rounded-xl mb-6 overflow-hidden">
                            <img src={selectedCampaign.image} alt={selectedCampaign.title} className="w-full h-full object-cover" />
                        </div>

                        {/* Budget Progression Section */}
                        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-750 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                        <DollarSign size={16} />
                                    </div>
                                    Budget Consommé
                                </h4>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">
                                    {((selectedCampaign.spent / selectedCampaign.budget) * 100).toFixed(1)}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                <div 
                                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                                        selectedCampaign.spent / selectedCampaign.budget > 0.9 
                                        ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                                    }`} 
                                    style={{ width: `${Math.min(100, (selectedCampaign.spent / selectedCampaign.budget) * 100)}%` }}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Dépensé</p>
                                    <p className="font-bold text-gray-800 dark:text-white">${selectedCampaign.spent.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total</p>
                                    <p className="font-bold text-gray-800 dark:text-white">${selectedCampaign.budget.toLocaleString()}</p>
                                </div>
                            </div>
                            
                            {/* Remaining info */}
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                 <span className="text-xs text-gray-500">Reste disponible</span>
                                 <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                    ${(selectedCampaign.budget - selectedCampaign.spent).toLocaleString()}
                                 </span>
                            </div>
                        </div>

                        {/* Other stats briefly */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedCampaign.views}</div>
                                <div className="text-xs text-gray-500">Vues</div>
                             </div>
                             <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedCampaign.clicks}</div>
                                <div className="text-xs text-gray-500">Clics</div>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
