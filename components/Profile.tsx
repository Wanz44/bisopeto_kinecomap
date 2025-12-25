
import React, { useState } from 'react';
import { 
    User as UserIcon, ArrowLeft, Moon, Sun, Settings, LogOut, 
    Star, Gift, Activity, Trash2, Leaf, Zap, Loader2, ChevronRight,
    Edit2, Save, X, Phone, Mail, MapPin, ShieldCheck, UserCog
} from 'lucide-react';
import { User as UserType, Theme, EcoVoucher, AppView } from '../types';
import { UserAPI } from '../services/api';

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
    onChangeView?: (view: AppView) => void;
}

const AVAILABLE_VOUCHERS: EcoVoucher[] = [
    { id: 'v1', title: '500 FC Crédit M-Pesa', partnerName: 'Vodacom', discountValue: '500 FC', pointCost: 100, expiryDate: '2024-12-31', code: 'MP-ECOMAP-10', category: 'service' },
    { id: 'v2', title: 'Réduction Supermarché', partnerName: 'Kin Marché', discountValue: '10%', pointCost: 500, expiryDate: '2024-12-31', code: 'KM-PETO-24', category: 'food' },
];

export const Profile: React.FC<ProfileProps> = ({ user, theme, onToggleTheme, onBack, onLogout, onSettings, onUpdateProfile, onToast, onChangeView }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'impact' | 'rewards'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [redeeming, setRedeeming] = useState<string | null>(null);

    // Formulaire d'édition locale
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
    });

    const handleSaveSelf = async () => {
        setIsSaving(true);
        try {
            await UserAPI.update({ id: user.id!, ...formData });
            onUpdateProfile(formData);
            setIsEditing(false);
            onToast?.("Profil mis à jour avec succès !", "success");
        } catch (e) {
            onToast?.("Erreur lors de la mise à jour", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRedeem = (voucher: EcoVoucher) => {
        if (user.points < voucher.pointCost) {
            onToast?.("Points insuffisants !", "error");
            return;
        }
        setRedeeming(voucher.id);
        setTimeout(async () => {
            const newPoints = user.points - voucher.pointCost;
            await UserAPI.update({ id: user.id!, points: newPoints });
            onUpdateProfile({ points: newPoints });
            setRedeeming(null);
            onToast?.(`Succès ! Votre code : ${voucher.code}`, "success");
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden">
            {/* Header Interne */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 border-b dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl transition-all"><ArrowLeft size={18}/></button>
                    <h2 className="text-lg font-black uppercase tracking-tighter dark:text-white leading-none">Mon Espace</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleTheme} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl">{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
                    <button onClick={onSettings} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl"><Settings size={18}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 no-scrollbar">
                {/* Profile Card */}
                <div className="bg-white dark:bg-[#0d1117] p-8 rounded-[3rem] border dark:border-white/5 shadow-xl flex flex-col items-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12 group-hover:scale-110 transition-transform"><UserIcon size={120}/></div>
                    <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4 relative z-10">{user.firstName[0].toUpperCase()}</div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter relative z-10">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center gap-2 mt-4 px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full border border-blue-100 font-black text-[10px] uppercase tracking-[0.2em] relative z-10">
                        <Star size={12}/> {user.points} Eco-Points
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-[2rem] border dark:border-white/5 gap-1.5 shadow-sm">
                    {[
                        { id: 'info', label: 'Infos', icon: UserIcon },
                        { id: 'impact', label: 'Impact', icon: Activity },
                        { id: 'rewards', label: 'Récompenses', icon: Gift }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="animate-fade-in">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border dark:border-white/5 relative shadow-sm">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Coordonnées personnelles</h4>
                                    {!isEditing ? (
                                        <button onClick={() => setIsEditing(true)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:scale-105 transition-all"><Edit2 size={16}/></button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditing(false)} className="p-2.5 bg-gray-100 text-gray-500 rounded-xl"><X size={16}/></button>
                                            <button onClick={handleSaveSelf} disabled={isSaving} className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20">{isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}</button>
                                        </div>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="space-y-5 animate-fade-in">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Prénom</label><input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" value={formData.firstName} onChange={e=>setFormData({...formData, firstName: e.target.value})}/></div>
                                            <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Nom</label><input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" value={formData.lastName} onChange={e=>setFormData({...formData, lastName: e.target.value})}/></div>
                                        </div>
                                        <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Email</label><input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})}/></div>
                                        <div className="space-y-1.5"><label className="text-[9px] font-black text-gray-400 uppercase ml-2">Téléphone</label><input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-bold text-sm dark:text-white" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})}/></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400"><Phone size={18}/></div><div><p className="text-[9px] font-black text-gray-400 uppercase">Téléphone</p><p className="font-bold text-sm dark:text-white">{user.phone}</p></div></div>
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400"><Mail size={18}/></div><div><p className="text-[9px] font-black text-gray-400 uppercase">E-mail</p><p className="font-bold text-sm dark:text-white">{user.email || 'Non renseigné'}</p></div></div>
                                        <div className="flex items-center gap-4"><div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400"><MapPin size={18}/></div><div><p className="text-[9px] font-black text-gray-400 uppercase">Commune</p><p className="font-bold text-sm dark:text-white uppercase">{user.commune}</p></div></div>
                                    </div>
                                )}
                            </div>

                            {user.type === 'admin' && (
                                <button onClick={() => onChangeView?.(AppView.ADMIN_USERS)} className="w-full p-6 bg-gray-900 dark:bg-gray-800 text-white rounded-[2.5rem] flex items-center justify-between group hover:bg-blue-600 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserCog size={24}/></div>
                                        <div className="text-left"><p className="font-black uppercase text-sm leading-none">Console Utilisateurs</p><p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">Gérer les autres membres du réseau</p></div>
                                    </div>
                                    <ChevronRight size={20} className="text-white/30"/>
                                </button>
                            )}
                        </div>
                    )}

                    {activeTab === 'impact' && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { label: 'Déchets Valorisés', val: `${user.totalTonnage || 0}kg`, icon: Trash2, color: 'text-green-500', bg: 'bg-green-50' },
                                { label: 'Émission CO2 évitée', val: `${user.co2Saved || 0}kg`, icon: Leaf, color: 'text-blue-500', bg: 'bg-blue-50' },
                            ].map((s, i) => (
                                <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-white/5 text-center shadow-sm">
                                    <div className={`w-14 h-14 ${s.color} ${s.bg.replace('50', '100')} dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4`}><s.icon size={24}/></div>
                                    <p className="text-3xl font-black dark:text-white tracking-tighter">{s.val}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2 leading-none">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-primary to-green-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl mb-4">
                                <Gift className="absolute -right-4 -bottom-4 p-8 opacity-20 rotate-12" size={150} />
                                <h4 className="text-2xl font-black tracking-tighter uppercase leading-tight mb-2">Transformez vos déchets <br/> en crédit réel.</h4>
                                <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">Solde actuel : {user.points} points</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {AVAILABLE_VOUCHERS.map(v => (
                                    <div key={v.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary"><Zap size={20}/></div>
                                            <div><h5 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-tight">{v.title}</h5><p className="text-[9px] text-gray-400 font-bold uppercase">{v.partnerName}</p></div>
                                        </div>
                                        <button onClick={() => handleRedeem(v)} disabled={redeeming === v.id} className={`px-6 py-3 rounded-2xl font-black uppercase text-[9px] transition-all flex items-center gap-2 ${user.points >= v.pointCost ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                            {redeeming === v.id ? <Loader2 className="animate-spin" size={14}/> : v.pointCost + ' Pts'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-10 border-t dark:border-white/5">
                    <button onClick={onLogout} className="w-full py-5 border-2 border-red-100 dark:border-red-900/30 text-red-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all"><LogOut size={18}/> Déconnexion</button>
                </div>
            </div>
        </div>
    );
};
