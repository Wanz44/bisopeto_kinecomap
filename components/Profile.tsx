
import React, { useState, useRef } from 'react';
import { User, ArrowLeft, Trophy, Medal, Award, Settings, Bell, LogOut, CreditCard, Moon, Sun, ChevronRight, Camera, Edit2, Mail, Phone, Lock, Save, X } from 'lucide-react';
import { User as UserType, Theme, UserType as UserEnum } from '../types';
import { StorageAPI } from '../services/api';

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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit Profile State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phone: user.phone || ''
    });

    const isPayingUser = user.type === UserEnum.CITIZEN || user.type === UserEnum.BUSINESS;

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            setIsUploading(true);
            try {
                const publicUrl = await StorageAPI.uploadImage(file, 'profiles');
                if (publicUrl) {
                    setProfileImage(publicUrl);
                    if (onToast) onToast("Photo de profil mise à jour", "success");
                    // Update user profile via API if needed
                } else {
                    if (onToast) onToast("Erreur upload photo (sauvegarde locale uniquement)", "info");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const triggerFileInput = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(editForm);
        setShowEditModal(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F5F7FA] dark:bg-gray-900 relative transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mon Profil</h2>
                </div>
                <button 
                    onClick={onSettings}
                    className="p-2 hover:bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
                >
                    <Settings size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Header Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative">
                    
                    <button 
                        onClick={() => setShowEditModal(true)}
                        className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>

                    {/* Avatar Section */}
                    <div className="relative mb-4 group cursor-pointer" onClick={triggerFileInput}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden border-4 border-white dark:border-gray-700 ${profileImage ? 'bg-white' : 'bg-gradient-to-br from-[#00C853] to-[#2962FF]'} ${isUploading ? 'opacity-50' : ''}`}>
                            {profileImage ? (
                                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-white" />
                            )}
                        </div>
                        
                        <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md border border-gray-100 dark:border-gray-600 group-hover:scale-110 transition-transform">
                            <Camera size={16} className="text-gray-600 dark:text-gray-300" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user.firstName} {user.lastName}</h2>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-wide">{user.type}</span>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">{user.address}</p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <div className="text-2xl font-bold text-[#00C853]">{user.points}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Points Eco</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
                        <div className="text-2xl font-bold text-[#2962FF]">{user.collections}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Collectes</div>
                    </div>
                </div>

                {/* Badges Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Mes Badges</h3>
                        <span className="text-sm text-green-600 dark:text-green-400 font-semibold cursor-pointer hover:underline">Voir tout</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-[#00C853] flex flex-col items-center text-center relative overflow-hidden group">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-[#00C853] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Trophy size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">Recycleur Débutant</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-[#00C853] flex flex-col items-center text-center group">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#2962FF] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Medal size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">Eco Citoyen</span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 opacity-60 flex flex-col items-center text-center grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center mb-2">
                                <Award size={20} />
                            </div>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">Super Collecteur</span>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
                    <button onClick={onToggleTheme} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </div>
                            <span className="font-semibold text-gray-700 dark:text-gray-200">Mode {theme === 'dark' ? 'Clair' : 'Sombre'}</span>
                        </div>
                        <div className={`w-11 h-6 rounded-full flex items-center transition-colors px-1 ${theme === 'dark' ? 'bg-[#00C853]' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </button>

                    {isPayingUser && (
                        <button onClick={onManageSubscription} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                    <CreditCard size={20} />
                                </div>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">Gérer l'abonnement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md uppercase">{user.subscription}</span>
                                <ChevronRight size={18} className="text-gray-400" />
                            </div>
                        </button>
                    )}

                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:scale-110 transition-transform">
                                <LogOut size={20} />
                            </div>
                            <span className="font-semibold text-red-500">Se déconnecter</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Modifier le profil</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
                                    <input 
                                        type="text" 
                                        value={editForm.firstName}
                                        onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                                    <input 
                                        type="text" 
                                        value={editForm.lastName}
                                        onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input 
                                        type="email" 
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                                <div className="relative">
                                    <Phone size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input 
                                        type="tel" 
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    />
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={() => { setShowEditModal(false); onSettings(); }}
                                className="w-full p-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <Lock size={18} className="text-blue-600 dark:text-blue-400" />
                                    <span className="text-blue-800 dark:text-blue-300 font-bold text-sm">Changer mot de passe</span>
                                </div>
                                <ChevronRight size={18} className="text-blue-400" />
                            </button>

                            <button 
                                type="submit"
                                className="w-full py-4 bg-[#00C853] hover:bg-green-600 text-white font-bold rounded-xl shadow-lg mt-4 flex items-center justify-center gap-2 transition-all"
                            >
                                <Save size={20} /> Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowLogoutConfirm(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl relative z-10 animate-fade-in-up">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-4 mx-auto">
                            <LogOut size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">Déconnexion</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-center text-sm">
                            Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={onLogout}
                                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
