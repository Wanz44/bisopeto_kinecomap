import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, HelpCircle, 
    ChevronRight, LogOut, Smartphone, Mail, Save, X, Eye, 
    EyeOff, Check, ChevronDown, ChevronUp, MessageCircle, Phone, 
    FileText, Monitor, Laptop, Wifi, Battery, Zap, Database, 
    Map as MapIcon, RefreshCw, AlertTriangle, Download, Trash2, 
    Fingerprint, Palette, Terminal, Sparkles, UserCog, CheckCircle2,
    // Added CreditCard and aliased Settings to SettingsIcon to resolve component name conflict and missing icon errors
    ShieldAlert, DollarSign, Megaphone, Truck, BookOpen, Layers, Plus, Edit2, RotateCcw, CreditCard, Settings as SettingsIcon
} from 'lucide-react';
import { Theme, User, Language, UserType, UserPermission } from '../types';
import { SettingsAPI } from '../services/api';
import { NotificationService } from '../services/notificationService';

interface SettingsProps {
    user: User;
    theme: Theme;
    onToggleTheme: () => void;
    onBack: () => void;
    onLogout: () => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

// Définition des permissions disponibles
const ALL_PERMISSIONS: { key: UserPermission; label: string; category: string; description: string; icon: any }[] = [
    { key: 'manage_users', label: 'Gérer Utilisateurs', category: 'Administration', description: 'Créer, modifier, bannir des comptes.', icon: UserCog },
    { key: 'validate_docs', label: 'Valider Documents', category: 'Administration', description: 'Accès au processus KYC.', icon: CheckCircle2 },
    // Fixed: Using aliased SettingsIcon to avoid conflict with the Settings component declaration
    { key: 'system_settings', label: 'Paramètres Système', category: 'Administration', description: 'Configuration globale de l\'app.', icon: SettingsIcon },
    { key: 'view_finance', label: 'Voir Finance', category: 'Finance', description: 'Accès aux tableaux de revenus.', icon: DollarSign },
    // Fixed: CreditCard icon is now correctly imported from lucide-react
    { key: 'manage_pos', label: 'Point de Vente (POS)', category: 'Finance', description: 'Encaisser les paiements manuels.', icon: CreditCard },
    { key: 'manage_ads', label: 'Gérer Publicités', category: 'Marketing', description: 'Créer des campagnes partenaires.', icon: Megaphone },
    { key: 'manage_communications', label: 'Communication', category: 'Marketing', description: 'Envoyer des notifications push.', icon: MessageCircle },
    { key: 'manage_fleet', label: 'Gérer Flotte', category: 'Opérations', description: 'Suivi GPS et maintenance.', icon: Truck },
    { key: 'manage_academy', label: 'Gérer Academy', category: 'Education', description: 'Créer des cours et quiz.', icon: BookOpen },
    { key: 'export_data', label: 'Exporter Données', category: 'Données', description: 'Télécharger les rapports CSV/PDF.', icon: Database },
];

interface RoleDefinition {
    id: string;
    label: string;
    isSystem: boolean;
    icon: any;
}

export const Settings: React.FC<SettingsProps> = ({ user, theme, onToggleTheme, onBack, onLogout, currentLanguage, onLanguageChange, onToast }) => {
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'branding' | 'waste_config' | 'roles'>('main');
    const [isPushEnabled, setIsPushEnabled] = useState(Notification.permission === 'granted');
    
    // --- États pour la gestion des rôles ---
    const [roles, setRoles] = useState<RoleDefinition[]>([
        { id: UserType.ADMIN, label: 'Administrateur', isSystem: true, icon: Shield },
        { id: UserType.COLLECTOR, label: 'Collecteur', isSystem: true, icon: Truck },
        { id: UserType.BUSINESS, label: 'Entreprise', isSystem: true, icon: DollarSign },
        { id: UserType.CITIZEN, label: 'Citoyen', isSystem: true, icon: UserCog },
    ]);
    const [rolePermissions, setRolePermissions] = useState<Record<string, UserPermission[]>>({
        [UserType.ADMIN]: ALL_PERMISSIONS.map(p => p.key),
        [UserType.COLLECTOR]: ['manage_fleet', 'validate_docs'],
        [UserType.BUSINESS]: ['view_finance', 'export_data'],
        [UserType.CITIZEN]: [],
    });
    const [selectedRoleId, setSelectedRoleId] = useState<string>(UserType.COLLECTOR);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roleFormName, setRoleFormName] = useState('');
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const handleTogglePush = async () => {
        if (!isPushEnabled) {
            const granted = await NotificationService.requestPermission();
            if (granted) {
                setIsPushEnabled(true);
                if (onToast) onToast("Notifications Push activées !", "success");
            } else {
                if (onToast) onToast("Permission refusée par le navigateur", "error");
            }
        } else {
            setIsPushEnabled(false);
            if (onToast) onToast("Notifications Push désactivées dans l'app", "info");
        }
    };

    const handleTogglePermission = (perm: UserPermission) => {
        if (selectedRoleId === UserType.ADMIN && ['manage_users', 'system_settings'].includes(perm)) {
            onToast?.("Permission critique pour l'Admin.", "error");
            return;
        }
        const current = rolePermissions[selectedRoleId] || [];
        const next = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
        setRolePermissions({ ...rolePermissions, [selectedRoleId]: next });
    };

    const handleAddRole = () => {
        if (!roleFormName.trim()) return;
        if (editingRoleId) {
            setRoles(roles.map(r => r.id === editingRoleId ? { ...r, label: roleFormName } : r));
            onToast?.("Rôle mis à jour", "success");
        } else {
            const newId = `custom_${Date.now()}`;
            setRoles([...roles, { id: newId, label: roleFormName, isSystem: false, icon: UserCog }]);
            setRolePermissions({ ...rolePermissions, [newId]: [] });
            setSelectedRoleId(newId);
            onToast?.("Nouveau rôle créé", "success");
        }
        setShowRoleModal(false);
        setRoleFormName('');
        setEditingRoleId(null);
    };

    const handleDeleteRole = (id: string) => {
        if (confirm("Supprimer ce rôle et révoquer tous les accès associés ?")) {
            setRoles(roles.filter(r => r.id !== id));
            setSelectedRoleId(UserType.CITIZEN);
            onToast?.("Rôle supprimé", "info");
        }
    };

    const SettingItem = ({ icon: Icon, label, subLabel, onClick, toggle, onToggle, danger = false }: any) => (
        <div onClick={!toggle && !onToggle ? onClick : undefined} className={`flex items-center justify-between p-5 bg-white dark:bg-gray-800 border-b dark:border-gray-700 last:border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${danger ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><Icon size={20} /></div>
                <div>
                    <span className="font-black text-sm block uppercase tracking-tight">{label}</span>
                    {subLabel && <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-widest">{subLabel}</span>}
                </div>
            </div>
            {toggle !== undefined ? (
                <button onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${toggle ? 'bg-[#00C853]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${toggle ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            ) : <ChevronRight size={18} className="text-gray-300" />}
        </div>
    );

    // --- Vue Gestion des Rôles ---
    if (activeSubView === 'roles') {
        const groupedPerms = ALL_PERMISSIONS.reduce((acc, p) => {
            if (!acc[p.category]) acc[p.category] = [];
            acc[p.category].push(p);
            return acc;
        }, {} as Record<string, typeof ALL_PERMISSIONS>);

        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveSubView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft/></button>
                        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Rôles & Permissions</h2>
                    </div>
                    <button onClick={() => { setEditingRoleId(null); setRoleFormName(''); setShowRoleModal(true); }} className="bg-primary text-white p-3 rounded-2xl shadow-lg"><Plus/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    {/* Liste des rôles */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {roles.map(role => (
                            <div 
                                key={role.id}
                                onClick={() => setSelectedRoleId(role.id)}
                                className={`px-5 py-4 rounded-[2rem] border-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-3 shrink-0 ${selectedRoleId === role.id ? 'bg-primary border-primary text-white shadow-xl scale-105' : 'bg-white dark:bg-gray-800 border-transparent text-gray-500'}`}
                            >
                                <role.icon size={18}/>
                                <span className="text-xs font-black uppercase tracking-widest">{role.label}</span>
                                {!role.isSystem && selectedRoleId === role.id && (
                                    <div className="flex items-center gap-2 ml-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingRoleId(role.id); setRoleFormName(role.label); setShowRoleModal(true); }} className="p-1 hover:bg-white/20 rounded"><Edit2 size={14}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.id); }} className="p-1 hover:bg-red-500/50 rounded"><Trash2 size={14}/></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Matrice de permissions */}
                    <div className="space-y-6">
                        {Object.entries(groupedPerms).map(([category, perms]) => (
                            <div key={category} className="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="bg-gray-50 dark:bg-gray-800/50 px-8 py-4 border-b dark:border-gray-800 flex items-center gap-2">
                                    <Layers size={16} className="text-gray-400"/>
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category}</h4>
                                </div>
                                <div className="divide-y dark:divide-gray-800">
                                    {perms.map(p => {
                                        const isChecked = (rolePermissions[selectedRoleId] || []).includes(p.key);
                                        return (
                                            <div key={p.key} onClick={() => handleTogglePermission(p.key)} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-850 cursor-pointer transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${isChecked ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}><p.icon size={18}/></div>
                                                    <div>
                                                        <span className="text-sm font-black dark:text-white uppercase tracking-tight">{p.label}</span>
                                                        <p className="text-[10px] text-gray-400 font-bold leading-tight">{p.description}</p>
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-primary border-primary' : 'border-gray-200'}`}>
                                                    {isChecked && <Check size={14} className="text-white" strokeWidth={4}/>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Modal Rôle */}
                {showRoleModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRoleModal(false)}></div>
                        <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-sm p-8 relative z-10 animate-scale-up border dark:border-gray-800">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-6">{editingRoleId ? 'Renommer' : 'Nouveau Rôle'}</h3>
                            <input autoFocus className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white mb-6" placeholder="ex: Superviseur Terrain" value={roleFormName} onChange={e => setRoleFormName(e.target.value)} />
                            <button onClick={handleAddRole} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20">{editingRoleId ? 'Mettre à jour' : 'Créer le rôle'}</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeSubView === 'branding') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center gap-4">
                    <button onClick={() => setActiveSubView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Identité Visuelle</h2>
                </div>
                {/* ... existing branding logic ... */}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-6 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Réglages</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-24 no-scrollbar">
                
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                    <h3 className="px-8 pt-8 pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Compte & Sécurité</h3>
                    <SettingItem icon={Lock} label="Accès & Sécurité" subLabel="2FA & Sessions actives" />
                    <SettingItem icon={Bell} label="Notifications Push" subLabel="Alertes système en temps réel" toggle={isPushEnabled} onToggle={handleTogglePush} />
                    <SettingItem icon={Globe} label="Langue App" subLabel={currentLanguage === 'fr' ? 'Français' : 'English'} onClick={() => onLanguageChange(currentLanguage === 'fr' ? 'en' : 'fr')} />
                </div>

                {user.type === UserType.ADMIN && (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                        <h3 className="px-8 pt-8 pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilotage Système</h3>
                        <SettingItem icon={ShieldAlert} label="Rôles & Permissions" subLabel="Gérer les accès personnalisés" onClick={() => setActiveSubView('roles')} />
                        <SettingItem icon={Palette} label="Personnalisation" subLabel="Logo, Slogan, Couleurs" onClick={() => setActiveSubView('branding')} />
                        <SettingItem icon={Sparkles} label="Moteur d'Analyse" subLabel="Types de déchets IA" onClick={() => setActiveSubView('waste_config')} />
                        <SettingItem icon={Terminal} label="API & Intégrations" subLabel="Gestion des clés d'accès" />
                    </div>
                )}

                <div className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <SettingItem icon={LogOut} label="Déconnexion" danger onClick={onLogout} />
                </div>

                <div className="text-center pb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Biso Peto Engine v1.4.0 • Build DRC</p>
                </div>
            </div>
        </div>
    );
};
