
import React, { useState, useEffect } from 'react';
import { 
    ChevronRight, ArrowLeft, Home, LogIn, User as UserIcon, Shield, Lock, Phone, 
    Eye, EyeOff, AlertCircle, Loader2, Clock, Globe, ShieldCheck, Mail, 
    MapPin, CheckCircle2, Building2, Truck, UserCheck, ShieldAlert 
} from 'lucide-react';
import { UserType, User } from '../types';
import { LegalDocs } from './LegalDocs';
import { UserAPI } from '../services/api';

interface OnboardingProps {
    onComplete: (user: Partial<User>) => void;
    onBackToLanding: () => void;
    appLogo?: string;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    initialShowLogin?: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onBackToLanding, appLogo = './logo.png', onToast, initialShowLogin = false }) => {
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

    // Common State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Login State
    const [loginRole, setLoginRole] = useState<UserType>(UserType.CITIZEN);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register Multi-step State
    const [regStep, setRegStep] = useState(1);
    const [registerPassword, setRegisterPassword] = useState('');
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, address: '', subscription: 'standard'
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        setShowLogin(initialShowLogin);
        if (!initialShowLogin) setRegStep(1);
    }, [initialShowLogin]);

    const updateData = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    // --- LOGIC: LOGIN ---
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginIdentifier || !loginPassword) {
            setError("Veuillez remplir tous les champs");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Note: l'API login pourrait utiliser le loginRole pour filtrer côté serveur si nécessaire
            const user = await UserAPI.login(loginIdentifier, loginPassword);
            if (user) {
                // On force le type si l'utilisateur a sélectionné un rôle spécifique (simulé ici)
                const authenticatedUser = { ...user, type: loginRole };
                if(onToast) onToast(`Mbote ${user.firstName} !`, "success");
                onComplete(authenticatedUser);
            } else {
                setError("Identifiants incorrects ou rôle non autorisé.");
            }
        } catch (err) {
            setError("Une erreur est survenue lors de la connexion.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- LOGIC: REGISTER ---
    const validateStep = () => {
        if (regStep === 1) {
            if (!formData.firstName || !formData.lastName || !formData.phone) {
                setError("Veuillez remplir les informations d'identité.");
                return false;
            }
        } else if (regStep === 2) {
            if (!formData.email || !registerPassword) {
                setError("Email et mot de passe requis.");
                return false;
            }
            if (registerPassword.length < 6) {
                setError("Le mot de passe doit faire au moins 6 caractères.");
                return false;
            }
        } else if (regStep === 3) {
            if (!formData.address) {
                setError("L'adresse est requise pour la collecte des déchets.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setRegStep(prev => prev + 1);
            setError(null);
        }
    };

    const handleRegisterSubmit = async () => {
        if (!validateStep()) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const newUser = await UserAPI.register(formData as User, registerPassword);
            if (onToast) onToast("Compte créé avec succès !", "success");
            onComplete(newUser);
        } catch (err: any) {
            setError(err.message || "Erreur lors de la création du compte.");
        } finally {
            setIsLoading(false);
        }
    };

    const renderLogin = () => {
        const formattedDate = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F7FA] dark:bg-[#050505] p-4 md:p-8 overflow-y-auto no-scrollbar">
                <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2.5rem] shadow-2xl flex flex-col p-8 space-y-6 animate-scale-up border border-white dark:border-gray-800 relative">
                    
                    {/* Header Greeting */}
                    <div className="text-center space-y-1">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#00C853] to-[#2962FF] rounded-2xl flex items-center justify-center p-0.5 shadow-lg">
                                <div className="bg-white dark:bg-black w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden">
                                    <img src={appLogo} alt="Logo" className="w-10 h-10 object-contain" />
                                </div>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Bonjour, bienvenue !</h2>
                        <p className="text-[10px] font-bold text-[#00C853] uppercase tracking-widest bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full inline-block border border-green-100 dark:border-green-800">
                           {formattedDate}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-2">Connectez-vous pour continuer</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 text-center">Choisissez votre profil</p>
                        
                        {/* Role Selector Grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: UserType.ADMIN, label: 'Admin', icon: ShieldAlert, color: 'text-purple-500' },
                                { id: UserType.COLLECTOR, label: 'Collecteur', icon: Truck, color: 'text-orange-500' },
                                { id: UserType.CITIZEN, label: 'Citoyen', icon: UserCheck, color: 'text-green-500' },
                                { id: UserType.BUSINESS, label: 'Entreprise', icon: Building2, color: 'text-blue-500' },
                            ].map((role) => {
                                const Icon = role.icon;
                                const isSelected = loginRole === role.id;
                                return (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setLoginRole(role.id as UserType)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-1 ${
                                            isSelected 
                                            ? 'bg-white dark:bg-gray-700 border-[#00C853] shadow-md scale-[1.02]' 
                                            : 'bg-transparent border-transparent text-gray-400 opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <Icon size={24} className={isSelected ? role.color : 'text-gray-400'} />
                                        <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{role.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {error && (
                            <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center justify-center gap-2 animate-shake">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center border border-gray-100 dark:border-gray-700 focus-within:border-[#00C853] pr-3 group transition-all">
                                <div className="pl-3 text-gray-400 group-focus-within:text-[#00C853]"><UserIcon size={18} /></div>
                                <input 
                                    required 
                                    type="text" 
                                    placeholder="Email ou Nom d'utilisateur" 
                                    value={loginIdentifier} 
                                    onChange={(e) => setLoginIdentifier(e.target.value)} 
                                    className="bg-transparent w-full p-4 text-sm text-gray-800 dark:text-white outline-none" 
                                />
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center border border-gray-100 dark:border-gray-700 focus-within:border-[#00C853] pr-3 group transition-all">
                                <div className="pl-3 text-gray-400 group-focus-within:text-[#00C853]"><Lock size={18} /></div>
                                <input 
                                    required 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Mot de passe" 
                                    value={loginPassword} 
                                    onChange={(e) => setLoginPassword(e.target.value)} 
                                    className="bg-transparent w-full p-4 text-sm text-gray-800 dark:text-white outline-none" 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2">
                                    {showPassword ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full bg-gradient-to-r from-[#00C853] to-[#009624] text-white font-black py-4 rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-xs transform active:scale-95 transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Se Connecter'}
                        </button>
                    </form>

                    <div className="flex flex-col items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between w-full">
                            <button onClick={onBackToLanding} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-xs font-bold transition-colors">
                                <Home size={14} /> Accueil
                            </button>
                            <button onClick={() => setShowLogin(false)} className="text-[#2962FF] hover:text-blue-700 text-xs font-bold transition-colors">
                                Créer un compte
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-8 text-center space-y-1 opacity-50">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Version v1.0.3 • Production DRC</p>
                    <p className="text-[10px] font-medium text-gray-400">Support Développeurs: +243 85 00 62 491</p>
                </div>
            </div>
        );
    };

    if (showLogin) return renderLogin();

    return (
        <div className="h-screen bg-[#F5F7FA] dark:bg-[#050505] flex flex-col md:items-center md:justify-center transition-all duration-500">
            <div className="w-full h-full md:max-w-md md:h-[90vh] md:max-h-[850px] md:shadow-2xl md:rounded-[2.5rem] overflow-hidden relative flex flex-col bg-white dark:bg-[#111827]">
                
                {/* Progress Bar & Back */}
                <div className="p-6 flex items-center shrink-0 bg-white dark:bg-[#111827]">
                    <button onClick={() => regStep > 1 ? setRegStep(s => s - 1) : onBackToLanding()} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="ml-4 flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00C853] transition-all duration-500 shadow-[0_0_10px_rgba(0,200,83,0.4)]" style={{ width: `${(regStep / 3) * 100}%` }}></div>
                    </div>
                    <span className="ml-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{regStep}/3</span>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
                    <div className="animate-fade-in-up">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">
                            {regStep === 1 ? "Commençons" : regStep === 2 ? "Sécurisez" : "Finalisez"}
                            <br/><span className="text-[#00C853]">votre accès.</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {regStep === 1 ? "Entrez vos informations d'identité." : regStep === 2 ? "Configurez vos identifiants de connexion." : "Renseignez votre adresse de collecte."}
                        </p>
                    </div>

                    {error && <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2 animate-shake"><AlertCircle size={14} /> {error}</div>}

                    <div className="space-y-4">
                        {/* STEP 1: IDENTITY */}
                        {regStep === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Prénom</label>
                                        <input placeholder="Ex: Jean" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={formData.firstName} onChange={(e) => updateData('firstName', e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Nom</label>
                                        <input placeholder="Ex: Kabeya" className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={formData.lastName} onChange={(e) => updateData('lastName', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">N° de téléphone</label>
                                    <div className="relative">
                                        <Phone size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input type="tel" placeholder="081 234 5678" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={formData.phone} onChange={(e) => updateData('phone', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: AUTH */}
                        {regStep === 2 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Adresse Email</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input type="email" placeholder="nom@exemple.com" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={formData.email} onChange={(e) => updateData('email', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Mot de passe</label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input type={showPassword ? "text" : "password"} placeholder="6 caractères min." className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={registerPassword} onChange={(e) => { setRegisterPassword(e.target.value); setError(null); }} />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PROFILE & LOCATION */}
                        {regStep === 3 && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-3">
                                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest">Type de ménage / structure</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => updateData('type', UserType.CITIZEN)} className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.type === UserType.CITIZEN ? 'bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-transparent border-blue-100 dark:border-gray-700 text-blue-400 dark:text-gray-500'}`}>Eco-Citoyen</button>
                                        <button onClick={() => updateData('type', UserType.BUSINESS)} className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.type === UserType.BUSINESS ? 'bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' : 'bg-transparent border-blue-100 dark:border-gray-700 text-blue-400 dark:text-gray-500'}`}>Entreprise</button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">Adresse de collecte</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-4 top-4 text-gray-400" />
                                        <input placeholder="N°, Avenue, Quartier, Commune" className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 outline-none focus:ring-2 focus:ring-[#00C853] dark:text-white font-medium transition-all" value={formData.address} onChange={(e) => updateData('address', e.target.value)} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 italic px-1">Cette adresse permet aux collecteurs de vous localiser précisément sur la carte.</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-4">
                            <button 
                                onClick={regStep === 3 ? handleRegisterSubmit : nextStep} 
                                disabled={isLoading} 
                                className="w-full py-5 bg-[#00C853] text-white rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-lg"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : regStep === 3 ? "CRÉER MON COMPTE" : "SUIVANT"}
                                {!isLoading && <ChevronRight />}
                            </button>
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <button onClick={() => setShowLogin(true)} className="text-gray-500 dark:text-gray-400 font-bold text-sm">Déjà membre ? <span className="text-[#2962FF]">Se connecter</span></button>
                    </div>
                    
                    {regStep === 3 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed text-center">
                            En cliquant sur Créer mon compte, vous acceptez nos <button onClick={() => setLegalModalType('terms')} className="text-blue-500 font-bold hover:underline">CGU</button> et notre <button onClick={() => setLegalModalType('privacy')} className="text-blue-500 font-bold hover:underline">Politique de Confidentialité</button>.
                        </div>
                    )}
                </div>
            </div>
            <LegalDocs isOpen={!!legalModalType} type={legalModalType} onClose={() => setLegalModalType(null)} />
        </div>
    );
}
