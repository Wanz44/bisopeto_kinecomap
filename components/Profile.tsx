
import React, { useState } from 'react';
import { 
    User as UserIcon, ArrowLeft, Moon, Sun, Settings, LogOut, 
    Star, Gift, Activity, Trash2, Leaf, Zap, Loader2, ChevronRight
} from 'lucide-react';
import { User as UserType, Theme, EcoVoucher } from '../types';
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
}

const AVAILABLE_VOUCHERS: EcoVoucher[] = [
    { id: 'v1', title: '500 FC Crédit M-Pesa', partnerName: 'Vodacom', discountValue: '500 FC', pointCost: 100, expiryDate: '2024-12-31', code: 'MP-ECOMAP-10', category: 'service' },
    { id: 'v2', title: 'Réduction Supermarché', partnerName: 'Kin Marché', discountValue: '10%', pointCost: 500, expiryDate: '2024-12-31', code: 'KM-PETO-24', category: 'food' },
    { id: 'v3', title: 'Forfait SNEL 10kW', partnerName: 'SNEL', discountValue: 'Gratuit', pointCost: 1000, expiryDate: '2024-08-30', code: 'ENERGY-PETO-10', category: 'energy' },
];

export const Profile: React.FC<ProfileProps> = ({ user, theme, onToggleTheme, onBack, onLogout, onSettings, onUpdateProfile, onToast }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'impact' | 'rewards'>('info');
    const [redeeming, setRedeeming] = useState<string | null>(null);

    const ecoPoints = user?.points || 0;

    const handleRedeem = (voucher: EcoVoucher) => {
        if (ecoPoints < voucher.pointCost) {
            onToast?.("Points insuffisants !", "error");
            return;
        }
        setRedeeming(voucher.id);
        setTimeout(async () => {
            const newPoints = ecoPoints - voucher.pointCost;
            await UserAPI.update({ id: user.id!, points: newPoints });
            onUpdateProfile({ points: newPoints });
            setRedeeming(null);
            onToast?.(`Succès ! Votre code : ${voucher.code}`, "success");
        }, 1500);
    };

    const initialLetter = (user?.firstName?.[0] || 'U').toUpperCase();

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden">
            {/* Header Interne - Remplace l'entête global pour gagner de la place */}
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
                    <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-lg mb-4 relative z-10">{initialLetter}</div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter relative z-10">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center gap-2 mt-4 px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full border border-blue-100 font-black text-[10px] uppercase tracking-[0.2em] relative z-10 animate-fade-in">
                        <Star size={12} className="animate-spin-slow"/> {ecoPoints} Eco-Points
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

                {/* Tab Content */}
                <div className="animate-fade-in-up">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-white/5 space-y-6">
                                <div className="space-y-4">
                                    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</p><p className="font-bold text-sm dark:text-white">{user.phone}</p></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone</p><p className="font-bold text-sm dark:text-white uppercase">{user.commune}</p></div>
                                        <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quartier</p><p className="font-bold text-sm dark:text-white uppercase">{user.neighborhood || '---'}</p></div>
                                    </div>
                                    <div><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse</p><p className="font-bold text-sm dark:text-white leading-relaxed uppercase">{user.address}</p></div>
                                </div>
                            </div>
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
                                <p className="text-[10px] font-black opacity-80 uppercase tracking-[0.2em]">Solde actuel : {ecoPoints} points</p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4">
                                {AVAILABLE_VOUCHERS.map(v => (
                                    <div key={v.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 flex items-center justify-between group transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Zap size={20}/></div>
                                            <div>
                                                <h5 className="font-black text-gray-900 dark:text-white uppercase text-xs tracking-tight">{v.title}</h5>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">{v.partnerName}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleRedeem(v)}
                                            disabled={redeeming === v.id}
                                            className={`px-6 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2 ${ecoPoints >= v.pointCost ? 'bg-primary text-white shadow-lg shadow-green-500/20 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
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
