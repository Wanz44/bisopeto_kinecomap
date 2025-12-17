
import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Home, LogIn, User as UserIcon, Shield, Lock, Phone, Eye, EyeOff, AlertCircle, Loader2, Clock, Globe, ShieldCheck } from 'lucide-react';
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
    // Si initialShowLogin est vrai, on affiche la connexion, sinon l'inscription.
    const [showLogin, setShowLogin] = useState(initialShowLogin);
    const [showForgotPass, setShowForgotPass] = useState(false);
    
    // Legal Docs State
    const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

    // Login State
    const [loginRole, setLoginRole] = useState<UserType>(UserType.CITIZEN);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Register State
    const [regStep, setRegStep] = useState(1);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    
    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '', lastName: '', phone: '', email: '',
        type: UserType.CITIZEN, address: '', subscription: 'plus'
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Met à jour l'affichage si la prop change (ex: navigation répétée)
    useEffect(() => {
        setShowLogin(initialShowLogin);
        if (!initialShowLogin) setRegStep(1);
    }, [initialShowLogin]);

    const updateData = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleSendOTP = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            if(onToast) onToast("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        setIsVerifyingOTP(true);
        setTimeout(() => {
            setIsVerifyingOTP(false);
            if(onToast) onToast(`Inscription réussie (Simulation)`, "success");
            onComplete(formData);
        }, 1500);
    };

    const handleLoginSubmit = async () => {
        if (!loginIdentifier || !loginPassword) {
            setLoginError("Veuillez remplir tous les champs");
            return;
        }
        setIsLoggingIn(true);
        setLoginError(null);
        try {
            const user = await UserAPI.login(loginIdentifier, loginPassword);
            if (user) {
                if(onToast) onToast(`Bon retour, ${user.firstName} !`, "success");
                onComplete(user);
            } else {
                setLoginError("Identifiants incorrects ou utilisateur introuvable.");
            }
        } catch (err) {
            setLoginError("Une erreur est survenue.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const renderLogin = () => {
        const formattedDate = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const displayTime = currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const roleConfig = [
            { id: UserType.ADMIN, label: 'Admin' }, 
            { id: UserType.COLLECTOR, label: 'Collecteur' }, 
            { id: UserType.CITIZEN, label: 'Citoyen' }, 
            { id: UserType.BUSINESS, label: 'Entreprise' }
        ];

        return (
            <div className="flex items-center justify-center min-h-screen bg-[#F5F7FA] relative overflow-hidden p-4">
                <div className="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl flex flex-col p-8 space-y-6">
                    <div className="text-center">
                        <span className="text-[#00C853] font-black italic tracking-widest text-[10px] bg-green-50 px-3 py-1 rounded-full border border-green-100 uppercase">Connexion</span>
                        <h2 className="text-3xl font-black text-gray-800 mt-2 mb-4 tracking-tighter uppercase">KIN ECO-MAP</h2>
                        <div className="flex justify-center gap-3">
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-600 flex items-center gap-1 border font-bold"><ShieldCheck size={12} className="text-[#00C853]" /> Sécurisé</span>
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-600 flex items-center gap-1 border font-bold"><Globe size={12} className="text-[#2962FF]" /> Écologie</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between border border-gray-200">
                        <div className="flex items-center gap-3 text-gray-600"><Clock size={18} className="text-gray-400" /><span className="font-bold text-sm">{formattedDate}</span></div>
                        <div className="bg-[#00C853] px-2 py-1 rounded-md text-xs text-white font-bold">{displayTime}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {roleConfig.map((role) => (
                            <button key={role.id} onClick={() => setLoginRole(role.id as any)} className={`py-2.5 px-1 rounded-xl text-[10px] font-bold uppercase transition-all border ${loginRole === role.id ? 'bg-white text-[#00C853] border-[#00C853] shadow-md ring-2 ring-[#00C853]/20' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}>{role.label}</button>
                        ))}
                    </div>
                    <div className="space-y-4">
                        {loginError && <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-xl border border-red-100 flex items-center justify-center gap-2"><AlertCircle size={14} /> {loginError}</div>}
                        <div className="bg-gray-50 rounded-xl flex items-center border border-gray-200 focus-within:border-[#00C853] pr-3 group">
                            <div className="pl-3 text-gray-400 group-focus-within:text-[#00C853]"><UserIcon size={18} /></div>
                            <input type="text" placeholder="Email ou Téléphone" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} className="bg-transparent w-full p-3.5 text-sm text-gray-800 outline-none" />
                        </div>
                        <div className="bg-gray-50 rounded-xl flex items-center border border-gray-200 focus-within:border-[#00C853] pr-3 group">
                            <div className="pl-3 text-gray-400 group-focus-within:text-[#00C853]"><Lock size={18} /></div>
                            <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-transparent w-full p-3.5 text-sm text-gray-800 outline-none" />
                            <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                    </div>
                    <button onClick={handleLoginSubmit} disabled={isLoggingIn} className="w-full bg-gradient-to-r from-[#00C853] to-[#009624] text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide text-sm">{isLoggingIn ? <Loader2 className="animate-spin" /> : 'Se Connecter'}</button>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        {/* LIEN ACCUEIL MODIFIÉ POUR ONBACKTOLANDING */}
                        <button onClick={onBackToLanding} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-xs font-medium"><Home size={14} /> Accueil</button>
                        <button onClick={() => setShowForgotPass(true)} className="text-[#2962FF] hover:text-blue-700 text-xs font-bold transition-colors">Mot de passe oublié ?</button>
                    </div>
                </div>
            </div>
        );
    };

    if (showLogin) return renderLogin();

    return (
        <div className="h-screen bg-white flex flex-col md:items-center md:justify-center transition-colors duration-500">
            <div className="w-full h-full md:max-w-md md:h-[90vh] md:max-h-[850px] md:shadow-2xl md:rounded-[2.5rem] overflow-hidden relative flex flex-col bg-[#F5F7FA]">
                <div className="p-6 flex items-center shrink-0">
                    <button onClick={onBackToLanding} className="p-3 bg-white rounded-full shadow-sm"><ArrowLeft size={20} className="text-gray-600" /></button>
                    <div className="ml-4 flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00C853] transition-all duration-500 shadow-[0_0_10px_#00C853]" style={{ width: `50%` }}></div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Rejoindre<br/><span className="text-[#00C853]">KIN ECO-MAP</span></h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Créez votre compte pour commencer à gérer vos déchets intelligemment à Kinshasa.</p>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Prénom" className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-[#00C853] font-medium" value={formData.firstName} onChange={(e) => updateData('firstName', e.target.value)} />
                            <input placeholder="Nom" className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-[#00C853] font-medium" value={formData.lastName} onChange={(e) => updateData('lastName', e.target.value)} />
                        </div>
                        <input type="tel" placeholder="N° de téléphone" className="w-full p-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:ring-2 focus:ring-[#00C853] font-medium" value={formData.phone} onChange={(e) => updateData('phone', e.target.value)} />
                        
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-widest">Type de compte</p>
                            <select 
                                className="w-full bg-transparent outline-none font-bold text-gray-800"
                                value={formData.type}
                                onChange={(e) => updateData('type', e.target.value)}
                            >
                                <option value={UserType.CITIZEN}>Eco-Citoyen (Ménage)</option>
                                <option value={UserType.BUSINESS}>Eco-Entreprise (Commerce)</option>
                                <option value={UserType.COLLECTOR}>Collecteur (Opérateur)</option>
                            </select>
                        </div>

                        <button onClick={handleSendOTP} disabled={isVerifyingOTP} className="w-full py-5 bg-[#00C853] text-white rounded-2xl font-black shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-lg">
                            {isVerifyingOTP ? <Loader2 className="animate-spin" /> : <>S'INSCRIRE <ChevronRight /></>}
                        </button>
                    </div>

                    <div className="text-center pt-4">
                        <button onClick={() => setShowLogin(true)} className="text-gray-500 font-bold text-sm">Déjà un compte ? <span className="text-[#2962FF]">Se connecter</span></button>
                    </div>
                </div>
            </div>
            <LegalDocs isOpen={!!legalModalType} type={legalModalType} onClose={() => setLegalModalType(null)} />
        </div>
    );
}
