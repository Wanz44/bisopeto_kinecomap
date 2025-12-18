
import React, { useState, useRef } from 'react';
import { 
    ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, 
    ChevronRight, LogOut, Smartphone, Mail, Save, X, 
    Fingerprint, Palette, Terminal, Sparkles, ShieldAlert, RotateCcw, 
    Settings as SettingsIcon, Upload, ImageIcon, Link as LinkIcon, RefreshCcw, Info,
    Trash2, AlertCircle, Database, Zap, ShieldCheck, Activity, Search, Wrench, Cloud, CloudOff
} from 'lucide-react';
import { Theme, User, Language, UserType, AppView, DatabaseHealth } from '../types';
import { NotificationService } from '../services/notificationService';
import { SettingsAPI } from '../services/api';

interface SettingsProps {
    user: User;
    theme: Theme;
    onToggleTheme: () => void;
    onBack: () => void;
    onLogout: () => void;
    currentLanguage: Language;
    onLanguageChange: (lang: Language) => void;
    onChangeView: (view: AppView) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    appLogo: string;
    onUpdateLogo: (logo: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    user, theme, onToggleTheme, onBack, onLogout, 
    currentLanguage, onLanguageChange, onChangeView, onToast,
    appLogo, onUpdateLogo
}) => {
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'branding' | 'maintenance'>('main');
    const [isPushEnabled, setIsPushEnabled] = useState(Notification.permission === 'granted');
    const [isResetting, setIsResetting] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [healthReport, setHealthReport] = useState<DatabaseHealth | null>(null);
    
    const [tempLogo, setTempLogo] = useState(appLogo);
    const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCheckDatabase = async () => {
        setIsChecking(true);
        try {
            const report = await SettingsAPI.checkDatabaseIntegrity();
            setHealthReport(report);
            if (onToast) onToast("Audit de la base de données terminé", "success");
        } catch (e) {
            if (onToast) onToast("Échec du diagnostic", "error");
        } finally {
            setIsChecking(false);
        }
    };

    const handleRepairDatabase = async () => {
        if (window.confirm("Lancer la réparation automatique ? Cela corrigera les structures sans effacer vos données.")) {
            await SettingsAPI.repairDatabase();
            await handleCheckDatabase();
            if (onToast) onToast("Base de données réparée", "success");
        }
    };

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveBranding = () => {
        onUpdateLogo(tempLogo);
        if (onToast) onToast("Identité visuelle mise à jour !", "success");
        setActiveSubView('main');
    };

    const handleFactoryReset = async () => {
        const confirm = window.confirm("ATTENTION : Cette action va effacer tous les signalements, annonces, véhicules et partenaires de la plateforme. Les compteurs reviendront à zéro. Continuer ?");
        if (confirm) {
            setIsResetting(true);
            await SettingsAPI.resetAllData();
            if (onToast) onToast("Réinitialisation terminée. Redémarrage...", "success");
            setTimeout(() => {
                window.location.reload();
            }, 2000);
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

    if (activeSubView === 'maintenance') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveSubView('main')} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Maintenance</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnostic & Intégrité</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 pb-24 no-scrollbar">
                    
                    {/* Database Integrity Audit Section */}
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Database size={20} className="text-blue-500" /> Audit de la Base de Données
                            </h3>
                            <button 
                                onClick={handleCheckDatabase}
                                disabled={isChecking}
                                className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-100"
                            >
                                {isChecking ? <RefreshCcw size={14} className="animate-spin" /> : <Activity size={14} />}
                                Lancer l'Audit
                            </button>
                        </div>

                        {healthReport && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${healthReport.status === 'healthy' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={24} />
                                            <div>
                                                <p className="text-sm font-black uppercase">Statut Global</p>
                                                <p className="text-[10px] font-bold opacity-70">{healthReport.status.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <span className="text-xl font-black">{healthReport.totalSizeKB} KB</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${healthReport.supabaseConnected ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                        <div className="flex items-center gap-3">
                                            {healthReport.supabaseConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
                                            <div>
                                                <p className="text-sm font-black uppercase">Sync Supabase</p>
                                                <p className="text-[10px] font-bold opacity-70">{healthReport.supabaseConnected ? 'OPÉRATIONNEL' : 'HORS-LIGNE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {healthReport.tables.map(table => (
                                        <div key={table.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase">{table.name}</p>
                                                <p className="text-sm font-black dark:text-white">{table.count} entrées</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase ${table.status === 'ok' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {table.status}
                                                </span>
                                                <p className="text-[9px] text-gray-400 mt-1">{table.sizeKB} KB</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {healthReport.status !== 'healthy' && (
                                    <button 
                                        onClick={handleRepairDatabase}
                                        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Wrench size={18} /> Réparer la Structure
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-[3rem] space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Zone de Danger</h3>
                                <p className="text-xs text-red-500 font-bold uppercase mt-1 opacity-70">Actions irréversibles sur la base de données</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-red-100 dark:border-red-800 space-y-4 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400"><Database size={24}/></div>
                                <div className="flex-1">
                                    <h4 className="font-black text-sm uppercase dark:text-white">Remise à zéro de la plateforme</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 leading-relaxed">
                                        Cette action effacera TOUTES les données et remettra les compteurs globaux à zéro.
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleFactoryReset}
                                disabled={isResetting}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                            >
                                {isResetting ? <RefreshCcw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                {isResetting ? "Réinitialisation..." : "Réinitialiser toute la plateforme"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeSubView === 'branding') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveSubView('main')} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Identité Visuelle</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo & Branding Plateforme</p>
                        </div>
                    </div>
                    <button 
                        onClick={saveBranding}
                        className="bg-[#2962FF] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Save size={16} /> Appliquer
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-24 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 flex flex-col items-center justify-center gap-4 shadow-sm relative group">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest absolute top-6 left-8">Aperçu Mode Clair</span>
                            <div className="w-32 h-32 flex items-center justify-center p-4 bg-gray-50 rounded-3xl">
                                <img src={tempLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                        <div className="bg-[#050505] p-8 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center gap-4 shadow-sm relative group">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest absolute top-6 left-8">Aperçu Mode Sombre</span>
                            <div className="w-32 h-32 flex items-center justify-center p-4 bg-white/5 rounded-3xl">
                                <img src={tempLogo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border dark:border-gray-800 overflow-hidden">
                        <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Configuration du Logo</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-1">Format recommandé : PNG transparent (512x512)</p>
                            </div>
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shrink-0">
                                <button onClick={() => setLogoInputType('upload')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logoInputType === 'upload' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-400'}`}>Upload</button>
                                <button onClick={() => setLogoInputType('url')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logoInputType === 'url' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-400'}`}>Lien URL</button>
                            </div>
                        </div>

                        <div className="p-8">
                            {logoInputType === 'upload' ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group"
                                >
                                    <div className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-3xl group-hover:scale-110 transition-transform group-hover:text-primary">
                                        <Upload size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm uppercase dark:text-white">Cliquez pour choisir un fichier</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ou glissez-déposez l'image ici</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <LinkIcon size={18} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                        <input 
                                            type="text" 
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-primary/20"
                                            placeholder="https://votre-serveur.com/logo.png"
                                            value={tempLogo}
                                            onChange={(e) => setTempLogo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={() => setTempLogo('logobisopeto.png')}
                                className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <RefreshCcw size={14} /> Réinitialiser au logo par défaut
                            </button>
                        </div>
                    </div>
                </div>
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
                        <SettingItem 
                            icon={ShieldAlert} 
                            label="Rôles & Permissions" 
                            subLabel="Gérer les accès personnalisés" 
                            onClick={() => onChangeView(AppView.ADMIN_PERMISSIONS)} 
                        />
                        <SettingItem icon={Palette} label="Personnalisation" subLabel="Logo, Slogan, Couleurs" onClick={() => setActiveSubView('branding')} />
                        <SettingItem icon={ShieldCheck} label="Maintenance Système" subLabel="Réinitialisation & Diagnostic" onClick={() => setActiveSubView('maintenance')} />
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
