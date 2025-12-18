
import React, { useState, useRef } from 'react';
import { ArrowLeft, Check, Edit2, DollarSign, Upload, AlertTriangle, Shield, Save, CreditCard, RefreshCw, MessageSquare, Tag, Bell, Sliders, UserCheck, X, FileText, Download, Clock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { SubscriptionPlan, SystemSettings, User, UserType } from '../types';

interface AdminSubscriptionsProps {
    onBack: () => void;
    plans: SubscriptionPlan[];
    exchangeRate: number;
    onUpdatePlan: (plan: SubscriptionPlan) => void;
    onUpdateExchangeRate: (rate: number) => void;
    currentLogo: string;
    onUpdateLogo: (logo: string) => void;
    systemSettings: SystemSettings;
    onUpdateSystemSettings: (settings: SystemSettings) => Promise<void> | void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ 
    onBack, plans, exchangeRate, onUpdatePlan, onUpdateExchangeRate, currentLogo, onUpdateLogo, systemSettings, onUpdateSystemSettings, onToast 
}) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'finance' | 'system' | 'history'>('requests');
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [tempPlan, setTempPlan] = useState<Partial<SubscriptionPlan>>({});
    const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    
    // Mock des demandes d'abonnement en attente
    const [pendingRequests, setPendingRequests] = useState([
        { id: 'req-1', name: 'Jean Kabeya', type: 'CITIZEN', plan: 'Plus', date: '2024-05-24', commune: 'Ngaliema', phone: '0812345678', status: 'pending' },
        { id: 'req-2', name: 'Hôtel Memling', type: 'BUSINESS', plan: 'Premium', date: '2024-05-23', commune: 'Gombe', phone: '0998765432', status: 'pending' },
    ]);

    const handleActionRequest = (id: string, action: 'approve' | 'reject') => {
        const msg = action === 'approve' ? "Abonnement validé" : "Demande rejetée";
        setPendingRequests(prev => prev.filter(r => r.id !== id));
        if (onToast) onToast(msg, action === 'approve' ? 'success' : 'info');
        setSelectedRequest(null);
    };

    const handleDownloadCert = () => {
        if (onToast) onToast("Génération du certificat PDF en cours...", "info");
        setTimeout(() => { if(onToast) onToast("Certificat téléchargé", "success"); }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Gestion des Revenus</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pilotage financier & Abonnements</p>
                        </div>
                    </div>
                    <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl">
                        <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'requests' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Demandes</button>
                        <button onClick={() => setActiveTab('finance')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'finance' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Plans</button>
                        <button onClick={() => setActiveTab('history')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-lg' : 'text-gray-500'}`}>Paiements</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 pb-24 no-scrollbar">
                
                {activeTab === 'requests' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="p-6">Client / Zone</th>
                                        <th className="p-6">Plan Demandé</th>
                                        <th className="p-6">Date</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {pendingRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                            <td className="p-6">
                                                <div className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{req.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 font-bold"><UserIcon size={12}/> {req.type} • {req.commune}</div>
                                            </td>
                                            <td className="p-6">
                                                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase border border-blue-100">{req.plan}</span>
                                            </td>
                                            <td className="p-6 text-xs font-bold text-gray-400">{req.date}</td>
                                            <td className="p-6 text-right">
                                                <button onClick={() => setSelectedRequest(req)} className="p-3 bg-[#2962FF] text-white rounded-xl hover:scale-105 transition-transform shadow-lg shadow-blue-500/20"><UserCheck size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingRequests.length === 0 && (
                                        <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">Aucune demande en attente</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                             <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase">Tarification & Change</h3>
                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {plans.map(plan => (
                                    <div key={plan.id} className="p-6 rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan {plan.id}</span>
                                            <button className="text-blue-500"><Edit2 size={16}/></button>
                                        </div>
                                        <div className="text-3xl font-black text-gray-900 dark:text-white">${plan.priceUSD}</div>
                                        <p className="text-xs font-bold text-gray-500 mt-1 uppercase">≈ {(plan.priceUSD * exchangeRate).toLocaleString()} FC</p>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><DollarSign size={20}/></div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white text-sm">Paiement Mobile Money</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Transaction #TR-00{i} • Gombe</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-green-600">28,000 FC</p>
                                        <p className="text-[9px] text-gray-400 font-bold">12 MAI 2024</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Validation */}
            {selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-lg p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Qualification</h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Vérification de l'abonné</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24}/></button>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                            <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-4">Infos Client</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold"><span className="text-gray-500">Nom</span><span className="dark:text-white">{selectedRequest.name}</span></div>
                                    <div className="flex justify-between text-sm font-bold"><span className="text-gray-500">Commune</span><span className="dark:text-white">{selectedRequest.commune}</span></div>
                                    <div className="flex justify-between text-sm font-bold"><span className="text-gray-500">Plan choisi</span><span className="text-[#2962FF]">{selectedRequest.plan}</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleDownloadCert} className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><FileText size={16}/> Voir Pièce ID</button>
                                <button onClick={handleDownloadCert} className="py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Download size={16}/> Certificat Eco</button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleActionRequest(selectedRequest.id, 'approve')} className="w-full py-5 bg-[#00C853] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all">Valider l'abonnement</button>
                            <button onClick={() => handleActionRequest(selectedRequest.id, 'reject')} className="w-full py-4 text-red-500 font-black uppercase tracking-widest text-[10px] hover:underline">Rejeter le dossier</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
