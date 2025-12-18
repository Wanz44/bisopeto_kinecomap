
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, 
    UserCheck, Briefcase, MapPin, Trash2, Phone, Mail, CreditCard, ShieldAlert, 
    AlertCircle, Info, PhoneCall, Sparkles, MessageCircle, ExternalLink, 
    MoreVertical, Ban, History, Calendar, Eye, Download, ShieldCheck, ClipboardList, 
    CheckCircle2, Clock, AlertTriangle
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

    const getStatusIcon = (status: WasteReport['status']) => {
        switch (status) {
            case 'resolved': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'pending': return <Clock size={16} className="text-orange-500" />;
            case 'assigned': return <Truck size={16} className="text-blue-500" />;
            case 'rejected': return <X size={16} className="text-red-500" />;
            default: return null;
        }
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
                         <button className="bg-[#2962FF] hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-all">
                            <Plus size={18} /> Nouveau Compte
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
                        <option value="Ngaba">Ngaba</option>
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
                                                <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-black text-lg shadow-inner">
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
                                                    <MapPin size={10} className="text-blue-500" /> {user.commune || 'Ksh'} • {user.address.slice(0,15)}...
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`text-[9px] px-3 py-1.5 rounded-full font-black uppercase border tracking-widest ${
                                                user.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                user.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' :
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
                                <button 
                                    onClick={() => setProfileTab('info')}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'info' ? 'bg-[#2962FF] text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}
                                >
                                    Infos
                                </button>
                                <button 
                                    onClick={() => setProfileTab('interventions')}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'interventions' ? 'bg-[#2962FF] text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}
                                >
                                    Interventions
                                </button>
                                <button 
                                    onClick={() => setProfileTab('billing')}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${profileTab === 'billing' ? 'bg-[#2962FF] text-white shadow-lg' : 'text-gray-400 hover:text-gray-700'}`}
                                >
                                    Facturation
                                </button>
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
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Collectes</p>
                                            <p className="text-2xl font-black text-[#2962FF]">{selectedUser.collections}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Coordonnées & Adresses</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-lg"><Mail size={18}/></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedUser.email || 'Non renseigné'}</span>
                                            </div>
                                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl">
                                                <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-lg"><MapPin size={18}/></div>
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{selectedUser.address}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><PhoneCall size={14}/> Validation Terrain</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <a href={`tel:${selectedUser.phone}`} className="p-4 bg-[#00C853] text-white rounded-3xl flex flex-col items-center gap-2 shadow-lg shadow-green-500/20 hover:scale-105 transition-all">
                                                <Phone size={24}/>
                                                <span className="text-[10px] font-black uppercase">Appel Direct</span>
                                            </a>
                                            <button className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-3xl flex flex-col items-center gap-2 hover:bg-gray-50 transition-all">
                                                <ShieldCheck size={24} className="text-blue-500"/>
                                                <span className="text-[10px] font-black uppercase">Voir Documents</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {profileTab === 'interventions' && (
                                <div className="space-y-6 animate-fade-in">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardList size={14} /> Historique des Interventions
                                    </h3>
                                    <div className="space-y-4">
                                        {getUserInterventions(selectedUser).length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aucune intervention enregistrée</p>
                                            </div>
                                        ) : (
                                            getUserInterventions(selectedUser).map(report => (
                                                <div key={report.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                                                {getStatusIcon(report.status)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{report.wasteType}</h4>
                                                                <p className="text-[10px] text-gray-500 font-bold">{new Date(report.date).toLocaleDateString()} • {report.commune || 'Kinshasa'}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                                            report.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                            report.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                            'bg-blue-50 text-blue-700 border-blue-100'
                                                        }`}>
                                                            {report.status}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 italic line-clamp-1 border-t dark:border-gray-800 pt-3">
                                                        "{report.comment || 'Aucun commentaire'}"
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {profileTab === 'billing' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><CreditCard size={100} /></div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Abonnement Actuel</p>
                                        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">PLAN {selectedUser.subscription?.toUpperCase()}</h3>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs font-bold opacity-70">Expire le</p>
                                                <p className="text-sm font-black uppercase tracking-widest">24 Juin 2024</p>
                                            </div>
                                            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-[10px] font-black uppercase transition-all">Historique</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[1, 2].map(i => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600"><Check size={16}/></div>
                                                    <div>
                                                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">Paiement Mobile Money</p>
                                                        <p className="text-[9px] text-gray-400 font-bold">12 MAI 2024 • TR-00{i}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-black text-gray-900 dark:text-white">28,000 FC</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>

                         {/* Footer Actions */}
                         <div className="p-8 border-t dark:border-gray-800 flex flex-col gap-3 shrink-0 bg-white dark:bg-gray-950">
                            {selectedUser.status === 'pending' && (
                                <button onClick={() => handleQualifyUser(selectedUser)} className="w-full py-4 bg-[#00C853] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all">Activer le Compte</button>
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
