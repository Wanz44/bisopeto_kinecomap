
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle, UserPlus, Key
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
    const [communeFilter, setCommuneFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [profileTab, setProfileTab] = useState<'info' | 'interventions' | 'billing'>('info');
    
    // Create User Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUserForm, setNewUserForm] = useState<Partial<AppUser>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, status: 'active', address: '', commune: 'Gombe'
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

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.firstName || !newUserForm.phone) return;
        setIsCreating(true);
        try {
            const created = await UserAPI.register(newUserForm as AppUser, "Password123!");
            setUsers([created, ...users]);
            setShowAddModal(false);
            setNewUserForm({ firstName: '', lastName: '', phone: '', email: '', type: UserType.CITIZEN, status: 'active', address: '', commune: 'Gombe' });
            if (onToast) onToast("Utilisateur créé avec succès", "success");
        } catch (e) {
            if (onToast) onToast("Erreur lors de la création", "error");
        } finally {
            setIsCreating(false);
        }
    };

    const handleBanUser = async (id: string) => {
        if (confirm("Suspendre définitivement l'accès à ce compte ?")) {
            await UserAPI.update({ id, status: 'suspended' });
            setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'suspended' as const } : u));
            if (onToast) onToast("Utilisateur suspendu", "info");
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.type === roleFilter;
        const matchesCommune = communeFilter === 'all' || u.commune === communeFilter;
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        const query = search.toLowerCase();
        const matchesSearch = !query || `${u.firstName} ${u.lastName} ${u.email} ${u.phone} ${u.address}`.toLowerCase().includes(query);
        return matchesRole && matchesStatus && matchesSearch && matchesCommune;
    });

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
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Annuaire du Réseau</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{filteredUsers.length} comptes filtrés</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-blue-600 transition-all"><Download size={20} /></button>
                         <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#2962FF] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all"
                        >
                            <UserPlus size={18} /> Nouveau Compte
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-3">
                    <div className="relative xl:col-span-1">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher un utilisateur..." 
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none text-sm font-bold focus:ring-2 focus:ring-[#2962FF] dark:text-white" 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                        />
                    </div>
                    <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Tous Rôles</option>
                        <option value={UserType.ADMIN}>Administrateurs</option>
                        <option value={UserType.COLLECTOR}>Collecteurs</option>
                        <option value={UserType.BUSINESS}>Entreprises</option>
                        <option value={UserType.CITIZEN}>Citoyens</option>
                    </select>
                    <select value={communeFilter} onChange={(e) => setCommuneFilter(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Toutes Communes</option>
                        <option value="Gombe">Gombe</option>
                        <option value="Limete">Limete</option>
                        <option value="Ngaliema">Ngaliema</option>
                        <option value="Kintambo">Kintambo</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none dark:text-gray-300">
                        <option value="all">Tous Statuts</option>
                        <option value="pending">À Qualifier</option>
                        <option value="active">Actifs</option>
                        <option value="suspended">Suspendus</option>
                    </select>
                </div>
             </div>

             {/* Users List */}
             <div className="flex-1 overflow-y-auto px-6 pb-24 mt-6 no-scrollbar">
                 {isLoading ? (
                     <div className="flex flex-col items-center justify-center pt-20 gap-4">
                        <Loader2 className="animate-spin text-[#2962FF]" size={48} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Récupération des profils...</p>
                     </div>
                 ) : (
                     <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] uppercase font-black text-gray-400 tracking-[0.1em]">
                                <tr>
                                    <th className="p-6">Utilisateur / Identité</th>
                                    <th className="p-6">Rôle / Commune</th>
                                    <th className="p-6">État</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredUsers.map((user: AppUser) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="p-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center font-black text-lg shadow-inner ${user.status === 'pending' ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                                                    {user.firstName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 dark:text-white text-base tracking-tight">{user.firstName} {user.lastName}</div>
                                                    <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mt-0.5"><Phone size={12} className="text-[#00C853]"/> {user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`w-fit text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    user.type === UserType.ADMIN ? 'bg-purple-100 text-purple-700' :
                                                    user.type === UserType.BUSINESS ? 'bg-blue-100 text-blue-700' :
                                                    user.type === UserType.COLLECTOR ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>{user.type}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-black uppercase truncate max-w-[150px]">
                                                    <MapPin size={10} className="text-blue-500" /> {user.commune || 'Ksh'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase border tracking-widest ${
                                                user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                user.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-bounce' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {user.status === 'pending' ? 'Verification' : user.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleQualifyUser(user)}
                                                        className="px-4 py-2 bg-[#00C853] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 shadow-lg shadow-green-500/20"
                                                    >
                                                        Valider
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => { setSelectedUser(user); setProfileTab('info'); }} 
                                                    className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>

             {/* ADD USER MODAL */}
             {showAddModal && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                     <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-lg p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Nouveau Compte</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Création manuelle admin</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24}/></button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                                    <input required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" value={newUserForm.firstName} onChange={e => setNewUserForm({...newUserForm, firstName: e.target.value})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                                    <input required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" value={newUserForm.lastName} onChange={e => setNewUserForm({...newUserForm, lastName: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                                <input required type="tel" className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" placeholder="081..." value={newUserForm.phone} onChange={e => setNewUserForm({...newUserForm, phone: e.target.value})} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de compte</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs uppercase dark:text-white" value={newUserForm.type} onChange={e => setNewUserForm({...newUserForm, type: e.target.value as UserType})}>
                                        <option value={UserType.CITIZEN}>Citoyen</option>
                                        <option value={UserType.COLLECTOR}>Collecteur</option>
                                        <option value={UserType.BUSINESS}>Entreprise</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-xs uppercase dark:text-white" value={newUserForm.commune} onChange={e => setNewUserForm({...newUserForm, commune: e.target.value})}>
                                        <option value="Gombe">Gombe</option>
                                        <option value="Ngaliema">Ngaliema</option>
                                        <option value="Limete">Limete</option>
                                        <option value="Kintambo">Kintambo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                                <Key size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-600 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-tight">
                                    Le mot de passe par défaut sera généré automatiquement. L'utilisateur pourra le modifier lors de sa première connexion.
                                </p>
                            </div>

                            <button disabled={isCreating} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isCreating ? <Loader2 className="animate-spin" size={20}/> : <UserPlus size={20}/>}
                                {isCreating ? "Création..." : "Enregistrer l'utilisateur"}
                            </button>
                        </form>
                     </div>
                 </div>
             )}

             {/* Detailed User Panel (Side Drawer) */}
             {selectedUser && (
                 <div className="fixed inset-0 z-[100] flex justify-end">
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedUser(null)}></div>
                     <div className="w-full max-w-xl bg-white dark:bg-gray-950 h-full relative z-10 animate-fade-in-left flex flex-col shadow-2xl">
                         {/* Header Profil */}
                         <div className="p-8 pb-6 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800 relative shrink-0">
                             <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all">
                                <X size={24} className="text-gray-400" />
                             </button>
                             <div className="flex items-center gap-6 mb-8">
                                 <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#2962FF] to-blue-700 flex items-center justify-center text-white text-4xl font-black shadow-xl">
                                    {selectedUser.firstName[0]}
                                 </div>
                                 <div>
                                     <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2 uppercase">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                     <div className="flex gap-2">
                                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase border ${
                                            selectedUser.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }`}>{selectedUser.status}</span>
                                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-black uppercase border border-blue-100 dark:border-blue-900/50">{selectedUser.type}</span>
                                     </div>
                                 </div>
                             </div>

                             <div className="flex gap-4 p-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <button onClick={() => setProfileTab('info')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'info' ? 'bg-[#2962FF] text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}>Infos</button>
                                <button onClick={() => setProfileTab('interventions')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'interventions' ? 'bg-[#2962FF] text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}>Activités</button>
                             </div>
                         </div>

                         {/* Profile Content */}
                         <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                            {profileTab === 'info' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Points Eco</p>
                                            <p className="text-2xl font-black text-[#00C853]">{selectedUser.points}</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Impact CO2</p>
                                            <p className="text-2xl font-black text-[#2962FF]">{selectedUser.co2Saved || 0}kg</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Coordonnées</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg"><Mail size={18}/></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedUser.email || 'Non renseigné'}</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl">
                                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-lg"><MapPin size={18}/></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedUser.commune} • {selectedUser.address}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profileTab === 'interventions' && (
                                <div className="space-y-6 animate-fade-in">
                                    {getUserInterventions(selectedUser).length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune intervention enregistrée</p>
                                        </div>
                                    ) : (
                                        getUserInterventions(selectedUser).map(report => (
                                            <div key={report.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600"><ClipboardList size={16}/></div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{report.wasteType}</h4>
                                                            <p className="text-[10px] text-gray-500 font-bold">{new Date(report.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${report.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                        {report.status}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                         </div>

                         {/* Footer Actions */}
                         <div className="p-8 border-t dark:border-gray-800 flex flex-col gap-3 shrink-0 bg-white dark:bg-gray-950">
                            {selectedUser.status === 'pending' && (
                                <button onClick={() => handleQualifyUser(selectedUser)} className="w-full py-4 bg-[#00C853] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all">Valider le profil</button>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <button className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"><Edit2 size={16}/> Modifier</button>
                                <button onClick={() => handleBanUser(selectedUser.id!)} className="py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"><Ban size={16}/> Suspendre</button>
                            </div>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
