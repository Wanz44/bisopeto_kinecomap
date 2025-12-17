
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, HelpCircle, ChevronRight, LogOut, Smartphone, Mail, Save, X, Eye, EyeOff, Check, ChevronDown, ChevronUp, MessageCircle, Phone, FileText, Monitor, Laptop, Wifi, Battery, Zap, Database, Map as MapIcon, RefreshCw, AlertTriangle, Download, Trash2, Fingerprint } from 'lucide-react';
import { Theme, User, Language, UserType } from '../types';
import { SettingsAPI } from '../services/api';

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

// Mock Active Sessions
const INITIAL_SESSIONS = [
    { id: 1, device: 'iPhone 13 Pro', location: 'Kinshasa, Gombe', active: true, type: 'mobile' },
    { id: 2, device: 'Chrome on Windows', location: 'Kinshasa, Lingwala', active: false, lastActive: '2h ago', type: 'desktop' },
];

export const Settings: React.FC<SettingsProps> = ({ user, theme, onToggleTheme, onBack, onLogout, currentLanguage, onLanguageChange, onToast }) => {
    // --- General State ---
    const [notifications, setNotifications] = useState({
        push: true,
        email: true,
        sms: false,
        marketing: false,
        security: true
    });
    
    // --- Collector Specific State ---
    const [collectorSettings, setCollectorSettings] = useState({
        dataSaver: false,
        highAccuracyGPS: true,
        syncFrequency: 'realtime', // realtime, 5min, 15min
        mapProvider: 'osm'
    });

    // --- Security State ---
    const [securitySettings, setSecuritySettings] = useState({
        twoFactor: false,
        biometric: true
    });

    const [sessions, setSessions] = useState(INITIAL_SESSIONS);
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'notifications' | 'data'>('main');

    const handleSave = () => {
        if (onToast) onToast("Préférences enregistrées", "success");
    };

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
        handleSave();
    };

    const handleRevokeSession = (id: number) => {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (onToast) onToast("Session déconnectée avec succès", "success");
    };

    // --- Render Components ---

    const SectionHeader = ({ title }: { title: string }) => (
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1 mt-6">
            {title}
        </h3>
    );

    const SettingItem = ({ 
        icon: Icon, 
        label, 
        subLabel,
        value, 
        onClick, 
        toggle,
        onToggle,
        danger = false,
        rightElement
    }: { 
        icon: any, 
        label: string, 
        subLabel?: string,
        value?: string | React.ReactNode, 
        onClick?: () => void,
        toggle?: boolean,
        onToggle?: () => void,
        danger?: boolean,
        rightElement?: React.ReactNode
    }) => (
        <div 
            onClick={!toggle && !onToggle ? onClick : undefined}
            className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-50 dark:border-gray-700 last:border-none first:rounded-t-2xl last:rounded-b-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${danger ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    <Icon size={18} />
                </div>
                <div>
                    <span className="font-semibold text-sm block">{label}</span>
                    {subLabel && <span className="text-xs text-gray-400 block mt-0.5">{subLabel}</span>}
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {value && <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{value}</span>}
                {rightElement}
                
                {(toggle !== undefined || onToggle) ? (
                    <div 
                        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
                        className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 cursor-pointer ${toggle ? 'bg-[#00C853]' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${toggle ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                ) : (
                    !danger && !rightElement && <ChevronRight size={18} className="text-gray-400" />
                )}
            </div>
        </div>
    );

    // --- SUB-VIEWS ---

    const renderSecurityView = () => (
        <div className="animate-fade-in">
            <div className="mb-4 flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => setActiveSubView('main')}>
                <ArrowLeft size={16} /> Retour
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Sécurité & Connexion</h2>

            <SectionHeader title="Authentification" />
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <SettingItem 
                    icon={Lock} 
                    label="Changer mot de passe" 
                    subLabel="Dernière modif. il y a 3 mois"
                    onClick={() => { if(onToast) onToast("Email de réinitialisation envoyé", "info"); }}
                />
                <SettingItem 
                    icon={Shield} 
                    label="Double Facteur (2FA)" 
                    subLabel="Sécuriser via SMS/App"
                    toggle={securitySettings.twoFactor}
                    onToggle={() => setSecuritySettings(prev => ({...prev, twoFactor: !prev.twoFactor}))}
                />
                <SettingItem 
                    icon={Fingerprint} 
                    label="Biométrie" 
                    subLabel="FaceID / Empreinte"
                    toggle={securitySettings.biometric}
                    onToggle={() => setSecuritySettings(prev => ({...prev, biometric: !prev.biometric}))}
                />
            </div>

            <SectionHeader title="Appareils Connectés" />
            <div className="space-y-3">
                {sessions.map(session => (
                    <div key={session.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${session.active ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                                {session.type === 'mobile' ? <Smartphone size={20} /> : <Laptop size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">{session.device}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    {session.location} • {session.active ? <span className="text-green-500 font-bold">Actif maintenant</span> : session.lastActive}
                                </p>
                            </div>
                        </div>
                        {!session.active && (
                            <button 
                                onClick={() => handleRevokeSession(session.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNotificationsView = () => (
        <div className="animate-fade-in">
            <div className="mb-4 flex items-center gap-2 text-gray-500 cursor-pointer" onClick={() => setActiveSubView('main')}>
                <ArrowLeft size={16} /> Retour
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Préférences de Notification</h2>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <SettingItem 
                    icon={Bell} 
                    label="Notifications Push" 
                    subLabel="Alertes sur cet appareil"
                    toggle={notifications.push} 
                    onToggle={() => toggleNotification('push')}
                />
                <SettingItem 
                    icon={Mail} 
                    label="Notifications Email" 
                    subLabel="Récapitulatifs et factures"
                    toggle={notifications.email} 
                    onToggle={() => toggleNotification('email')}
                />
                <SettingItem 
                    icon={MessageCircle} 
                    label="Notifications SMS" 
                    subLabel="Alertes urgentes uniquement"
                    toggle={notifications.sms} 
                    onToggle={() => toggleNotification('sms')}
                />
            </div>

            <SectionHeader title="Types de messages" />
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <SettingItem 
                    icon={Shield} 
                    label="Sécurité & Compte" 
                    subLabel="Connexions, changements de mot de passe"
                    toggle={notifications.security} 
                    onToggle={() => toggleNotification('security')}
                />
                <SettingItem 
                    icon={Zap} 
                    label="Offres & Marketing" 
                    subLabel="Promotions partenaires"
                    toggle={notifications.marketing} 
                    onToggle={() => toggleNotification('marketing')}
                />
            </div>
        </div>
    );

    // --- MAIN VIEW ---

    if (activeSubView === 'security') return renderSecurityView();
    if (activeSubView === 'notifications') return renderNotificationsView();

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Paramètres</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-20">
                
                {/* Account Summary Card */}
                <div className="bg-gradient-to-r from-[#2962FF] to-[#3D5AFE] rounded-3xl p-6 text-white shadow-lg mb-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner border border-white/10">
                        {user.firstName[0]}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
                        <p className="text-white/80 text-sm capitalize">{user.type}</p>
                    </div>
                    <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* --- RÔLE : COLLECTEUR (Spécifique) --- */}
                {user.type === UserType.COLLECTOR && (
                    <>
                        <SectionHeader title="Outils Professionnels" />
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <SettingItem 
                                icon={Wifi} 
                                label="Mode Économie de Données" 
                                subLabel="Ne pas charger les images lourdes"
                                toggle={collectorSettings.dataSaver}
                                onToggle={() => setCollectorSettings(prev => ({...prev, dataSaver: !prev.dataSaver}))}
                            />
                            <SettingItem 
                                icon={MapIcon} 
                                label="Fournisseur de Carte" 
                                value={collectorSettings.mapProvider === 'osm' ? 'OpenStreet' : 'Satellite'}
                                rightElement={
                                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button onClick={() => setCollectorSettings(prev => ({...prev, mapProvider: 'osm'}))} className={`p-1 rounded ${collectorSettings.mapProvider === 'osm' ? 'bg-white shadow' : ''}`}><MapIcon size={14}/></button>
                                        <button onClick={() => setCollectorSettings(prev => ({...prev, mapProvider: 'sat'}))} className={`p-1 rounded ${collectorSettings.mapProvider === 'sat' ? 'bg-white shadow' : ''}`}><Globe size={14}/></button>
                                    </div>
                                }
                            />
                            <SettingItem 
                                icon={RefreshCw} 
                                label="Fréquence Sync GPS" 
                                value="Temps réel"
                            />
                        </div>
                    </>
                )}

                {/* --- RÔLE : ADMIN (Spécifique) --- */}
                {user.type === UserType.ADMIN && (
                    <>
                        <SectionHeader title="Administration Système" />
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <SettingItem 
                                icon={Monitor} 
                                label="Logs Console" 
                                subLabel="Pour débogage avancé"
                                toggle={false}
                            />
                            <SettingItem 
                                icon={Database} 
                                label="Cache Local" 
                                value="14 MB"
                                rightElement={
                                    <button 
                                        onClick={() => { if(onToast) onToast("Cache local vidé.", "success"); }}
                                        className="text-xs text-red-500 font-bold hover:underline"
                                    >
                                        Vider
                                    </button>
                                }
                            />
                        </div>
                    </>
                )}

                <SectionHeader title="Général" />
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <SettingItem 
                        icon={Globe} 
                        label="Langue" 
                        value={currentLanguage === 'fr' ? 'Français' : 'English'} 
                        onClick={() => {
                            onLanguageChange(currentLanguage === 'fr' ? 'en' : 'fr');
                            handleSave();
                        }}
                    />
                    {/* Enhanced Theme Toggle */}
                    <div className="p-4 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-50 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer" onClick={onToggleTheme}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            </div>
                            <div>
                                <span className="font-semibold text-sm text-gray-800 dark:text-white">Apparence</span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
                                </p>
                            </div>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400'}`}>
                                <Sun size={14} />
                            </button>
                            <button className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-gray-600 shadow-sm text-blue-300' : 'text-gray-400'}`}>
                                <Moon size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                <SectionHeader title="Compte & Données" />
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <SettingItem 
                        icon={Bell} 
                        label="Notifications" 
                        onClick={() => setActiveSubView('notifications')}
                    />
                    <SettingItem 
                        icon={Shield} 
                        label="Sécurité & Connexion" 
                        onClick={() => setActiveSubView('security')}
                    />
                    {user.type === UserType.CITIZEN && (
                        <SettingItem 
                            icon={Download} 
                            label="Exporter mes données" 
                            subLabel="Format JSON (RGPD)"
                            onClick={() => { if(onToast) onToast("Export des données lancé. Vous recevrez un email.", "info"); }}
                        />
                    )}
                </div>

                <div className="mt-8">
                     <button 
                        onClick={onLogout}
                        className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors shadow-sm"
                     >
                        <LogOut size={20} />
                        Déconnexion
                     </button>
                     <div className="text-center mt-6">
                        <p className="text-xs font-bold text-gray-400">KIN ECO-MAP v1.0.3</p>
                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">ID: {user.id}</p>
                     </div>
                </div>
            </div>
        </div>
    );
};
