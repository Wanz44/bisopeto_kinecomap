
import React, { useState, useRef } from 'react';
import { 
    User as UserIcon, ArrowLeft, Trophy, Medal, Award, Settings, Bell, LogOut, 
    CreditCard, Moon, Sun, ChevronRight, Camera, Edit2, Mail, 
    Phone, Lock, Save, X, History, Monitor, Smartphone, 
    ShieldCheck, Activity, Star, Zap, Trash2, MapPin, 
    ChevronLeft, Loader2, Sparkles, TrendingUp, CheckCircle, Leaf, FileText, Download, Shield,
    Recycle
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
    const [activeTab, setActiveTab] = useState<'info' | 'impact' | 'cert' | 'security'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Initialisation sécurisée du formulaire
    const [editForm, setEditForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const ecoPoints = user?.points || 0;
    const currentLevel = Math.floor(ecoPoints / 500) + 1;
    const nextLevelXP = 500;
    const progress = (ecoPoints % 500) / nextLevelXP * 100;

    const handleSaveProfile = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await UserAPI.update({ ...editForm, id: user.id });
            onUpdateProfile(editForm);
            setIsEditing(false);
            if (onToast) onToast("Profil mis à jour !", "success");
        } catch (e) {
            if (onToast) onToast("Erreur sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const url = await StorageAPI.uploadImage(file);
                if (url && onToast) onToast("Photo mise à jour !", "success");
            } catch (err) {
                if (onToast) onToast("Erreur upload", "error");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const BadgeItem = ({ label, icon: Icon, color, unlocked }: any) => (
        <div className={`flex flex-col items-center gap-3 p-5 rounded-[2.5rem] border-2 transition-all duration-500 hover:scale-110 cursor-default ${unlocked ? 'border-primary/20 bg-primary/5 shadow-xl shadow-primary/5' : 'border-gray-100 bg-gray-50 opacity-30 grayscale'}`}>
            <div className={`p-4 rounded-3xl ${color} shadow-lg shadow-black/5 animate-float`}>
                <Icon size={28}/>
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none px-2">{label}</span>
        </div>
    );

    // Sécurité supplémentaire si l'objet user est corrompu
    if (!user) return <div className="p-10 text-center font-black uppercase text-gray-400">Erreur de chargement du profil</div>;

    const initialLetter = (user.firstName || user.lastName || 'U')[0].toUpperCase();

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden min-h-screen">
            {/* Ultra Premium Header */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 border-b dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-900 dark:text-white" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white leading-none">Espace Privé</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connecté • v1.4.2</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onToggleTheme} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:scale-110 transition-transform">
                        {theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}
                    </button>
                    <button onClick={onSettings} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-gray-500 hover:rotate-90 transition-transform duration-500"><Settings size={22}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 pb-32 no-scrollbar">
                
                {/* Immersive Hero Card */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-[4rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                    <div className="bg-white dark:bg-[#0d1117] p-10 rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 right-0 p-20 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 p-20 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>
                        
                        <div className="relative mb-8">
                            <div className="w-40 h-40 bg-gradient-to-br from-primary to-primary-light rounded-[3.5rem] p-1 shadow-[0_20px_50px_rgba(46,125,50,0.3)]">
                                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[3.2rem] flex items-center justify-center text-primary text-6xl font-black overflow-hidden relative group/avatar">
                                    {isUploading ? <Loader2 className="animate-spin" /> : initialLetter}
                                    <button 
                                        onClick={handleAvatarClick}
                                        className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 backdrop-blur-sm"
                                    >
                                        <Camera className="text-white mb-2" size={32} />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Modifier</span>
                                    </button>
                                </div>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <div className="absolute -bottom-3 -right-3 bg-action text-gray-900 p-4 rounded-[1.8rem] shadow-2xl border-8 border-white dark:border-[#0d1117] animate-float">
                                <Shield size={24} />
                            </div>
                        </div>

                        <h3 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter text-center">{user.firstName} {user.lastName}</h3>
                        <div className="flex items-center gap-3 mt-4">
                             <div className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <Award size={12}/> Grade : {currentLevel === 1 ? 'Apprenti' : 'Protecteur'}
                             </div>
                             <div className="flex items-center gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-green-100 dark:border-green-900/30">
                                <Zap size={12}/> {user.subscription}
                             </div>
                        </div>

                        {/* XP Progress Slider */}
                        <div className="w-full max-w-md mt-10 space-y-3">
                            <div className="flex justify-between items-end px-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Niveau Actuel</span>
                                    <span className="text-xl font-black dark:text-white">Lvl {currentLevel}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Prochain Palier</span>
                                    <p className="text-sm font-black dark:text-white">{ecoPoints % 500} / 500 XP</p>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border dark:border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary via-primary-light to-primary transition-all duration-[2000ms] cubic-bezier(0.4, 0, 0.2, 1) relative overflow-hidden"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Glass Tabs */}
                <div className="flex p-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-x-auto no-scrollbar gap-2 shadow-sm">
                    {[
                        { id: 'info', label: 'Identité', icon: UserIcon },
                        { id: 'impact', label: 'Impact SIG', icon: Activity },
                        { id: 'cert', label: 'Certificat', icon: FileText },
                        { id: 'security', label: 'Sessions', icon: Monitor }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-[11px] font-black uppercase tracking-tight transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-2xl scale-105' : 'text-gray-400 hover:bg-white dark:hover:bg-white/5'}`}
                        >
                            <tab.icon size={16}/> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Rendering */}
                <div className="animate-fade-in-up">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center px-4">
                                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">Fiche d'identité numérique</h4>
                                <button onClick={() => setIsEditing(!isEditing)} className={`p-3 rounded-2xl transition-all ${isEditing ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                                    {isEditing ? <X size={20}/> : <Edit2 size={20}/>}
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                                        <div className="flex gap-4">
                                            <input disabled={!isEditing} className="flex-1 bg-gray-50 dark:bg-white/5 p-5 rounded-2xl font-bold dark:text-white outline-none border-none focus:ring-2 ring-primary/20" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})}/>
                                            <input disabled={!isEditing} className="flex-1 bg-gray-50 dark:bg-white/5 p-5 rounded-2xl font-bold dark:text-white outline-none border-none focus:ring-2 ring-primary/20" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email vérifié</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-5 top-5 text-gray-300 group-focus-within:text-primary" size={20}/>
                                            <input disabled={!isEditing} className="w-full bg-gray-50 dark:bg-white/5 pl-14 pr-5 py-5 rounded-2xl font-bold dark:text-white outline-none border-none focus:ring-2 ring-primary/20" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}/>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact Mobile</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-5 top-5 text-gray-300 group-focus-within:text-primary" size={20}/>
                                            <input disabled={!isEditing} className="w-full bg-gray-50 dark:bg-white/5 pl-14 pr-5 py-5 rounded-2xl font-bold dark:text-white outline-none border-none focus:ring-2 ring-primary/20" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lieu de résidence</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-5 top-5 text-red-400" size={20}/>
                                            <input disabled={!isEditing} className="w-full bg-gray-50 dark:bg-white/5 pl-14 pr-5 py-5 rounded-2xl font-bold dark:text-white outline-none border-none focus:ring-2 ring-primary/20" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {isEditing && (
                                <button onClick={handleSaveProfile} disabled={isSaving} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin"/> : <Save size={24}/>} Sauvegarder les modifications
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'impact' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Valorisé', val: `${user.totalTonnage || 0}kg`, icon: Trash2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/10' },
                                    { label: 'CO2 Sauvé', val: `${user.co2Saved || 0}kg`, icon: Leaf, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
                                    { label: 'Collectes', val: user.collections || 0, icon: CheckCircle, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10' },
                                    { label: 'Taux Tri', val: `${user.recyclingRate || 0}%`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
                                ].map((s, i) => (
                                    <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-sm group hover:scale-105 transition-transform">
                                        <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}><s.icon size={24}/></div>
                                        <p className="text-2xl font-black dark:text-white leading-none">{s.val}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-900 p-10 rounded-[3.5rem] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-20 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2"></div>
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Badges & Accomplissements</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        <BadgeItem label="Pionnier" icon={Sparkles} color="bg-orange-500 text-white" unlocked={true} />
                                        <BadgeItem label="Expert Tri" icon={Recycle} color="bg-blue-500 text-white" unlocked={ecoPoints > 1000} />
                                        <BadgeItem label="Vigilant" icon={Camera} color="bg-red-500 text-white" unlocked={true} />
                                        <BadgeItem label="Elite" icon={Trophy} color="bg-yellow-500 text-white" unlocked={user.subscription === 'premium'} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cert' && (
                        <div className="animate-fade-in flex flex-col items-center">
                            <div className="w-full max-w-2xl aspect-[1.414] bg-white p-12 rounded-[2rem] shadow-2xl border-[16px] border-gray-50 relative overflow-hidden text-gray-900">
                                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12"><Shield size={300} /></div>
                                <div className="relative z-10 flex flex-col items-center text-center h-full border-4 border-double border-primary/20 p-10 rounded-xl">
                                    <div className="w-20 h-20 bg-primary rounded-2xl p-4 mb-8">
                                        <img src="https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png" className="w-full h-full object-contain brightness-0 invert" alt="BP"/>
                                    </div>
                                    <h1 className="text-3xl font-black uppercase tracking-tighter text-primary leading-none">Certificat de Citoyenneté Verte</h1>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-2">Biso Peto Group SARL - Kinshasa</p>
                                    
                                    <div className="my-auto">
                                        <p className="text-sm font-medium italic text-gray-500">Décerné à</p>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter mt-2">{user.firstName} {user.lastName}</h2>
                                        <div className="w-24 h-1 bg-primary mx-auto my-6"></div>
                                        <p className="text-sm font-bold text-gray-700 leading-relaxed max-w-sm">
                                            Pour sa contribution exceptionnelle à l'assainissement de la ville province de Kinshasa et la réduction de l'empreinte carbone locale.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-3 w-full border-t border-gray-100 pt-8">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-primary">{user.co2Saved || 0}kg</p>
                                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">CO2 Neutralisé</p>
                                        </div>
                                        <div className="text-center flex flex-col items-center justify-center">
                                            <ShieldCheck className="text-primary mb-1" size={32}/>
                                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Officiel SIG</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-primary">{user.totalTonnage || 0}kg</p>
                                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Déchets Recyclés</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => onToast?.("Génération du PDF en cours...", "info")} className="mt-8 px-10 py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all">
                                <Download size={20}/> Télécharger mon certificat (PDF)
                            </button>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors"><Smartphone size={24}/></div>
                                        <div>
                                            <p className="font-black dark:text-white uppercase tracking-tight">iPhone 14 Pro Max</p>
                                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Session Active • Kinshasa</p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg">Actuel</span>
                                </div>
                                <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors"><Monitor size={24}/></div>
                                        <div>
                                            <p className="font-black dark:text-white uppercase tracking-tight">Windows 11 Desktop</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Vu il y a 2 heures • Gombe</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Déconnecter</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Actions Section */}
                <div className="pt-10 border-t dark:border-white/5 flex flex-col sm:flex-row gap-4">
                    <button onClick={onLogout} className="flex-1 py-5 bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/20 text-red-600 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-500/5 active:scale-95">
                        <LogOut size={20}/> Déconnexion Sécurisée
                    </button>
                    <button className="flex-1 py-5 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-[2.5rem] font-black uppercase tracking-widest text-[10px] hover:text-red-500 transition-colors">
                        Supprimer mon compte définitivement
                    </button>
                </div>
            </div>
        </div>
    );
};
