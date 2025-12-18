
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Globe, Lock, Moon, Sun, Shield, HelpCircle, ChevronRight, LogOut, Smartphone, Mail, Save, X, Eye, EyeOff, Check, ChevronDown, ChevronUp, MessageCircle, Phone, FileText, Monitor, Laptop, Wifi, Battery, Zap, Database, Map as MapIcon, RefreshCw, AlertTriangle, Download, Trash2, Fingerprint, Palette, Terminal, Sparkles } from 'lucide-react';
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

export const Settings: React.FC<SettingsProps> = ({ user, theme, onToggleTheme, onBack, onLogout, currentLanguage, onLanguageChange, onToast }) => {
    const [activeSubView, setActiveSubView] = useState<'main' | 'security' | 'branding' | 'waste_config'>('main');
    const [branding, setBranding] = useState({
        slogan: "Agir localement, impacter durablement.",
        primaryColor: "#2E7D32",
        appName: "KIN ECO MAP"
    });
    
    // Config des types de déchets détectables par l'IA
    const [wasteTypes, setWasteTypes] = useState([
        { id: '1', label: 'Plastique', active: true },
        { id: '2', label: 'Organique', active: true },
        { id: '3', label: 'Gravats', active: true },
        { id: '4', label: 'Électronique', active: true },
        { id: '5', label: 'Verre', active: false },
    ]);

    const handleSave = () => {
        if (onToast) onToast("Configurations système mises à jour", "success");
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
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center gap-4">
                    <button onClick={() => setActiveSubView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Identité Visuelle</h2>
                </div>
                <div className="p-8 space-y-6">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-sm border dark:border-gray-800 space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom de l'application</label>
                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-sm outline-none border-none dark:text-white" value={branding.appName} onChange={e => setBranding({...branding, appName: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Slogan Officiel</label>
                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold text-sm outline-none border-none dark:text-white" value={branding.slogan} onChange={e => setBranding({...branding, slogan: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Couleur Primaire</label>
                            <div className="flex gap-4">
                                <input type="color" className="w-20 h-14 rounded-2xl cursor-pointer bg-transparent border-none" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} />
                                <input className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-mono text-sm outline-none border-none dark:text-white" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} />
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><Save size={20}/> Appliquer les changements</button>
                    </div>
                </div>
            </div>
        );
    }

    if (activeSubView === 'waste_config') {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 animate-fade-in">
                <div className="bg-white dark:bg-gray-900 p-6 border-b dark:border-gray-800 flex items-center gap-4">
                    <button onClick={() => setActiveSubView('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Configuration IA</h2>
                </div>
                <div className="p-8">
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                        <div className="p-8 border-b dark:border-gray-800"><p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Déterminez les catégories de déchets que Biso Peto AI peut identifier lors des signalements citoyens.</p></div>
                        {wasteTypes.map(type => (
                            <SettingItem key={type.id} icon={Sparkles} label={type.label} toggle={type.active} onToggle={() => setWasteTypes(prev => prev.map(t => t.id === type.id ? {...t, active: !t.active} : t))} />
                        ))}
                        <button className="w-full p-6 text-blue-600 font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-colors">+ Ajouter une catégorie</button>
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
                    <SettingItem icon={Lock} label="Sécurité Admin" subLabel="2FA & Sessions actives" onClick={() => setActiveSubView('branding')} />
                    <SettingItem icon={Globe} label="Langue App" subLabel={currentLanguage === 'fr' ? 'Français' : 'English'} onClick={() => onLanguageChange(currentLanguage === 'fr' ? 'en' : 'fr')} />
                </div>

                {user.type === UserType.ADMIN && (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                        <h3 className="px-8 pt-8 pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilotage Système</h3>
                        <SettingItem icon={Palette} label="Personnalisation" subLabel="Logo, Slogan, Couleurs" onClick={() => setActiveSubView('branding')} />
                        <SettingItem icon={Sparkles} label="Moteur d'Analyse" subLabel="Types de déchets IA" onClick={() => setActiveSubView('waste_config')} />
                        <SettingItem icon={Terminal} label="API & Intégrations" subLabel="Gestion des clés d'accès" />
                    </div>
                )}

                <div className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <SettingItem icon={LogOut} label="Déconnexion" danger onClick={onLogout} />
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Biso Peto Engine v1.4.0 • Build DRC</p>
                </div>
            </div>
        </div>
    );
};
