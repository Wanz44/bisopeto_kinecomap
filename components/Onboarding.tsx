
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ArrowLeft, Home, LogIn, User as UserIcon, Shield, Lock, Phone, 
    Eye, EyeOff, AlertCircle, Loader2, Clock, Globe, ShieldCheck, Mail, 
    MapPin, CheckCircle2, Building2, Truck, UserCheck, ShieldAlert, PhoneCall,
    Briefcase, UserCog, Sparkles, Map as MapIcon, GraduationCap, ArrowRight, Zap,
    Send, Scale, ExternalLink
} from 'lucide-react';
import { UserType, User } from '../types';
import { UserAPI } from '../services/api';
import { LegalDocs } from './LegalDocs';

interface OnboardingProps {
    onComplete: (user: Partial<User>) => void;
    onBackToLanding: () => void;
    appLogo?: string;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    initialShowLogin?: boolean;
    onNotifyAdmin?: (title: string, message: string) => void;
}

const KINSHASA_COMMUNES = [
    "Barumbu", "Bumbu", "Bandalungwa", "Gombe", "Kalamu", "Kasa-Vubu", 
    "Kinshasa", "Kintambo", "Lingwala", "Lemba", "Limete", "Makala", 
    "Maluku", "Masina", "Matete", "Mont Ngafula", "Mbinza", "Ngaba", 
    "Ngaliema", "N’djili", "Nsele", "Selembao", "Kimbanseke", "Kisenso"
];

const ONBOARDING_SLIDES = [
    {
        title: "Bienvenue sur Kin Eco Map",
        desc: "L'application qui transforme Kinshasa. Agir localement, impacter durablement.",
        icon: Sparkles,
        color: "text-primary-light",
        bg: "bg-green-50",
    },
    {
        title: "Signalez les déchets en un clic",
        desc: "Prenez une photo, notre IA identifie l'urgence et localise le tas pour une collecte rapide.",
        icon: MapPin,
        color: "text-secondary",
        bg: "bg-blue-50",
    },
    {
        title: "Suivez les collectes en temps réel",
        desc: "Visualisez les camions sur la carte et recevez une notification à leur approche.",
        icon: Truck,
        color: "text-action",
        bg: "bg-yellow-50",
    },
    {
        title: "Rejoignez l'académie écolo",
        desc: "Apprenez le tri et le recyclage, gagnez des points Eco et devenez un citoyen modèle.",
        icon: GraduationCap,
        color: "text-purple-500",
        bg: "bg-purple-50",
    },
    {
        title: "Commencez maintenant",
        desc: "Créez votre compte en quelques secondes et participez à l'assainissement de votre ville.",
        icon: CheckCircle2,
        color: "text-primary",
        bg: "bg-green-100",
    }
];

const ROLES_CONFIG = [
    { 
        type: UserType.CITIZEN, 
        label: 'Citoyen', 
        icon: UserIcon, 
        color: 'text-primary-light', 
        bg: 'bg-green-50 dark:bg-green-900/20', 
        border: 'border-green-100 dark:border-green-800',
        desc: 'Pour mon foyer'
    },
    { 
        type: UserType.BUSINESS, 
        label: 'Entreprise', 
        icon: Briefcase, 
        color: 'text-secondary', 
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

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLanding, appLogo = './logobisopeto.png', onToast, initialShowLogin = false, onNotifyAdmin }) => {
    const [mode, setMode] = useState<'slides' | 'auth'>(initialShowLogin ? 'auth' : 'slides');
    const [activeSlide, setActiveSlide] = useState(0);
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
        type: UserType.CITIZEN, status: 'pending', address: '', neighborhood: '', subscription: 'standard', commune: 'Gombe'
    });

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToEmails, setAgreedToEmails] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' | null }>({ isOpen: false, type: null });

    const handleNextSlide = () => {
        if (activeSlide < ONBOARDING_SLIDES.length - 1) {
            setActiveSlide(activeSlide + 1);
        } else {
            setMode('auth');
        }
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
        if (!formData.commune) { setError("Veuillez sélectionner votre commune."); return; }
        if (!formData.neighborhood) { setError("Veuillez renseigner votre quartier."); return; }
        if (!formData.address) { setError("L'adresse précise est requise pour la collecte."); return; }
        if (!agreedToTerms) { setError("Vous devez accepter les conditions d'utilisation."); return; }
        
        setIsLoading(true);
        try {
            const registeredUser = await UserAPI.register({ 
                ...formData, 
                status: 'pending',
                emailConsent: agreedToEmails 
            } as User, registerPassword);
            
            if (onNotifyAdmin) {
                onNotifyAdmin(
                    "Nouvelle Inscription 👤", 
                    `${formData.firstName} ${formData.lastName} (${formData.type}) en attente de validation. Zone: ${formData.commune}, ${formData.neighborhood}.`
                );
            }
            
            setRegistrationFinished(true);
            if (onToast) onToast(`Demande envoyée avec succès`, "success");
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'slides') {
        const slide = ONBOARDING_SLIDES[activeSlide];
        return (
            <div className={`min-h-screen ${slide.bg} dark:bg-gray-950 flex flex-col items-center justify-center p-6 md:p-8 transition-colors duration-700`}>
                <div className="w-full max-w-lg text-center animate-fade-in">
                    <div className={`w-20 h-20 md:w-24 md:h-24 ${slide.bg.replace('50', '100')} dark:bg-gray-800 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-xl shadow-black/5`}>
                        <slide.icon size={40} md={48} className={slide.color} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 tracking-tighter leading-tight">
                        {slide.title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 font-medium mb-8 md:mb-12 leading-relaxed px-2">
                        {slide.desc}
                    </p>
                    
                    <div className="flex justify-center gap-2 mb-8 md:mb-12">
                        {ONBOARDING_SLIDES.map((_, i) => (
                            <div key={i} className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-6 md:w-8 bg-primary' : 'w-1.5 md:w-2 bg-gray-300'}`}></div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={handleNextSlide}
                            className="w-full bg-primary hover:bg-primary-light text-white py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-xs md:text-sm shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {activeSlide === ONBOARDING_SLIDES.length - 1 ? "C'est parti !" : "Suivant"}
                            <ArrowRight size={18} md={20} />
                        </button>
                        <button 
                            onClick={() => setMode('auth')}
                            className="text-gray-400 font-bold hover:text-primary transition-colors text-[10px] md:text-sm uppercase tracking-widest"
                        >
                            Passer l'intro
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (registrationFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA] dark:bg-[#050505] p-6 text-center">
                <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 shadow-2xl animate-scale-up border border-gray-100 dark:border-gray-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary rotate-12"><Send size={150} /></div>
                    
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-green-50 dark:bg-green-900/20 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary-light shadow-inner relative z-10">
                        <CheckCircle2 size={48} md={56} className="animate-bounce" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none relative z-10">Demande Reçue !</h2>
                    
                    <div className="space-y-4 md:space-y-6 mb-10 md:mb-12 relative z-10">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 md:p-6 rounded-[1.8rem] md:rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-start gap-4 text-left">
                            <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-blue-600"><Mail size={20} md={24} /></div>
                            <div>
                                <p className="text-[11px] md:text-sm font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-1">Dossier en attente</p>
                                <p className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                                    Validation en cours pour la zone <strong>{formData.commune}</strong>.
                                </p>
                            </div>
                        </div>
                        <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium leading-relaxed px-2">
                            Mbote {formData.firstName}! Préparez-vous à impacter votre quartier (**{formData.neighborhood}**) dès validation.
                        </p>
                    </div>

                    <button 
                        onClick={() => onComplete(formData as User)} 
                        className="w-full bg-primary text-white py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        Accéder à l'espace d'attente <ChevronRight size={16} md={18}/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8">
            {/* 
               MODIFICATION UX : max-h-[90vh] et overflow-y-auto sur la carte pour mobile 
               permet de voir tout le formulaire et les cases à cocher sans être bloqué.
            */}
            <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-[2.5rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 space-y-6 md:space-y-8 animate-scale-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
                <div className="text-center shrink-0">
                    <div className="flex justify-center mb-4 md:mb-6">
                        <img src={appLogo} alt="Logo" className="w-16 h-16 md:w-20 md:h-20 object-contain" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2">
                        {showLogin ? 'Connexion' : 'Nous Rejoindre'}
                    </h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                        {showLogin ? 'Gérez votre compte eco' : `Étape ${regStep} sur 3`}
                    </p>
                </div>

                {error && (
                    <div className="shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-100 p-3 md:p-4 rounded-xl md:rounded-2xl flex items-center gap-3 text-red-600 text-xs md:text-sm font-bold">
                        <AlertCircle size={16} md={18} /> {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 md:space-y-8 pr-1">
                    {showLogin ? (
                        <div className="space-y-6 md:space-y-8">
                            <div className="space-y-4">
                                <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Je suis un...</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ROLES_CONFIG.map((role) => (
                                        <button
                                            key={role.type}
                                            onClick={() => setLoginRole(role.type)}
                                            className={`flex flex-col items-center p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 relative overflow-hidden group ${
                                                loginRole === role.type 
                                                ? `border-primary ${role.bg} shadow-lg scale-105` 
                                                : 'border-transparent bg-gray-50 dark:bg-gray-800/50 opacity-60'
                                            }`}
                                        >
                                            <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl mb-2 ${role.color} bg-white dark:bg-gray-700 shadow-sm transition-transform group-hover:scale-110`}>
                                                <role.icon size={20} md={24} />
                                            </div>
                                            <span className={`font-black text-xs md:text-sm ${loginRole === role.type ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{role.label}</span>
                                            {loginRole === role.type && <div className="absolute top-2 right-2"><CheckCircle2 size={14} className="text-primary" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-4 md:space-y-5 animate-fade-in pb-4">
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl md:rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all overflow-hidden pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Mail size={16} md={18} /></div>
                                        <input required type="text" placeholder="Email ou Téléphone" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="bg-transparent w-full p-3 md:p-4 text-xs md:text-sm text-gray-900 dark:text-white font-bold outline-none placeholder-gray-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-xl md:rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all overflow-hidden pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Lock size={16} md={18} /></div>
                                        <input required type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-transparent w-full p-3 md:p-4 text-xs md:text-sm text-gray-900 dark:text-white font-bold outline-none placeholder-gray-400" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-primary p-1">{showPassword ? <EyeOff size={16} md={18} /> : <Eye size={16} md={18} />}</button>
                                    </div>
                                </div>
                                <button disabled={isLoading} className="w-full bg-primary hover:bg-primary-DEFAULT/90 text-white py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 mt-2">
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                                    {isLoading ? 'Accès...' : `Se connecter`}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-5 md:space-y-6 pb-4">
                            {regStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <input placeholder="Prénom" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                                        <input placeholder="Nom" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                                    </div>
                                    <input type="tel" placeholder="Téléphone (ex: 0812345678)" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            )}

                            {regStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <input type="email" placeholder="Email" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    <input type="password" placeholder="Mot de passe sécurisé" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                </div>
                            )}

                            {regStep === 3 && (
                                <div className="space-y-4 md:space-y-5 animate-fade-in">
                                    <div className="flex gap-2">
                                        <button onClick={() => setFormData({...formData, type: UserType.CITIZEN})} className={`flex-1 p-2.5 md:p-3 rounded-xl border-2 font-bold text-[10px] md:text-xs transition-all ${formData.type === UserType.CITIZEN ? 'border-primary-light bg-green-50 text-primary-light' : 'border-transparent bg-gray-100 text-gray-500'}`}>Particulier</button>
                                        <button onClick={() => setFormData({...formData, type: UserType.BUSINESS})} className={`flex-1 p-2.5 md:p-3 rounded-xl border-2 font-bold text-[10px] md:text-xs transition-all ${formData.type === UserType.BUSINESS ? 'border-secondary bg-blue-50 text-secondary' : 'border-transparent bg-gray-100 text-gray-500'}`}>Entreprise</button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commune</label>
                                            <select className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-[11px] md:text-xs uppercase appearance-none" value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})}>
                                                {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quartier</label>
                                            <input placeholder="ex: Quartier Latin" className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-[11px] md:text-xs uppercase" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                                        </div>
                                    </div>
                                    <textarea rows={2} placeholder="Adresse précise (N°, Avenue)..." className="w-full p-3.5 md:p-4 rounded-xl md:rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-xs md:text-sm font-bold text-gray-900 dark:text-white outline-none resize-none" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                    
                                    <div className="space-y-4 pt-4 border-t dark:border-gray-800">
                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={agreedToTerms} 
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)} 
                                                />
                                                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg peer-checked:bg-primary peer-checked:border-primary transition-all"></div>
                                                <CheckCircle2 size={14} md={16} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-bold leading-tight select-none">
                                                J'accepte les <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="text-primary hover:underline">Conditions</button> et la <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="text-primary hover:underline">Confidentialité</button>. <span className="text-red-500">*</span>
                                            </span>
                                        </label>

                                        <label className="flex items-start gap-4 cursor-pointer group">
                                            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer" 
                                                    checked={agreedToEmails} 
                                                    onChange={(e) => setAgreedToEmails(e.target.checked)} 
                                                />
                                                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-300 dark:border-gray-700 rounded-lg peer-checked:bg-secondary peer-checked:border-secondary transition-all"></div>
                                                <CheckCircle2 size={14} md={16} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                            </div>
                                            <span className="text-[10px] md:text-xs text-gray-600 dark:text-gray-400 font-bold leading-tight select-none">
                                                J'autorise l'usage de mon courriel pour les communications (facultatif).
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shrink-0 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex gap-3 md:gap-4">
                        {regStep > 1 && !showLogin && (
                            <button onClick={() => setRegStep(prev => prev - 1)} className="p-4 md:p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl md:rounded-2xl">
                                <ArrowLeft size={18} md={20} />
                            </button>
                        )}
                        <button 
                            onClick={showLogin ? handleLoginSubmit : (regStep === 3 ? handleRegisterSubmit : nextStep)} 
                            disabled={isLoading || (!showLogin && regStep === 3 && !agreedToTerms)} 
                            className={`flex-1 text-white py-4 md:py-5 rounded-[1.2rem] md:rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center justify-center gap-2 group transition-all shadow-lg ${
                                !showLogin && regStep === 3 && !agreedToTerms ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed grayscale' : 'bg-primary'
                            }`}
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={16}/> : (showLogin ? 'Se connecter' : (regStep === 3 ? 'S\'inscrire' : 'Suivant'))}
                            {!isLoading && <ChevronRight size={16} md={18} />}
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <button onClick={() => { setShowLogin(!showLogin); setError(null); }} className="text-xs md:text-sm font-black text-secondary hover:underline transition-all">
                            {showLogin ? "Nouveau ? Créer un compte" : "Déjà membre ? Se connecter"}
                        </button>
                        <button onClick={onBackToLanding} className="text-[9px] md:text-[10px] font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest transition-colors">
                            <ArrowLeft size={12} md={14} /> Accueil
                        </button>
                    </div>
                </div>
            </div>

            <LegalDocs 
                isOpen={legalModal.isOpen} 
                type={legalModal.type} 
                onClose={() => setLegalModal({ isOpen: false, type: null })} 
            />
        </div>
    );
};
