
import React, { useState } from 'react';
// Fixed: Added missing 'Info' icon to imports from lucide-react
import { 
    ArrowLeft, Shield, Save, RotateCcw, AlertTriangle, Lock, Check, 
    UserCog, Settings, DollarSign, Megaphone, Truck, BookOpen, 
    Database, MessageCircle, CreditCard, Layers, Plus, Trash2, Edit2, X, Search, Info
} from 'lucide-react';
import { UserPermission, UserType } from '../types';

interface AdminPermissionsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Catalogue exhaustif des permissions du système
const ALL_PERMISSIONS: { key: UserPermission; label: string; category: string; description: string; icon: any }[] = [
    { key: 'manage_users', label: 'Gestion Utilisateurs', category: 'Administration', description: 'Accès total aux comptes, bannissements et validations.', icon: UserCog },
    { key: 'validate_docs', label: 'Validation KYC', category: 'Administration', description: 'Vérifier et approuver les documents d\'identité.', icon: Shield },
    { key: 'system_settings', label: 'Configuration Système', category: 'Administration', description: 'Modifier les paramètres globaux et API.', icon: Settings },
    
    { key: 'view_finance', label: 'Reporting Financier', category: 'Finance', description: 'Consulter les revenus et statistiques de change.', icon: DollarSign },
    { key: 'manage_pos', label: 'Gestion POS', category: 'Finance', description: 'Gérer les points de vente et encaissements.', icon: CreditCard },
    
    { key: 'manage_ads', label: 'Régie Publicitaire', category: 'Marketing', description: 'Créer et monitorer les campagnes partenaires.', icon: Megaphone },
    { key: 'manage_communications', label: 'Centre de Comm.', category: 'Marketing', description: 'Envoi de notifications push groupées.', icon: MessageCircle },
    
    { key: 'manage_fleet', label: 'Gestion Flotte', category: 'Opérations', description: 'Suivi GPS, verrouillage moteur et maintenance.', icon: Truck },
    { key: 'manage_academy', label: 'Gestion Academy', category: 'Éducation', description: 'Édition des cours, quiz et XP.', icon: BookOpen },
    { key: 'export_data', label: 'Audit & Export', category: 'Données', description: 'Extraire les logs et rapports CSV/PDF.', icon: Database },
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
    [UserType.COLLECTOR]: ['manage_fleet', 'validate_docs'],
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

    // Modal States
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
        // Simulation de sauvegarde API
        setHasChanges(false);
        onToast?.("Modifications enregistrées sur le serveur", "success");
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
            {/* Toolbar Top */}
            <div className="bg-white dark:bg-gray-900 p-4 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Rôles & Privilèges</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contrôle d'accès hiérarchique (RBAC)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { setRolePermissions(INITIAL_PERMISSIONS); setHasChanges(true); }}
                        className="p-3 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-2xl transition-all"
                        title="Réinitialiser"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={handlePersistChanges}
                        disabled={!hasChanges}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                            hasChanges 
                            ? 'bg-primary text-white shadow-xl shadow-green-500/20 hover:scale-105' 
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} /> Sauvegarder
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Role Selector */}
                <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col shrink-0">
                    <div className="p-6">
                        <button 
                            onClick={() => { setEditingRoleId(null); setRoleNameInput(''); setShowRoleModal(true); }}
                            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-gray-400 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest"
                        >
                            <Plus size={16} /> Nouveau Rôle
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 no-scrollbar">
                        {roles.map(role => (
                            <div 
                                key={role.id}
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`group p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border-2 ${
                                    selectedRoleId === role.id 
                                    ? 'bg-primary/5 border-primary text-primary' 
                                    : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`p-2 rounded-xl shrink-0 ${selectedRoleId === role.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        <role.icon size={18} />
                                    </div>
                                    <span className="font-black uppercase text-xs truncate tracking-tight">{role.label}</span>
                                </div>
                                {!role.isSystem && selectedRoleId === role.id && (
                                    <div className="flex gap-1 animate-fade-in">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingRoleId(role.id); setRoleNameInput(role.label); setShowRoleModal(true); }} className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-lg"><Edit2 size={12}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={12}/></button>
                                    </div>
                                )}
                                {role.isSystem && <Lock size={12} className="opacity-20" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content: Permission Matrix */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC] dark:bg-gray-950 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Permissions : {selectedRole?.label}</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{currentPerms.length} accès activés sur {ALL_PERMISSIONS.length}</p>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Filtrer permissions..." 
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border-none text-xs font-bold shadow-sm outline-none focus:ring-2 ring-primary/20"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {Object.entries(groupedPermissions).map(([category, perms]) => {
                            const filtered = perms.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()));
                            if (filtered.length === 0) return null;

                            return (
                                <div key={category} className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-in-up">
                                    <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Layers size={18} className="text-gray-400" />
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{category}</h4>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleCategoryAction(category, 'all')} className="text-[9px] font-black uppercase text-primary hover:underline tracking-widest">Tout activer</button>
                                            <button onClick={() => handleCategoryAction(category, 'none')} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500 tracking-widest">Tout désactiver</button>
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
                                                    className={`p-6 flex items-start gap-4 transition-all cursor-pointer group ${isActive ? 'bg-primary/[0.02]' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'} ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isActive ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                                        {isActive && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{perm.label}</span>
                                                            {isLocked && <Lock size={12} className="text-orange-500" />}
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
                </div>
            </div>

            {/* Modal Role Create/Edit */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowRoleModal(false)}></div>
                    <form onSubmit={handleSaveRole} className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-sm p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{editingRoleId ? 'Renommer Rôle' : 'Nouveau Rôle'}</h3>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du profil</label>
                                <input 
                                    autoFocus
                                    required
                                    className="w-full p-5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-primary/20"
                                    placeholder="ex: Superviseur Zone Est" 
                                    value={roleNameInput} 
                                    onChange={e => setRoleNameInput(e.target.value)} 
                                />
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-600 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-tight">
                                    Une fois créé, vous pourrez assigner des permissions spécifiques à ce rôle dans la matrice.
                                </p>
                            </div>
                            <button type="submit" className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all">
                                {editingRoleId ? 'Mettre à jour' : 'Créer le rôle'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
