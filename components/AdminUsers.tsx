
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw,
    FileText, CheckCircle, Fingerprint, ShieldQuestion, ChevronRight, CheckCircle as CheckIcon,
    Package, Activity
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
    // Fix: Added missing 'desc' property to fix TypeScript error
    { key: 'export_data', label: 'Audit et CSV', desc: 'Extraction des données au format CSV' },
    { key: 'system_settings', label: 'Paramètres', desc: 'Config technique' },
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

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, reportsData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll()
            ]);
            setUsers(usersData);
            setAllReports(reportsData);
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
            
            // Notification si activation
            if (editForm.status === 'active' && selectedUser.status === 'pending') {
                onNotify(selectedUser.id, "Compte Activé ! 🎉", "Félicitations, votre accès au réseau Biso Peto a été validé par l'administration.", "success");
            }

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
        const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Filtrer les rapports pour l'utilisateur sélectionné
    const userRelatedReports = allReports.filter(r => 
        r.reporterId === selectedUser?.id || r.assignedTo === selectedUser?.id
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                                placeholder="Nom, email ou téléphone..." 
                                className="pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white w-64 shadow-inner"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select 
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 font-black text-[10px] uppercase outline-none dark:text-gray-300 border-none shadow-inner"
                        >
                            <option value="all">Tous les états</option>
                            <option value="pending">En attente (KYC)</option>
                            <option value="active">Comptes Actifs</option>
                            <option value="suspended">Suspendus</option>
                        </select>
                    </div>
                </div>
             </div>

             {/* Grid Liste */}
             <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={48} />
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Initialisation de la base...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400 font-black uppercase text-xs tracking-widest">Aucun membre ne correspond</div>
                ) : filteredUsers.map(user => (
                    <div key={user.id} onClick={() => handleOpenEdit(user)} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black transition-all ${
                                    user.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                } group-hover:scale-110`}>
                                    {user.firstName[0]}
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    user.status === 'pending' ? 'bg-orange-500 text-white animate-pulse' : 
                                    user.status === 'suspended' ? 'bg-red-500 text-white' : 
                                    'bg-green-500 text-white'
                                }`}>
                                    {user.status === 'pending' ? 'À Qualifier' : user.status}
                                </span>
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-none">{user.firstName} {user.lastName}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{user.type} • {user.commune}</p>
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

                        {/* Onglets Strategiques */}
                        <div className="px-8 flex border-b dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'identity', label: 'Coordonnées', icon: User },
                                { id: 'documents', label: 'KYC', icon: FileText },
                                { id: 'history', label: 'Interventions', icon: Activity },
                                { id: 'permissions', label: 'Privilèges', icon: ShieldCheck }
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
                            
                            {/* --- TAB IDENTITÉ --- */}
                            {activeTab === 'identity' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom Citoyen</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm dark:text-white transition-all shadow-inner" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom de famille</label>
                                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-sm dark:text-white transition-all shadow-inner" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Mobile</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-4 text-gray-400" size={16} />
                                                <input className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Optionnel)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-4 text-gray-400" size={16} />
                                                <input className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white shadow-inner" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone de Collecte Affectée</label>
                                        <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white appearance-none shadow-inner" value={editForm.commune} onChange={e => setEditForm({...editForm, commune: e.target.value})}>
                                            <option value="Gombe">Gombe (Secteur Central)</option>
                                            <option value="Ngaliema">Ngaliema (Hauts-Plateaux)</option>
                                            <option value="Limete">Limete (Zone Industrielle)</option>
                                            <option value="Kintambo">Kintambo (Secteur Ouest)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse Géographique Précise</label>
                                        <textarea rows={3} className="w-full p-5 bg-gray-50 dark:bg-gray-800 rounded-[2rem] border-none outline-none font-bold text-sm dark:text-white resize-none shadow-inner" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} placeholder="Rue, n°, quartier..." />
                                    </div>
                                </div>
                            )}

                            {/* --- TAB DOCUMENTS --- */}
                            {activeTab === 'documents' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2.5rem] border border-orange-100 dark:border-orange-800 flex items-start gap-4">
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl text-orange-500 shadow-sm"><AlertTriangle size={24}/></div>
                                        <div>
                                            <h4 className="text-sm font-black text-orange-700 dark:text-orange-400 uppercase tracking-tight">Audit de Sécurité KYC</h4>
                                            <p className="text-xs text-orange-600 dark:text-orange-300 font-bold leading-relaxed mt-1">
                                                L'utilisateur a transmis ses pièces justificatives. Assurez-vous de la lisibilité des documents avant de débloquer les accès opérationnels.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pièce d'Identité (recto)</span>
                                                <span className="text-[8px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-black uppercase">Format OK</span>
                                            </div>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3 group cursor-zoom-in hover:bg-gray-50 transition-all overflow-hidden">
                                                <Fingerprint size={56} className="opacity-10 group-hover:opacity-30 transition-opacity" />
                                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">Chargement Image HD...</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Justificatif Domicile</span>
                                                <span className="text-[8px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-black uppercase">Vérifier Lieu</span>
                                            </div>
                                            <div className="aspect-[3/2] bg-gray-100 dark:bg-gray-900 rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-400 gap-3 group cursor-zoom-in hover:bg-gray-50 transition-all overflow-hidden">
                                                <MapPin size={56} className="opacity-10 group-hover:opacity-30 transition-opacity" />
                                                <p className="text-[10px] font-black uppercase tracking-tighter opacity-40">Consultation Preuve...</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-[3rem] border dark:border-gray-800 flex flex-col items-center gap-6">
                                        <ShieldCheck size={48} className="text-gray-300" />
                                        <div className="text-center">
                                            <p className="font-black text-sm dark:text-white uppercase tracking-tighter">Décision Administrative</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1">L'approbation activera immédiatement les services de collecte.</p>
                                        </div>
                                        <div className="flex gap-3 w-full max-w-sm">
                                            <button className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-500/20 hover:scale-105 transition-all">Approuver</button>
                                            <button className="flex-1 py-4 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Rejeter</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB HISTORIQUE DES INTERVENTIONS --- */}
                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between mb-2 px-1">
                                        <div>
                                            <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Historique des Interventions</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rapports traités & collectes effectuées</p>
                                        </div>
                                        <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-blue-600/20">{userRelatedReports.length} Ticket(s)</span>
                                    </div>

                                    {userRelatedReports.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                            <Package size={56} className="opacity-10 mb-4" />
                                            <p className="font-black uppercase text-[11px] tracking-[0.2em] opacity-40">Aucune activité enregistrée</p>
                                            <p className="text-[10px] font-bold mt-1">Les interventions apparaîtront après le premier signalement.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {userRelatedReports.map(report => (
                                                <div key={report.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2.2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-5 group hover:shadow-xl transition-all border-l-4 border-l-transparent hover:border-l-blue-500">
                                                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700">
                                                        <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Preuve déchet" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="space-y-0.5">
                                                                <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm truncate">{report.wasteType}</h5>
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                        report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                                                        report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                                        report.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                                        'bg-blue-100 text-blue-600'
                                                                    }`}>{report.status}</span>
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                                        report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                                                    }`}>{report.urgency} priority</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] text-gray-400 font-black uppercase leading-none">{new Date(report.date).toLocaleDateString('fr-FR')}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{new Date(report.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-800/50">
                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 truncate pr-4">
                                                                <MapPin size={10} className="text-red-500 shrink-0"/> {report.commune || 'KINSHASA'} • #{report.id.slice(-6)}
                                                            </p>
                                                            {report.assignedTo === selectedUser?.id && (
                                                                <div className="flex items-center gap-1.5 text-[8px] font-black text-blue-500 uppercase tracking-widest shrink-0">
                                                                    <Truck size={10} /> Mission Collecteur
                                                                </div>
                                                            )}
                                                            {report.reporterId === selectedUser?.id && (
                                                                <div className="flex items-center gap-1.5 text-[8px] font-black text-green-500 uppercase tracking-widest shrink-0">
                                                                    <User size={10} /> Alerte Citoyenne
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4">
                                        <div className="p-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm text-blue-600"><Info size={20} className="shrink-0" /></div>
                                        <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase leading-relaxed tracking-wide">
                                            Cette chronologie certifiée regroupe les signalements émis par l'utilisateur ainsi que les missions opérationnelles qui lui ont été confiées sur le terrain par le central Biso Peto.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* --- TAB PERMISSIONS & RÔLES --- */}
                            {activeTab === 'permissions' && (
                                <div className="space-y-12 animate-fade-in">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center"><UserPlus size={16}/></div>
                                            Catégorie de Profil
                                        </h4>
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
                                                    {editForm.type === role && <CheckCircle2 className="absolute top-6 right-6 text-blue-500" size={20} />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Matrice de permissions - S'affiche uniquement pour ADMIN ou modification manuelle */}
                                    {(editForm.type === UserType.ADMIN || editForm.type === UserType.COLLECTOR) && (
                                        <div className="space-y-8 animate-scale-up border-t dark:border-gray-800 pt-10">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg flex items-center justify-center"><Key size={16}/></div>
                                                    Matrice de Privilèges
                                                </h4>
                                                <button onClick={() => setEditForm({...editForm, permissions: ALL_PERMISSIONS.map(p => p.key)})} className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">Tout activer</button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {ALL_PERMISSIONS.map(p => (
                                                    <div 
                                                        key={p.key} 
                                                        onClick={() => handleUpdatePermission(p.key)}
                                                        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                                                            editForm.permissions?.includes(p.key) 
                                                            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 shadow-sm' 
                                                            : 'border-gray-50 dark:border-gray-900 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all ${
                                                            editForm.permissions?.includes(p.key) ? 'bg-[#00C853] border-[#00C853] text-white shadow-lg shadow-green-500/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                        }`}>
                                                            {editForm.permissions?.includes(p.key) && <CheckIcon size={12} strokeWidth={5} />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`text-[11px] font-black uppercase tracking-tight truncate ${editForm.permissions?.includes(p.key) ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{p.label}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold mt-0.5 line-clamp-1">{p.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6 border-t dark:border-gray-800 pt-10">
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Statut du Compte</h4>
                                        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-3xl gap-1 shadow-inner">
                                            {[
                                                { id: 'active', label: 'ACTIF', color: 'text-green-500' },
                                                { id: 'pending', label: 'ATTENTE', color: 'text-orange-500' },
                                                { id: 'suspended', label: 'SUSPENDU', color: 'text-red-500' }
                                            ].map(s => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => setEditForm({...editForm, status: s.id as any})}
                                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                                        editForm.status === s.id 
                                                        ? 'bg-white dark:bg-gray-700 shadow-xl scale-[1.02] ' + s.color
                                                        : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Fixe */}
                        <div className="p-8 border-t dark:border-gray-800 bg-white dark:bg-gray-950 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                             <div className="flex gap-4">
                                <button 
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[1.8rem] font-black uppercase text-xs tracking-widest transition-colors hover:bg-gray-200"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-[2] py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20}/>}
                                    Valider et Enregistrer
                                </button>
                             </div>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
};
