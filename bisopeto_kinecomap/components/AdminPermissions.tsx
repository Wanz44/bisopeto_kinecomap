
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Shield, Save, RotateCcw, Lock, Check, 
    UserCog, Settings, DollarSign, Megaphone, Truck, BookOpen, 
    Database, MessageCircle, CreditCard, Layers, Plus, Trash2, Edit2, X, Search, Info,
    ShoppingBag, Map as MapIcon, ShieldAlert, ChevronRight, Filter, Loader2,
    Copy, Zap, Eye, AlertCircle
} from 'lucide-react';
import { UserPermission, UserType } from '../types';
import { SettingsAPI } from '../services/api';

interface RoleItem {
    id: string;
    label: string;
    isSystem: boolean;
    icon: any;
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

const INITIAL_ROLES: RoleItem[] = [
    { id: UserType.ADMIN, label: 'Administrateur', isSystem: true, icon: Shield },
    { id: UserType.COLLECTOR, label: 'Collecteur', isSystem: true, icon: Truck },
    { id: UserType.BUSINESS, label: 'Entreprise', isSystem: true, icon: DollarSign },
    { id: UserType.CITIZEN, label: 'Citoyen', isSystem: true, icon: UserCog },
];

const CRITICAL_PERMS: UserPermission[] = ['manage_users', 'system_settings'];

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({ onBack, onToast }) => {
    const [roles, setRoles] = useState<RoleItem[]>(INITIAL_ROLES);
    const [rolePermissions, setRolePermissions] = useState<Record<string, UserPermission[]>>({});
    const [selectedRoleId, setSelectedRoleId] = useState<string>(UserType.ADMIN);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    
    // UI states for modals
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingRoleMeta, setEditingRoleMeta] = useState<{id: string, label: string} | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await SettingsAPI.getRolesConfig();
                // Assurer que tous les rôles par défaut existent dans la config
                const updatedConfig = { ...config };
                roles.forEach(r => {
                    if (!updatedConfig[r.id]) updatedConfig[r.id] = [];
                });
                setRolePermissions(updatedConfig);
            } catch (e) {
                console.error("Failed to load RBAC config");
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleTogglePermission = (permKey: UserPermission) => {
        if (selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(permKey)) {
            onToast?.("Sécurité : Permission verrouillée pour l'Admin.", "error");
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

    const handleSaveMatrix = async () => {
        setIsSaving(true);
        try {
            await SettingsAPI.updateRolesConfig(rolePermissions);
            setHasChanges(false);
            onToast?.("Matrice des privilèges synchronisée !", "success");
        } catch (e) {
            onToast?.("Erreur lors de la sauvegarde Cloud", "error");
        } finally {
            setIsSaving(false);
        }
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

    const handleCreateRole = (id: string, label: string) => {
        if (rolePermissions[id]) {
            onToast?.("Cet identifiant de rôle existe déjà.", "error");
            return;
        }
        setRoles([...roles, { id, label, isSystem: false, icon: UserCog }]);
        setRolePermissions({ ...rolePermissions, [id]: [] });
        setSelectedRoleId(id);
        setShowRoleModal(false);
        setHasChanges(true);
    };

    const handleRenameRole = (id: string, newLabel: string) => {
        setRoles(roles.map(r => r.id === id ? { ...r, label: newLabel } : r));
        setEditingRoleMeta(null);
        setHasChanges(true);
    };

    const handleDuplicateRole = (sourceId: string) => {
        const newId = `${sourceId}_copy_${Date.now().toString().slice(-4)}`;
        const sourceRole = roles.find(r => r.id === sourceId);
        if (!sourceRole) return;

        setRoles([...roles, { ...sourceRole, id: newId, label: `${sourceRole.label} (Copie)`, isSystem: false }]);
        setRolePermissions({ ...rolePermissions, [newId]: [...(rolePermissions[sourceId] || [])] });
        setSelectedRoleId(newId);
        onToast?.("Rôle dupliqué avec succès", "success");
        setHasChanges(true);
    };

    const handleDeleteRole = (id: string) => {
        const role = roles.find(r => r.id === id);
        if (role?.isSystem) {
            onToast?.("Impossible de supprimer un rôle système.", "error");
            return;
        }
        if (window.confirm(`Supprimer le rôle "${role?.label}" ?`)) {
            setRoles(roles.filter(r => r.id !== id));
            const newPerms = { ...rolePermissions };
            delete newPerms[id];
            setRolePermissions(newPerms);
            setSelectedRoleId(UserType.CITIZEN);
            setHasChanges(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#F8FAFC] dark:bg-gray-950">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chargement RBAC Cloud...</p>
            </div>
        );
    }

    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    const currentPerms = rolePermissions[selectedRoleId] || [];
    const selectedRole = roles.find(r => r.id === selectedRoleId);

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-40 gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Matrice Privilèges</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">Configurateur RBAC Cloud</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {hasChanges && <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-4 py-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-900 animate-pulse">Non sauvegardé</div>}
                    <button 
                        onClick={handleSaveMatrix} 
                        disabled={!hasChanges || isSaving} 
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${hasChanges ? 'bg-[#2962FF] text-white shadow-xl shadow-blue-500/20' : 'bg-gray-200 text-gray-400'}`}
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                        {isSaving ? "Sync..." : "Sauvegarder"}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Roles Side */}
                <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col shrink-0 px-4 pt-6 space-y-2">
                    <div className="flex items-center justify-between px-4 mb-3">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Rôles du système</p>
                        <button onClick={() => setShowRoleModal(true)} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:scale-110 transition-transform"><Plus size={14}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-1">
                        {roles.map(role => (
                            <div key={role.id} className="group relative">
                                <div 
                                    onClick={() => setSelectedRoleId(role.id)} 
                                    className={`p-4 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4 border-2 ${selectedRoleId === role.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRoleId === role.id ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}><role.icon size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black uppercase text-[11px] tracking-tight truncate">{role.label}</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">{role.id}</p>
                                    </div>
                                    {selectedRoleId === role.id && (
                                        <button onClick={(e) => { e.stopPropagation(); setEditingRoleMeta({id: role.id, label: role.label}); }} className="p-1.5 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 hover:text-blue-500 transition-all">
                                            <Edit2 size={12}/>
                                        </button>
                                    )}
                                </div>
                                
                                {/* Hover Actions for Roles */}
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1">
                                    {!role.isSystem && selectedRoleId !== role.id && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="p-2 bg-red-50 text-red-500 rounded-lg shadow-sm hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 size={12}/>
                                        </button>
                                    )}
                                    {selectedRoleId !== role.id && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateRole(role.id); }} className="p-2 bg-gray-50 text-gray-400 rounded-lg shadow-sm hover:text-blue-500 transition-all">
                                            <Copy size={12}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Permissions Matrix */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar relative">
                    <div className="max-w-4xl mx-auto space-y-10 pb-32">
                        {/* Status bar for selected role */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-500/20">
                                    {selectedRole?.icon ? <selectedRole.icon size={32}/> : <Shield size={32}/>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedRole?.label}</h3>
                                        {selectedRole?.isSystem && <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-400 text-[8px] font-black uppercase rounded">Système</span>}
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Zap size={10} className="text-blue-500"/> {currentPerms.length} Privilèges actifs sur {ALL_PERMISSIONS.length}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleCategoryAction('Opérations', 'all')} className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-all">Full Opérations</button>
                                <button onClick={() => { if(selectedRole?.id !== UserType.ADMIN) setRolePermissions({...rolePermissions, [selectedRoleId]: []}); setHasChanges(true); }} className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl font-black text-[9px] uppercase tracking-widest border border-red-100 dark:border-red-900/30 hover:bg-red-100 transition-all">Réinitialiser</button>
                            </div>
                        </div>

                        <div className="relative">
                            <Search size={20} className="absolute left-6 top-5 text-gray-400" />
                            <input type="text" placeholder="Chercher un privilège..." className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-gray-900 border-none text-sm font-bold shadow-sm outline-none focus:ring-2 ring-blue-500/20 dark:text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>

                        <div className="space-y-8">
                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                const filtered = perms.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()));
                                if (filtered.length === 0) return null;
                                return (
                                    <div key={category} className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden animate-fade-in-up">
                                        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800 flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{category}</h4>
                                            <div className="flex gap-4">
                                                <button onClick={() => handleCategoryAction(category, 'all')} className="text-[9px] font-black uppercase text-blue-600 hover:underline">Tout</button>
                                                <button onClick={() => handleCategoryAction(category, 'none')} className="text-[9px] font-black uppercase text-gray-400 hover:text-red-500">Rien</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x dark:divide-gray-800">
                                            {filtered.map(perm => {
                                                const isActive = currentPerms.includes(perm.key);
                                                const isLocked = selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(perm.key);
                                                return (
                                                    <div key={perm.key} onClick={() => !isLocked && handleTogglePermission(perm.key)} className={`p-8 flex items-start gap-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all ${isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-gray-900/50' : ''}`}>
                                                        <div className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-[#00C853] border-[#00C853] text-white shadow-lg shadow-green-500/20' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                                            {isActive && <Check size={16} strokeWidth={4}/>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{perm.label}</p>
                                                                {isLocked && <Lock size={10} className="text-gray-400" />}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed mt-1">{perm.description}</p>
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
            </div>

            {/* MODAL: ADD ROLE */}
            {showRoleModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowRoleModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-10 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-2 leading-none">Nouveau Rôle</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-8">Définissez une nouvelle catégorie d'utilisateurs</p>
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleCreateRole(formData.get('roleId') as string, formData.get('roleLabel') as string);
                        }} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Identifiant (Unique)</label>
                                <input name="roleId" required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" placeholder="ex: moderator, supervisor..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Libellé Affiché</label>
                                <input name="roleLabel" required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" placeholder="ex: Superviseur de Zone" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase text-xs">Annuler</button>
                                <button type="submit" className="flex-[2] py-4 bg-[#2962FF] text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Créer le rôle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT ROLE META */}
            {editingRoleMeta && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setEditingRoleMeta(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-10 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase mb-8">Éditer Rôle</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nouveau Libellé</label>
                                <input 
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-blue-500/20" 
                                    value={editingRoleMeta.label}
                                    onChange={(e) => setEditingRoleMeta({ ...editingRoleMeta, label: e.target.value })}
                                />
                            </div>
                            <button onClick={() => handleRenameRole(editingRoleMeta.id, editingRoleMeta.label)} className="w-full py-5 bg-[#2962FF] text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-500/20">Mettre à jour</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AdminPermissionsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}
