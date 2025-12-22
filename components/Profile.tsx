
import React, { useState, useRef, useEffect } from 'react';
import { 
    User as UserIcon, ArrowLeft, Trophy, Medal, Award, Settings, Bell, LogOut, 
    CreditCard, Moon, Sun, ChevronRight, Camera, Edit2, Mail, 
    Phone, Lock, Save, X, History, Smartphone, 
    ShieldCheck, Activity, Star, Zap, Trash2, MapPin, 
    ChevronLeft, Loader2, Sparkles, TrendingUp, CheckCircle, Leaf, FileText, Download, Shield,
    Recycle, ShoppingCart, Gift, Zap as EnergyIcon, Utensils
} from 'lucide-react';
import { User as UserType, Theme, UserType as UserEnum, EcoVoucher } from '../types';
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

const AVAILABLE_VOUCHERS: EcoVoucher[] = [
    { id: 'v1', title: '500 FC Crédit M-Pesa', partnerName: 'Vodacom', discountValue: '500 FC', pointCost: 100, expiryDate: '2024-12-31', code: 'MP-ECOMAP-10', category: 'service' },
    { id: 'v2', title: 'Réduction Supermarché', partnerName: 'Kin Marché', discountValue: '10%', pointCost: 500, expiryDate: '2024-12-31', code: 'KM-PETO-24', category: 'food' },
    { id: 'v3', title: 'Forfait SNEL 10kW', partnerName: 'SNEL', discountValue: 'Gratuit', pointCost: 1000, expiryDate: '2024-08-30', code: 'ENERGY-PETO-10', category: 'energy' },
];

export const Profile: React.FC<ProfileProps> = ({ user, theme, onToggleTheme, onBack, onLogout, onManageSubscription, onSettings, onUpdateProfile, onToast }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'impact' | 'rewards'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-500 overflow-hidden min-h-screen">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 border-b dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl transition-all"><ArrowLeft size={20}/></button>
                    <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Espace Privé</h2>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onToggleTheme} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl">{theme === 'dark' ? <Sun size={20}/> : <Moon size={20}/>}</button>
                    <button onClick={onSettings} className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl"><Settings size={22}/></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 pb-32 no-scrollbar">
                <div className="bg-white dark:bg-[#0d1117] p-10 rounded-[3.5rem] border dark:border-white/5 shadow-2xl flex flex-col items-center">
                    <div className="w-32 h-32 bg-primary rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-xl mb-6">{initialLetter}</div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center gap-2 mt-4 px-6 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full border border-blue-100 font-black text-[10px] uppercase tracking-widest"><Star size={12}/> {ecoPoints} Eco-Points</div>
                </div>

                <div className="flex p-2 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border dark:border-white/5 gap-2 shadow-sm overflow-x-auto no-scrollbar">
                    {[
                        { id: 'info', label: 'Identité', icon: UserIcon },
                        { id: 'impact', label: 'Impact', icon: Activity },
                        { id: 'rewards', label: 'Boutique Points', icon: Gift }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] text-[11px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-400'}`}><tab.icon size={16}/> {tab.label}</button>
                    ))}
                </div>

                <div className="animate-fade-in-up">
                    {activeTab === 'info' && (
                        <div className="p-8 bg-white dark:bg-gray-900 rounded-[3rem] border dark:border-white/5 space-y-6">
                            <div className="space-y-4">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contact</p><p className="font-bold dark:text-white">{user.phone}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune</p><p className="font-bold dark:text-white">{user.commune}</p></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'impact' && (
                         <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Valorisé', val: `${user.totalTonnage || 0}kg`, icon: Trash2, color: 'text-green-500' },
                                { label: 'CO2 Sauvé', val: `${user.co2Saved || 0}kg`, icon: Leaf, color: 'text-blue-500' },
                            ].map((s, i) => (
                                <div key={i} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border dark:border-white/5 text-center">
                                    <div className={`w-14 h-14 ${s.color} bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4`}><s.icon size={24}/></div>
                                    <p className="text-2xl font-black dark:text-white">{s.val}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase mt-2">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-r from-[#2962FF] to-blue-400 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl mb-10">
                                <Sparkles className="absolute top-0 right-0 p-8 opacity-20" size={150} />
                                <h4 className="text-3xl font-black tracking-tighter uppercase leading-tight mb-2">Transformez vos déchets <br/> en économies réelles.</h4>
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Utilisez vos {ecoPoints} points maintenant.</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {AVAILABLE_VOUCHERS.map(v => (
                                    <div key={v.id} className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border-2 border-gray-100 dark:border-white/5 flex flex-col gap-6 group hover:border-primary transition-all">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                                                    {v.category === 'food' ? <Utensils/> : v.category === 'energy' ? <EnergyIcon/> : <Smartphone/>}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{v.title}</h5>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{v.partnerName}</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{v.discountValue}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleRedeem(v)}
                                            disabled={redeeming === v.id}
                                            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 ${ecoPoints >= v.pointCost ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {redeeming === v.id ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14}/>}
                                            {ecoPoints >= v.pointCost ? `Échanger (${v.pointCost} Pts)` : `Besoin de ${v.pointCost - ecoPoints} Pts`}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-10 border-t dark:border-white/5">
                    <button onClick={onLogout} className="w-full py-5 border-2 border-red-100 text-red-600 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><LogOut size={20}/> Déconnexion</button>
                </div>
            </div>
        </div>
    );
};
