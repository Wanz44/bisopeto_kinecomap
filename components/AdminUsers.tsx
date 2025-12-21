
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw,
    FileText, CheckCircle, Fingerprint, ShieldQuestion, ChevronRight, CheckCircle as CheckIcon,
    Package, Activity, FileWarning, HelpCircle
} from 'lucide-react';
import { UserPermission, User as AppUser, UserType, WasteReport } from '../types';
import { UserAPI, ReportsAPI } from '../services/api';

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
    const [allReports, setAllReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // States du Tiroir (Drawer)
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'documents' | 'permissions' | 'history'>('identity');
    const [editForm, setEditForm] = useState<Partial<AppUser>>({});

    // KYC State
    const [kycChecklist, setKycChecklist] = useState({
        identity: false,
        address: false,
        phone: false,
        tos: false
    });
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionForm, setShowRejectionForm] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, reportsData] = await Promise.all([
                UserAPI.getAll(),
                UserAPI.getAll() // Simplifié pour la démo, ReportsAPI.getAll() en temps normal
            ]);
            setUsers(usersData);
            setAllReports([]); // Placeholder
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleOpenEdit = (user: AppUser) => {
        setSelectedUser(user);
        setEditForm({ ...user });
        setActiveTab('identity');
        setKycChecklist({ identity: false, address: false, phone: false, tos: false });
        setRejectionReason('');
        setShowRejectionForm(false);
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
            } else if (finalStatus === 'suspended') {
                onNotify(selectedUser.id, "Compte Suspendu ⚠️", rejectionReason || "Votre compte nécessite une vérification supplémentaire.", "alert");
            }

            if (onToast) onToast(`Utilisateur mis à jour: ${finalStatus.toUpperCase()}`, "success");
            setSelectedUser(null);
        } catch (e) {
            if (onToast) onToast("Erreur lors de la sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
        const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const isKycComplete = Object.values(kycChecklist).every(v => v);

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
             {/* Header */}
             <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Réseau & KYC</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{users.length} membres • {users.filter(u => u.status === 'pending').length} en attente</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white w-64 shadow-inner"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 font-black text-[10px] uppercase outline-none dark:text-gray-300 border-none shadow-inner cursor-pointer"
                        >
                            <option value="all">Tous</option>
                            <option value="pending">À Qualifier 🟡</option>
                            <option value="active">Actifs 🟢</option>
                            <option value="suspended">Suspendus 🔴</option>
                        </select>
                    </div>
                </div>
             </div>

             {/* Grid Liste */}
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Accès sécurisé à la base...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                        <HelpCircle size={48} className="opacity-10"/>
                        <p className="font-black uppercase text-xs tracking-widest">Aucun membre trouvé</p>
                    </div>
                ) : filteredUsers.map(user => (
                    <div key={user.id} onClick={() => handleOpenEdit(user)} className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${user.status === 'pending' ? 'border-orange-200 shadow-orange-100 dark:border-orange-900/30' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                        {user.status === 'pending' && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500 text-white flex items-center justify-center translate-x-6 -translate-y-6 rotate-45 shadow-lg"><Clock size={14}/></div>}
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                                    user.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                } group-hover:scale-110`}>
                                    {user.firstName[0]}
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    user.status === 'pending' ? 'bg-orange-500 text-white' : 
                                    user.status === 'suspended' ? 'bg-red-500 text-white' : 
                                    'bg-green-500 text-white'
                                }`}>
                                    {user.status === 'pending' ? 'En attente' : user.status}
                                </span>
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-none">{user.firstName} {user.lastName}</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">{user.type} • {user.commune}</p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                                <Phone size={12} className="text-blue-500"/> {user.phone}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                ))}
             </div>

             {/* MODAL / DRAWER DE QUALIFICATION */}
             {selectedUser && (
                 <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}></div>
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col overflow-hidden border-l dark:border-gray-800">
                        
                        {/* Header Profile */}
                        <div className="p-8 pb-4 flex justify-between items-start border-b dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl">{selectedUser.firstName[0]}</div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedUser.firstName} {selectedUser.lastName}</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <ShieldQuestion size={12} className="text-orange-500" /> Profil {selectedUser.type} • ID: {selectedUser.id?.slice(-8)}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm"><X size={24}/></button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="px-8 flex border-b dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'identity', label: 'Coordonnées', icon: User },
                                { id: 'documents', label: 'Dossier KYC', icon: FileText },
                                { id: 'permissions', label: 'Accès', icon: ShieldCheck },
                                { id: 'history', label: 'Activité', icon: Activity }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 whitespace-nowrap ${
                                        activeTab === tab.id ? 'border-blue-500 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    <tab.icon size={14}/> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Contenu Dynamique */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            
                            {/* Qualification Status Wizard for Pending Users */}
                            {selectedUser.status === 'pending' && (
                                <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2.5rem] border-2 border-dashed border-orange-200 dark:border-orange-800 animate-fade-in space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl"><FileWarning size={20}/></div>
                                            <h4 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">Qualification Requise</h4>
                                        </div>
                                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Priorité Haute</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'identity', label: 'Identité Vérifiée' },
                                            { key: 'address', label: 'Lieu de Collecte' },
                                            { key: 'phone', label: 'Contact Validé' },
                                            { key: 'tos', label: 'Engagements' }
                                        ].map(check => (
                                            <button 
                                                key={check.key}
                                                onClick={() => setKycChecklist(prev => ({ ...prev, [check.key]: !prev[check.key as keyof typeof kycChecklist] }))}
                                                className={`p-3 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                                                    kycChecklist[check.key as keyof typeof kycChecklist] 
                                                    ? 'bg-green-50 border-green-200 text-green-600' 
                                                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${kycChecklist[check.key as keyof typeof kycChecklist] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-200'}`}>
                                                    {kycChecklist[check.key as keyof typeof kycChecklist] && <Check size={12} strokeWidth={4}/>}
                                                </div>
                                                <span className="text-[10px] font-black uppercase truncate">{check.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- TAB IDENTITÉ --- */}
                            {activeTab === 'identity' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white shadow-inner" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white shadow-inner" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Mobile</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white shadow-inner" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white appearance-none shadow-inner" value={editForm.commune} onChange={e => setEditForm({...editForm, commune: e.target.value})}>
                                            <option value="Gombe">Gombe</option><option value="Ngaliema">Ngaliema</option><option value="Limete">Limete</option><option value="Kintambo">Kintambo</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse de Collecte</label>
                                        <textarea rows={2} className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border-none outline-none font-bold text-sm dark:text-white resize-none shadow-inner" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {/* --- TAB DOCUMENTS --- */}
                            {activeTab === 'documents' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pièce d'Identité</span>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3 group cursor-zoom-in hover:bg-gray-50 transition-all overflow-hidden relative">
                                                <Fingerprint size={56} className="opacity-10 group-hover:opacity-30 transition-opacity" />
                                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">Chargement Image HD...</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Justificatif Domicile</span>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3 group cursor-zoom-in hover:bg-gray-50 transition-all overflow-hidden">
                                                <MapPin size={56} className="opacity-10 group-hover:opacity-30 transition-opacity" />
                                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">Consultation Preuve...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB PERMISSIONS --- */}
                            {activeTab === 'permissions' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.values(UserType).map(role => (
                                            <button 
                                                key={role}
                                                onClick={() => setEditForm({...editForm, type: role})}
                                                className={`p-6 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden flex flex-col gap-3 ${
                                                    editForm.type === role ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-lg' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editForm.type === role ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                    {role === 'admin' ? <Shield size={20}/> : role === 'collector' ? <Truck size={20}/> : <User size={20}/>}
                                                </div>
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${editForm.type === role ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>{role}</span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {(editForm.type === UserType.ADMIN || editForm.type === UserType.COLLECTOR) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-gray-800 pt-10">
                                            {ALL_PERMISSIONS.map(p => (
                                                <div key={p.key} onClick={() => handleUpdatePermission(p.key)} className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${editForm.permissions?.includes(p.key) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 shadow-sm' : 'border-gray-50 dark:border-gray-900 hover:border-gray-200'}`}>
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 ${editForm.permissions?.includes(p.key) ? 'bg-[#00C853] border-[#00C853] text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                                        {editForm.permissions?.includes(p.key) && <CheckIcon size={12} strokeWidth={5} />}
                                                    </div>
                                                    <p className={`text-[11px] font-black uppercase tracking-tight ${editForm.permissions?.includes(p.key) ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{p.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- TAB HISTORIQUE --- */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-fade-in py-10 flex flex-col items-center justify-center text-gray-400">
                                    <Package size={56} className="opacity-10 mb-4" />
                                    <p className="font-black uppercase text-[11px] tracking-[0.2em] opacity-40">Historique Opérationnel Vide</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Fixe de Décision */}
                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                             
                             {showRejectionForm ? (
                                <div className="space-y-6 animate-scale-up">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-1">Motif du refus / suspension</label>
                                            <button onClick={() => setShowRejectionForm(false)} className="text-[9px] font-black uppercase text-gray-400 hover:text-black">Annuler</button>
                                        </div>
                                        <textarea 
                                            autoFocus
                                            className="w-full p-5 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border-2 border-red-100 dark:border-red-900/30 outline-none font-bold text-sm text-red-600 resize-none" 
                                            rows={3} 
                                            placeholder="Ex: Document illisible, commune non desservie..." 
                                            value={rejectionReason}
                                            onChange={e => setRejectionReason(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        disabled={!rejectionReason.trim() || isSaving}
                                        onClick={() => handleSave('suspended')}
                                        className="w-full py-5 bg-red-500 text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 transition-all"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Confirmer la suspension"}
                                    </button>
                                </div>
                             ) : (
                                <div className="flex flex-col gap-4">
                                    {selectedUser.status === 'pending' ? (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setShowRejectionForm(true)}
                                                className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest transition-colors hover:bg-red-50 hover:text-red-500"
                                            >
                                                Refuser KYC
                                            </button>
                                            <button 
                                                onClick={() => handleSave('active')}
                                                disabled={!isKycComplete || isSaving}
                                                className={`flex-[2] py-5 text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all ${isKycComplete ? 'bg-[#00C853] shadow-green-500/20' : 'bg-gray-300 shadow-none cursor-not-allowed'}`}
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20}/>}
                                                Activer le Compte
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => handleSave()}
                                                disabled={isSaving}
                                                className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                                                Mettre à jour
                                            </button>
                                            <button 
                                                onClick={() => setShowRejectionForm(true)}
                                                className="p-5 bg-red-50 text-red-500 rounded-[1.8rem] hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Suspendre"
                                            >
                                                <Ban size={22}/>
                                            </button>
                                        </div>
                                    )}
                                    {selectedUser.status === 'pending' && !isKycComplete && (
                                        <p className="text-[9px] text-center font-black text-gray-400 uppercase tracking-widest animate-pulse">Complétez la checklist KYC pour activer</p>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
