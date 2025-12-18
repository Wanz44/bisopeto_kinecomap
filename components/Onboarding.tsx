
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ArrowLeft, Home, LogIn, User as UserIcon, Shield, Lock, Phone, 
    Eye, EyeOff, AlertCircle, Loader2, Clock, Globe, ShieldCheck, Mail, 
    MapPin, CheckCircle2, Building2, Truck, UserCheck, ShieldAlert, PhoneCall,
    Briefcase, UserCog
} from 'lucide-react';
import { UserType, User } from '../types';
import { UserAPI } from '../services/api';

interface OnboardingProps {
    onComplete: (user: Partial<User>) => void;
    onBackToLanding: () => void;
    appLogo?: string;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    initialShowLogin?: boolean;
}

const ROLES_CONFIG = [
    { 
        type: UserType.CITIZEN, 
        label: 'Citoyen', 
        icon: UserIcon, 
        color: 'text-[#00C853]', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-100 dark:border-green-800',
        desc: 'Pour mon foyer'
    },
    { 
        type: UserType.BUSINESS, 
        label: 'Entreprise', 
        icon: Briefcase, 
        color: 'text-[#2962FF]', 
        bg: 'bg-blue-50 dark:bg-blue-900/20', 
        border: 'border-blue-100 dark:border-blue-800',
        desc: 'Bureaux & Commerces'
    },
    { 
        type: UserType.COLLECTOR, 
        label: 'Collecteur', 
        icon: Truck, 
        color: 'text-orange-600', 
        bg: 'bg-orange-50 dark:bg-orange-900/20', 
        border: 'border-orange-100 dark:border-orange-800',
        desc: 'Agents de terrain'
    },
    { 
        type: UserType.ADMIN, 
        label: 'Administrateur', 
        icon: Shield, 
        color: 'text-gray-900 dark:text-white', 
        bg: 'bg-gray-100 dark:bg-gray-800', 
        border: 'border-gray-200 dark:border-gray-700',
        desc: 'Gestion système'
    },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLanding, appLogo = './logobisopeto.png', onToast, initialShowLogin = false }) => {
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const [registrationFinished, setRegistrationFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [loginRole, setLoginRole] = useState<UserType>(UserType.CITIZEN);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regStep, setRegStep] = useState(1);
    const [registerPassword, setRegisterPassword] = useState('');
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, status: 'pending', address: '', subscription: 'standard'
    });

    const updateData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginIdentifier || !loginPassword) {
            setError("Champs obligatoires manquants.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const user = await UserAPI.login(loginIdentifier, loginPassword);
            if (user) {
                if(onToast) onToast(`Mbote ${user.firstName} !`, "success");
                onComplete({ ...user, type: loginRole });
            } else {
                setError("Identifiants incorrects pour ce profil.");
            }
        } catch (err) {
            setError("Erreur de connexion réseau.");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => {
        if (regStep === 1 && (!formData.firstName || !formData.lastName || !formData.phone)) {
            setError("Veuillez remplir votre identité."); return;
        }
        if (regStep === 2 && (!formData.email || !registerPassword)) {
            setError("Email ou mot de passe manquant."); return;
        }
        setRegStep(prev => prev + 1);
        setError(null);
    };

    const handleRegisterSubmit = async () => {
        if (!formData.address) { setError("L'adresse est requise pour la collecte."); return; }
        setIsLoading(true);
        try {
            const registeredUser = await UserAPI.register({ ...formData, status: 'pending' } as User, registerPassword);
            setRegistrationFinished(true);
            // On peut automatiquement connecter l'utilisateur en mode 'pending'
            onComplete(registeredUser);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (registrationFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#050505] p-6 text-center">
                <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[3.5rem] p-10 shadow-2xl animate-scale-up border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full -mr-8 -mt-8"></div>
                    
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8 text-[#00C853] shadow-inner">
                        <CheckCircle2 size={48} className="animate-bounce" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">C'est Presque Fini !</h2>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-3xl mb-8 border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-300 font-bold leading-relaxed">
                            "Merci pour votre souscription. Notre équipe vous contactera sous peu pour finaliser votre abonnement à <span className="text-[#00C853] font-black">Bisopeto</span>."
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-2 h-2 rounded-full bg-[#00C853]"></div>
                            <span className="text-xs font-bold text-gray-500">Qualification par appel vocal</span>
                        </div>
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-2 h-2 rounded-full bg-[#2962FF]"></div>
                            <span className="text-xs font-bold text-gray-500">Validation de la zone de collecte</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => onComplete(formData as User)} 
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl hover:shadow-green-500/10"
                    >
                        Accéder à mon espace attente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-scale-up border border-gray-100 dark:border-gray-800">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <img src={appLogo} alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2">
                        {showLogin ? 'Espace Connexion' : 'Nous Rejoindre'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                        {showLogin ? 'Accédez à votre tableau de bord' : `Étape ${regStep} sur 3`}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-black animate-fade-in">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <div className="space-y-8">
                    {showLogin ? (
                        <div className="space-y-8">
                            {/* Role Selector Grid */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Je suis un...</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES_CONFIG.map((role) => (
                                        <button
                                            key={role.type}
                                            onClick={() => setLoginRole(role.type)}
                                            className={`flex flex-col items-center p-4 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${
                                                loginRole === role.type 
                                                ? `${role.border} ${role.bg} shadow-lg scale-105` 
                                                : 'border-transparent bg-gray-50 dark:bg-gray-800/50 grayscale hover:grayscale-0 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <div className={`p-3 rounded-2xl mb-2 ${role.color} bg-white dark:bg-gray-700 shadow-sm transition-transform group-hover:scale-110`}>
                                                <role.icon size={24} />
                                            </div>
                                            <span className={`font-black text-sm ${loginRole === role.type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{role.label}</span>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-1">{role.desc}</span>
                                            {loginRole === role.type && <div className="absolute top-2 right-2"><CheckCircle2 size={16} className={role.color} /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Identifiants {loginRole}</label>
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-[#2962FF] transition-all overflow-hidden pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Mail size={18} /></div>
                                        <input required type="text" placeholder="Email ou Téléphone" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none placeholder-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Mot de passe</label>
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-[#2962FF] transition-all overflow-hidden pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Lock size={18} /></div>
                                        <input required type={showPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none placeholder-gray-400" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-[#2962FF] p-1">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <button disabled={isLoading} className="w-full bg-[#2962FF] hover:bg-[#1E40AF] text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2 mt-4">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
                                    {isLoading ? 'Authentification...' : `Se connecter en tant qu'${loginRole}`}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {regStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Prénom</label>
                                            <input placeholder="Jean" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm" value={formData.firstName} onChange={(e) => updateData('firstName', e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nom</label>
                                            <input placeholder="Kabeya" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm" value={formData.lastName} onChange={(e) => updateData('lastName', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Téléphone</label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-4 top-5 text-gray-400" />
                                            <input type="tel" placeholder="081 234 5678" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm" value={formData.phone} onChange={(e) => updateData('phone', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {regStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Email</label>
                                        <input type="email" placeholder="votre@email.com" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm" value={formData.email} onChange={(e) => updateData('email', e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Mot de passe sécurisé</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {regStep === 3 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Type de compte</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => updateData('type', UserType.CITIZEN)} className={`flex-1 p-3 rounded-xl border-2 font-bold text-xs transition-all ${formData.type === UserType.CITIZEN ? 'border-[#00C853] bg-green-50 dark:bg-green-900/20 text-[#00C853]' : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>Ménage</button>
                                            <button onClick={() => updateData('type', UserType.BUSINESS)} className={`flex-1 p-3 rounded-xl border-2 font-bold text-xs transition-all ${formData.type === UserType.BUSINESS ? 'border-[#2962FF] bg-blue-50 dark:bg-blue-900/20 text-[#2962FF]' : 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>Business</button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Adresse de collecte</label>
                                        <textarea rows={3} placeholder="N°, Rue, Quartier, Commune..." className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-[#00C853] text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-sm resize-none" value={formData.address} onChange={(e) => updateData('address', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                {regStep > 1 && (
                                    <button onClick={() => setRegStep(prev => prev - 1)} className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl hover:bg-gray-200 transition-colors">
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                <button onClick={regStep === 3 ? handleRegisterSubmit : nextStep} disabled={isLoading} className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 group transition-all active:scale-[0.98] shadow-lg">
                                    {isLoading ? <Loader2 className="animate-spin" /> : regStep === 3 ? 'Finaliser l\'inscription' : 'Étape Suivante'}
                                    {!isLoading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-5 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={() => { setShowLogin(!showLogin); setError(null); }} className="text-sm font-black text-[#2962FF] dark:text-blue-400 hover:underline transition-all">
                            {showLogin ? "Nouveau ici ? Créer un compte citoyen" : "Déjà membre ? Se connecter"}
                        </button>
                        <button onClick={onBackToLanding} className="text-[10px] font-black text-gray-400 dark:text-gray-500 flex items-center gap-2 hover:text-gray-600 dark:hover:text-gray-300 uppercase tracking-widest transition-colors">
                            <ArrowLeft size={14} /> Retour au portail
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
