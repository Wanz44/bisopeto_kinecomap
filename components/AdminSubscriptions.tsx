import React, { useState, useRef } from 'react';
import { ArrowLeft, Check, Edit2, DollarSign, Upload, AlertTriangle, Shield, Save, CreditCard, RefreshCw } from 'lucide-react';
import { SubscriptionPlan, SystemSettings } from '../types';

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
    onBack, 
    plans, 
    exchangeRate, 
    onUpdatePlan, 
    onUpdateExchangeRate, 
    currentLogo, 
    onUpdateLogo,
    systemSettings,
    onUpdateSystemSettings,
    onToast 
}) => {
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const [tempPlan, setTempPlan] = useState<Partial<SubscriptionPlan>>({});
    const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEditPlan = (plan: SubscriptionPlan) => {
        setEditingPlanId(plan.id);
        setTempPlan({ ...plan });
    };

    const handleSavePlan = () => {
        if (editingPlanId && tempPlan.id) {
            onUpdatePlan(tempPlan as SubscriptionPlan);
            setEditingPlanId(null);
            setTempPlan({});
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateLogo(reader.result as string);
                if (onToast) onToast("Logo mis à jour", "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveExchangeRate = () => {
        const rate = parseFloat(newExchangeRate);
        if (!isNaN(rate)) {
            onUpdateExchangeRate(rate);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuration Système</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Finance, Abonnements & Paramètres</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* System Settings Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Shield size={20} className="text-purple-500" /> Paramètres Généraux
                    </h3>

                    <div className="space-y-6">
                        {/* Maintenance Mode */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Mode Maintenance</label>
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${systemSettings.maintenanceMode ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">Accès Public</p>
                                        <p className="text-xs text-gray-500">{systemSettings.maintenanceMode ? 'Application verrouillée' : 'Application ouverte'}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={systemSettings.maintenanceMode}
                                        onChange={() => {
                                            const newMode = !systemSettings.maintenanceMode;
                                            onUpdateSystemSettings({...systemSettings, maintenanceMode: newMode});
                                            if (onToast) onToast(`Mode maintenance ${newMode ? 'activé' : 'désactivé'}`, newMode ? "info" : "success");
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                            </div>
                        </div>

                        {/* Exchange Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Taux de Change (1 USD)</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-3 text-gray-400 font-bold">FC</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                            value={newExchangeRate}
                                            onChange={(e) => setNewExchangeRate(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleSaveExchangeRate}
                                        className="bg-[#2962FF] text-white px-4 rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        <Save size={20} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Logo de l'application</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center justify-center">
                                        <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Upload size={16} /> Changer
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleLogoUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subscription Plans Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <CreditCard size={20} className="text-[#00C853]" /> Plans d'Abonnement
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div key={plan.id} className={`p-5 rounded-2xl border-2 transition-all ${editingPlanId === plan.id ? 'border-[#2962FF] bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800'}`}>
                                {editingPlanId === plan.id ? (
                                    <div className="space-y-3">
                                        <input 
                                            className="w-full p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-bold"
                                            value={tempPlan.name}
                                            onChange={e => setTempPlan({...tempPlan, name: e.target.value})}
                                            placeholder="Nom du plan"
                                        />
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-gray-400" />
                                            <input 
                                                type="number"
                                                className="w-full p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-bold"
                                                value={tempPlan.priceUSD}
                                                onChange={e => setTempPlan({...tempPlan, priceUSD: parseFloat(e.target.value)})}
                                                placeholder="Prix USD"
                                            />
                                        </div>
                                        <input 
                                            className="w-full p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-xs"
                                            value={tempPlan.schedule}
                                            onChange={e => setTempPlan({...tempPlan, schedule: e.target.value})}
                                            placeholder="Planning (ex: Mar, Jeu)"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => setEditingPlanId(null)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">Annuler</button>
                                            <button onClick={handleSavePlan} className="flex-1 py-2 bg-[#2962FF] text-white rounded-lg text-xs font-bold">Sauver</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-800 dark:text-white">{plan.name}</h4>
                                            <button onClick={() => handleEditPlan(plan)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-500 transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                        <div className="text-2xl font-black text-[#2962FF] mb-1">${plan.priceUSD}</div>
                                        <p className="text-xs text-gray-500 mb-3">≈ {(plan.priceUSD * exchangeRate).toLocaleString()} FC</p>
                                        <div className="bg-white dark:bg-gray-700 p-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                            <RefreshCw size={12} className="text-gray-400" />
                                            {plan.schedule}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};