
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key, EyeOff, Lock, Save, RefreshCw
} from 'lucide-react';
import { UserPermission, User as AppUser, UserType, WasteReport } from '../types';
import { UserAPI, ReportsAPI } from '../services/api';

interface AdminUsersProps {
    onBack: () => void;
    currentUser: AppUser;
    onNotify: (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack, currentUser, onNotify, onToast }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [communeFilter, setCommuneFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [profileTab, setProfileTab] = useState<'info' | 'interventions' | 'billing'>('info');
    
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [userForm, setUserForm] = useState<Partial<AppUser> & { password?: string }>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, status: 'active', address: '', commune: 'Gombe', password: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [usersData, reportsData] = await Promise.all([
                UserAPI.getAll(),
                ReportsAPI.getAll()
            ]);
            setUsers(usersData);
            setReports(reportsData);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleQualifyUser = async (user: AppUser) => {
        try {
            await UserAPI.update({ ...user, id: user.id!, status: 'active' });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' as const } : u));
            if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, status: 'active' as const });
            
            onNotify(user.id!, "Compte Qualifié ! ♻️", 
                `Mbote ${user.firstName}, votre identité a été validée. Vous avez maintenant accès à tous les services Biso Peto.`, 'success');
            
            if (onToast) onToast(`Compte de ${user.firstName} activé.`, "success");
        } catch (e) {
            if (onToast) onToast("Erreur de qualification", "error");
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForm.firstName || !userForm.phone) return;
        
        setIsSaving(true);
        try {
            if (isEditMode && userForm.id) {
                await UserAPI.update(userForm as any);
                setUsers(prev => prev.map(u => u.id === userForm.id ? { ...u, ...userForm } as AppUser : u));
                if (onToast) onToast("Compte mis à jour avec succès", "success");
            } else {
                const created = await UserAPI.register(userForm as AppUser, userForm.password || "Password123!");
                setUsers([created, ...users]);
                if (onToast) onToast(`${userForm.type === UserType.ADMIN ? 'Administrateur' : 'Utilisateur'} créé avec succès`, "success");
            }
            setShowFormModal(false);
        } catch (e) {
            if (onToast) onToast("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.type === roleFilter;
        const matchesCommune = communeFilter === 'all' || u.commune === communeFilter;
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        const query = search.toLowerCase();
        const matchesSearch = !query || `${u.firstName} ${u.lastName} ${u.email} ${u.phone} ${u.address}`.toLowerCase().includes(query);
        return matchesRole && matchesStatus && matchesSearch && matchesCommune;
    }).sort((a, b) => (a.status === 'pending' ? -1 : 1)); // Priorité aux pending dans le tri

    const getUserInterventions = (user: AppUser) => {
        if (user.type === UserType.COLLECTOR) {
            return reports.filter(r => r.assignedTo === user.id);
        }
        return reports.filter(r => r.reporterId === user.id);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
             {/* Header */}
             <div className="bg-white dark:bg-gray-900 p-6 shadow-sm flex flex-col gap-6 sticky top-0 z-40 border-b dark:border-gray-800 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Annuaire du Réseau</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{users.filter(u => u.status === 'pending').length} dossiers prioritaires</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={loadData} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl transition-all hover:bg-gray-200"><RefreshCw size={20} className={isLoading ? "animate-spin" : ""} /></button>
                         <button onClick={() => { setIsEditMode(false); setShowFormModal(true); }} className="bg-[#2962FF] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
                            <UserPlus size={18} /> Nouveau Compte
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
                    <div className="relative xl:col-span-1">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input type="text" placeholder="Chercher un nom, mobile..." className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none text-sm font-bold focus:ring-2 focus:ring-[#2962FF] dark:text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Tous Statuts</option>
                        <option value="pending">⚠️ À Valider ({users.filter(u => u.status === 'pending').length})</option>
                        <option value="active">Actifs</option>
                        <option value="suspended">Suspendus</option>
                    </select>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Tous Rôles</option>
                        <option value={UserType.ADMIN}>Administrateurs</option>
                        <option value={UserType.COLLECTOR}>Collecteurs</option>
                        <option value={UserType.BUSINESS}>Entreprises</option>
                        <option value={UserType.CITIZEN}>Citoyens</option>
                    </select>
                    <select value={communeFilter} onChange={(e) => setCommuneFilter(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Toutes Communes</option>
                        <option value="Gombe">Gombe</option><option value="Limete">Limete</option><option value="Ngaliema">Ngaliema</option>
                    </select>
                </div>
             </div>

             {/* Users List */}
             <div className="flex-1 overflow-y-auto px-6 pb-24 mt-6 no-scrollbar">
                 {isLoading ? (
                     <div className="flex flex-col items-center justify-center pt-20 gap-4">
                        <Loader2 className="animate-spin text-[#2962FF]" size={48} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronisation...</p>
                     </div>
                 ) : (
                     <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.1em]">
                                <tr>
                                    <th className="p-6">Utilisateur</th>
                                    <th className="p-6">Détails</th>
                                    <th className="p-6">État</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredUsers.map((user: AppUser) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group ${user.status === 'pending' ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-inner ${user.status === 'pending' ? 'bg-orange-100 text-orange-600 animate-pulse border-2 border-orange-200' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                                                    {user.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 dark:text-white text-base tracking-tight uppercase leading-none">{user.firstName} {user.lastName}</div>
                                                    <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mt-1.5"><Phone size={12}/> {user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`w-fit text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    user.type === UserType.ADMIN ? 'bg-purple-100 text-purple-700' :
                                                    user.type === UserType.BUSINESS ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>{user.type}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-black uppercase">
                                                    <MapPin size={10} className="text-blue-500" /> {user.commune || 'Ksh'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase border tracking-widest ${
                                                user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                user.status === 'pending' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {user.status === 'pending' ? '🔔 À QUALIFIER' : user.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.status === 'pending' && (
                                                    <button onClick={() => handleQualifyUser(user)} className="px-4 py-2 bg-[#00C853] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all">QUALIFIER</button>
                                                )}
                                                <button onClick={() => { setSelectedUser(user); setProfileTab('info'); }} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl hover:bg-gray-200"><Eye size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>
        </div>
    );
};
