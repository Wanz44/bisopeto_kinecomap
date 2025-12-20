
import React, { useState, useRef } from 'react';
import { 
    ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, 
    ChevronRight, LogOut, Smartphone, Mail, Save, X, 
    Fingerprint, Palette, Terminal, Sparkles, ShieldAlert, RotateCcw, 
    Settings as SettingsIcon, Upload, ImageIcon, Link as LinkIcon, RefreshCcw, Info,
    Trash2, AlertCircle, Database, Zap, ShieldCheck, Activity, Search, Wrench, Cloud, CloudOff, Loader2,
    Monitor, Check
} from 'lucide-react';
import { Theme, User, Language, UserType, AppView, DatabaseHealth, SystemSettings } from '../types';
import { NotificationService } from '../services/notificationService';
import { SettingsAPI, StorageAPI } from '../services/api';

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
    systemSettings: SystemSettings;
}

const DEFAULT_LOGO = 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png';

const LANGUAGES_CONFIG = [
    { code: 'fr', label: 'Français', native: 'Français', flag: '🇫🇷', desc: 'Langue officielle' },
    { code: 'en', label: 'English', native: 'English', flag: '🇬🇧', desc: 'International' },
    { code: 'ln', label: 'Lingala', native: 'Lingála', flag: '🇨🇩', desc: 'Langue locale' },
];

export const Settings: React.FC<SettingsProps> = ({ 
    user, theme, onToggleTheme, onBack, onLogout, 
    currentLanguage, onLanguageChange, onChangeView, onToast,
    appLogo, onUpdateLogo, systemSettings
}) => {
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'branding' | 'maintenance'>('main');
    const [isPushEnabled, setIsPushEnabled] = useState(Notification.permission === 'granted');
    const [isResetting, setIsResetting] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [healthReport, setHealthReport] = useState<DatabaseHealth | null>(null);
    
    const [tempLogo, setTempLogo] = useState(appLogo);
    const [logoFile, setLogoFile] = useState<File | null>(null);
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
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveBranding = async () => {
        setIsUploading(true);
        try {
            let finalLogoUrl = tempLogo;

            if (logoInputType === 'upload' && logoFile) {
                const cloudUrl = await StorageAPI.uploadLogo(logoFile);
                if (cloudUrl) {
                    finalLogoUrl = cloudUrl;
                }
            }

            onUpdateLogo(finalLogoUrl);

            await SettingsAPI.update({
                ...systemSettings,
                logoUrl: finalLogoUrl
            });

            if (onToast) onToast("Identité visuelle mise à jour et sauvegardée !", "success");
            setActiveSubView('main');
        } catch (error: any) {
            console.error("Branding save error:", error);
            if (onToast) onToast(error.message || "Erreur lors de la sauvegarde", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleFactoryReset = async () => {
        const confirm = window.confirm("ATTENTION : Cette action va effacer TOUTES les données de Supabase. Continuer ?");
        if (confirm) {
            setIsResetting(true);
            try {
                await SettingsAPI.resetAllData();
                if (onToast) onToast("Plateforme réinitialisée !", "success");
                setTimeout(() => { window.location.reload(); }, 2000);
            } catch (e) {
                if (onToast) onToast("Erreur lors de la réinitialisation", "error");
                setIsResetting(false);
            }
        }
    };

    const SettingItem = ({ icon: Icon, label, subLabel, onClick, toggle, onToggle, danger = false }: any) => (
        <div onClick={!toggle && !onToggle ? onClick : undefined} className={`flex items-center justify-between p-5 bg-white dark:bg-gray-900 border-b dark:border-gray-800 last:border-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${danger ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}><Icon size={20} /></div>
                <div>
                    <span className="font-black text-sm block uppercase tracking-tight">{label}</span>
                    {subLabel && <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-widest">{subLabel}</span>}
                </div>
            </div>
            {toggle !== undefined ? (
                <button onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${toggle ? 'bg-primary-light' : 'bg-gray-300 dark:bg-gray-700'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${toggle ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
            ) : <ChevronRight size={18} className="text-gray-300" />}
        </div>
    );

    if (activeSubView === 'branding') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setActiveSubView('main')} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Branding</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo & Identité Visuelle</p>
                        </div>
                    </div>
                    <button 
                        onClick={saveBranding}
                        disabled={isUploading}
                        className="bg-primary text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Appliquer
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 pb-24 no-scrollbar">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Prévisualisation Adaptative</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                                <span className="absolute top-4 left-6 text-[8px] font-black uppercase text-gray-300 tracking-[0.2em]">Mode Clair</span>
                                <div className="w-40 h-40 flex items-center justify-center p-4 bg-gray-50/50 rounded-3xl border border-gray-100 group-hover:scale-105 transition-transform">
                                    <img src={tempLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            </div>
                            <div className="bg-gray-950 p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center gap-4 relative overflow-hidden group">
                                <span className="absolute top-4 left-6 text-[8px] font-black uppercase text-gray-600 tracking-[0.2em]">Mode Sombre</span>
                                <div className="w-40 h-40 flex items-center justify-center p-4 bg-white/5 rounded-3xl border border-white/5 group-hover:scale-105 transition-transform">
                                    <img src={tempLogo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                        <div className="p-8 border-b dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight">Configuration du Logo</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-1">Choisissez comment importer votre identité</p>
                            </div>
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shrink-0">
                                <button onClick={() => setLogoInputType('upload')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logoInputType === 'upload' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}>Upload</button>
                                <button onClick={() => setLogoInputType('url')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${logoInputType === 'url' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-400'}`}>Lien URL</button>
                            </div>
                        </div>

                        <div className="p-8">
                            {logoInputType === 'upload' ? (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-green-50/5 dark:hover:bg-green-900/5 transition-all group"
                                >
                                    <div className="p-6 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-3xl group-hover:scale-110 transition-transform group-hover:text-primary group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm">
                                        <Upload size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm uppercase dark:text-white">Parcourir les fichiers</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">PNG ou SVG recommandé (max 2MB)</p>
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
                                            placeholder="https://votre-site.com/logo.png"
                                            value={tempLogo}
                                            onChange={(e) => setTempLogo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-center">
                                <button 
                                    onClick={() => { setTempLogo(DEFAULT_LOGO); setLogoFile(null); }}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <RefreshCcw size={14} /> Restaurer le logo par défaut
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (activeSubView === 'maintenance') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] animate-fade-in">
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
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <Database size={20} className="text-primary" /> Audit du Cloud
                            </h3>
                            <button 
                                onClick={handleCheckDatabase}
                                disabled={isChecking}
                                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200"
                            >
                                {isChecking ? <RefreshCcw size={14} className="animate-spin" /> : <Activity size={14} />}
                                Lancer Diagnostic
                            </button>
                        </div>

                        {healthReport && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${healthReport.status === 'healthy' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={24} />
                                            <div>
                                                <p className="text-sm font-black uppercase">Santé</p>
                                                <p className="text-[10px] font-bold opacity-70">{healthReport.status.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <span className="text-xl font-black">{healthReport.totalSizeKB} KB</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl border flex items-center justify-between ${healthReport.supabaseConnected ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                        <div className="flex items-center gap-3">
                                            {healthReport.supabaseConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
                                            <div>
                                                <p className="text-sm font-black uppercase">Sync</p>
                                                <p className="text-[10px] font-bold opacity-70">{healthReport.supabaseConnected ? 'ACTIF' : 'HORS-LIGNE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {healthReport.tables.map(table => (
                                        <div key={table.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border dark:border-gray-700 flex justify-between items-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase">{table.name}</p>
                                            <span className="text-sm font-black dark:text-white">{table.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-[3rem] space-y-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertCircle size={20} />
                            <h3 className="text-lg font-black uppercase tracking-tight">Zone de Danger</h3>
                        </div>
                        <p className="text-xs text-red-500 font-bold uppercase opacity-70">Les actions suivantes sont irréversibles et impactent le Cloud Supabase.</p>
                        <button 
                            onClick={handleFactoryReset}
                            disabled={isResetting}
                            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-red-500/20 flex items-center justify-center gap-2"
                        >
                            {isResetting ? <RefreshCcw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                            Réinitialisation Complète
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Paramètres</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 pb-24 no-scrollbar">
                
                {/* 1. Theme Selector */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Apparence du Système</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div 
                            onClick={() => theme === 'dark' && onToggleTheme()}
                            className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center gap-4 ${theme === 'light' ? 'bg-white border-primary shadow-xl scale-105' : 'bg-white/50 dark:bg-gray-900 border-transparent opacity-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'light' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}><Sun size={24}/></div>
                            <span className="font-black text-[10px] uppercase tracking-widest">Mode Clair</span>
                            {theme === 'light' && <div className="p-1 bg-primary rounded-full text-white"><Check size={12} strokeWidth={4}/></div>}
                        </div>
                        <div 
                            onClick={() => theme === 'light' && onToggleTheme()}
                            className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer flex flex-col items-center gap-4 ${theme === 'dark' ? 'bg-gray-900 border-primary shadow-xl scale-105' : 'bg-gray-100 dark:bg-white/5 border-transparent opacity-50'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme === 'dark' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-500'}`}><Moon size={24}/></div>
                            <span className="font-black text-[10px] uppercase tracking-widest dark:text-white">Mode Sombre</span>
                            {theme === 'dark' && <div className="p-1 bg-primary rounded-full text-white"><Check size={12} strokeWidth={4}/></div>}
                        </div>
                    </div>
                </div>

                {/* 2. Language Selector (Improved) */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Préférences de Langue</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {LANGUAGES_CONFIG.map((lang) => (
                            <div 
                                key={lang.code}
                                onClick={() => onLanguageChange(lang.code as Language)}
                                className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center gap-4 ${currentLanguage === lang.code ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-lg scale-[1.02]' : 'bg-white/50 dark:bg-gray-900/50 border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <div className="text-3xl filter drop-shadow-sm">{lang.flag}</div>
                                <div className="flex-1">
                                    <span className="font-black text-xs uppercase dark:text-white block">{lang.native}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{lang.desc}</span>
                                </div>
                                {currentLanguage === lang.code && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4}/></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                    <h3 className="px-8 pt-8 pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Général</h3>
                    <SettingItem icon={Bell} label="Notifications Push" subLabel="Alertes système en temps réel" toggle={isPushEnabled} onToggle={handleTogglePush} />
                </div>

                {user.type === UserType.ADMIN && (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                        <h3 className="px-8 pt-8 pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Administration Pro</h3>
                        <SettingItem 
                            icon={Palette} 
                            label="Personnalisation" 
                            subLabel="Changer le Logo & Branding" 
                            onClick={() => setActiveSubView('branding')} 
                        />
                        <SettingItem 
                            icon={ShieldAlert} 
                            label="Permissions" 
                            subLabel="Gérer les accès RBAC" 
                            onClick={() => onChangeView(AppView.ADMIN_PERMISSIONS)} 
                        />
                        <SettingItem 
                            icon={Wrench} 
                            label="Outils Maintenance" 
                            subLabel="Diagnostic & Nettoyage Cloud" 
                            onClick={() => setActiveSubView('maintenance')} 
                        />
                    </div>
                )}

                <div className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <SettingItem icon={LogOut} label="Déconnexion" danger onClick={onLogout} />
                </div>

                <div className="text-center pb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Biso Peto v1.4.0 • DRC Engineering</p>
                </div>
            </div>
        </div>
    );
};
