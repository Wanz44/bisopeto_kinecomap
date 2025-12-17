
import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, Home, Building, Truck, Check, CreditCard, MapPin, LogIn, User as UserIcon, Shield, Lock, Phone, Eye, EyeOff, AlertCircle, Mail, Smartphone, RefreshCw, KeyRound, Globe, Loader2, X } from 'lucide-react';
import { UserType, User } from '../types';
import { LegalDocs } from './LegalDocs';
import { UserAPI } from '../services/api';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface OnboardingProps {
    onComplete: (user: Partial<User>) => void;
    appLogo?: string;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, appLogo = './logo.png', onToast }) => {
    const [step, setStep] = useState(1);
    const [showLogin, setShowLogin] = useState(false);
    const [showForgotPass, setShowForgotPass] = useState(false);
    
    // Legal Docs State
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

    // Login State
    const [loginRole, setLoginRole] = useState<UserType.CITIZEN | UserType.COLLECTOR | UserType.ADMIN>(UserType.CITIZEN);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Register State
    const [regStep, setRegStep] = useState(1);
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0); 

    const [formData, setFormData] = useState<Partial<User>>({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        type: UserType.CITIZEN,
        address: '',
        subscription: 'plus',
        companyName: '',
        companyPhone: '',
        sector: '',
        vehicleType: '',
        housingType: 'Maison'
    });

    // --- Helpers (omitted for brevity, same logic) ---
    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    const updateData = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));
    const calculatePasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[A-Z]/.test(pass)) strength++;
        if (/[0-9]/.test(pass)) strength++;
        if (/[^A-Za-z0-9]/.test(pass)) strength++;
        setPasswordStrength(strength);
    };
    const handlePasswordInput = (val: string) => {
        setRegisterPassword(val);
        calculatePasswordStrength(val);
    };
    
    // --- OTP Logic ---
    const startOtpTimer = () => {
        setOtpTimer(60);
        const interval = setInterval(() => {
            setOtpTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async () => {
        if (!formData.firstName || !formData.lastName || !formData.phone) {
            if(onToast) onToast("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }
        setIsVerifyingOTP(true);
        setTimeout(() => {
            setIsVerifyingOTP(false);
            setRegStep(2);
            startOtpTimer();
            if(onToast) onToast(`Code envoyé au ${formData.phone}`, "info");
        }, 1500);
    };

    const handleVerifyOTP = async () => {
        const code = otpCode.join('');
        if (code.length !== 6) {
            if(onToast) onToast("Code incomplet", "error");
            return;
        }
        setIsVerifyingOTP(true);
        const isValid = await UserAPI.verifyOTP(code);
        setIsVerifyingOTP(false);
        if (isValid) {
            if(onToast) onToast("Numéro vérifié avec succès", "success");
            setRegStep(3);
        } else {
            if(onToast) onToast("Code incorrect (Essayez 123456)", "error");
            setOtpCode(['', '', '', '', '', '']);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    // --- Login Logic ---
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
                if(onToast) onToast("Échec de connexion", "error");
            }
        } catch (err) {
            console.error(err);
            setLoginError("Une erreur de connexion est survenue.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // --- Forgot Password ---
    const handleForgotPassSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            await UserAPI.resetPassword(loginIdentifier);
            setShowForgotPass(false);
            if(onToast) onToast("Un lien de réinitialisation a été envoyé.", "success");
        } catch (e) {
            if(onToast) onToast("Erreur lors de la demande.", "error");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // --- Register Submit ---
    const handleRegisterSubmit = async () => {
        try {
            const newUser: User = {
                id: '',
                firstName: formData.firstName || '',
                lastName: formData.lastName || '',
                email: formData.email,
                phone: formData.phone || '',
                type: formData.type || UserType.CITIZEN,
                address: formData.address || '',
                points: 100,
                collections: 0,
                badges: 0,
                subscription: formData.subscription || 'standard',
                companyName: formData.companyName,
                sector: formData.sector,
                housingType: formData.housingType
            };
            await UserAPI.register(newUser, registerPassword);
            if(onToast) onToast("Compte créé avec succès !", "success");
            onComplete(newUser);
        } catch (error) {
            console.error("Registration failed", error);
            if(onToast) onToast("Erreur lors de la création du compte.", "error");
        }
    };

    // --- RENDER FUNCTIONS ---

    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-[#00C853] rounded-full blur-[150px] opacity-20 animate-pulse-slow"></div>
            
            <div className="relative z-10 w-full max-w-md mx-auto">
                <div className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-10 shadow-2xl border border-white/20 mx-auto animate-float">
                     <img src={appLogo} alt="KIN ECO-MAP Logo" className="w-full h-full object-contain p-4" />
                </div>
                
                <h1 className="text-5xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400">KIN ECO-MAP</h1>
                <p className="text-lg text-gray-300 mb-12 font-light max-w-xs mx-auto leading-relaxed">
                    Le futur de la propreté urbaine.<br/>
                    <span className="text-[#00C853] font-bold">Intelligent. Connecté. Vert.</span>
                </p>
                
                <div className="w-full space-y-4">
                    <button onClick={() => { setStep(2); setRegStep(1); }} className="w-full bg-[#00C853] hover:bg-[#00E676] text-black font-black py-4 rounded-2xl shadow-[0_0_20px_rgba(0,200,83,0.4)] transition-all flex items-center justify-center gap-2 transform active:scale-95 text-lg tracking-wide">
                        COMMENCER
                        <ChevronRight size={24} />
                    </button>
                    
                    <button onClick={() => setShowLogin(true)} className="w-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 tracking-wide">
                        SE CONNECTER
                        <LogIn size={20} />
                    </button>
                </div>
                
                {!isSupabaseConfigured() && (
                    <div className="mt-8 text-[10px] text-white/30 bg-white/5 px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/5 inline-block">
                        Mode Démo (Local Storage)
                    </div>
                )}
            </div>
        </div>
    );

    const renderLogin = () => (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] animate-fade-in relative">
            <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-[#00C853]/10 to-transparent pointer-events-none"></div>
            
            {/* Header Login */}
            <div className="p-8 pb-4 relative z-10">
                <button onClick={() => setShowLogin(false)} className="p-3 -ml-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors mb-6 text-gray-600 dark:text-gray-300">
                    <ArrowLeft size={28} />
                </button>
                
                <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Bon retour.</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Connectez-vous pour continuer.</p>
            </div>

            {/* Role Tabs - Futuristic Pills */}
            <div className="px-8 py-4">
                <div className="bg-gray-200/50 dark:bg-white/5 p-1.5 rounded-2xl flex backdrop-blur-sm">
                    {[
                        { id: UserType.CITIZEN, label: 'Utilisateur' },
                        { id: UserType.COLLECTOR, label: 'Collecteur' },
                        { id: UserType.ADMIN, label: 'Admin' }
                    ].map(role => (
                        <button 
                            key={role.id}
                            onClick={() => setLoginRole(role.id as any)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${loginRole === role.id ? 'bg-white dark:bg-[#2962FF] shadow-lg text-black dark:text-white transform scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                        >
                            {role.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Form */}
            <div className="px-8 flex-1 space-y-6 overflow-y-auto">
                {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                        <AlertCircle size={20} /> {loginError}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
                            {loginRole === UserType.ADMIN ? 'Identifiant Admin' : 'Email ou Téléphone'}
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#00C853] transition-colors">
                                {loginRole === UserType.ADMIN ? <Shield size={20} /> : <UserIcon size={20} />}
                            </div>
                            <input 
                                type="text"
                                value={loginIdentifier}
                                onChange={(e) => setLoginIdentifier(e.target.value)}
                                placeholder={loginRole === UserType.ADMIN ? "admin@kinecomap.cd" : "Ex: +243 81..."}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-[#00C853] outline-none transition-all font-medium placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Mot de passe</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-[#00C853] transition-colors">
                                <Lock size={20} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-transparent bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-[#00C853] outline-none transition-all font-medium placeholder-gray-400 dark:placeholder-gray-600 shadow-sm"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={() => setShowForgotPass(true)} className="text-xs text-[#00C853] font-bold hover:underline py-1">Mot de passe oublié ?</button>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleLoginSubmit}
                    disabled={isLoggingIn || !loginIdentifier || !loginPassword}
                    className="w-full bg-[#00C853] hover:bg-[#00E676] disabled:bg-gray-300 dark:disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-[0_4px_14px_0_rgba(0,200,83,0.39)] transition-all flex items-center justify-center gap-3 transform active:scale-95 text-lg"
                >
                    {isLoggingIn ? <Loader2 className="animate-spin" /> : <>SE CONNECTER <ChevronRight size={24} /></>}
                </button>

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#F5F7FA] dark:bg-[#050505] px-2 text-gray-400 font-bold">Ou continuer avec</span></div>
                </div>

                <button className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold py-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-3 shadow-sm">
                    <Globe size={20} className="text-blue-500" /> Compte Google
                </button>
            </div>
        </div>
    );

    const renderForgotPassModal = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForgotPass(false)}></div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 relative z-10 shadow-xl animate-fade-in-up">
                <button onClick={() => setShowForgotPass(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Mot de passe oublié</h3>
                <p className="text-sm text-gray-500 mb-6">Entrez votre identifiant pour recevoir un lien de réinitialisation.</p>
                <form onSubmit={handleForgotPassSubmit} className="space-y-4">
                    <input 
                        type="text" 
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Email ou Téléphone"
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#00C853]"
                        required
                    />
                    <button type="submit" disabled={isLoggingIn} className="w-full py-3 bg-[#00C853] text-white rounded-xl font-bold">
                        {isLoggingIn ? <Loader2 className="animate-spin mx-auto" /> : 'Envoyer'}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderRegisterStep1 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Créer un compte</h2>
                <p className="text-gray-500 dark:text-gray-400">Commençons par les bases.</p>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Prénom" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.firstName} onChange={(e) => updateData('firstName', e.target.value)} />
                    <input type="text" placeholder="Nom" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.lastName} onChange={(e) => updateData('lastName', e.target.value)} />
                </div>
                <input type="tel" placeholder="Téléphone (+243...)" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.phone} onChange={(e) => updateData('phone', e.target.value)} />
                <input type="email" placeholder="Email (Optionnel)" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.email} onChange={(e) => updateData('email', e.target.value)} />
            </div>
            <button onClick={handleSendOTP} disabled={isVerifyingOTP} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                {isVerifyingOTP ? <Loader2 className="animate-spin" /> : <>Suivant <ChevronRight /></>}
            </button>
        </div>
    );

    const renderRegisterStep2_OTP = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Vérification</h2>
                <p className="text-gray-500 dark:text-gray-400">Code envoyé au {formData.phone}</p>
            </div>
            <div className="flex justify-between gap-2">
                {otpCode.map((digit, idx) => (
                    <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength={1}
                        className="w-12 h-14 rounded-xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] text-center text-xl font-bold text-gray-800 dark:text-white outline-none"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                    />
                ))}
            </div>
            <div className="text-center text-sm text-gray-500">
                {otpTimer > 0 ? `Renvoyer dans ${otpTimer}s` : <button onClick={handleSendOTP} className="text-[#00C853] font-bold">Renvoyer le code</button>}
            </div>
            <button onClick={handleVerifyOTP} disabled={isVerifyingOTP} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                {isVerifyingOTP ? <Loader2 className="animate-spin" /> : 'Vérifier'}
            </button>
        </div>
    );

    const renderRegisterStep3_Password = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Sécurité</h2>
                <p className="text-gray-500 dark:text-gray-400">Choisissez un mot de passe fort.</p>
            </div>
            <div className="space-y-4">
                <input type="password" placeholder="Mot de passe" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={registerPassword} onChange={(e) => handlePasswordInput(e.target.value)} />
                
                {/* Password Strength Indicator */}
                <div className="flex gap-1 h-1.5 mt-2">
                    <div className={`flex-1 rounded-full ${passwordStrength >= 1 ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 2 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 3 ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    <div className={`flex-1 rounded-full ${passwordStrength >= 4 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                </div>

                <input type="password" placeholder="Confirmer mot de passe" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button onClick={() => setRegStep(4)} disabled={!registerPassword || registerPassword !== confirmPassword} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Suivant <ChevronRight />
            </button>
        </div>
    );

    const renderRegisterStep4_Role = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Vous êtes ?</h2>
                <p className="text-gray-500 dark:text-gray-400">Sélectionnez votre type de profil.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {[
                    { id: UserType.CITIZEN, label: 'Citoyen / Ménage', icon: Home, desc: 'Gestion des déchets domestiques' },
                    { id: UserType.BUSINESS, label: 'Entreprise', icon: Building, desc: 'Solutions pour professionnels' },
                    { id: UserType.COLLECTOR, label: 'Collecteur', icon: Truck, desc: 'Je travaille dans la collecte' },
                ].map(type => (
                    <button 
                        key={type.id}
                        onClick={() => updateData('type', type.id)}
                        className={`p-6 rounded-3xl border-2 text-left transition-all ${formData.type === type.id ? 'border-[#00C853] bg-green-50 dark:bg-green-900/10' : 'border-transparent bg-white dark:bg-white/5 hover:border-gray-200 dark:hover:border-gray-700'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${formData.type === type.id ? 'bg-[#00C853] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                <type.icon size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{type.label}</h3>
                                <p className="text-sm text-gray-500">{type.desc}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
            <button onClick={() => setRegStep(5)} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2">
                Suivant <ChevronRight />
            </button>
        </div>
    );

    const renderRegisterStep5_Address = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Localisation</h2>
                <p className="text-gray-500 dark:text-gray-400">Où devons-nous collecter ?</p>
            </div>
            <div className="space-y-4">
                <input type="text" placeholder="Adresse complète" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.address} onChange={(e) => updateData('address', e.target.value)} />
                
                {/* Additional fields based on role */}
                {formData.type === UserType.BUSINESS && (
                    <>
                        <input type="text" placeholder="Nom de l'entreprise" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.companyName} onChange={(e) => updateData('companyName', e.target.value)} />
                        <input type="text" placeholder="Secteur d'activité" className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium" value={formData.sector} onChange={(e) => updateData('sector', e.target.value)} />
                    </>
                )}

                {formData.type === UserType.CITIZEN && (
                    <select 
                        className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border-2 border-transparent focus:border-[#00C853] outline-none text-gray-800 dark:text-white font-medium"
                        value={formData.housingType}
                        onChange={(e) => updateData('housingType', e.target.value)}
                    >
                        <option value="Maison">Maison individuelle</option>
                        <option value="Appartement">Appartement</option>
                        <option value="Compound">Parcelle (Compound)</option>
                    </select>
                )}
            </div>
            <button onClick={() => setRegStep(6)} disabled={!formData.address} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Suivant <ChevronRight />
            </button>
        </div>
    );

    const renderRegisterStep6_Plan = () => {
        // Plans simulation
        const plans = [
            { id: 'standard', name: 'Standard', price: '10$', features: ['2x / semaine', 'Déchets ménagers'] },
            { id: 'plus', name: 'Plus', price: '15$', features: ['3x / semaine', 'Tri sélectif'], popular: true },
            { id: 'premium', name: 'Premium', price: '20$', features: ['Quotidien', 'Tout inclus'] },
        ];

        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 dark:text-white mb-2">Abonnement</h2>
                    <p className="text-gray-500 dark:text-gray-400">Choisissez votre formule.</p>
                </div>
                <div className="space-y-3">
                    {plans.map(plan => (
                        <div 
                            key={plan.id}
                            onClick={() => updateData('subscription', plan.id)}
                            className={`p-5 rounded-3xl border-2 cursor-pointer transition-all relative ${formData.subscription === plan.id ? 'border-[#00C853] bg-green-50 dark:bg-green-900/10' : 'border-transparent bg-white dark:bg-white/5 hover:border-gray-200'}`}
                        >
                            {plan.popular && <span className="absolute top-0 right-0 bg-[#00C853] text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">Populaire</span>}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white">{plan.name}</h3>
                                    <p className="text-xs text-gray-500">{plan.features.join(' • ')}</p>
                                </div>
                                <div className="text-xl font-black text-[#2962FF]">{plan.price}</div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-3 py-2">
                    <div 
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-colors ${acceptedTerms ? 'bg-[#00C853] border-[#00C853] text-white' : 'border-gray-300'}`}
                    >
                        {acceptedTerms && <Check size={14} />}
                    </div>
                    <span className="text-xs text-gray-500">
                        J'accepte les <button onClick={() => setLegalModalType('terms')} className="text-[#2962FF] font-bold hover:underline">conditions d'utilisation</button> et la <button onClick={() => setLegalModalType('privacy')} className="text-[#2962FF] font-bold hover:underline">politique de confidentialité</button>.
                    </span>
                </div>

                <button onClick={handleRegisterSubmit} disabled={!acceptedTerms} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed">
                    {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Créer mon compte'}
                </button>
            </div>
        );
    };

    if (showLogin) {
        return (
             <div className="h-screen bg-white dark:bg-[#050505] flex flex-col md:items-center md:justify-center transition-colors duration-500">
                <div className="w-full h-full md:max-w-md md:h-[90vh] md:max-h-[850px] md:shadow-2xl md:rounded-[2.5rem] overflow-hidden relative flex flex-col bg-[#F5F7FA] dark:bg-[#050505] border border-transparent md:dark:border-white/10">
                    {renderLogin()}
                </div>
                {showForgotPass && renderForgotPassModal()}
             </div>
        );
    }

    return (
        <div className="h-screen bg-white dark:bg-[#050505] flex flex-col md:items-center md:justify-center transition-colors duration-500">
            <div className="w-full h-full md:max-w-md md:h-[90vh] md:max-h-[850px] md:shadow-2xl md:rounded-[2.5rem] overflow-hidden relative flex flex-col bg-[#F5F7FA] dark:bg-[#050505] border border-transparent md:dark:border-white/10">
                {step > 1 && (
                    <div className="p-6 flex items-center shrink-0">
                        <button onClick={() => {
                            if (regStep > 1) setRegStep(prev => prev - 1);
                            else handleBack();
                        }} className="p-3 bg-white dark:bg-white/5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div className="ml-4 flex-1 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00C853] transition-all duration-500 ease-out shadow-[0_0_10px_#00C853]" style={{ width: `${((regStep) / 6) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    {step === 1 && renderWelcome()}
                    {step === 2 && (
                        <div className="animate-fade-in">
                            {/* Reusing existing logic but wrapped in a container for consistent spacing if needed */}
                            {regStep === 1 && renderRegisterStep1()}
                            {regStep === 2 && renderRegisterStep2_OTP()}
                            {regStep === 3 && renderRegisterStep3_Password()}
                            {regStep === 4 && renderRegisterStep4_Role()}
                            {regStep === 5 && renderRegisterStep5_Address()}
                            {regStep === 6 && renderRegisterStep6_Plan()}
                        </div>
                    )}
                </div>
            </div>

            <LegalDocs 
                isOpen={!!legalModalType} 
                type={legalModalType} 
                onClose={() => setLegalModalType(null)} 
            />
        </div>
    );
}
