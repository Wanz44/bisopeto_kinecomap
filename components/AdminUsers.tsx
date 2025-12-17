import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, MoreVertical, Shield, User, Truck, Filter, CheckCircle, 
    XCircle, FileText, Download, Ban, Edit, Save, CreditCard, Activity, 
    Calendar, Mail, Phone, MapPin, X, AlertTriangle, Eye, FileCheck, 
    Image as ImageIcon, Send, Users, TrendingUp, AlertCircle, Lock, Unlock, 
    Clock, Plus, ChevronDown, ChevronUp, Weight, Map, CheckSquare, Square, 
    Trash2, MessageSquare, Key, Receipt, Loader2, Info, Edit2, MoreHorizontal,
    Briefcase, RefreshCcw, ShieldCheck, ShieldAlert, Check, History, Monitor, Globe, Smartphone
} from 'lucide-react';
import { UserPermission, User as AppUser, UserType } from '../types';
import { UserAPI } from '../services/api';

interface AdminUsersProps {
    onBack: () => void;
    currentUser: AppUser;
    onNotify: (targetId: string | 'ADMIN' | 'ALL', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ALL_PERMISSIONS: { key: UserPermission; label: string; description: string }[] = [
    { key: 'manage_users', label: 'Gérer Utilisateurs', description: 'Créer, modifier, bannir' },
    { key: 'validate_docs', label: 'Valider Documents', description: 'Processus KYC' },
    { key: 'view_finance', label: 'Voir Finance', description: 'Revenus & Abonnements' },
    { key: 'manage_ads', label: 'Gérer Publicités', description: 'Campagnes partenaires' },
    { key: 'export_data', label: 'Exporter Données', description: 'Accès CSV/PDF' },
    { key: 'manage_fleet', label: 'Gérer Flotte', description: 'Véhicules & GPS' },
    { key: 'manage_academy', label: 'Gérer Academy', description: 'Cours & Quiz' },
    { key: 'system_settings', label: 'Paramètres Système', description: 'Config globale (Danger)' },
    { key: 'manage_pos', label: 'Point de Vente', description: 'Encaissement manuel' },
    { key: 'manage_communications', label: 'Communication', description: 'Envoi de messages' }
];

// Mock Data pour l'historique
const generateMockHistory = (userId: string) => [
    { id: 1, action: 'Connexion réussie', details: 'iPhone 13 Pro • Kinshasa', time: 'À l\'instant', type: 'success', icon: Smartphone },
    { id: 2, action: 'Modification profil', details: 'Changement d\'adresse', time: 'Hier, 14:30', type: 'info', icon: Edit2 },
    { id: 3, action: 'Paiement abonnement', details: 'Plan Premium (20$)', time: '24 Mai 2024', type: 'success', icon: CreditCard },
    { id: 4, action: 'Connexion Web', details: 'Chrome • Windows', time: '20 Mai 2024', type: 'info', icon: Monitor },
    { id: 5, action: 'Création de compte', details: 'Inscription initiale', time: '15 Mai 2024', type: 'info', icon: User },
];

export const AdminUsers: React.FC<AdminUsersProps> = ({ onBack, currentUser, onNotify, onToast }) => {
    // --- States ---
    const [users, setUsers] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters & Pagination
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    
    // Detailed View
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'finance' | 'documents' | 'history'>('overview');
    
    // Modal State (Add & Edit)
    const [showUserModal, setShowUserModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [userForm, setUserForm] = useState<{
        id?: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        role: UserType;
        location: string;
        permissions: UserPermission[];
    }>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: UserType.CITIZEN,
        location: '',
        permissions: []
    });

    // --- Action Modals State ---
    const [showResetModal, setShowResetModal] = useState(false);
    const [showMsgModal, setShowMsgModal] = useState(false);
    
    // Message State
    const [msgSubject, setMsgSubject] = useState('');
    const [msgContent, setMsgContent] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    
    // Password Reset State
    const [resetMethod, setResetMethod] = useState<'link' | 'manual'>('link');
    const [tempPassword, setTempPassword] = useState('');

    // --- Load Data ---
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await UserAPI.getAll(); 
            setUsers(data); 
        } catch (e) {
            console.error("Error loading users", e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers ---

    const openAddModal = () => {
        setIsEditing(false);
        setUserForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            role: UserType.CITIZEN,
            location: '',
            permissions: []
        });
        setShowUserModal(true);
    };

    const openEditModal = (user: AppUser) => {
        setIsEditing(true);
        setUserForm({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email || '',
            phone: user.phone,
            role: user.type,
            location: user.address,
            permissions: user.permissions || []
        });
        setShowUserModal(true);
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
            permissions: userForm.permissions
        };

        try {
            if (isEditing && userForm.id) {
                await UserAPI.update({ ...userData, id: userForm.id });
                setUsers(prev => prev.map(u => u.id === userForm.id ? { ...u, ...userData } : u));
                if (selectedUser?.id === userForm.id) {
                    setSelectedUser({ ...selectedUser, ...userData });
                }
                if (onToast) onToast(`Compte mis à jour : ${userForm.firstName}`, "success");
            } else {
                const newUser = {
                    ...userData,
                    id: `u-${Date.now()}`,
                    points: 0,
                    collections: 0,
                    badges: 0,
                    subscription: 'standard',
                    status: 'active'
                };
                await UserAPI.add(newUser);
                setUsers([newUser, ...users]);
                if (onToast) onToast(`Compte créé : ${userForm.firstName}`, "success");
            }
            setShowUserModal(false);
        } catch (e) {
            if (onToast) onToast("Erreur lors de l'opération", "error");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm("Confirmation : Cette action est irréversible et effacera toutes les données associées.")) {
            try {
                await UserAPI.delete(userId);
                setUsers(prev => prev.filter(u => u.id !== userId));
                setSelectedUser(null);
                if (onToast) onToast("Utilisateur supprimé définitivement", "success");
            } catch (e) {
                if (onToast) onToast("Erreur système", "error");
            }
        }
    };

    const togglePermission = (perm: UserPermission) => {
        setUserForm(prev => {
            const hasPerm = prev.permissions.includes(perm);
            return {
                ...prev,
                permissions: hasPerm 
                    ? prev.permissions.filter(p => p !== perm)
                    : [...prev.permissions, perm]
            };
        });
    };

    const handleBulkAction = (action: 'delete' | 'suspend' | 'export') => {
        if (selectedRows.length === 0) return;
        if (onToast) onToast(`${selectedRows.length} utilisateurs : Action ${action} exécutée`, "info");
        setSelectedRows([]);
    };

    // --- Reset Password Logic ---
    const handleOpenReset = () => {
        setResetMethod('link');
        const randomPass = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100) + '!';
        setTempPassword(randomPass);
        setShowResetModal(true);
    };

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (resetMethod === 'link') {
            await UserAPI.resetPassword(selectedUser.email || selectedUser.phone);
            if (onToast) onToast(`Lien de réinitialisation envoyé à ${selectedUser.email || selectedUser.phone}`, "success");
        } else {
            if (!tempPassword) {
                if(onToast) onToast("Veuillez définir un mot de passe", "error");
                return;
            }
            if (onToast) onToast(`Mot de passe mis à jour pour ${selectedUser.firstName}`, "success");
        }
        setShowResetModal(false);
    };

    // --- Message Logic ---
    const handleOpenMessage = () => {
        setMsgSubject('Information Importante - KIN ECO-MAP');
        setMsgContent('');
        setShowMsgModal(true);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !msgContent.trim()) return;
        
        setIsSendingEmail(true);

        try {
            // Envoi de la notification interne
            onNotify(selectedUser.id!, msgSubject, msgContent, 'info');

            // Envoi de l'email via le service backend (simulé ou réel)
            if (selectedUser.email) {
                await UserAPI.sendEmail(selectedUser.email, msgSubject, msgContent);
                if (onToast) onToast(`E-mail envoyé à ${selectedUser.email}`, "success");
            } else {
                if (onToast) onToast(`Pas d'email défini, notification interne envoyée seulement.`, "info");
            }
            
            setShowMsgModal(false);
        } catch (error) {
            console.error(error);
            if (onToast) onToast("Erreur lors de l'envoi de l'e-mail", "error");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = roleFilter === 'all' || u.type === roleFilter;
        // @ts-ignore - Gestion dynamique du statut
        const userStatus = (u as any).status || 'active';
        const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;
        
        const query = search.toLowerCase().trim();
        
        // Si aucune recherche, on renvoie juste les filtres dropdown
        if (!query) return matchesRole && matchesStatus;

        // Préparation des champs pour la recherche
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        // On normalise le téléphone en enlevant les espaces pour faciliter la recherche (ex: '081 234' match avec '081234')
        const phoneRaw = (u.phone || '').replace(/\s+/g, '');
        const queryRaw = query.replace(/\s+/g, '');

        const matchesSearch = 
            fullName.includes(query) || 
            email.includes(query) || 
            phoneRaw.includes(queryRaw) || // Recherche dans le téléphone normalisé
            (u.phone || '').includes(query); // Recherche dans le téléphone formaté (si l'utilisateur tape des espaces)

        return matchesRole && matchesStatus && matchesSearch; 
    });

    const getRoleColor = (role: string) => {
        switch(role) {
            case UserType.ADMIN: return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800';
            case UserType.COLLECTOR: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case UserType.BUSINESS: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
            default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
        }
    };

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.status === 'active').length;
    const newUsers = 0; 

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
             
             {/* Header Toolbar */}
             <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestion Utilisateurs</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{totalUsers} comptes enregistrés</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            title="Exporter CSV"
                        >
                            <Download size={20} />
                        </button>
                        <button 
                             onClick={openAddModal}
                             className="px-4 py-2 bg-[#2962FF] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                        >
                            <Plus size={18} /> <span className="hidden md:inline">Ajouter</span>
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Users size={18} /></div>
                        <div>
                            <span className="text-xl font-black text-gray-800 dark:text-white">{totalUsers}</span>
                            <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                        </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800 flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><Activity size={18} /></div>
                        <div>
                            <span className="text-xl font-black text-gray-800 dark:text-white">{activeUsers}</span>
                            <p className="text-xs text-gray-500 uppercase font-bold">Actifs</p>
                        </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><TrendingUp size={18} /></div>
                        <div>
                            <span className="text-xl font-black text-gray-800 dark:text-white">+{newUsers}</span>
                            <p className="text-xs text-gray-500 uppercase font-bold">Cette semaine</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-800 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><ShieldAlert size={18} /></div>
                        <div>
                            <span className="text-xl font-black text-gray-800 dark:text-white">0</span>
                            <p className="text-xs text-gray-500 uppercase font-bold">Suspendus</p>
                        </div>
                    </div>
                </div>
                
                {/* Advanced Filters */}
                <div className="flex flex-col md:flex-row gap-3 bg-gray-50 dark:bg-gray-750 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher nom, email, téléphone..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-[#2962FF]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={roleFilter} 
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="all">Tous les Rôles</option>
                            <option value={UserType.CITIZEN}>Citoyen</option>
                            <option value={UserType.BUSINESS}>Entreprise</option>
                            <option value={UserType.COLLECTOR}>Collecteur</option>
                            <option value={UserType.ADMIN}>Admin</option>
                        </select>
                        
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none"
                        >
                            <option value="all">Tous Status</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                            <option value="pending">En attente</option>
                        </select>
                    </div>
                </div>
                
                {/* Bulk Actions Header (Contextual) */}
                {selectedRows.length > 0 && (
                    <div className="bg-[#2962FF]/10 border border-[#2962FF]/20 px-4 py-2 rounded-lg flex items-center justify-between animate-fade-in">
                        <span className="text-sm font-bold text-[#2962FF]">{selectedRows.length} sélectionné(s)</span>
                        <div className="flex gap-2">
                            <button onClick={() => handleBulkAction('suspend')} className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1.5 rounded-md hover:bg-orange-200">Suspendre</button>
                            <button onClick={() => handleBulkAction('delete')} className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-md hover:bg-red-200">Supprimer</button>
                        </div>
                    </div>
                )}
             </div>

             {/* DATA TABLE */}
             <div className="flex-1 overflow-y-auto px-4 pb-4">
                 {isLoading ? (
                     <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-[#2962FF] w-8 h-8" /></div>
                 ) : (
                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase font-bold text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-[#2962FF] focus:ring-[#2962FF]"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRows(filteredUsers.map(u => u.id as string));
                                                else setSelectedRows([]);
                                            }}
                                            checked={selectedRows.length === filteredUsers.length && filteredUsers.length > 0}
                                        />
                                    </th>
                                    <th className="p-4">Utilisateur</th>
                                    <th className="p-4">Rôle & Statut</th>
                                    <th className="p-4 hidden md:table-cell">Abonnement</th>
                                    <th className="p-4 hidden lg:table-cell">Dernière Activité</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400">Aucun utilisateur trouvé.</td>
                                    </tr>
                                )}
                                {filteredUsers.map((user: any) => (
                                    <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${selectedRows.includes(user.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="p-4">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-[#2962FF] focus:ring-[#2962FF]"
                                                checked={selectedRows.includes(user.id)}
                                                onChange={(e) => {
                                                    if(e.target.checked) setSelectedRows([...selectedRows, user.id]);
                                                    else setSelectedRows(selectedRows.filter(id => id !== user.id));
                                                }}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${user.type === UserType.ADMIN ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                                                    {user.firstName[0]}{user.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white">{user.firstName} {user.lastName}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getRoleColor(user.type)}`}>
                                                    {user.type}
                                                </span>
                                                <span className={`flex items-center gap-1 text-xs font-medium ${user.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                    {user.status === 'active' ? 'Actif' : 'Suspendu'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell">
                                            <div className="font-medium text-gray-700 dark:text-gray-300 capitalize">{user.subscription}</div>
                                            <div className="text-xs text-gray-400">Exp: 12/2024</div>
                                        </td>
                                        <td className="p-4 hidden lg:table-cell">
                                            <div className="text-gray-600 dark:text-gray-400">{user.lastLogin || 'Jamais'}</div>
                                            <div className="text-xs text-gray-400 font-mono">{user.ipAddress}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="text-[#2962FF] hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors font-bold text-xs"
                                            >
                                                Gérer
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 )}
             </div>

             {/* DETAIL MODAL / DRAWER */}
             {selectedUser && (
                 <div className="fixed inset-0 z-50 flex justify-end">
                     <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                     <div className="w-full max-w-xl bg-white dark:bg-gray-900 h-full relative z-10 shadow-2xl animate-fade-in-left overflow-hidden flex flex-col border-l border-gray-200 dark:border-gray-700">
                         {/* Drawer Header */}
                         <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-start">
                             <div className="flex gap-4">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${selectedUser.type === UserType.ADMIN ? 'bg-gray-800' : 'bg-gradient-to-br from-[#00C853] to-[#2962FF]'}`}>
                                    {selectedUser.firstName[0]}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                    <p className="text-sm text-gray-500 mb-2">{selectedUser.id}</p>
                                    <div className="flex gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${getRoleColor(selectedUser.type)}`}>{selectedUser.type}</span>
                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 font-bold px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800 flex items-center gap-1">
                                            <ShieldCheck size={10} /> KYC Vérifié
                                        </span>
                                    </div>
                                </div>
                             </div>
                             <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                 <X size={24} />
                             </button>
                         </div>

                         {/* Quick Actions Toolbar */}
                         <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
                             <button onClick={() => openEditModal(selectedUser)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap">
                                 <Edit2 size={16} /> Modifier Profil
                             </button>
                             <button onClick={handleOpenReset} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap">
                                 <Key size={16} /> Reset Password
                             </button>
                             <button onClick={handleOpenMessage} className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap">
                                 <MessageSquare size={16} /> Message / Email
                             </button>
                             <div className="flex-1"></div>
                             <button onClick={() => handleDeleteUser(selectedUser.id!)} className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors whitespace-nowrap">
                                 <Trash2 size={16} />
                             </button>
                         </div>

                         {/* Tabs */}
                         <div className="flex border-b border-gray-100 dark:border-gray-800 px-6 overflow-x-auto no-scrollbar">
                             {['overview', 'history', 'security', 'finance', 'documents'].map((tab) => (
                                 <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-4 mr-6 text-sm font-bold capitalize transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[#2962FF]' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                 >
                                     {tab === 'overview' ? 'Général' : tab === 'history' ? 'Historique' : tab === 'security' ? 'Sécurité & Droits' : tab}
                                     {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2962FF] rounded-t-full"></div>}
                                 </button>
                             ))}
                         </div>

                         {/* Content */}
                         <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/50">
                             
                             {activeTab === 'overview' && (
                                 <div className="space-y-6 animate-fade-in">
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                             <p className="text-xs text-gray-500 uppercase font-bold mb-1">Email</p>
                                             <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2 truncate">
                                                 <Mail size={14} className="text-blue-500" /> {selectedUser.email}
                                             </p>
                                         </div>
                                         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                             <p className="text-xs text-gray-500 uppercase font-bold mb-1">Téléphone</p>
                                             <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                                                 <Phone size={14} className="text-green-500" /> {selectedUser.phone}
                                             </p>
                                         </div>
                                         <div className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                             <p className="text-xs text-gray-500 uppercase font-bold mb-1">Adresse Principale</p>
                                             <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                                                 <MapPin size={14} className="text-red-500" /> {selectedUser.address}
                                             </p>
                                         </div>
                                     </div>

                                     <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                         <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                             <Activity size={18} className="text-[#2962FF]" /> Activité Récente
                                         </h4>
                                         <div className="space-y-4">
                                             {[1,2,3].map((i) => (
                                                 <div key={i} className="flex gap-3 items-start">
                                                     <div className="w-2 h-2 rounded-full bg-gray-300 mt-2"></div>
                                                     <div>
                                                         <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Connexion depuis un nouvel appareil</p>
                                                         <p className="text-xs text-gray-400">Hier à 14:30 • IP 192.168.1.1</p>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'history' && (
                                 <div className="space-y-6 animate-fade-in">
                                     <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                         <h4 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                             <History size={18} className="text-[#2962FF]" /> Historique Complet
                                         </h4>
                                         
                                         <div className="relative border-l-2 border-gray-100 dark:border-gray-700 ml-3 space-y-8">
                                             {generateMockHistory(selectedUser.id!).map((log, idx) => (
                                                 <div key={log.id} className="relative pl-6">
                                                     {/* Timeline Dot */}
                                                     <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                                                         log.type === 'success' ? 'bg-green-500' : 
                                                         log.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                                     }`}></div>
                                                     
                                                     <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                                                         <div>
                                                             <h5 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                                 {log.action}
                                                             </h5>
                                                             <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                                 <log.icon size={12} /> {log.details}
                                                             </p>
                                                         </div>
                                                         <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded self-start">
                                                             {log.time}
                                                         </span>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                         
                                         <button className="w-full mt-6 py-2 text-xs font-bold text-gray-500 hover:text-[#2962FF] transition-colors">
                                             Charger plus d'activité...
                                         </button>
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'finance' && (
                                 <div className="space-y-6 animate-fade-in">
                                     <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-2xl text-white shadow-lg">
                                         <p className="text-gray-400 text-xs font-bold uppercase mb-1">Valeur à vie (LTV)</p>
                                         <h3 className="text-3xl font-black">{((selectedUser as any).ltv || 0).toLocaleString()} FC</h3>
                                         <div className="mt-4 flex gap-4 text-xs">
                                             <div>
                                                 <p className="text-gray-400">Dernier Paiement</p>
                                                 <p className="font-bold">24 Mai 2024</p>
                                             </div>
                                             <div>
                                                 <p className="text-gray-400">Plan Actuel</p>
                                                 <p className="font-bold text-[#00C853] capitalize">{selectedUser.subscription}</p>
                                             </div>
                                         </div>
                                     </div>

                                     <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                         <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-sm">Historique Transactions</div>
                                         {[1,2,3].map(i => (
                                             <div key={i} className="p-4 border-b border-gray-50 dark:border-gray-800 last:border-none flex justify-between items-center">
                                                 <div className="flex items-center gap-3">
                                                     <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
                                                         <CreditCard size={16} />
                                                     </div>
                                                     <div>
                                                         <p className="text-sm font-bold text-gray-800 dark:text-white">Abonnement Mensuel</p>
                                                         <p className="text-xs text-gray-500">24 Mai 2024</p>
                                                     </div>
                                                 </div>
                                                 <span className="font-mono font-bold text-gray-800 dark:text-white">15$</span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'security' && (
                                 <div className="space-y-6 animate-fade-in">
                                     <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                         <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                             <Lock size={18} className="text-orange-500" /> Permissions Actuelles
                                         </h4>
                                         
                                         {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                                             <div className="grid grid-cols-1 gap-2">
                                                 {ALL_PERMISSIONS.map(perm => {
                                                     const isActive = selectedUser.permissions?.includes(perm.key);
                                                     return (
                                                         <div key={perm.key} className={`flex items-center justify-between p-3 rounded-xl border ${isActive ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 opacity-60'}`}>
                                                             <div className="flex items-center gap-3">
                                                                 <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                                 <span className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{perm.label}</span>
                                                             </div>
                                                             {isActive && <Check size={16} className="text-green-600 dark:text-green-400" />}
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         ) : (
                                             <div className="text-center py-6 text-gray-400">
                                                 <ShieldAlert size={32} className="mx-auto mb-2 opacity-50" />
                                                 <p className="text-sm">Aucune permission spécifique.</p>
                                             </div>
                                         )}
                                         
                                         <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                             <button onClick={() => openEditModal(selectedUser)} className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                 Modifier les accès
                                             </button>
                                         </div>
                                     </div>

                                     <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30">
                                         <h4 className="font-bold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                                             <AlertTriangle size={18} /> Zone de Danger
                                         </h4>
                                         <p className="text-xs text-red-600 dark:text-red-300 mb-4">Ces actions impactent la sécurité du compte.</p>
                                         <div className="flex gap-2">
                                             <button onClick={handleOpenReset} className="flex-1 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                                                 Reset Password
                                             </button>
                                             <button className="flex-1 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors">
                                                 Forcer Déconnexion
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                             )}
                             
                             {activeTab === 'documents' && (
                                 <div className="grid grid-cols-2 gap-4">
                                     {['Carte d\'identité', 'Preuve de résidence'].map((doc, i) => (
                                         <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                             <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                                                 <FileText size={32} className="text-gray-400" />
                                             </div>
                                             <div className="flex justify-between items-center">
                                                 <span className="text-sm font-bold truncate">{doc}</span>
                                                 <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Validé</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}

                         </div>
                     </div>
                 </div>
             )}

             {/* RESET PASSWORD MODAL */}
             {showResetModal && selectedUser && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                     <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-scale-up">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold dark:text-white">Réinitialisation Mot de Passe</h3>
                             <button onClick={() => setShowResetModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                         </div>
                         
                         <form onSubmit={handleConfirmReset} className="space-y-4">
                             <div className="space-y-3">
                                 <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:border-gray-600">
                                     <input type="radio" name="resetMethod" className="accent-[#2962FF]" checked={resetMethod === 'link'} onChange={() => setResetMethod('link')} />
                                     <div className="ml-3">
                                         <span className="block text-sm font-bold dark:text-white">Envoyer un lien magique</span>
                                         <span className="text-xs text-gray-500">Email ou SMS sécurisé</span>
                                     </div>
                                 </label>
                                 <label className="flex items-center p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:border-gray-600">
                                     <input type="radio" name="resetMethod" className="accent-[#2962FF]" checked={resetMethod === 'manual'} onChange={() => setResetMethod('manual')} />
                                     <div className="ml-3">
                                         <span className="block text-sm font-bold dark:text-white">Définir manuellement</span>
                                         <span className="text-xs text-gray-500">Mot de passe temporaire</span>
                                     </div>
                                 </label>
                             </div>

                             {resetMethod === 'manual' && (
                                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl">
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nouveau mot de passe</label>
                                     <input 
                                        type="text" 
                                        className="w-full p-2 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg text-sm font-mono"
                                        value={tempPassword}
                                        onChange={e => setTempPassword(e.target.value)}
                                     />
                                     <button type="button" onClick={() => setTempPassword(Math.random().toString(36).slice(-8) + '!')} className="text-xs text-[#2962FF] font-bold mt-2 hover:underline">Générer aléatoire</button>
                                 </div>
                             )}

                             <button type="submit" className="w-full py-3 bg-[#2962FF] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                 Confirmer
                             </button>
                         </form>
                     </div>
                 </div>
             )}

             {/* MESSAGE MODAL */}
             {showMsgModal && selectedUser && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                     <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
                         <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold dark:text-white">Envoyer un message</h3>
                             <button onClick={() => setShowMsgModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                         </div>
                         
                         <form onSubmit={handleSendMessage} className="space-y-4">
                             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex items-center gap-3">
                                 <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                     {selectedUser.firstName[0]}
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold dark:text-white">À : {selectedUser.firstName} {selectedUser.lastName}</p>
                                     <p className="text-xs text-gray-500">{selectedUser.email ? selectedUser.email : "Pas d'email (Notif seule)"}</p>
                                 </div>
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sujet</label>
                                 <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    value={msgSubject}
                                    onChange={e => setMsgSubject(e.target.value)}
                                    placeholder="Ex: Rappel de paiement"
                                    required
                                 />
                             </div>

                             <div>
                                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Message</label>
                                 <textarea 
                                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF] min-h-[100px] resize-none"
                                    value={msgContent}
                                    onChange={e => setMsgContent(e.target.value)}
                                    placeholder="Écrivez votre message ici..."
                                    required
                                 />
                             </div>

                             <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl text-xs text-gray-500">
                                <p className="flex items-center gap-2"><Mail size={14} className="text-blue-500"/> Ce message sera envoyé par e-mail et notification in-app.</p>
                             </div>

                             <button 
                                type="submit" 
                                disabled={isSendingEmail}
                                className="w-full py-3 bg-[#2962FF] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                             >
                                 {isSendingEmail ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} 
                                 {isSendingEmail ? 'Envoi en cours...' : 'Envoyer'}
                             </button>
                         </form>
                     </div>
                 </div>
             )}

             {/* User Add/Edit Modal */}
             {showUserModal && (
                 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                     <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] flex flex-col">
                         <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-bold dark:text-white">{isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h3>
                            <button onClick={() => setShowUserModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                         </div>
                         
                         <form onSubmit={handleSaveUser} className="space-y-4 overflow-y-auto pr-2">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Prénom</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" placeholder="Prénom" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nom</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" placeholder="Nom" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} required />
                                </div>
                             </div>
                             
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                                <input type="email" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" placeholder="Email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Téléphone</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" placeholder="Téléphone" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})} required />
                                 </div>
                                 <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Rôle</label>
                                    <select className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as any})}>
                                        <option value="citizen">Citoyen</option>
                                        <option value="business">Entreprise</option>
                                        <option value="collector">Collecteur</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                 </div>
                             </div>

                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Adresse</label>
                                <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-[#2962FF] outline-none" placeholder="Adresse complète" value={userForm.location} onChange={e => setUserForm({...userForm, location: e.target.value})} />
                             </div>

                             {/* --- PERMISSIONS SECTION --- */}
                             {(userForm.role === UserType.ADMIN || userForm.role === UserType.COLLECTOR || userForm.role === UserType.BUSINESS) && (
                                 <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 mt-2">
                                     <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
                                         <Lock size={16} /> Permissions Spécifiques
                                     </h4>
                                     <p className="text-xs text-gray-500 mb-3">
                                         Cochez les droits d'accès accordés à cet utilisateur.
                                     </p>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                         {ALL_PERMISSIONS.map(perm => (
                                             <label key={perm.key} className={`flex items-start gap-2 cursor-pointer p-2 rounded-lg transition-all border ${userForm.permissions.includes(perm.key) ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-900 shadow-sm' : 'border-transparent hover:bg-white dark:hover:bg-gray-800'}`}>
                                                 <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${userForm.permissions.includes(perm.key) ? 'bg-[#2962FF] border-[#2962FF]' : 'border-gray-400 bg-white dark:bg-gray-900'}`}>
                                                     {userForm.permissions.includes(perm.key) && <CheckSquare size={14} className="text-white" />}
                                                 </div>
                                                 <input 
                                                    type="checkbox" 
                                                    className="hidden" 
                                                    checked={userForm.permissions.includes(perm.key)}
                                                    onChange={() => togglePermission(perm.key)}
                                                 />
                                                 <div>
                                                     <span className={`text-xs font-bold block ${userForm.permissions.includes(perm.key) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                         {perm.label}
                                                     </span>
                                                     <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                                                         {perm.description}
                                                     </span>
                                                 </div>
                                             </label>
                                         ))}
                                     </div>
                                 </div>
                             )}
                             
                             <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                                 <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Annuler</button>
                                 <button type="submit" className="flex-1 py-3 bg-[#00C853] text-white rounded-xl font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">
                                     {isEditing ? 'Mettre à jour' : 'Créer'}
                                 </button>
                             </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};