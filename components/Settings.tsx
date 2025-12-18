
import React, { useState, useRef } from 'react';
/* Fixed: Added missing 'Info' icon to the lucide-react imports */
import { 
    ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, 
    ChevronRight, LogOut, Smartphone, Mail, Save, X, 
    Fingerprint, Palette, Terminal, Sparkles, ShieldAlert, RotateCcw, 
    Settings as SettingsIcon, Upload, ImageIcon, Link as LinkIcon, RefreshCcw, Info
} from 'lucide-react';
import { Theme, User, Language, UserType, AppView } from '../types';
import { NotificationService } from '../services/notificationService';

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
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'branding' | 'waste_config'>('main');
    const [isPushEnabled, setIsPushEnabled] = useState(Notification.permission === 'granted');
    
    // Branding states
    const [tempLogo, setTempLogo] = useState(appLogo);
    const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    {/* Logo Preview Section */}
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

                    {/* Logo Config Section */}
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
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                                        <Info size={18} className="text-blue-500 shrink-0" />
                                        <p className="text-[10px] text-blue-600 dark:text-blue-300 font-bold leading-relaxed uppercase tracking-tight">
                                            L'URL doit pointer vers une image publique. Les formats SVG, PNG et WebP sont préférés pour une netteté optimale.
                                        </p>
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
                        <SettingItem icon={Sparkles} label="Moteur d'Analyse" subLabel="Types de déchets IA" />
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
