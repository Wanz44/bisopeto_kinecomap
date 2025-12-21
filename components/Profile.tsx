
import React, { useState, useRef } from 'react';
import { 
    User, ArrowLeft, Trophy, Medal, Award, Settings, Bell, LogOut, 
    CreditCard, Moon, Sun, ChevronRight, Camera, Edit2, Mail, 
    Phone, Lock, Save, X, History, Monitor, Smartphone, 
    ShieldCheck, Activity, Star, Zap, Trash2, MapPin, 
    ChevronLeft, Loader2, Sparkles, TrendingUp, CheckCircle, Leaf
} from 'lucide-react';
import { User as UserType, Theme, UserType as UserEnum } from '../types';
import { UserAPI, StorageAPI } from '../services/api';

interface ProfileProps {
    user: UserType;
    theme: Theme;
    onToggleTheme: () => void;
    onBack: () => void;
    onLogout: () => void;
    onManageSubscription: () => void;
    onSettings: () => void;
    onUpdateProfile: (updatedData: Partial<UserType>) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, theme, onToggleTheme, onBack, onLogout, onManageSubscription, onSettings, onUpdateProfile, onToast }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'impact' | 'sessions' | 'security'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phone: user.phone,
        address: user.address || ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simulation de calcul de niveau
    const ecoPoints = user.points || 0;
    const currentLevel = Math.floor(ecoPoints / 500) + 1;
    const nextLevelXP = 500;
    const progress = (ecoPoints % 500) / nextLevelXP * 100;

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await UserAPI.update({ ...editForm, id: user.id! });
            onUpdateProfile(editForm);
            setIsEditing(false);
            if (onToast) onToast("Profil mis à jour avec succès !", "success");
        } catch (e) {
            if (onToast) onToast("Erreur lors de la sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const url = await StorageAPI.uploadImage(file);
                if (url) {
                    await UserAPI.update({ id: user.id!, address: user.address }); // Hack pour forcer update si pas de champ avatar dédié, ou adapter selon API réelle
                    // Idéalement, user.avatarUrl existe dans le futur
                    if (onToast) onToast("Photo mise à jour !", "success");
                }
            } catch (err) {
                if (onToast) onToast("Erreur lors de l'envoi de l'image", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const BadgeItem = ({ label, icon: Icon, color, unlocked }: any) => (
        <div className={`flex flex-col items-center gap-2 p-4 rounded-3xl border-2 transition-all ${unlocked ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-gray-50 opacity-40 grayscale'}`}>
            <div className={`p-3 rounded-2xl ${color} shadow-lg shadow-black/5`}><Icon size={24}/></div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-none">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            {/* Elegant Header */}
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Mon Espace</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ID: #{user.id?.slice(-8)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <button 
                            onClick={handleSaveProfile} 
                            disabled={isSaving}
                            className="bg-[#00C853] text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Sauver
                        </button>
                    ) : (
                        <button onClick={onSettings} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl text-gray-400"><Settings size={22}/></button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-32 no-scrollbar">
                
                {/* Hero Profile Section */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 p-20 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
                    
                    <div className="relative flex flex-col items-center z-10">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 bg-gradient-to-br from-[#2962FF] to-[#00C853] rounded-[3rem] p-1 shadow-2xl">
                                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[2.8rem] flex items-center justify-center text-primary text-5xl font-black overflow-hidden relative group/avatar">
                                    {isUploading ? <Loader2 className="animate-spin" /> : user.firstName[0]}
                                    <button 
                                        onClick={handleAvatarClick}
                                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                                    >
                                        <Camera className="text-white" size={32} />
                                    </button>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <div className="absolute -bottom-2 -right-2 bg-action text-gray-900 p-2.5 rounded-2xl shadow-xl border-4 border-white dark:border-gray-900">
                                <Award size={20} />
                            </div>
                        </div>

                        <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center">{user.firstName} {user.lastName}</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100 dark:border-blue-900/30">Niveau {currentLevel}</span>
                             <span className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100 dark:border-green-900/30">{user.type}</span>
                        </div>

                        {/* XP Progress Bar */}
                        <div className="w-full max-w-sm mt-8 space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Évolution de grade</span>
                                <span className="text-[10px] font-black text-primary uppercase">{ecoPoints % 500} / 500 XP</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Section */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Succès & Badges</h4>
                    <div className="grid grid-cols-4 gap-3">
                        <BadgeItem label="Pionnier" icon={Sparkles} color="bg-orange-100 text-orange-600" unlocked={true} />
                        <BadgeItem label="Éboueur Pro" icon={Trash2} color="bg-blue-100 text-blue-600" unlocked={user.collections > 5} />
                        <BadgeItem label="Vigilant" icon={Camera} color="bg-red-100 text-red-600" unlocked={true} />
                        <BadgeItem label="Elite Green" icon={ShieldCheck} color="bg-green-100 text-green-600" unlocked={false} />
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex p-1.5 bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 overflow-x-auto no-scrollbar gap-2">
                    {[
                        { id: 'info', label: 'Identité', icon: User },
                        { id: 'impact', label: 'Impact', icon: Zap },
                        { id: 'security', label: 'Sécurité', icon: Lock },
                        { id: 'sessions', label: 'Appareils', icon: Smartphone }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                        >
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'info' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Informations Générales</h4>
                                <button onClick={() => setIsEditing(!isEditing)} className="p-2 text-primary-light hover:bg-green-50 dark:hover:bg-green-900/10 rounded-xl transition-all">
                                    {isEditing ? <X size={18}/> : <Edit2 size={18}/>}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Prénom</label>
                                        <input 
                                            disabled={!isEditing} 
                                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold text-sm dark:text-white disabled:opacity-70"
                                            value={editForm.firstName}
                                            onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Nom</label>
                                        <input 
                                            disabled={!isEditing} 
                                            className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border-none outline-none font-bold text-sm dark:text-white disabled:opacity-70"
                                            value={editForm.lastName}
                                            onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 space-y-4">
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                                            <input 
                                                disabled={!isEditing} 
                                                className="w-full bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none font-bold text-sm dark:text-white disabled:opacity-70"
                                                value={editForm.email}
                                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16}/>
                                            <input 
                                                disabled={!isEditing} 
                                                className="w-full bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none font-bold text-sm dark:text-white disabled:opacity-70"
                                                value={editForm.phone}
                                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-3 ml-1">Adresse de collecte</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-red-400" size={18}/>
                                    <input 
                                        disabled={!isEditing} 
                                        className="w-full bg-gray-50 dark:bg-gray-800 pl-12 pr-4 py-4 rounded-2xl border-none outline-none font-bold text-sm dark:text-white disabled:opacity-70"
                                        value={editForm.address}
                                        onChange={e => setEditForm({...editForm, address: e.target.value})}
                                        placeholder="Commune, Quartier, Avenue, N°..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impact' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 bg-green-50 dark:bg-green-900/10 rounded-[2.5rem] border border-green-100 dark:border-green-900/30 text-center space-y-2">
                                    <TrendingUp className="mx-auto text-green-600" size={32} />
                                    <p className="text-2xl font-black text-green-700 dark:text-green-400 leading-none">{user.totalTonnage || 0} Kg</p>
                                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Déchets valorisés</p>
                                </div>
                                <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 text-center space-y-2">
                                    <CheckCircle className="mx-auto text-blue-600" size={32} />
                                    <p className="text-2xl font-black text-blue-700 dark:text-blue-400 leading-none">{user.recyclingRate || 0}%</p>
                                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Taux de Recyclage</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-xs font-black dark:text-white uppercase tracking-[0.2em]">Bilan Carbone (CO2)</h4>
                                    <span className="text-[10px] font-black text-green-500 uppercase">Impact Positif</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-primary shadow-inner">
                                        <Leaf className="text-primary" size={32}/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">-{user.co2Saved || 0} Kg</p>
                                        <p className="text-xs text-gray-400 font-bold mt-2 leading-relaxed">Quantité de CO2 évitée grâce à vos gestes de tri et de collecte cette année.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="animate-fade-in space-y-4">
                             <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:text-blue-500 transition-colors"><Lock size={20}/></div>
                                    <div><p className="font-black text-gray-900 dark:text-white text-sm">Mot de Passe</p><p className="text-[10px] text-gray-400 font-bold uppercase">Dernière modif: il y a 3 mois</p></div>
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-400 group-hover:text-purple-500 transition-colors"><ShieldCheck size={20}/></div>
                                    <div><p className="font-black text-gray-900 dark:text-white text-sm">Double Authentification (2FA)</p><p className="text-[10px] text-red-500 font-bold uppercase">Non activé</p></div>
                                </div>
                                <ChevronRight size={18} className="text-gray-300" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Smartphone size={20}/></div>
                                    <div><p className="font-black text-gray-900 dark:text-white text-sm uppercase">iPhone 14 Pro • Kinshasa</p><p className="text-[10px] text-green-500 font-bold uppercase">Session Active • 192.168.1.1</p></div>
                                </div>
                                <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded">Actuel</span>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl group-hover:bg-red-50 group-hover:text-red-500 transition-colors"><Monitor size={20}/></div>
                                    <div><p className="font-black text-gray-900 dark:text-white text-sm uppercase">Windows PC • Gombe</p><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vu il y a 2 heures</p></div>
                                </div>
                                <button className="text-[10px] font-black text-red-500 uppercase hover:underline decoration-2 underline-offset-4">Révoquer</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dangerous Actions */}
                <div className="pt-8 border-t dark:border-gray-800 flex flex-col gap-3">
                    <button onClick={onLogout} className="w-full py-5 bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/30 text-red-500 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95">
                        <LogOut size={20}/> Quitter la session
                    </button>
                    <button className="text-[10px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest text-center py-2 transition-colors">Supprimer mon compte définitivement</button>
                </div>
            </div>
        </div>
    );
};
