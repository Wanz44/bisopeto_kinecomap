
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Shield, Save, RotateCcw, Lock, Check, 
    UserCog, Settings, DollarSign, Megaphone, Truck, BookOpen, 
    Database, MessageCircle, CreditCard, Layers, Plus, Trash2, Edit2, X, Search, Info,
    ShoppingBag, Map as MapIcon, ShieldAlert, ChevronRight, Filter, Loader2
} from 'lucide-react';
import { UserPermission, UserType } from '../types';
import { SettingsAPI } from '../services/api';

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

const INITIAL_ROLES = [
    { id: UserType.ADMIN, label: 'Administrateur', isSystem: true, icon: Shield },
    { id: UserType.COLLECTOR, label: 'Collecteur', isSystem: true, icon: Truck },
    { id: UserType.BUSINESS, label: 'Entreprise', isSystem: true, icon: DollarSign },
    { id: UserType.CITIZEN, label: 'Citoyen', isSystem: true, icon: UserCog },
];

const CRITICAL_PERMS: UserPermission[] = ['manage_users', 'system_settings'];

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({ onBack, onToast }) => {
    const [roles, setRoles] = useState(INITIAL_ROLES);
    const [rolePermissions, setRolePermissions] = useState<Record<string, UserPermission[]>>({});
    const [selectedRoleId, setSelectedRoleId] = useState<string>(UserType.ADMIN);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await SettingsAPI.getRolesConfig();
                setRolePermissions(config);
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
                    {hasChanges && <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-4 py-2 bg-orange-50 rounded-xl border animate-pulse">Non sauvegardé</div>}
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
                    <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Rôles du système</p>
                    {roles.map(role => (
                        <div key={role.id} onClick={() => setSelectedRoleId(role.id)} className={`p-4 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-4 border-2 ${selectedRoleId === role.id ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRoleId === role.id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><role.icon size={18} /></div>
                            <span className="font-black uppercase text-[11px] tracking-tight">{role.label}</span>
                        </div>
                    ))}
                </div>

                {/* Permissions Matrix */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-10">
                        <div className="relative">
                            <Search size={20} className="absolute left-6 top-5 text-gray-400" />
                            <input type="text" placeholder="Chercher un privilège..." className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white dark:bg-gray-900 border-none text-sm font-bold shadow-sm outline-none focus:ring-2 ring-blue-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>

                        <div className="space-y-8">
                            {Object.entries(groupedPermissions).map(([category, perms]) => {
                                const filtered = perms.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase()));
                                if (filtered.length === 0) return null;
                                return (
                                    <div key={category} className="bg-white dark:bg-gray-900 rounded-[3rem] border shadow-sm overflow-hidden animate-fade-in-up">
                                        <div className="px-8 py-5 bg-gray-50 dark:bg-gray-800/50 border-b flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{category}</h4>
                                            <div className="flex gap-4">
                                                <button onClick={() => handleCategoryAction(category, 'all')} className="text-[9px] font-black uppercase text-blue-600">Tout</button>
                                                <button onClick={() => handleCategoryAction(category, 'none')} className="text-[9px] font-black uppercase text-gray-400">Rien</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x dark:divide-gray-800">
                                            {filtered.map(perm => {
                                                const isActive = currentPerms.includes(perm.key);
                                                const isLocked = selectedRoleId === UserType.ADMIN && CRITICAL_PERMS.includes(perm.key);
                                                return (
                                                    <div key={perm.key} onClick={() => !isLocked && handleTogglePermission(perm.key)} className={`p-8 flex items-start gap-5 cursor-pointer hover:bg-gray-50 transition-all ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                                        <div className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center ${isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200'}`}>{isActive && <Check size={16} strokeWidth={4}/>}</div>
                                                        <div>
                                                            <p className={`text-sm font-black uppercase tracking-tight ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{perm.label}</p>
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
            </div>
        </div>
    );
};
