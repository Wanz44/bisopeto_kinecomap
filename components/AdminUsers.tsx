
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw,
    FileText, CheckCircle, Fingerprint, ShieldQuestion, ChevronRight, CheckCircle as CheckIcon,
    Package, Activity, FileWarning, HelpCircle, Zap, Filter, Users, DownloadCloud,
    TrendingUp, ArrowUpDown, UserMinus, UserX, BarChart3, SortAsc, SortDesc,
    // Fix: Added missing Radio icon import
    Radio
} from 'lucide-react';
import { UserPermission, User as AppUser, UserType, WasteReport } from '../types';
import { UserAPI, ReportsAPI, SettingsAPI } from '../services/api';

interface AdminUsersProps {
    onBack: () => void;
    currentUser: AppUser;
    onNotify: (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ALL_PERMISSIONS: { key: UserPermission; label: string; desc: string }[] = [
    { key: 'manage_users', label: 'Gestion Utilisateurs', desc: 'Gestion complète des comptes' },
    { key: 'validate_docs', label: 'Validation KYC', desc: 'Vérifier et approuver les documents d\'identité.' },
    { key: 'system_settings', label: 'Configuration Système', desc: 'Modifier les paramètres globaux et API.' },
    { key: 'view_finance', label: 'Reporting Financier', desc: 'Consulter les revenus et statistiques.' },
    { key: 'manage_recovery', label: 'Recouvrement Cash', desc: 'Encaissement cash et facturation QR.' },
    { key: 'manage_subscriptions', label: 'Gestion Abonnements', desc: 'Validation des plans abonnés.' },
    { key: 'manage_ads', label: 'Régie Publicitaire', desc: 'Créer et monitorer les campagnes.' },
    { key: 'manage_communications', label: 'Centre de Comm.', desc: 'Envoi de notifications push.' },
    { key: 'manage_reports', label: 'SIG & Reports', desc: 'Gestion des alertes déchets.' },
    { key: 'manage_fleet', label: 'Gestion Flotte', desc: 'Suivi camions et GPS.' },
    { key: 'manage_marketplace', label: 'Marketplace', desc: 'Modération des annonces.' },
    { key: 'manage_academy', label: 'Academy', desc: 'Gestion des cours et XP.' },
    { key: 'export_data', label: 'Audit et CSV', desc: 'Extraction des données au format CSV.' },
];

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack, currentUser, onNotify, onToast }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [rolesConfig, setRolesConfig] = useState<Record<string, UserPermission[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'points' | 'tonnage' | 'date'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'permissions' | 'impact'>('identity');
    const [editForm, setEditForm] = useState<Partial<AppUser>>({});

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, config] = await Promise.all([
                UserAPI.getAll(),
                SettingsAPI.getRolesConfig()
            ]);
            setUsers(usersData);
            setRolesConfig(config);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    // --- KPIs calculés ---
    const stats = useMemo(() => {
        return {
            total: users.length,
            pending: users.filter(u => u.status === 'pending').length,
            active: users.filter(u => u.status === 'active').length,
            tonnageTotal: users.reduce((acc, u) => acc + (u.totalTonnage || 0), 0)
        };
    }, [users]);

    const handleApplyDefaultPerms = () => {
        const type = editForm.type;
        if (type && rolesConfig[type]) {
            setEditForm({ ...editForm, permissions: rolesConfig[type] });
            onToast?.(`Permissions par défaut pour ${type} appliquées.`, "info");
        }
    };

    const handleUpdatePermission = (perm: UserPermission) => {
        const currentPerms = editForm.permissions || [];
        const newPerms = currentPerms.includes(perm)
            ? currentPerms.filter(p => p !== perm)
            : [...currentPerms, perm];
        setEditForm({ ...editForm, permissions: newPerms });
    };

    const handleSave = async (statusOverride?: 'active' | 'suspended') => {
        if (!selectedUser?.id) return;
        setIsSaving(true);
        
        const finalStatus = statusOverride || editForm.status || 'pending';
        const finalForm = { ...editForm, status: finalStatus };

        try {
            await UserAPI.update(finalForm as any);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...finalForm } as AppUser : u));
            
            if (finalStatus === 'active' && selectedUser.status === 'pending') {
                onNotify(selectedUser.id, "Compte Activé ! 🎉", "Félicitations, votre accès au réseau Biso Peto a été validé.", "success");
            }

            if (onToast) onToast(`Utilisateur mis à jour`, "success");
            setSelectedUser(null);
        } catch (e) {
            onToast?.("Erreur sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBatchAction = async (action: 'active' | 'suspended' | 'delete') => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Appliquer "${action}" à ${selectedIds.length} comptes ?`)) return;

        setIsSaving(true);
        try {
            await Promise.all(selectedIds.map(id => UserAPI.update({ id, status: action === 'delete' ? 'suspended' : action })));
            onToast?.(`${selectedIds.length} comptes mis à jour`, "success");
            setSelectedIds([]);
            loadData();
        } catch (e) {
            onToast?.("Erreur traitement groupé", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const exportUsersToCSV = () => {
        const headers = ["ID", "Prénom", "Nom", "Type", "Statut", "Commune", "Téléphone", "Tonnage", "Points"];
        const rows = filteredUsers.map(u => [u.id, u.firstName, u.lastName, u.type, u.status, u.commune, u.phone, u.totalTonnage || 0, u.points]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `biso_peto_users_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast?.("Export CSV généré", "info");
    };

    const filteredUsers = useMemo(() => {
        return users
            .filter(u => {
                const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
                const matchesRole = filterRole === 'all' || u.type === filterRole;
                const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase());
                return matchesStatus && matchesRole && matchesSearch;
            })
            .sort((a, b) => {
                let valA: any = a[sortBy === 'name' ? 'firstName' : sortBy === 'tonnage' ? 'totalTonnage' : sortBy] || 0;
                let valB: any = b[sortBy === 'name' ? 'firstName' : sortBy === 'tonnage' ? 'totalTonnage' : sortBy] || 0;
                if (sortOrder === 'asc') return valA > valB ? 1 : -1;
                return valA < valB ? 1 : -1;
            });
    }, [users, search, filterStatus, filterRole, sortBy, sortOrder]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
             
             {/* Header Dynamique */}
             <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console Membres</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Radio size={12} className="text-blue-500 animate-pulse" /> Réseau Cloud Actif
                            </p>
                        </div>
                    </div>

                    {/* KPI Section */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 xl:max-w-2xl">
                        {[
                            { label: 'Total Comptes', val: stats.total, icon: Users, color: 'text-blue-600' },
                            { label: 'En attente', val: stats.pending, icon: Clock, color: 'text-orange-500', pulse: stats.pending > 0 },
                            { label: 'Tonnage Réseau', val: `${stats.tonnageTotal}kg`, icon: Zap, color: 'text-green-600' },
                            { label: 'Exportation', val: 'CSV', icon: DownloadCloud, color: 'text-gray-500', action: exportUsersToCSV }
                        ].map((kpi, i) => (
                            <div key={i} onClick={kpi.action} className={`bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex items-center gap-3 border dark:border-gray-700 ${kpi.action ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 ${kpi.color} shadow-sm`}>
                                    <kpi.icon size={16} className={kpi.pulse ? 'animate-bounce' : ''} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{kpi.label}</p>
                                    <p className="text-sm font-black dark:text-white leading-none">{kpi.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Barre d'Actions Groupées */}
                {selectedIds.length > 0 && (
                    <div className="mt-6 flex items-center justify-between p-4 bg-[#2962FF] text-white rounded-2xl animate-fade-in-up shadow-xl">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} sélectionnés</span>
                            <button onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white"><X size={16}/></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleBatchAction('active')} className="px-4 py-2 bg-white text-[#2962FF] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"><Check size={14}/> Activer</button>
                            <button onClick={() => handleBatchAction('suspended')} className="px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg"><Ban size={14}/> Suspendre</button>
                        </div>
                    </div>
                )}

                {/* Filtres & Recherche */}
                <div className="mt-6 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher par nom, téléphone ou email..." 
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white shadow-inner"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar w-full lg:w-auto">
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border-none outline-none font-black text-[10px] uppercase dark:text-white">
                            <option value="all">Tous les rôles</option>
                            <option value={UserType.CITIZEN}>Citoyens</option>
                            <option value={UserType.COLLECTOR}>Collecteurs</option>
                            <option value={UserType.BUSINESS}>Entreprises</option>
                            <option value={UserType.ADMIN}>Admins</option>
                        </select>
                        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border-none outline-none font-black text-[10px] uppercase dark:text-white">
                            <option value="date">Tri : Date Inscription</option>
                            <option value="points">Tri : Points Eco</option>
                            <option value="tonnage">Tri : Tonnage Impact</option>
                            <option value="name">Tri : Ordre Alphabétique</option>
                        </select>
                        <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="p-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500">
                            {sortOrder === 'asc' ? <SortAsc size={20}/> : <SortDesc size={20}/>}
                        </button>
                    </div>
                </div>
             </div>

             {/* Liste Membres */}
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Synchronisation Cloud...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-30">
                        <UserMinus size={64} className="mx-auto mb-4" />
                        <p className="font-black uppercase text-xs">Aucun résultat trouvé</p>
                    </div>
                ) : filteredUsers.map(u => {
                    const isSelected = selectedIds.includes(u.id!);
                    return (
                        <div key={u.id} className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border-2 transition-all group relative overflow-hidden flex flex-col ${isSelected ? 'border-[#2962FF] shadow-xl' : 'border-gray-50 dark:border-gray-800 shadow-sm hover:border-blue-200'}`}>
                            <div onClick={() => toggleSelect(u.id!)} className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer z-10 ${isSelected ? 'bg-[#2962FF] border-[#2962FF] text-white shadow-inner' : 'bg-gray-50 dark:bg-gray-800 border-gray-200'}`}>
                                {isSelected && <Check size={12} strokeWidth={4}/>}
                            </div>
                            
                            <div onClick={() => { setSelectedUser(u); setEditForm(u); }} className="cursor-pointer">
                                <div className="flex justify-between items-start mb-6 pl-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${u.type === 'admin' ? 'bg-gray-900 text-white' : u.type === 'collector' ? 'bg-orange-100 text-orange-600' : u.type === 'business' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        {u.type === 'collector' ? <Truck size={24}/> : u.type === 'business' ? <Briefcase size={24}/> : u.firstName[0]}
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${u.status === 'pending' ? 'bg-orange-500 text-white animate-pulse' : u.status === 'suspended' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                        {u.status}
                                    </span>
                                </div>
                                <h3 className="font-black text-gray-900 dark:text-white uppercase truncate tracking-tight text-sm">{u.firstName} {u.lastName}</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{u.commune} • {u.type}</p>
                                
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl text-center">
                                        <p className="text-[7px] font-black text-gray-400 uppercase">Impact</p>
                                        <p className="text-xs font-black dark:text-white">{u.totalTonnage || 0}kg</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-xl text-center">
                                        <p className="text-[7px] font-black text-gray-400 uppercase">Eco-Points</p>
                                        <p className="text-xs font-black text-blue-500">{u.points}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>

             {/* Tiroir de Détails & Édition */}
             {selectedUser && (
                 <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}></div>
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col overflow-hidden border-l dark:border-gray-800">
                        
                        <div className="p-8 pb-4 flex justify-between items-start border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-[#2962FF] text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl">{selectedUser.firstName[0]}</div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Fingerprint size={12}/> ID : {selectedUser.id?.slice(-12).toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={24}/></button>
                        </div>

                        <div className="px-8 flex border-b dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10 shadow-sm overflow-x-auto no-scrollbar">
                            {[
                                { id: 'identity', label: 'Profil & Statut', icon: User },
                                { id: 'impact', label: 'Impact Environnemental', icon: Activity },
                                { id: 'permissions', label: 'Privilèges RBAC', icon: ShieldCheck }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}>
                                    <tab.icon size={14}/> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de compte</label>
                                            <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-black text-xs dark:text-white appearance-none" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                                                <option value="citizen">Citoyen</option>
                                                <option value="business">Entreprise</option>
                                                <option value="collector">Collecteur</option>
                                                <option value="admin">Administrateur</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">État actuel</label>
                                            <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none font-black text-xs dark:text-white appearance-none" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                                                <option value="pending">⏳ En attente</option>
                                                <option value="active">✅ Actif</option>
                                                <option value="suspended">🚫 Suspendu</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12}/> Contacts & Localisation</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div><p className="text-[8px] font-black text-gray-400 uppercase">Téléphone</p><p className="text-sm font-black dark:text-white">{selectedUser.phone}</p></div>
                                            <div><p className="text-[8px] font-black text-gray-400 uppercase">Commune</p><p className="text-sm font-black dark:text-white uppercase">{selectedUser.commune}</p></div>
                                            <div className="col-span-2"><p className="text-[8px] font-black text-gray-400 uppercase">Quartier / Adresse</p><p className="text-sm font-black dark:text-white uppercase">{selectedUser.neighborhood} • {selectedUser.address}</p></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'impact' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-8 bg-green-50 dark:bg-green-900/10 rounded-[3rem] border border-green-100 dark:border-green-900/30 text-center">
                                            <Trash2 className="text-green-600 mx-auto mb-3" size={32}/>
                                            <p className="text-4xl font-black text-green-700 dark:text-green-400">{selectedUser.totalTonnage || 0} <span className="text-lg">kg</span></p>
                                            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-1">Déchets Valorisés</p>
                                        </div>
                                        <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 text-center">
                                            <Zap className="text-blue-600 mx-auto mb-3" size={32}/>
                                            <p className="text-4xl font-black text-blue-700 dark:text-blue-400">{selectedUser.points}</p>
                                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1">Points Eco cumulés</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Score de Fiabilité Citoyenne</h4>
                                        <div className="flex items-end gap-1 mb-2">
                                            <div className="h-10 w-4 bg-green-500 rounded-t-lg"></div>
                                            <div className="h-14 w-4 bg-green-500 rounded-t-lg"></div>
                                            <div className="h-8 w-4 bg-green-500 rounded-t-lg"></div>
                                            <div className="h-16 w-4 bg-blue-500 rounded-t-lg"></div>
                                            <div className="h-12 w-4 bg-blue-500 rounded-t-lg ml-auto px-10 flex flex-col items-center">
                                                <span className="text-3xl font-black dark:text-white">98%</span>
                                                <span className="text-[8px] font-bold text-gray-400 uppercase">Excellent</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold leading-relaxed">Basé sur {selectedUser.collections || 0} collectes validées sans litige par les experts terrain.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="space-y-6 animate-fade-in">
                                    <button onClick={handleApplyDefaultPerms} className="w-full py-4 bg-blue-50 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-blue-100 mb-6 flex items-center justify-center gap-2"><RefreshCw size={14}/> Restaurer par défaut ({editForm.type})</button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {ALL_PERMISSIONS.map(p => {
                                            const isActive = editForm.permissions?.includes(p.key);
                                            return (
                                                <div key={p.key} onClick={() => handleUpdatePermission(p.key)} className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isActive ? 'border-[#00C853] bg-green-50 dark:bg-green-900/10' : 'border-gray-50 dark:border-gray-900 hover:border-blue-100'}`}>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors ${isActive ? 'bg-[#00C853] border-[#00C853] text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200'}`}>
                                                        {isActive && <CheckIcon size={12} strokeWidth={5} />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-[11px] font-black uppercase tracking-tight ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{p.label}</p>
                                                        <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5">{p.desc}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0 shadow-2xl flex gap-3">
                             <button 
                                onClick={() => handleSave()}
                                disabled={isSaving}
                                className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                                Sauvegarder
                            </button>
                            <button className="p-5 bg-red-50 text-red-500 rounded-[1.8rem] hover:bg-red-500 hover:text-white transition-all"><Trash2 size={24}/></button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
