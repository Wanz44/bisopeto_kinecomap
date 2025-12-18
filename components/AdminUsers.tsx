
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, Shield, User, Truck, Check, X, Edit2, Plus, Loader2, UserCheck, Briefcase, MapPin, Trash2, Phone, Mail,
    ShieldAlert, AlertCircle, Info, PhoneCall, Sparkles
} from 'lucide-react';
import { UserPermission, User as AppUser, UserType } from '../types';
import { UserAPI } from '../services/api';

interface AdminUsersProps {
    onBack: () => void;
    currentUser: AppUser;
    onNotify: (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack, currentUser, onNotify, onToast }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [userForm, setUserForm] = useState({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserType.CITIZEN as UserType,
        location: '',
        vehicleType: '',
        permissions: [] as UserPermission[]
    });

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await UserAPI.getAll(); 
            setUsers(data); 
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    // --- QUALIFICATION DU COMPTE (Activation après contact humain) ---
    const handleQualifyUser = async (user: AppUser) => {
        try {
            await UserAPI.update({ ...user, id: user.id!, status: 'active' });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' as const } : u));
            if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, status: 'active' as const });
            
            // ÉTAPE 5 : Simulation d'e-mail automatique de bienvenue/félicitations
            onNotify(user.id!, "Compte Bisopeto Activé ! ♻️", 
                `Félicitations ${user.firstName}, votre compte a été qualifié avec succès par notre équipe. 
                Vous avez désormais accès à l'intégralité des services de collecte et aux modules Eco-Academy. 
                Bienvenue dans la communauté !`, 'success');
            
            if (onToast) onToast(`Compte de ${user.firstName} qualifié et activé ! E-mail de bienvenue envoyé.`, "success");
        } catch (e) {
            if (onToast) onToast("Erreur lors de la qualification", "error");
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const userData: any = { 
            firstName: userForm.firstName,
            lastName: userForm.lastName,
            email: userForm.email,
            phone: userForm.phone,
            type: userForm.role,
            address: userForm.location,
            vehicleType: userForm.vehicleType,
            permissions: userForm.permissions,
            status: 'active' // Les créations manuelles admin sont actives par défaut
        };

        try {
            if (isEditing && userForm.id) {
                await UserAPI.update({ ...userData, id: userForm.id });
                setUsers(prev => prev.map(u => u.id === userForm.id ? { ...u, ...userData } : u));
                if (onToast) onToast("Utilisateur mis à jour", "success");
            } else {
                const newUser = { ...userData, id: `u-${Date.now()}`, points: 0, collections: 0, badges: 0, subscription: 'standard' };
                await UserAPI.register(newUser, "TempPass123!");
                setUsers([newUser, ...users]);
                if (onToast) onToast("Nouveau compte créé !", "success");
            }
            setShowUserModal(false);
        } catch (e) { if (onToast) onToast("Erreur opération", "error"); }
    };

    const openEditModal = (user: AppUser) => {
        setIsEditing(true);
        setUserForm({
            id: user.id || '',
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email || '',
            phone: user.phone,
            role: user.type,
            location: user.address,
            vehicleType: user.vehicleType || '',
            permissions: user.permissions || []
        });
        setShowUserModal(true);
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.type === roleFilter;
        const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
        const query = search.toLowerCase();
        const matchesSearch = !query || `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`.toLowerCase().includes(query);
        return matchesRole && matchesStatus && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse';
            case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getRoleIcon = (type: UserType) => {
        switch(type) {
            case UserType.ADMIN: return <Shield size={14} className="text-purple-500" />;
            case UserType.COLLECTOR: return <Truck size={14} className="text-orange-500" />;
            case UserType.BUSINESS: return <Briefcase size={14} className="text-blue-500" />;
            default: return <User size={14} className="text-green-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
             <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" /></button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Annuaire Clients</h2>
                    </div>
                    <button onClick={() => { setIsEditing(false); setUserForm({ id: '', firstName: '', lastName: '', email: '', phone: '', role: UserType.CITIZEN, location: '', vehicleType: '', permissions: [] }); setShowUserModal(true); }} className="px-4 py-2 bg-[#2962FF] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus size={18} /> Ajouter</button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-3 bg-gray-50 dark:bg-gray-750 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input type="text" placeholder="Nom, téléphone, email..." className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-none outline-none text-sm focus:ring-2 focus:ring-[#2962FF]" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium outline-none">
                            <option value="all">Tous Rôles</option>
                            <option value={UserType.ADMIN}>Admin</option>
                            <option value={UserType.COLLECTOR}>Collecteur</option>
                            <option value={UserType.BUSINESS}>Entreprise</option>
                            <option value={UserType.CITIZEN}>Citoyen</option>
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium outline-none">
                            <option value="all">Statuts</option>
                            <option value="pending">À Qualifier 🚀</option>
                            <option value="active">Actifs</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto px-4 pb-4 mt-4">
                 {isLoading ? (
                     <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-[#2962FF] w-8 h-8" /></div>
                 ) : (
                     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-750 text-[10px] uppercase font-bold text-gray-500">
                                <tr>
                                    <th className="p-4">Utilisateur</th>
                                    <th className="p-4">Rôle</th>
                                    <th className="p-4">Statut</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredUsers.map((user: AppUser) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold uppercase">{user.firstName[0]}{user.lastName[0]}</div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={10}/> {user.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {getRoleIcon(user.type)}
                                                <span className="capitalize font-bold text-xs">{user.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getStatusStyle(user.status)}`}>
                                                {user.status === 'pending' ? 'À Qualifier' : user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {user.status === 'pending' && (
                                                    <button 
                                                        onClick={() => handleQualifyUser(user)}
                                                        className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-md flex items-center gap-1 animate-pulse"
                                                        title="Valider le compte après contact humain"
                                                    >
                                                        <UserCheck size={14} /> Qualifier
                                                    </button>
                                                )}
                                                <button onClick={() => setSelectedUser(user)} className="text-[#2962FF] font-bold text-xs p-2 hover:bg-blue-50 rounded-lg">Détails</button>
                                                <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>

             {showUserModal && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)}></div>
                     <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl animate-scale-up">
                         <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{isEditing ? 'Éditer Fiche' : 'Nouveau Client'}</h3>
                            <button onClick={() => setShowUserModal(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                         </div>

                         <form onSubmit={handleSaveUser} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Prénom</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 ring-blue-500" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nom</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 ring-blue-500" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Contact</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <input placeholder="Téléphone" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 ring-blue-500" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} required />
                                    <input placeholder="Email" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 ring-blue-500" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Rôle Système</label>
                                <select className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                                    <option value={UserType.CITIZEN}>Citoyen</option>
                                    <option value={UserType.COLLECTOR}>Collecteur</option>
                                    <option value={UserType.BUSINESS}>Entreprise</option>
                                    <option value={UserType.ADMIN}>Administrateur</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Adresse de collecte</label>
                                <textarea className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" rows={2} value={userForm.location} onChange={e => setUserForm({...userForm, location: e.target.value})} />
                            </div>

                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 rounded-2xl font-bold">Annuler</button>
                                <button type="submit" className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl">Enregistrer</button>
                            </div>
                         </form>
                     </div>
                 </div>
             )}

             {selectedUser && (
                 <div className="fixed inset-0 z-50 flex justify-end">
                     <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                     <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full relative z-10 animate-fade-in-left flex flex-col shadow-2xl border-l dark:border-gray-800">
                         <div className="p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                             <div className="flex justify-between items-start mb-6">
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-black">{selectedUser.firstName[0]}</div>
                                <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><X size={24} /></button>
                             </div>
                             <h2 className="text-3xl font-black dark:text-white tracking-tighter">{selectedUser.firstName} {selectedUser.lastName}</h2>
                             <div className="flex gap-2 mt-4">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase border ${getStatusStyle(selectedUser.status)}`}>{selectedUser.status === 'pending' ? 'À Qualifier' : selectedUser.status}</span>
                                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full font-black uppercase border border-blue-100 dark:border-blue-900/50">{selectedUser.type}</span>
                             </div>
                         </div>

                         <div className="p-8 flex-1 overflow-y-auto space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Coordonnées</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Phone size={18}/></div>
                                        <span className="font-bold">{selectedUser.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><Mail size={18}/></div>
                                        <span className="font-medium underline">{selectedUser.email || 'Pas d\'email'}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"><MapPin size={18}/></div>
                                        <span className="text-sm font-medium">{selectedUser.address}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedUser.status === 'pending' && (
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                                            <PhoneCall size={20} />
                                        </div>
                                        <h4 className="font-black text-orange-800 dark:text-orange-400">Qualification Requise</h4>
                                    </div>
                                    <p className="text-xs text-orange-700 dark:text-orange-300 mb-6 leading-relaxed">
                                        Étape indispensable : Contactez ce client par téléphone pour confirmer ses informations et valider sa zone de collecte avant d'activer son accès.
                                    </p>
                                    <button 
                                        onClick={() => handleQualifyUser(selectedUser)}
                                        className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <UserCheck size={20} /> Activer et Envoyer Mail
                                    </button>
                                </div>
                            )}
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};
