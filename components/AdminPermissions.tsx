
import React, { useState } from 'react';
import { 
    ArrowLeft, Shield, Save, RotateCcw, Lock, Check, 
    UserCog, Settings, DollarSign, Megaphone, Truck, BookOpen, 
    Database, MessageCircle, CreditCard, Layers, Plus, Trash2, Edit2, X, Search, Info,
    ShoppingBag, Map as MapIcon, ShieldAlert, ChevronRight, Filter
} from 'lucide-react';
import { UserPermission, UserType } from '../types';

interface AdminPermissionsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const ALL_PERMISSIONS: { key: UserPermission; label: string; category: string; description: string; icon: any }[] = [
    { key: 'manage_users', label: 'Gestion Utilisateurs', category: 'Administration', description: 'Accès total aux comptes, bannissements et validations.', icon: UserCog },
    { key: 'validate_docs', label: 'Validation KYC', category: 'Administration', description: 'Vérifier et approuver les documents d\'identité.', icon: Shield },
    { key: 'system_settings', label: 'Configuration Système', category: 'Administration', description: 'Modifier les paramètres globaux et API.', icon: Settings },
    
    { key: 'view_finance', label: 'Reporting Financier', category: 'Finance', description: 'Consulter les revenus et statistiques de change.', icon: DollarSign },
    { key: 'manage_recovery', label: 'Recouvrement Cash', category: 'Finance', description: 'Encaisser les paiements physiques et générer des factures QR.', icon: CreditCard },
    { key: 'manage_subscriptions', label: 'Gestion Abonnements', category: 'Finance', description: 'Valider ou suspendre les plans des abonnés.', icon: Check },
    
    { key: 'manage_ads', label: 'Régie Publicitaire', category: 'Marketing', description: 'Créer et monitorer les campagnes partenaires.', icon: Megaphone },
    { key: 'manage_communications', label: 'Centre de Comm.', category: 'Marketing', description: 'Envoi de notifications push groupées.', icon: MessageCircle },
    
    { key: 'manage_reports', label: 'SIG & Signalements', category: 'Opérations', description: 'Gérer les alertes déchets et affecter les collecteurs.', icon: MapIcon },
    { key: 'manage_fleet', label: 'Gestion Flotte', category: 'Opérations', description: 'Suivi GPS, verrouillage moteur et maintenance.', icon: Truck },
    
    { key: 'manage_marketplace', label: 'Modération Boutique', category: 'Contenu', description: 'Approuver ou supprimer les annonces de la marketplace.', icon: ShoppingBag },
    { key: 'manage_academy', label: 'Gestion Academy', category: 'Éducation', description: 'Édition des cours, quiz et XP.', icon: BookOpen },
    { key: 'export_data', label: 'Audit & Export Data', category: 'Données', description: 'Extraire les rapports CSV, logs et données SIG.', icon: Database },
];

interface RoleDefinition {
    id: string;
    label: string;
    isSystem: boolean;
    icon: any;
}

const INITIAL_ROLES: RoleDefinition[] = [
    { id: UserType.ADMIN, label: 'Administrateur', isSystem: true, icon: Shield },
    { id: UserType.COLLECTOR, label: 'Collecteur', isSystem: true, icon: Truck },
    { id: UserType.BUSINESS, label: 'Entreprise', isSystem: true, icon: DollarSign },
    { id: UserType.CITIZEN, label: 'Citoyen', isSystem: true, icon: UserCog },
];

const INITIAL_PERMISSIONS: Record<string, UserPermission[]> = {
    [UserType.ADMIN]: ALL_PERMISSIONS.map(p => p.key),
    [UserType.COLLECTOR]: ['manage_fleet', 'manage_reports'],
    [UserType.BUSINESS]: ['view_finance', 'export_data'],
    [UserType.CITIZEN]: [],
};

const CRITICAL_PERMS: UserPermission[] = ['manage_users', 'system_settings'];

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({ onBack, onToast }) => {
    const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
    const [rolePermissions, setRolePermissions] = useState<Record<string, UserPermission[]>>(INITIAL_PERMISSIONS);
    const [selectedRoleId, setSelectedRoleId] = useState<string>(UserType.ADMIN);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleNameInput, setRoleNameInput] = useState('');
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const handleTogglePermission = (permKey: UserPermission) => {
        if (selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(permKey)) {
            onToast?.("Sécurité : Impossible de retirer cette permission à l'Administrateur.", "error");
            return;
        }

        setRolePermissions(prev => {
            const current = prev[selectedRoleId] || [];
            const updated = current.includes(permKey) 
                ? current.filter(k => k !== permKey) 
                : [...current, permKey];
            return { ...prev, [selectedRoleId]: updated };
        });
        setHasChanges(true);
    };

    const handleCategoryAction = (category: string, action: 'all' | 'none') => {
        const catPerms = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
        setRolePermissions(prev => {
            let updated = [...(prev[selectedRoleId] || [])];
            if (action === 'all') {
                catPerms.forEach(pk => { if (!updated.includes(pk)) updated.push(pk); });
            } else {
                updated = updated.filter(pk => !catPerms.includes(pk) || (selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(pk)));
            }
            return { ...prev, [selectedRoleId]: updated };
        });
        setHasChanges(true);
    };

    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleNameInput.trim()) return;

        if (editingRoleId) {
            setRoles(prev => prev.map(r => r.id === editingRoleId ? { ...r, label: roleNameInput } : r));
            onToast?.("Nom du rôle mis à jour", "success");
        } else {
            const newId = `custom_${Date.now()}`;
            setRoles(prev => [...prev, { id: newId, label: roleNameInput, isSystem: false, icon: UserCog }]);
            setRolePermissions(prev => ({ ...prev, [newId]: [] }));
            setSelectedRoleId(newId);
            onToast?.("Nouveau rôle créé", "success");
        }
        setShowRoleModal(false);
        setRoleNameInput('');
        setEditingRoleId(null);
        setHasChanges(true);
    };

    const handleDeleteRole = (id: string) => {
        if (confirm("Supprimer ce rôle ? Les utilisateurs associés perdront leurs accès.")) {
            setRoles(prev => prev.filter(r => r.id !== id));
            setSelectedRoleId(UserType.ADMIN);
            onToast?.("Rôle supprimé", "info");
            setHasChanges(true);
        }
    };

    const handlePersistChanges = () => {
        setHasChanges(false);
        onToast?.("Configuration des privilèges enregistrée.", "success");
    };

    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    const currentPerms = rolePermissions[selectedRoleId] || [];
    const selectedRole = roles.find(r => r.id === selectedRoleId);

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-gray-950 transition-colors duration-300">
            {/* Main Sticky Header */}
            <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-40 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Matrice des Privilèges</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                           <ShieldAlert size={12} className="text-blue-500" /> Contrôle d'accès hiérarchique (RBAC)
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-800 animate-pulse">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Modifié</span>
                        </div>
                    )}
                    <button onClick={() => { setRolePermissions(INITIAL_PERMISSIONS); setHasChanges(true); }} className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-all" title="Réinitialiser"><RotateCcw size={20} /></button>
                    <button onClick={handlePersistChanges} disabled={!hasChanges} className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${hasChanges ? 'bg-[#2962FF] text-white shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}><Save size={18} /> Sauvegarder</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Role List */}
                <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col shrink-0">
                    <div className="p-6">
                        <button onClick={() => { setEditingRoleId(null); setRoleNameInput(''); setShowRoleModal(true); }} className="w-full py-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-gray-400 hover:border-[#2962FF] hover:text-[#2962FF] transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest group">
                            <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Nouveau Rôle
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 no-scrollbar">
                        <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Profils définis</p>
                        {roles.map(role => (
                            <div key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`group p-4 rounded-[1.5rem] cursor-pointer transition-all flex items-center justify-between border-2 ${selectedRoleId === role.id ? 'bg-[#2962FF]/5 border-[#2962FF] text-[#2962FF]' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-all ${selectedRoleId === role.id ? 'bg-[#2962FF] text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <role.icon size={18} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black uppercase text-[11px] truncate tracking-tight">{role.label}</span>
                                        <span className="text-[8px] font-bold text-gray-400 uppercase">{role.isSystem ? 'Système' : 'Custom'}</span>
                                    </div>
                                </div>
                                {!role.isSystem && selectedRoleId === role.id && (
                                    <div className="flex gap-1 animate-fade-in">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingRoleId(role.id); setRoleNameInput(role.label); setShowRoleModal(true); }} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-blue-500"><Edit2 size={12}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={12}/></button>
                                    </div>
                                )}
                                {role.isSystem && <Lock size={10} className="opacity-20" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Permission Matrix */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#F8FAFC] dark:bg-gray-950 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-10">
                        
                        {/* Selected Role Summary */}
                        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 bg-[#2962FF]/10 text-[#2962FF] rounded-[2rem] flex items-center justify-center shrink-0 border-2 border-[#2962FF]/20">
                                <selectedRole.icon size={40} />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedRole?.label}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">Configuration des accès individuels</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-center px-6 border-r dark:border-gray-800">
                                    <p className="text-2xl font-black text-[#2962FF]">{currentPerms.length}</p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Actives</p>
                                </div>
                                <div className="text-center px-6">
                                    <p className="text-2xl font-black text-gray-300 dark:text-gray-700">{ALL_PERMISSIONS.length - currentPerms.length}</p>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Inactives</p>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar Matrix */}
                        <div className="relative">
                            <Search size={20} className="absolute left-6 top-5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher un privilège spécifique (ex: GPS, Finance, Chat...)" 
                                className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-gray-900 border-none text-sm font-bold shadow-sm outline-none focus:ring-2 ring-[#2962FF]/20 dark:text-white" 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>

                        {/* Categorized Permissions */}
                        <div className="space-y-8">
                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                const filtered = perms.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));
                                if (filtered.length === 0) return null;
                                
                                return (
                                    <div key={category} className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-in-up">
                                        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Layers size={18} className="text-blue-500" />
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{category}</h4>
                                            </div>
                                            <div className="flex gap-6">
                                                <button onClick={() => handleCategoryAction(category, 'all')} className="text-[9px] font-black uppercase text-[#2962FF] hover:underline tracking-widest">Activer tout</button>
                                                <button onClick={() => handleCategoryAction(category, 'none')} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 tracking-widest">Désactiver tout</button>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x dark:divide-gray-800">
                                            {filtered.map(perm => {
                                                const isActive = currentPerms.includes(perm.key);
                                                const isLocked = selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(perm.key);
                                                
                                                return (
                                                    <div 
                                                        key={perm.key} 
                                                        onClick={() => !isLocked && handleTogglePermission(perm.key)} 
                                                        className={`p-8 flex items-start gap-5 transition-all cursor-pointer group ${isActive ? 'bg-blue-50/20 dark:bg-blue-900/[0.03]' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    >
                                                        <div className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${isActive ? 'bg-[#00C853] border-[#00C853] text-white shadow-lg shadow-green-500/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 group-hover:border-blue-300'}`}>
                                                            {isActive && <Check size={16} strokeWidth={4} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-1.5">
                                                                <span className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 group-hover:text-gray-600'}`}>{perm.label}</span>
                                                                {isLocked && (
                                                                    <div className="p-1 bg-orange-100 text-orange-600 rounded-md" title="Paramètre critique verrouillé">
                                                                        <Lock size={10} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">{perm.description}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-10 rounded-[3.5rem] border-2 border-dashed border-blue-200 dark:border-blue-900/30 text-center space-y-4">
                            <span className="p-4 bg-white dark:bg-gray-900 rounded-full inline-block shadow-sm"><Info size={24} className="text-blue-500" /></span>
                            <p className="text-xs text-blue-800 dark:text-blue-300 font-bold uppercase tracking-widest max-w-md mx-auto leading-loose">
                                Les modifications de permissions prennent effet dès la prochaine connexion de l'utilisateur concerné. Soyez prudent avec les accès de type "Administration".
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW ROLE MODAL */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRoleModal(false)}></div>
                    <form onSubmit={handleSaveRole} className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-sm p-10 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{editingRoleId ? 'Renommer Rôle' : 'Nouveau Rôle'}</h3>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nom du profil métier</label>
                                <input 
                                    autoFocus 
                                    required 
                                    className="w-full p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-4 ring-[#2962FF]/10 shadow-inner" 
                                    placeholder="ex: Superviseur Zone Ouest" 
                                    value={roleNameInput} 
                                    onChange={e => setRoleNameInput(e.target.value)} 
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                {editingRoleId ? 'Mettre à jour' : 'Créer le rôle'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
