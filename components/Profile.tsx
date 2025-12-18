
import React, { useState } from 'react';
import { User, ArrowLeft, Trophy, Medal, Award, Settings, Bell, LogOut, CreditCard, Moon, Sun, ChevronRight, Camera, Edit2, Mail, Phone, Lock, Save, X, History, Monitor, Smartphone, ShieldCheck, Activity } from 'lucide-react';
import { User as UserType, Theme, UserType as UserEnum } from '../types';

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
    const [activeTab, setActiveTab] = useState<'info' | 'sessions' | 'activity'>('info');

    const ActivityItem = ({ title, date, icon: Icon, color }: any) => (
        <div className="flex gap-4 items-center p-4 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18}/></div>
            <div className="flex-1">
                <p className="text-xs font-black dark:text-white uppercase tracking-tight">{title}</p>
                <p className="text-[10px] text-gray-400 font-bold">{date}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 rounded-2xl"><ArrowLeft/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Espace Personnel</h2>
                </div>
                <button onClick={onSettings} className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400"><Settings/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-24 no-scrollbar">
                
                {/* Profile Hero */}
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-white text-4xl font-black shadow-xl mb-6">{user.firstName[0]}</div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{user.firstName} {user.lastName}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-2">Accès {user.type}</p>
                    
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'info' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>Profil</button>
                        <button onClick={() => setActiveTab('sessions')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'sessions' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>Sécurité</button>
                        <button onClick={() => setActiveTab('activity')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === 'activity' ? 'bg-gray-900 text-white shadow-xl' : 'bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>Log</button>
                    </div>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Mail size={20}/></div>
                                <div><span className="text-[9px] font-black text-gray-400 uppercase block">Email</span><span className="text-sm font-black dark:text-white">{user.email}</span></div>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><Phone size={20}/></div>
                                <div><span className="text-[9px] font-black text-gray-400 uppercase block">Contact</span><span className="text-sm font-black dark:text-white">{user.phone}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'sessions' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Smartphone size={20}/></div>
                                <div><p className="font-black text-gray-900 dark:text-white text-sm">iPhone 13 • Kinshasa</p><p className="text-[10px] text-green-500 font-bold uppercase">Session Active</p></div>
                            </div>
                            <span className="text-[9px] font-black text-gray-400 uppercase">Actuel</span>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-900 rounded-3xl border dark:border-gray-800 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-2xl group-hover:bg-red-50 group-hover:text-red-500 transition-colors"><Monitor size={20}/></div>
                                <div><p className="font-black text-gray-900 dark:text-white text-sm">Windows Chrome • Paris</p><p className="text-[10px] text-gray-400 font-bold uppercase">Il y a 2 heures</p></div>
                            </div>
                            <button className="text-[10px] font-black text-red-500 uppercase hover:underline">Déconnecter</button>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-3 animate-fade-in">
                        <ActivityItem title="Modification mot de passe" date="Aujourd'hui à 10:30" icon={Lock} color="bg-orange-50 text-orange-600" />
                        <ActivityItem title="Validation Marketplace item #82" date="Hier à 14:15" icon={ShieldCheck} color="bg-green-50 text-green-600" />
                        <ActivityItem title="Envoi notification groupée" date="23 Mai 2024" icon={Bell} color="bg-blue-50 text-blue-600" />
                        <ActivityItem title="Connexion nouvelle IP" date="22 Mai 2024" icon={Activity} color="bg-purple-50 text-purple-600" />
                    </div>
                )}

                <button onClick={onLogout} className="w-full py-5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-sm"><LogOut size={20}/> Quitter la session</button>
            </div>
        </div>
    );
};
