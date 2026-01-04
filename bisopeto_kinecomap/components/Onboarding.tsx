
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ArrowLeft, LogIn, User as UserIcon, Lock, 
    Eye, EyeOff, AlertCircle, Loader2, Mail, 
    CheckCircle2, Truck, Briefcase, Sparkles, MapPin, GraduationCap, ArrowRight, Send
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

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLanding, appLogo = './logobisopeto.png', onToast, initialShowLogin = false, onNotifyAdmin }) => {
    const [mode, setMode] = useState<'slides' | 'auth'>(initialShowLogin ? 'auth' : 'slides');
    const [activeSlide, setActiveSlide] = useState(0);
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const [registrationFinished, setRegistrationFinished] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regStep, setRegStep] = useState(1);
    const [registerPassword, setRegisterPassword] = useState('');
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, status: 'pending', address: '', neighborhood: '', subscription: 'standard', commune: 'Gombe'
    });

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' | null }>({ isOpen: false, type: null });

    const handleNextSlide = () => {
        if (activeSlide < ONBOARDING_SLIDES.length - 1) {
            setActiveSlide(activeSlide + 1);
        } else {
            setMode('auth');
        }
    };

    const handleLoginSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
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
                onComplete({ ...user });
            } else {
                setError("Identifiants incorrects ou compte inexistant.");
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
        if (!formData.neighborhood || formData.neighborhood.trim() === '') { setError("Veuillez renseigner votre quartier."); return; }
        if (!formData.address) { setError("L'adresse précise est requise."); return; }
        if (!agreedToTerms) { setError("Vous devez accepter les conditions."); return; }
        
        setIsLoading(true);
        try {
            const registeredUser = await UserAPI.register({ 
                ...formData, 
                status: 'pending'
            } as User, registerPassword);
            
            if (onNotifyAdmin) {
                onNotifyAdmin(
                    "Nouvelle Inscription 👤", 
                    `${formData.firstName} ${formData.lastName} (${formData.type}) en attente. Zone: ${formData.commune}.`
                );
            }
            
            setRegistrationFinished(true);
            if (onToast) onToast(`Demande envoyée`, "success");
        } catch (err: any) {
            setError(err.message || "Erreur lors de l'inscription.");
        } finally {
            setIsLoading(false);
        }
    };

    if (mode === 'slides') {
        const slide = ONBOARDING_SLIDES[activeSlide];
        return (
            <div className={`min-h-screen ${slide.bg} dark:bg-gray-950 flex flex-col items-center justify-center p-8 transition-colors duration-700`}>
                <div className="w-full max-w-lg text-center animate-fade-in">
                    <div className={`w-24 h-24 md:w-28 md:h-28 ${slide.bg.replace('50', '100')} dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-xl shadow-black/5`}>
                        <slide.icon className={`w-12 h-12 md:w-16 md:h-16 ${slide.color}`} />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight uppercase">{slide.title}</h2>
                    <p className="text-base md:text-xl text-gray-500 dark:text-gray-400 font-medium mb-12 leading-relaxed px-2">{slide.desc}</p>
                    <div className="flex justify-center gap-2 mb-12">
                        {ONBOARDING_SLIDES.map((_, i) => (
                            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-primary' : 'w-2 bg-gray-300'}`}></div>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={handleNextSlide} className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-2xl flex items-center justify-center gap-3">
                            {activeSlide === ONBOARDING_SLIDES.length - 1 ? "C'est parti !" : "Suivant"}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (registrationFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA] dark:bg-[#050505] p-6 text-center">
                <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-[3.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-primary-light">
                        <CheckCircle2 className="w-12 h-12 animate-bounce" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 uppercase">Demande Reçue !</h2>
                    <p className="text-base text-gray-500 dark:text-gray-400 font-medium mb-12">Mbote {formData.firstName}! Préparez-vous à impacter votre quartier dès validation.</p>
                    <button onClick={() => onComplete(formData as User)} className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                        Accéder à l'espace d'attente <ChevronRight className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-xl bg-white dark:bg-[#111827] rounded-[3rem] shadow-2xl p-8 md:p-12 space-y-8 animate-scale-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar">
                <div className="text-center shrink-0">
                    <div className="flex justify-center mb-6">
                        <img src={appLogo} alt="Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter leading-none mb-2 uppercase">
                        {showLogin ? 'Connexion' : 'Nous Rejoindre'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em]">
                        {showLogin ? 'Gérez votre compte eco' : `Étape ${regStep} sur 3`}
                    </p>
                </div>

                {error && (
                    <div className="shrink-0 bg-red-50 dark:bg-red-900/20 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                        <AlertCircle className="w-5 h-5" /> {error}
                    </div>
                )}

                <div className="flex-1 space-y-8">
                    {showLogin ? (
                        <div className="space-y-8">
                            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Mail className="w-5 h-5" /></div>
                                        <input required type="text" placeholder="Email ou Téléphone" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl flex items-center border-2 border-transparent focus-within:border-primary transition-all pr-3 shadow-sm">
                                        <div className="pl-4 text-gray-400"><Lock className="w-5 h-5" /></div>
                                        <input required type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-transparent w-full p-4 text-sm text-gray-900 dark:text-white font-bold outline-none" />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 p-2">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                                <button type="submit" className="hidden" />
                            </form>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {regStep === 1 && (
                                <div className="space-y-5 animate-fade-in">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="Prénom" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
                                        <input placeholder="Nom" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
                                    </div>
                                    <input type="tel" placeholder="Téléphone" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            )}

                            {regStep === 2 && (
                                <div className="space-y-5 animate-fade-in">
                                    <input type="email" placeholder="Email" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    <input type="password" placeholder="Mot de passe" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} />
                                </div>
                            )}

                            {regStep === 3 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex gap-4">
                                        <button onClick={() => setFormData({...formData, type: UserType.CITIZEN})} className={`flex-1 p-5 rounded-3xl border-2 font-black text-xs transition-all uppercase flex flex-col items-center gap-2 ${formData.type === UserType.CITIZEN ? 'border-primary-light bg-green-50 text-primary-light shadow-md' : 'border-gray-100 bg-gray-50 text-gray-400 grayscale'}`}>
                                            <UserIcon size={24} /> Particulier
                                        </button>
                                        <button onClick={() => setFormData({...formData, type: UserType.BUSINESS})} className={`flex-1 p-5 rounded-3xl border-2 font-black text-xs transition-all uppercase flex flex-col items-center gap-2 ${formData.type === UserType.BUSINESS ? 'border-secondary bg-blue-50 text-secondary shadow-md' : 'border-gray-100 bg-gray-50 text-gray-400 grayscale'}`}>
                                            <Briefcase size={24} /> Entreprise
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-sm uppercase appearance-none" value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})}>
                                            {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                        <input placeholder="Quartier" className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-sm uppercase" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                                    </div>
                                    <textarea rows={2} placeholder="Adresse précise..." className="w-full p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-light text-sm font-bold dark:text-white outline-none resize-none" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" className="w-5 h-5 accent-primary" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} />
                                        <span className="text-xs text-gray-500 font-bold">J'accepte les conditions d'utilisation.</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="shrink-0 space-y-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex gap-4">
                        {regStep > 1 && !showLogin && (
                            <button onClick={() => setRegStep(prev => prev - 1)} className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <button 
                            onClick={showLogin ? handleLoginSubmit : (regStep === 3 ? handleRegisterSubmit : nextStep)} 
                            disabled={isLoading} 
                            className="flex-1 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm bg-primary shadow-lg flex items-center justify-center gap-3"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (showLogin ? 'Se connecter' : (regStep === 3 ? 'S\'inscrire' : 'Suivant'))}
                            {!isLoading && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex flex-col items-center gap-5">
                        <button onClick={() => { setShowLogin(!showLogin); setError(null); }} className="text-sm font-black text-secondary hover:underline">
                            {showLogin ? "Nouveau ? Créer un compte" : "Déjà membre ? Se connecter"}
                        </button>
                        <button onClick={onBackToLanding} className="text-xs font-black text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                            <ArrowLeft className="w-4 h-4" /> Accueil
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
