
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw,
    FileText, CheckCircle, Fingerprint, ShieldQuestion, ChevronRight
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
    { key: 'manage_users', label: 'Utilisateurs', desc: 'Gestion complète des comptes' },
    { key: 'manage_reports', label: 'SIG & Reports', desc: 'Gestion des alertes déchets' },
    { key: 'manage_fleet', label: 'Flotte GPS', desc: 'Suivi camions et GPS' },
    { key: 'manage_recovery', label: 'Recouvrement', desc: 'Encaissement cash' },
    { key: 'manage_subscriptions', label: 'Abonnements', desc: 'Validation des plans' },
    { key: 'manage_marketplace', label: 'Marketplace', desc: 'Modération des annonces' },
    { key: 'manage_academy', label: 'Academy', desc: 'Gestion des cours' },
    { key: 'export_data', label: 'Export Data', desc: 'Audit et CSV' },
    { key: 'system_settings', label: 'Paramètres', desc: 'Config technique' },
];

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack, currentUser, onNotify, onToast }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // Edit States
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'documents' | 'permissions'>('identity');
    const [editForm, setEditForm] = useState<Partial<AppUser>>({});

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const usersData = await UserAPI.getAll();
            setUsers(usersData);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleOpenEdit = (user: AppUser) => {
        setSelectedUser(user);
        setEditForm({ ...user });
        setActiveTab('identity');
    };

    const handleUpdatePermission = (perm: UserPermission) => {
        const currentPerms = editForm.permissions || [];
        const newPerms = currentPerms.includes(perm)
            ? currentPerms.filter(p => p !== perm)
            : [...currentPerms, perm];
        setEditForm({ ...editForm, permissions: newPerms });
    };

    const handleSave = async () => {
        if (!selectedUser?.id) return;
        setIsSaving(true);
        try {
            await UserAPI.update(editForm as any);
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } as AppUser : u));
            if (onToast) onToast("Utilisateur mis à jour avec succès", "success");
            setSelectedUser(null);
        } catch (e) {
            if (onToast) onToast("Erreur lors de la sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
        const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone}`.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
             {/* Header */}
             <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Réseau Biso Peto</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{users.length} membres actifs</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white w-64"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 font-black text-[10px] uppercase outline-none dark:text-gray-300"
                        >
                            <option value="all">Tous</option>
                            <option value="pending">En attente</option>
                            <option value="active">Actifs</option>
                        </select>
                    </div>
                </div>
             </div>

             {/* Users Grid */}
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-scrollbar pb-24">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chargement de l'annuaire...</p>
                    </div>
                ) : filteredUsers.map(user => (
                    <div key={user.id} onClick={() => handleOpenEdit(user)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xl font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {user.firstName[0]}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                user.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                            }`}>
                                {user.status}
                            </span>
                        </div>
                        <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{user.firstName} {user.lastName}</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 mb-4">{user.type} • {user.commune}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Phone size={12} className="text-blue-500"/> {user.phone}
                        </div>
                        <div className="absolute bottom-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronRight className="text-blue-500" />
                        </div>
                    </div>
                ))}
             </div>

             {/* MODAL / DRAWER DE MODIFICATION */}
             {selectedUser && (
                 <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}></div>
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col overflow-hidden">
                        
                        {/* Header Drawer */}
                        <div className="p-8 pb-4 flex justify-between items-start border-b dark:border-gray-800 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Édition Profil</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {selectedUser.id}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"><X size={24}/></button>
                        </div>

                        {/* Onglets */}
                        <div className="px-8 flex border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                            {[
                                { id: 'identity', label: 'Identité', icon: User },
                                { id: 'documents', label: 'Documents KYC', icon: FileText },
                                { id: 'permissions', label: 'Rôle & Accès', icon: ShieldCheck }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                        activeTab === tab.id ? 'border-blue-500 text-blue-500 bg-white dark:bg-gray-950' : 'border-transparent text-gray-400'
                                    }`}
                                >
                                    <tab.icon size={14}/> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Corps du Drawer */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            
                            {activeTab === 'identity' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune de résidence</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20" value={editForm.commune} onChange={e => setEditForm({...editForm, commune: e.target.value})}>
                                            <option value="Gombe">Gombe</option>
                                            <option value="Ngaliema">Ngaliema</option>
                                            <option value="Limete">Limete</option>
                                            <option value="Kintambo">Kintambo</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse complète</label>
                                        <textarea rows={3} className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500/20 resize-none" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-800 flex items-start gap-4">
                                        <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={24}/>
                                        <div>
                                            <h4 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase">Vérification KYC</h4>
                                            <p className="text-xs text-orange-600 dark:text-orange-300 font-bold leading-relaxed mt-1">Le membre a soumis ses documents pour validation. Veuillez vérifier la conformité avant d'activer le compte.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pièce d'Identité</span>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-2 group cursor-zoom-in hover:bg-gray-50 transition-all">
                                                <Fingerprint size={48} className="opacity-20 group-hover:opacity-40" />
                                                <span className="text-[10px] font-black uppercase">Voir Document</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Justificatif Domicile</span>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-2 group cursor-zoom-in hover:bg-gray-50 transition-all">
                                                <MapPin size={48} className="opacity-20 group-hover:opacity-40" />
                                                <span className="text-[10px] font-black uppercase">Voir Justificatif</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition-all">Valider les pièces</button>
                                        <button className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Rejeter</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Rôle Principal</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.values(UserType).map(role => (
                                                <button 
                                                    key={role}
                                                    onClick={() => setEditForm({...editForm, type: role})}
                                                    className={`p-5 rounded-3xl border-2 transition-all text-left group relative overflow-hidden ${
                                                        editForm.type === role ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                                                    }`}
                                                >
                                                    <span className={`text-xs font-black uppercase tracking-widest block ${editForm.type === role ? 'text-blue-600' : 'text-gray-400'}`}>{role}</span>
                                                    {editForm.type === role && <CheckCircle2 className="absolute top-4 right-4 text-blue-500" size={16} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {editForm.type === UserType.ADMIN && (
                                        <div className="space-y-6 animate-scale-up">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Shield size={20}/></div>
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Affectation des Privilèges</h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {ALL_PERMISSIONS.map(p => (
                                                    <div 
                                                        key={p.key}
                                                        onClick={() => handleUpdatePermission(p.key)}
                                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                                                            editForm.permissions?.includes(p.key) 
                                                            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10' 
                                                            : 'border-gray-50 dark:border-gray-900 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                            editForm.permissions?.includes(p.key) ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                                        }`}>
                                                            <Check size={14} strokeWidth={4} />
                                                        </div>
                                                        <div>
                                                            <p className={`text-[11px] font-black uppercase tracking-tight ${editForm.permissions?.includes(p.key) ? 'text-purple-700 dark:text-purple-400' : 'text-gray-500'}`}>{p.label}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">{p.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Status du Compte</h4>
                                        <div className="flex gap-2">
                                            {['active', 'suspended', 'pending'].map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => setEditForm({...editForm, status: s as any})}
                                                    className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                                                        editForm.status === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white dark:bg-gray-900 text-gray-400 border-gray-100 dark:border-gray-800'
                                                    }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Drawer */}
                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0">
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[1.5rem] font-black uppercase text-xs tracking-widest"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] py-5 bg-[#2962FF] text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18}/>}
                                    Enregistrer les modifications
                                </button>
                             </div>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
