
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw,
    FileText, CheckCircle, Fingerprint, ShieldQuestion, ChevronRight, CheckCircle as CheckIcon,
    Package, Activity, FileWarning, HelpCircle, Zap
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
    
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'permissions'>('identity');
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

    const handleApplyDefaultPerms = () => {
        const type = editForm.type;
        if (type && rolesConfig[type]) {
            setEditForm({ ...editForm, permissions: rolesConfig[type] });
            onToast?.(`Permissions par défaut pour ${type} appliquées.`, "info");
        }
    };

    const handleOpenEdit = (user: AppUser) => {
        setSelectedUser(user);
        setEditForm({ ...user, permissions: user.permissions || [] });
        setActiveTab('identity');
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

            if (onToast) onToast(`Utilisateur mis à jour avec succès`, "success");
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
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Annuaire du Réseau</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{users.length} membres enregistrés</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Nom, Tél..." 
                                className="pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white w-64 shadow-inner"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
             </div>

             {/* Grid Liste */}
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Lecture Cloud...</p>
                    </div>
                ) : filteredUsers.map(user => (
                    <div key={user.id} onClick={() => handleOpenEdit(user)} className={`bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${user.status === 'pending' ? 'border-orange-200' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${user.type === 'admin' ? 'bg-gray-900 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                    {user.firstName[0]}
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user.status === 'pending' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                                    {user.status}
                                </span>
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white uppercase truncate">{user.firstName} {user.lastName}</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-2">{user.type} • {user.commune}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t dark:border-gray-800 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-bold">{user.phone}</span>
                            <ChevronRight size={16} className="text-gray-300" />
                        </div>
                    </div>
                ))}
             </div>

             {/* MODAL PERMISSIONS & INFOS */}
             {selectedUser && (
                 <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}></div>
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col overflow-hidden border-l dark:border-gray-800">
                        
                        <div className="p-8 pb-4 flex justify-between items-start border-b dark:border-gray-800 shrink-0 bg-gray-50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black shadow-xl">{selectedUser.firstName[0]}</div>
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedUser.firstName}</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">ID: {selectedUser.id?.slice(-8)}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl"><X size={24}/></button>
                        </div>

                        <div className="px-8 flex border-b dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
                            {[
                                { id: 'identity', label: 'Coordonnées', icon: User },
                                { id: 'permissions', label: 'Droits Accès', icon: ShieldCheck }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-400'}`}>
                                    <tab.icon size={14}/> {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type de Profil</label>
                                            <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black dark:text-white" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value as any})}>
                                                <option value="citizen">Citoyen</option>
                                                <option value="business">Entreprise</option>
                                                <option value="collector">Collecteur</option>
                                                <option value="admin">Administrateur</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</label>
                                            <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black dark:text-white" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})}>
                                                <option value="pending">En attente</option>
                                                <option value="active">Actif</option>
                                                <option value="suspended">Suspendu</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Action rapide pour réaligner les droits si le rôle change */}
                                    <button 
                                        type="button"
                                        onClick={handleApplyDefaultPerms}
                                        className="w-full py-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-all"
                                    >
                                        <Zap size={14} /> Appliquer les droits par défaut du rôle
                                    </button>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 mb-8">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-bold leading-relaxed">
                                            Modifiez les accès individuels. Si vous changez le rôle, utilisez l'onglet coordonnées pour réinitialiser les droits par défaut.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {ALL_PERMISSIONS.map(p => (
                                            <div key={p.key} onClick={() => handleUpdatePermission(p.key)} className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${editForm.permissions?.includes(p.key) ? 'border-[#00C853] bg-green-50 dark:bg-green-900/10' : 'border-gray-50 dark:border-gray-900'}`}>
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 ${editForm.permissions?.includes(p.key) ? 'bg-[#00C853] border-[#00C853] text-white' : 'bg-white dark:bg-gray-800 border-gray-200'}`}>
                                                    {editForm.permissions?.includes(p.key) && <CheckIcon size={12} strokeWidth={5} />}
                                                </div>
                                                <div>
                                                    <p className={`text-[11px] font-black uppercase tracking-tight ${editForm.permissions?.includes(p.key) ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{p.label}</p>
                                                    <p className="text-[8px] text-gray-400 font-bold uppercase">{p.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
                             <button 
                                onClick={() => handleSave()}
                                disabled={isSaving}
                                className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                                {isSaving ? "Sauvegarde..." : "Enregistrer les modifications"}
                            </button>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
