
import React, { useState } from 'react';
import { ArrowLeft, Shield, CheckSquare, Save, RotateCcw, AlertTriangle, Lock, Check, Square, CheckCircle2, UserCog, Settings, DollarSign, Megaphone, Truck, BookOpen, Database, MessageCircle, CreditCard, Layers, Plus, Trash2, Edit2, X } from 'lucide-react';
import { UserPermission, UserType } from '../types';

interface AdminPermissionsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Définition des permissions avec métadonnées pour l'UI
const ALL_PERMISSIONS: { key: UserPermission; label: string; category: string; description: string; icon: any }[] = [
    // Administration
    { key: 'manage_users', label: 'Gérer Utilisateurs', category: 'Administration', description: 'Créer, modifier, bannir des comptes.', icon: UserCog },
    { key: 'validate_docs', label: 'Valider Documents', category: 'Administration', description: 'Accès au processus KYC.', icon: CheckCircle2 },
    { key: 'system_settings', label: 'Paramètres Système', category: 'Administration', description: 'Configuration globale de l\'app.', icon: Settings },
    
    // Finance
    { key: 'view_finance', label: 'Voir Finance', category: 'Finance', description: 'Accès aux tableaux de revenus.', icon: DollarSign },
    { key: 'manage_pos', label: 'Point de Vente (POS)', category: 'Finance', description: 'Encaisser les paiements manuels.', icon: CreditCard },
    
    // Marketing
    { key: 'manage_ads', label: 'Gérer Publicités', category: 'Marketing', description: 'Créer des campagnes partenaires.', icon: Megaphone },
    { key: 'manage_communications', label: 'Communication', category: 'Marketing', description: 'Envoyer des notifications push.', icon: MessageCircle },
    
    // Opérations
    { key: 'manage_fleet', label: 'Gérer Flotte', category: 'Opérations', description: 'Suivi GPS et maintenance.', icon: Truck },
    { key: 'manage_academy', label: 'Gérer Academy', category: 'Education', description: 'Créer des cours et quiz.', icon: BookOpen },
    
    // Données
    { key: 'export_data', label: 'Exporter Données', category: 'Données', description: 'Télécharger les rapports CSV/PDF.', icon: Database },
];

// Structure pour gérer les rôles dynamiques
interface RoleDefinition {
    id: string;
    label: string;
    isSystem: boolean; // Si true, on ne peut pas supprimer ou renommer
    icon: any;
}

// Permissions initiales par ID de rôle
const INITIAL_PERMISSIONS: Record<string, UserPermission[]> = {
    [UserType.ADMIN]: ALL_PERMISSIONS.map(p => p.key),
    [UserType.COLLECTOR]: ['manage_fleet', 'validate_docs'],
    [UserType.BUSINESS]: ['view_finance', 'export_data'],
    [UserType.CITIZEN]: [],
};

// Rôles initiaux
const INITIAL_ROLES: RoleDefinition[] = [
    { id: UserType.ADMIN, label: 'Administrateur', isSystem: true, icon: Shield },
    { id: UserType.COLLECTOR, label: 'Collecteur', isSystem: true, icon: Truck },
    { id: UserType.BUSINESS, label: 'Entreprise', isSystem: true, icon: DollarSign },
    { id: UserType.CITIZEN, label: 'Citoyen', isSystem: true, icon: UserCog },
];

// Permissions critiques qui ne peuvent PAS être retirées au rôle ADMIN
const CRITICAL_ADMIN_PERMISSIONS: UserPermission[] = ['manage_users', 'system_settings'];

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({ onBack, onToast }) => {
    const [roles, setRoles] = useState<RoleDefinition[]>(INITIAL_ROLES);
    const [rolePermissions, setRolePermissions] = useState<Record<string, UserPermission[]>>(INITIAL_PERMISSIONS);
    const [selectedRoleId, setSelectedRoleId] = useState<string>(UserType.COLLECTOR);
    const [hasChanges, setHasChanges] = useState(false);

    // Modal State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleFormMode, setRoleFormMode] = useState<'create' | 'edit'>('create');
    const [roleFormName, setRoleFormName] = useState('');
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    // --- Role Management Logic ---

    const handleAddRole = () => {
        setRoleFormMode('create');
        setRoleFormName('');
        setShowRoleModal(true);
    };

    const handleEditRole = (role: RoleDefinition, e: React.MouseEvent) => {
        e.stopPropagation();
        if (role.isSystem) return;
        setRoleFormMode('edit');
        setRoleFormName(role.label);
        setEditingRoleId(role.id);
        setShowRoleModal(true);
    };

    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roleFormName.trim()) return;

        if (roleFormMode === 'create') {
            const newId = `custom_${Date.now()}`;
            const newRole: RoleDefinition = {
                id: newId,
                label: roleFormName,
                isSystem: false,
                icon: UserCog // Icône par défaut pour les rôles custom
            };
            setRoles([...roles, newRole]);
            setRolePermissions(prev => ({ ...prev, [newId]: [] })); // Init permissions vides
            setSelectedRoleId(newId);
            if (onToast) onToast(`Rôle "${roleFormName}" créé avec succès`, "success");
        } else if (roleFormMode === 'edit' && editingRoleId) {
            setRoles(prev => prev.map(r => r.id === editingRoleId ? { ...r, label: roleFormName } : r));
            if (onToast) onToast(`Rôle renommé en "${roleFormName}"`, "success");
        }

        setShowRoleModal(false);
        setHasChanges(true); // Active le bouton Sauvegarder
    };

    const handleDeleteRole = (roleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.")) {
            const roleName = roles.find(r => r.id === roleId)?.label;
            setRoles(prev => prev.filter(r => r.id !== roleId));
            const newPerms = { ...rolePermissions };
            delete newPerms[roleId];
            setRolePermissions(newPerms);
            
            if (selectedRoleId === roleId) {
                setSelectedRoleId(UserType.CITIZEN);
            }
            if (onToast) onToast(`Rôle "${roleName}" supprimé`, "success");
            setHasChanges(true); // Active le bouton Sauvegarder
        }
    };

    // --- Permissions Logic ---

    const handleTogglePermission = (perm: UserPermission) => {
        // Sécurité : Empêcher de retirer les droits critiques aux admins système
        if (selectedRoleId === UserType.ADMIN && CRITICAL_ADMIN_PERMISSIONS.includes(perm)) {
            if (onToast) onToast("Action refusée : Permission critique pour Admin.", "error");
            return;
        }

        const currentPerms = rolePermissions[selectedRoleId] || [];
        const hasPerm = currentPerms.includes(perm);
        const permLabel = ALL_PERMISSIONS.find(p => p.key === perm)?.label || perm;

        setRolePermissions(prev => {
            const newPerms = hasPerm 
                ? currentPerms.filter(p => p !== perm)
                : [...currentPerms, perm];
            
            return { ...prev, [selectedRoleId]: newPerms };
        });
        
        setHasChanges(true);
        if (onToast) onToast(`Permission "${permLabel}" ${hasPerm ? 'retirée' : 'ajoutée'}`, "info");
    };

    const handleToggleCategory = (category: string, enable: boolean) => {
        const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
        
        setRolePermissions(prev => {
            let newPerms = [...(prev[selectedRoleId] || [])];
            
            if (enable) {
                // Ajouter ceux qui manquent
                categoryPerms.forEach(p => {
                    if (!newPerms.includes(p)) newPerms.push(p);
                });
            } else {
                // Retirer tout sauf les critiques si Admin
                newPerms = newPerms.filter(p => {
                    if (selectedRoleId === UserType.ADMIN && CRITICAL_ADMIN_PERMISSIONS.includes(p)) return true;
                    return !categoryPerms.includes(p);
                });
            }
            return { ...prev, [selectedRoleId]: newPerms };
        });
        
        setHasChanges(true);
        if (onToast) onToast(`Catégorie "${category}" ${enable ? 'activée' : 'désactivée'}`, "info");
    };

    const handleSave = () => {
        // Simulation d'appel API
        // await API.updatePermissions(rolePermissions);
        if (onToast) onToast(`Modifications enregistrées avec succès`, "success");
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm("Réinitialiser les permissions par défaut pour ce rôle ?")) {
            setRolePermissions(prev => ({
                ...prev,
                [selectedRoleId]: INITIAL_PERMISSIONS[selectedRoleId] || []
            }));
            setHasChanges(true); // Active le bouton Sauvegarder pour persister le reset
            if (onToast) onToast("Permissions réinitialisées par défaut", "info");
        }
    };

    // Group permissions by category
    const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = [];
        acc[perm.category].push(perm);
        return acc;
    }, {} as Record<string, typeof ALL_PERMISSIONS>);

    const selectedRoleDef = roles.find(r => r.id === selectedRoleId);

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Shield size={24} className="text-[#2962FF]" />
                            Gestion des Permissions
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Contrôle d'accès hiérarchique (RBAC)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleReset} 
                        className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" 
                        title="Réinitialiser par défaut"
                    >
                        <RotateCcw size={20} />
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={!hasChanges}
                        className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                            hasChanges 
                            ? 'bg-[#2962FF] text-white hover:bg-blue-700 shadow-blue-500/20' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <Save size={18} /> Enregistrer
                    </button>
                </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    
                    {/* Sidebar: Role Selector */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-2 space-y-1 shadow-sm max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 mt-2">Rôles Disponibles</h3>
                            
                            {roles.map(role => (
                                <div
                                    key={role.id}
                                    onClick={() => setSelectedRoleId(role.id)}
                                    className={`w-full px-3 py-3 rounded-xl font-bold text-sm transition-all flex justify-between items-center group cursor-pointer border ${
                                        selectedRoleId === role.id 
                                        ? 'bg-[#2962FF] text-white shadow-md border-[#2962FF]' 
                                        : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-1.5 rounded-lg shrink-0 ${selectedRoleId === role.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-white'}`}>
                                            <role.icon size={16} />
                                        </div>
                                        <span className="capitalize truncate">{role.label}</span>
                                    </div>
                                    
                                    {/* Action Buttons for Custom Roles */}
                                    {!role.isSystem && (
                                        <div className={`flex gap-1 ${selectedRoleId === role.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                            <button 
                                                onClick={(e) => handleEditRole(role, e)}
                                                className={`p-1 rounded hover:bg-white/20`}
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteRole(role.id, e)}
                                                className={`p-1 rounded hover:bg-red-500/50 hover:text-white`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    
                                    {/* Counter for System Roles */}
                                    {role.isSystem && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${selectedRoleId === role.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                            {rolePermissions[role.id]?.length || 0}
                                        </span>
                                    )}
                                </div>
                            ))}

                            <button 
                                onClick={handleAddRole}
                                className="w-full mt-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl text-gray-400 dark:text-gray-500 font-bold text-sm hover:border-[#2962FF] hover:text-[#2962FF] transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={16} /> Nouveau Rôle
                            </button>
                        </div>
                        
                        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-orange-700 dark:text-orange-400">Modification en cours</p>
                                <p className="text-[10px] text-orange-600 dark:text-orange-300 leading-relaxed">
                                    Vous éditez les droits du rôle <strong>{selectedRoleDef?.label}</strong>. Les changements s'appliquent à tous les utilisateurs associés.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main: Permission Matrix */}
                    <div className="lg:col-span-3 space-y-6 lg:overflow-y-auto pb-10">
                        {Object.entries(groupedPermissions).map(([category, perms]) => {
                            const currentRolePerms = rolePermissions[selectedRoleId] || [];
                            const activeCount = perms.filter(p => currentRolePerms.includes(p.key)).length;
                            const isAllActive = activeCount === perms.length;

                            return (
                                <div key={category} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm animate-fade-in">
                                    {/* Category Header */}
                                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Layers size={18} className="text-gray-400" />
                                            <h4 className="font-bold text-gray-800 dark:text-white">{category}</h4>
                                            <span className="text-xs text-gray-400 ml-2">({activeCount}/{perms.length})</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleToggleCategory(category, true)}
                                                disabled={isAllActive}
                                                className="text-[10px] font-bold uppercase px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 text-green-600"
                                            >
                                                Tout Cocher
                                            </button>
                                            <button 
                                                onClick={() => handleToggleCategory(category, false)}
                                                disabled={activeCount === 0}
                                                className="text-[10px] font-bold uppercase px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 text-red-500"
                                            >
                                                Tout Décocher
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permission Grid */}
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {perms.map(perm => {
                                            const isChecked = currentRolePerms.includes(perm.key);
                                            const isLocked = selectedRoleId === UserType.ADMIN && CRITICAL_ADMIN_PERMISSIONS.includes(perm.key);

                                            return (
                                                <div 
                                                    key={perm.key} 
                                                    onClick={() => !isLocked && handleTogglePermission(perm.key)}
                                                    className={`relative flex items-start gap-4 p-4 rounded-xl cursor-pointer border transition-all duration-200 group ${
                                                        isChecked 
                                                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                                                        : 'bg-gray-50/50 dark:bg-gray-800/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                                                    } ${isLocked ? 'opacity-75 cursor-not-allowed' : ''}`}
                                                >
                                                    {/* Checkbox Visual */}
                                                    <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 ${
                                                        isChecked 
                                                        ? 'bg-[#2962FF] border-[#2962FF]' 
                                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 group-hover:border-[#2962FF]'
                                                    }`}>
                                                        {isChecked && <Check size={16} className="text-white" strokeWidth={3} />}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className={`block text-sm font-bold mb-1 ${isChecked ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                {perm.label}
                                                            </span>
                                                            {isLocked && <span title="Verrouillé pour sécurité"><Lock size={14} className="text-orange-500" /></span>}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                                                            {perm.description}
                                                        </p>
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

            {/* Modal Création/Edition Rôle */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white">
                                {roleFormMode === 'create' ? 'Nouveau Rôle' : 'Modifier le Rôle'}
                            </h3>
                            <button onClick={() => setShowRoleModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                        </div>
                        
                        <form onSubmit={handleSaveRole} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nom du Rôle</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    placeholder="Ex: Superviseur, Auditeur..."
                                    value={roleFormName}
                                    onChange={e => setRoleFormName(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="w-full py-3 bg-[#2962FF] text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                                {roleFormMode === 'create' ? 'Créer' : 'Mettre à jour'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
