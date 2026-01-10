
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, CreditCard, ShieldCheck, Smartphone, X, Loader2, Scale, Calendar, Clock, AlertTriangle, Zap, Download, History, ChevronRight, Star, Wifi, Gem, Building2, Briefcase } from 'lucide-react';
import { User, SubscriptionPlan, UserType, Payment } from '../types';
import { PaymentsAPI, CashBookAPI } from '../services/api';

interface SubscriptionProps {
    user: User;
    onBack: () => void;
    onUpdatePlan: (planId: 'standard' | 'plus' | 'premium' | 'special') => void;
    plans: SubscriptionPlan[];
    exchangeRate: number;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type PaymentMethod = 'mobile_money' | 'card' | 'google_pay';
type MobileProvider = 'mpesa' | 'orange' | 'airtel' | 'africell';

export const Subscription: React.FC<SubscriptionProps> = ({ user, onBack, onUpdatePlan, plans, exchangeRate, onToast }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<'standard' | 'plus' | 'premium' | 'special' | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
    const [mobileProvider, setMobileProvider] = useState<MobileProvider>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentStep, setPaymentStep] = useState<'form' | 'ussd_push' | 'success'>('form');

    const getSelectedPlanDetails = () => plans.find(p => p.id === selectedPlanId);

    const formatPrice = (priceUSD: number) => {
        return `${(priceUSD * exchangeRate).toLocaleString()} FC`;
    };

    const handleSelectPlan = (planId: string) => {
        if (planId === user.subscription) return;
        setSelectedPlanId(planId as any);
        setShowPaymentModal(true);
        setPaymentStep('form');
    };

    const handleInitiatePayment = async () => {
        if (paymentMethod === 'mobile_money') {
            if (phoneNumber.length < 9) {
                if (onToast) onToast("Numéro de téléphone invalide", "error");
                return;
            }
            
            const planDetails = getSelectedPlanDetails();
            if (!planDetails) return;

            setPaymentStep('ussd_push');
            
            // Simulation du délai réseau USSD
            setTimeout(async () => {
                try {
                    const paymentId = `SUB-${Date.now().toString().slice(-6)}`;
                    const amountFC = planDetails.priceUSD * exchangeRate;
                    
                    // 1. ENREGISTRER LE PAIEMENT DANS LA TABLE PAYMENTS
                    const payment: Payment = {
                        id: paymentId,
                        userId: user.id!,
                        userName: `${user.firstName} ${user.lastName}`,
                        amountFC: amountFC,
                        currency: 'FC',
                        method: 'mobile_money',
                        period: `Abonnement ${planDetails.name} - ${new Date().toLocaleDateString('fr-FR', {month: 'long'})}`,
                        collectorId: 'SYSTEM',
                        collectorName: 'Passerelle Mobile Money',
                        createdAt: new Date().toISOString(),
                        qrCodeData: `SUBSCRIPTION:${paymentId}:${user.id}:${planDetails.id}`,
                        status: 'released'
                    };
                    await PaymentsAPI.record(payment);

                    // 2. CRÉER UNE ÉCRITURE DANS LE LIVRE DE CAISSE (ADMIN)
                    await CashBookAPI.add({
                        ref: paymentId,
                        label: `Abonnement ${planDetails.name} - ${user.firstName}`,
                        type: 'in',
                        category: 'Abonnement',
                        amount: amountFC,
                        userId: user.id,
                        userName: user.firstName
                    });

                    setPaymentStep('success');
                    if (onToast) onToast("Abonnement activé !", "success");
                    
                    setTimeout(() => {
                        if (selectedPlanId) onUpdatePlan(selectedPlanId);
                        setShowPaymentModal(false);
                    }, 2500);

                } catch (e) {
                    if (onToast) onToast("Erreur Cloud lors de la validation", "error");
                    setPaymentStep('form');
                }
            }, 3500);
        } else {
            // Autres méthodes (Simulation directe)
            setPaymentStep('success');
            setTimeout(() => {
                if (selectedPlanId) onUpdatePlan(selectedPlanId);
                setShowPaymentModal(false);
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505] transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b dark:border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Abonnements</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Gérez votre accès aux collectes</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar pb-32">
                <div className="bg-gradient-to-r from-primary to-green-600 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                    <Gem className="absolute -right-6 -bottom-6 w-64 h-64 opacity-10 rotate-12" />
                    <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">Investissez dans <br/> votre quartier.</h3>
                    <p className="text-sm opacity-80 max-w-sm font-medium leading-relaxed mb-6">Chaque abonnement finance l'équipement de nos collecteurs et l'assainissement direct de Kinshasa.</p>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                        <Scale size={14}/> Taux : 1$ = {exchangeRate} FC
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {plans.map(plan => {
                        const isCurrent = user.subscription === plan.id;
                        const isBusiness = plan.id === 'special';
                        return (
                            <div key={plan.id} className={`bg-white dark:bg-gray-900 p-8 rounded-[3rem] border-4 transition-all relative flex flex-col ${isCurrent ? 'border-primary shadow-xl scale-[1.02]' : 'border-white dark:border-gray-800 shadow-sm hover:border-blue-100'}`}>
                                {plan.popular && <div className="absolute top-4 right-8 bg-[#00C853] text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-lg">Populaire</div>}
                                
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isBusiness ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
                                        {isBusiness ? <Building2 size={24}/> : <Star size={24}/>}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{plan.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">{plan.schedule}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">${plan.priceUSD}</span>
                                        <span className="text-xs font-bold text-gray-400">/ mois</span>
                                    </div>
                                    <p className="text-xs font-black text-blue-600 mt-1 uppercase">≈ {formatPrice(plan.priceUSD)}</p>
                                </div>

                                <div className="flex-1 space-y-4 mb-10">
                                    {plan.features.map((f, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-600 shrink-0 mt-0.5"><Check size={12} strokeWidth={4}/></div>
                                            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight uppercase tracking-tight">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={isCurrent}
                                    className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-[#2962FF] text-white shadow-blue-500/20 hover:scale-105 active:scale-95'}`}
                                >
                                    {isCurrent ? 'Plan Actif' : isBusiness ? 'Contacter Commercial' : 'Choisir ce plan'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DE PAIEMENT MOBILE MONEY KINSHASA */}
            {showPaymentModal && selectedPlanId && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] w-full max-w-md relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800 overflow-hidden">
                        
                        <div className="bg-gray-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><CreditCard size={120}/></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Paiement Mobile</h3>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction sécurisée SSL</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
                        </div>

                        {paymentStep === 'form' && (
                            <div className="p-8 space-y-8 animate-fade-in">
                                <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Abonnement choisi</p>
                                        <h4 className="font-black dark:text-white uppercase">{getSelectedPlanDetails()?.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total à payer</p>
                                        <h4 className="font-black text-blue-600 uppercase">{formatPrice(getSelectedPlanDetails()?.priceUSD || 0)}</h4>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-2">
                                        {['mpesa', 'orange', 'airtel', 'africell'].map(op => (
                                            <button key={op} onClick={() => setMobileProvider(op as any)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${mobileProvider === op ? 'border-primary bg-green-50 dark:bg-green-900/10' : 'border-gray-50 dark:border-gray-800 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}>
                                                <div className={`w-3 h-3 rounded-full ${mobileProvider === op ? 'bg-primary' : 'bg-gray-200'}`}></div>
                                                <span className="text-[8px] font-black uppercase tracking-tighter dark:text-white">{op}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro de téléphone (+243)</label>
                                        <div className="relative group">
                                            <Smartphone size={18} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary" />
                                            <input required type="tel" placeholder="81 234 5678" className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleInitiatePayment} className="w-full py-6 bg-[#00C853] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition-all text-sm">Initier le paiement</button>
                            </div>
                        )}

                        {paymentStep === 'ussd_push' && (
                            <div className="p-12 text-center space-y-8 animate-fade-in">
                                <div className="relative mx-auto w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-primary"><Smartphone size={40}/></div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">Vérifiez votre téléphone</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">Une demande de débit de **{formatPrice(getSelectedPlanDetails()?.priceUSD || 0)}** a été envoyée sur votre compte **{mobileProvider}**. Entrez votre code PIN pour valider.</p>
                                </div>
                                <div className="flex items-center justify-center gap-2 bg-yellow-50 dark:bg-yellow-900/10 px-4 py-2 rounded-full border border-yellow-100">
                                    <Wifi size={14} className="text-yellow-600 animate-pulse"/><span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">En attente de confirmation USSD...</span>
                                </div>
                            </div>
                        )}

                        {paymentStep === 'success' && (
                            <div className="p-12 text-center animate-scale-up">
                                <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner mb-8 border border-green-100"><Check size={48} strokeWidth={4}/></div>
                                <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-2">Succès !</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-10">Votre abonnement est maintenant actif.</p>
                                <button onClick={() => setShowPaymentModal(false)} className="w-full py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Accéder à mon tableau de bord</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
