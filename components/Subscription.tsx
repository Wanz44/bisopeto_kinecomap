
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, CreditCard, ShieldCheck, Smartphone, X, Loader2, Scale, Calendar, Clock, AlertTriangle, Zap, Download, History, ChevronRight, Star, Wifi } from 'lucide-react';
import { User, SubscriptionPlan, UserType } from '../types';

interface SubscriptionProps {
    user: User;
    onBack: () => void;
    onUpdatePlan: (plan: 'standard' | 'plus' | 'premium' | 'special') => void;
    plans: SubscriptionPlan[];
    exchangeRate: number;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type PaymentMethod = 'mobile_money' | 'card' | 'google_pay';
type MobileProvider = 'mpesa' | 'orange' | 'airtel' | 'africell';
type BillingCycle = 'monthly' | 'yearly';

declare global {
    interface Window {
        google: any;
    }
}

export const Subscription: React.FC<SubscriptionProps> = ({ user, onBack, onUpdatePlan, plans, exchangeRate, onToast }) => {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<'standard' | 'plus' | 'premium' | 'special' | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
    const [mobileProvider, setMobileProvider] = useState<MobileProvider>('mpesa');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Payment Flow States
    const [paymentStep, setPaymentStep] = useState<'form' | 'ussd_push' | 'success'>('form');
    
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [showHistory, setShowHistory] = useState(false);

    const isPayingUser = user.type === UserType.CITIZEN || user.type === UserType.BUSINESS;

    if (!isPayingUser) {
        return (
            <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 items-center justify-center p-6 text-center">
                <h2 className="text-2xl font-bold dark:text-white">Accès Non Autorisé</h2>
                <button onClick={onBack} className="mt-4 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded dark:text-white">Retour</button>
            </div>
        );
    }

    const getSelectedPlanDetails = () => plans.find(p => p.id === selectedPlanId);

    const formatPrice = (priceUSD: number, forceMonthly = false) => {
        let finalPrice = priceUSD;
        if (billingCycle === 'yearly' && !forceMonthly) {
            finalPrice = priceUSD * 12 * 0.85; 
        }
        return `${(finalPrice * exchangeRate).toLocaleString()} FC`;
    };

    const handleSelectPlan = (planId: string) => {
        if (planId === user.subscription) return;
        setSelectedPlanId(planId as any);
        setShowPaymentModal(true);
        setPaymentStep('form');
    };

    // --- Google Pay Integration ---
    const handleGooglePayPayment = () => {
        const plan = getSelectedPlanDetails();
        
        // Vérification basique si l'API est chargée
        if (!window.google || !window.google.payments || !window.google.payments.api) {
            if (onToast) onToast("Google Pay n'est pas disponible pour le moment.", "error");
            console.warn("Google Pay SDK not loaded");
            // Fallback simulation pour la démo si le script échoue
            setPaymentStep('success');
            setTimeout(() => {
                if (selectedPlanId) onUpdatePlan(selectedPlanId);
                setShowPaymentModal(false);
                setSelectedPlanId(null);
            }, 2000);
            return;
        }

        const paymentsClient = new window.google.payments.api.PaymentsClient({environment: 'TEST'});
        
        const paymentDataRequest = {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                    allowedCardNetworks: ['MASTERCARD', 'VISA']
                },
                tokenizationSpecification: {
                    type: 'PAYMENT_GATEWAY',
                    parameters: {
                        gateway: 'example',
                        gatewayMerchantId: 'exampleGatewayMerchantId'
                    }
                }
            }],
            merchantInfo: {
                merchantId: '12345678901234567890',
                merchantName: 'KIN ECO-MAP'
            },
            transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPriceLabel: 'Total',
                // IMPORTANT: Google Pay requires price as string with 2 decimal places (e.g. "10.00")
                totalPrice: (plan?.priceUSD || 10).toFixed(2),
                currencyCode: 'USD',
                countryCode: 'US'
            }
        };

        paymentsClient.loadPaymentData(paymentDataRequest)
            .then((paymentData: any) => {
                console.log('Google Pay Success', paymentData);
                setPaymentStep('success');
                if (onToast) onToast("Paiement Google Pay réussi !", "success");
                
                setTimeout(() => {
                    if (selectedPlanId) onUpdatePlan(selectedPlanId);
                    setShowPaymentModal(false);
                    setSelectedPlanId(null);
                }, 3000);
            })
            .catch((err: any) => {
                console.error("Google Pay Error", JSON.stringify(err));
                if (err.statusCode !== 'CANCELED') {
                    if (onToast) onToast("Erreur lors du paiement Google Pay", "error");
                }
            });
    };

    const handleInitiatePayment = () => {
        if (paymentMethod === 'mobile_money') {
            if (phoneNumber.length < 9) {
                if (onToast) onToast("Numéro de téléphone invalide", "error");
                return;
            }
            // Switch to USSD Simulation Screen
            setPaymentStep('ussd_push');
            
            // Simulate waiting for user to enter PIN on phone
            setTimeout(() => {
                setPaymentStep('success');
                if (onToast) onToast("Paiement Mobile Money confirmé !", "success");
                
                setTimeout(() => {
                    if (selectedPlanId) onUpdatePlan(selectedPlanId);
                    setShowPaymentModal(false);
                    setSelectedPlanId(null);
                }, 3000);
            }, 5000); // 5 seconds waiting time
        } else if (paymentMethod === 'google_pay') {
            handleGooglePayPayment();
        } else {
            // Card fallback simulation
            setPaymentStep('success');
            setTimeout(() => {
                if (selectedPlanId) onUpdatePlan(selectedPlanId);
                setShowPaymentModal(false);
                setSelectedPlanId(null);
            }, 2000);
        }
    };

    const renderPaymentModal = () => {
        if (!showPaymentModal || !selectedPlanId) return null;

        const plan = getSelectedPlanDetails();
        const isSpecial = plan?.id === 'special';
        const finalPriceDisplay = isSpecial ? 'Variable' : formatPrice(plan?.priceUSD || 0);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)}></div>
                
                <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                            {paymentStep === 'ussd_push' ? 'Vérifiez votre téléphone' : 'Paiement Sécurisé'}
                        </h3>
                        {paymentStep === 'form' && (
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
                                <X size={20} className="text-gray-500 dark:text-gray-300" />
                            </button>
                        )}
                    </div>

                    {/* Step 1: Form */}
                    {paymentStep === 'form' && (
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-2xl mb-6 flex justify-between items-center shadow-lg">
                                <div>
                                    <span className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Abonnement</span>
                                    <div className="font-bold text-xl flex items-center gap-2">{plan?.name}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Montant</span>
                                    <div className="font-bold text-xl text-[#00C853]">{finalPriceDisplay}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button onClick={() => setPaymentMethod('mobile_money')} className={`py-3 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all border-2 ${paymentMethod === 'mobile_money' ? 'border-[#00C853] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-100 dark:border-gray-700'}`}>
                                    <Smartphone size={20} /> Mobile Money
                                </button>
                                <button onClick={() => setPaymentMethod('google_pay')} className={`py-3 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-2 transition-all border-2 ${paymentMethod === 'google_pay' ? 'border-gray-800 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white' : 'border-gray-100 dark:border-gray-700'}`}>
                                    <svg className="h-5 w-auto" viewBox="0 0 40 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M15.82 8.35C15.82 12.63 12.79 15.7 8.52 15.7C4.24 15.7 1.21 12.63 1.21 8.35C1.21 4.07 4.24 1 8.52 1C12.79 1 15.82 4.07 15.82 8.35ZM12.76 8.35C12.76 5.6 10.85 3.73 8.52 3.73C6.18 3.73 4.27 5.6 4.27 8.35C4.27 11.1 6.18 12.97 8.52 12.97C10.85 12.97 12.76 11.1 12.76 8.35Z" />
                                        <path fillRule="evenodd" clipRule="evenodd" d="M20.5 8.35C20.5 5.6 18.59 3.73 16.26 3.73C13.92 3.73 12.01 5.6 12.01 8.35C12.01 11.1 13.92 12.97 16.26 12.97C18.59 12.97 20.5 11.1 20.5 8.35ZM23.56 8.35C23.56 12.63 20.53 15.7 16.26 15.7C11.98 15.7 8.95 12.63 8.95 8.35C8.95 4.07 11.98 1 16.26 1C20.53 1 23.56 4.07 23.56 8.35Z" />
                                        <path d="M26.2 3.12H29.07V13.5H26.2V3.12Z" />
                                        <path d="M32.5 10.5C33.78 10.5 34.6 9.87 35.03 8.92L38.8 17.5H35.8L35.25 16.12" />
                                    </svg>
                                    Google Pay
                                </button>
                            </div>

                            {paymentMethod === 'mobile_money' && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="grid grid-cols-4 gap-2">
                                        {['mpesa', 'orange', 'airtel', 'africell'].map((provider) => (
                                            <div key={provider} onClick={() => setMobileProvider(provider as any)} className={`cursor-pointer p-2 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all ${mobileProvider === provider ? 'border-[#00C853] bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700'}`}>
                                                <div className={`w-3 h-3 rounded-full ${mobileProvider === provider ? 'bg-[#00C853]' : 'bg-gray-300'}`}></div>
                                                <span className="capitalize font-bold text-[10px] text-gray-700 dark:text-gray-200">{provider.slice(0,3)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-gray-500 font-bold">+243</span>
                                        <input type="tel" className="w-full pl-14 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:border-[#00C853] outline-none font-bold tracking-wide" placeholder="81 234 5678" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'google_pay' && (
                                <div className="space-y-4 animate-fade-in bg-gray-50 dark:bg-gray-700 p-4 rounded-xl text-center">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        Vous serez redirigé vers l'interface sécurisée de Google Pay pour finaliser votre paiement.
                                    </p>
                                    <div className="flex justify-center">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <svg className="h-8 w-auto" viewBox="0 0 40 17" fill="#5F6368" xmlns="http://www.w3.org/2000/svg">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M15.82 8.35C15.82 12.63 12.79 15.7 8.52 15.7C4.24 15.7 1.21 12.63 1.21 8.35C1.21 4.07 4.24 1 8.52 1C12.79 1 15.82 4.07 15.82 8.35ZM12.76 8.35C12.76 5.6 10.85 3.73 8.52 3.73C6.18 3.73 4.27 5.6 4.27 8.35C4.27 11.1 6.18 12.97 8.52 12.97C10.85 12.97 12.76 11.1 12.76 8.35Z" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M20.5 8.35C20.5 5.6 18.59 3.73 16.26 3.73C13.92 3.73 12.01 5.6 12.01 8.35C12.01 11.1 13.92 12.97 16.26 12.97C18.59 12.97 20.5 11.1 20.5 8.35ZM23.56 8.35C23.56 12.63 20.53 15.7 16.26 15.7C11.98 15.7 8.95 12.63 8.95 8.35C8.95 4.07 11.98 1 16.26 1C20.53 1 23.56 4.07 23.56 8.35Z" />
                                                <path d="M26.2 3.12H29.07V13.5H26.2V3.12Z" />
                                                <path d="M32.5 10.5C33.78 10.5 34.6 9.87 35.03 8.92L38.8 17.5H35.8L35.25 16.12" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6">
                                <button onClick={handleInitiatePayment} className="w-full py-4 bg-[#00C853] hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                    {paymentMethod === 'google_pay' ? 'Continuer avec GPay' : `Payer ${finalPriceDisplay}`}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: USSD Push Simulation */}
                    {paymentStep === 'ussd_push' && (
                        <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-[#00C853] animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Smartphone size={32} className="text-gray-400" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Veuillez confirmer sur votre téléphone</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Une demande de paiement a été envoyée au <strong>+243 {phoneNumber}</strong> via {mobileProvider}.
                                    <br/><br/>
                                    Entrez votre code PIN pour valider la transaction.
                                </p>
                            </div>
                            <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center justify-center gap-2">
                                <Wifi size={16} className="text-yellow-600 animate-pulse" />
                                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">En attente de réseau...</span>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {paymentStep === 'success' && (
                        <div className="p-8 flex flex-col items-center justify-center text-center animate-fade-in">
                            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 text-[#00C853]">
                                <Check size={48} strokeWidth={4} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-800 dark:text-white mb-2">Paiement Réussi !</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">Votre abonnement est actif immédiatement.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header (Identique) */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" /></button>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mon Abonnement</h2>
                </div>
                <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}><History size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {!showHistory && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
                        {plans.map(plan => (
                            <div key={plan.id} className="relative rounded-3xl p-6 border-2 border-gray-100 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                                <h4 className="text-lg font-bold text-gray-800 dark:text-white">{plan.name}</h4>
                                <div className="mt-2 text-2xl font-black text-[#2962FF]">${plan.priceUSD}</div>
                                <div className="text-xs text-gray-500 font-medium">≈ {formatPrice(plan.priceUSD)}</div>
                                <button onClick={() => handleSelectPlan(plan.id)} disabled={user.subscription === plan.id} className={`w-full mt-4 py-3 rounded-xl font-bold transition-all ${user.subscription === plan.id ? 'bg-gray-200 text-gray-500' : 'bg-[#2962FF] text-white hover:bg-blue-700'}`}>
                                    {user.subscription === plan.id ? 'Actuel' : 'Choisir'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {renderPaymentModal()}
        </div>
    );
};
