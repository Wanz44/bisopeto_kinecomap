
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Edit2, CheckCircle, RefreshCw, DollarSign, Calendar, Upload, Image as ImageIcon, Trash2, Shield, Settings, AlertTriangle, Lock, Smartphone, Server, Receipt, Printer, User, QrCode, FileText, Download, XCircle, RotateCcw, Percent, Filter, CreditCard, Banknote, Database, HardDrive, Activity, Wifi, ShieldAlert, Key, Clock, LogOut, Palette, LayoutTemplate, Type, Globe, Sliders, Check, Sparkles, Plus, Minus, Search, ShoppingCart, Calculator, FileSpreadsheet, History, Store, Wallet, TrendingUp } from 'lucide-react';
import { SubscriptionPlan, SystemSettings } from '../types';

interface AdminSubscriptionsProps {
    onBack: () => void;
    plans: SubscriptionPlan[];
    exchangeRate: number;
    onUpdatePlan: (updatedPlan: SubscriptionPlan) => void;
    onUpdateExchangeRate: (rate: number) => void;
    currentLogo?: string;
    onUpdateLogo?: (newLogo: string) => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    systemSettings: SystemSettings;
    onUpdateSystemSettings: (settings: SystemSettings) => void;
}

interface CartItem {
    id: string;
    name: string;
    priceUSD: number;
    quantity: number;
    type: 'plan' | 'custom';
}

interface Transaction {
    id: string;
    timestamp: Date;
    clientName: string;
    items: CartItem[];
    totalFC: number;
    totalUSD: number;
    amountTendered: number;
    changeDue: number;
    status: 'completed' | 'voided';
    cashierName: string;
    paymentMethod: 'cash' | 'mobile' | 'card';
}

interface AuditLog {
    id: string;
    action: string;
    user: string;
    role: string;
    timestamp: string;
    ip: string;
    status: 'success' | 'warning' | 'failed';
}

// --- BRANDING PRESETS ---
const BRANDING_PRESETS = {
    eco: {
        primary: '#00C853',
        secondary: '#2962FF',
        surface: '#FFFFFF',
        radius: '16px',
        font: 'Inter',
        buttonStyle: 'gradient' as const,
        glass: true
    },
    corporate: {
        primary: '#1E293B',
        secondary: '#3B82F6',
        surface: '#F8FAFC',
        radius: '6px',
        font: 'Roboto',
        buttonStyle: 'flat' as const,
        glass: false
    },
    neon: {
        primary: '#D500F9',
        secondary: '#00E0FF',
        surface: '#121212',
        radius: '24px',
        font: 'Poppins',
        buttonStyle: 'outline' as const,
        glass: true
    }
};

const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'log-init', action: 'Initialisation Système', user: 'System', role: 'Root', timestamp: 'Maintenant', ip: '127.0.0.1', status: 'success' },
];

const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'TX-849201',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        clientName: 'Jean K.',
        items: [{ id: 'standard', name: 'Standard', priceUSD: 10, quantity: 1, type: 'plan' }],
        totalFC: 28000,
        totalUSD: 10,
        amountTendered: 30000,
        changeDue: 2000,
        status: 'completed',
        cashierName: 'Admin',
        paymentMethod: 'cash'
    },
    {
        id: 'TX-849155',
        timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        clientName: 'Marie L.',
        items: [{ id: 'plus', name: 'Plus', priceUSD: 15, quantity: 1, type: 'plan' }],
        totalFC: 42000,
        totalUSD: 15,
        amountTendered: 42000,
        changeDue: 0,
        status: 'completed',
        cashierName: 'Admin',
        paymentMethod: 'mobile'
    }
];

export const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ 
    onBack, 
    plans, 
    exchangeRate, 
    onUpdatePlan, 
    onUpdateExchangeRate,
    currentLogo = './logo.png',
    onUpdateLogo,
    onToast,
    systemSettings,
    onUpdateSystemSettings
}) => {
    const [activeTab, setActiveTab] = useState<'plans' | 'branding' | 'system' | 'security' | 'pos'>('system');
    
    // --- State for Exchange Rate & Commission ---
    const [rateInput, setRateInput] = useState(exchangeRate.toString());
    const [commissionInput, setCommissionInput] = useState((systemSettings.marketplaceCommission * 100).toString());

    // --- State for Plans ---
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [editForm, setEditForm] = useState<Partial<SubscriptionPlan>>({});

    // --- State for Branding (Advanced) ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const [brandingConfig, setBrandingConfig] = useState({
        appName: 'KIN ECO-MAP',
        tagline: 'Le futur de la propreté',
        primaryColor: '#00C853',
        secondaryColor: '#2962FF',
        surfaceColor: '#FFFFFF',
        borderRadius: '16px', // px
        fontFamily: 'Inter',
        buttonStyle: 'gradient', // flat, gradient, outline
        glassmorphism: true,
        logoUrl: currentLogo,
        loginBgUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2574'
    });

    // --- POS State (Advanced) ---
    const [posView, setPosView] = useState<'register' | 'history'>('register');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [transactionHistory, setTransactionHistory] = useState<Transaction[]>(MOCK_TRANSACTIONS);
    const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [historySearch, setHistorySearch] = useState('');

    // --- Security & System State ---
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isClearingCache, setIsClearingCache] = useState(false);

    // --- Computed POS Values ---
    const cartTotalUSD = cart.reduce((acc, item) => acc + (item.priceUSD * item.quantity), 0);
    const cartTotalFC = cartTotalUSD * exchangeRate;
    const changeDue = parseFloat(amountTendered) - cartTotalFC;
    const isPaymentValid = parseFloat(amountTendered) >= cartTotalFC && cart.length > 0;

    // --- Handlers ---

    const handleAddToCart = (plan: SubscriptionPlan) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === plan.id);
            if (existing) {
                return prev.map(item => item.id === plan.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { id: plan.id, name: plan.name, priceUSD: plan.priceUSD, quantity: 1, type: 'plan' }];
        });
    };

    const handleRemoveFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleUpdateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
        }));
    };

    const handleQuickCash = (amount: number) => {
        setAmountTendered(amount.toString());
    };

    const handleProcessPayment = () => {
        if (!isPaymentValid) return;

        const newTx: Transaction = {
            id: `TX-${Date.now().toString().slice(-6)}`,
            timestamp: new Date(),
            clientName: customerSearch || 'Client Comptoir',
            items: [...cart],
            totalFC: cartTotalFC,
            totalUSD: cartTotalUSD,
            amountTendered: parseFloat(amountTendered),
            changeDue: changeDue,
            status: 'completed',
            cashierName: 'Admin',
            paymentMethod: 'cash'
        };

        setTransactionHistory([newTx, ...transactionHistory]);
        setLastTransaction(newTx);
        setShowReceiptModal(true);
        
        // Reset Cart
        setCart([]);
        setAmountTendered('');
        setCustomerSearch('');
        
        if (onToast) onToast("Paiement validé avec succès", "success");
    };

    const handleSaveRateAndCommission = () => { 
        const rate = parseInt(rateInput); 
        const comm = parseFloat(commissionInput);
        
        if(!isNaN(rate) && rate > 0) onUpdateExchangeRate(rate); 
        if(!isNaN(comm)) onUpdateSystemSettings({...systemSettings, marketplaceCommission: comm/100});
        
        if(onToast) onToast("Paramètres financiers mis à jour", "success"); 
    };

    const handleSavePlan = () => { 
        if(editingPlan && editForm) { 
            onUpdatePlan({...editingPlan, ...editForm} as SubscriptionPlan); 
            setEditingPlan(null); 
            if(onToast) onToast("Plan mis à jour", "success");
        } 
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'bg') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'logo') {
                    if (onUpdateLogo) onUpdateLogo(reader.result as string);
                    setBrandingConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
                } else {
                    setBrandingConfig(prev => ({ ...prev, loginBgUrl: reader.result as string }));
                }
                if(onToast) onToast(`${type === 'logo' ? 'Logo' : 'Arrière-plan'} mis à jour`, "success");
            };
            reader.readAsDataURL(file);
        }
    };

    const applyPreset = (presetKey: keyof typeof BRANDING_PRESETS) => {
        const preset = BRANDING_PRESETS[presetKey];
        setBrandingConfig(prev => ({
            ...prev,
            primaryColor: preset.primary,
            secondaryColor: preset.secondary,
            surfaceColor: preset.surface,
            borderRadius: preset.radius,
            fontFamily: preset.font,
            buttonStyle: preset.buttonStyle,
            glassmorphism: preset.glass
        }));
        if (onToast) onToast(`Thème ${presetKey} appliqué`, "info");
    };

    const handleBackup = () => {
        setIsBackingUp(true);
        setTimeout(() => {
            setIsBackingUp(false);
            if(onToast) onToast("Sauvegarde de la base de données effectuée", "success");
        }, 2000);
    };

    const handleClearCache = () => {
        setIsClearingCache(true);
        setTimeout(() => {
            setIsClearingCache(false);
            if(onToast) onToast("Cache système vidé", "success");
        }, 1500);
    };

    // --- Export CSV Logic ---
    const handleExportCSV = () => {
        const headers = ["ID Transaction", "Date", "Heure", "Client", "Total (FC)", "Total (USD)", "Méthode", "Statut", "Caissier"];
        const rows = transactionHistory.map(tx => [
            tx.id,
            tx.timestamp.toLocaleDateString(),
            tx.timestamp.toLocaleTimeString(),
            `"${tx.clientName}"`, // Escape quotes for names
            tx.totalFC,
            tx.totalUSD,
            tx.paymentMethod,
            tx.status,
            tx.cashierName
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapport_caisse_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if(onToast) onToast("Rapport CSV téléchargé", "success");
    };

    // --- Sub-Renderers ---

    const renderSystemTab = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl"><Server size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">API Server</p>
                        <p className="text-sm font-black text-gray-800 dark:text-white flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> En Ligne
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Database size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Database</p>
                        <p className="text-sm font-black text-gray-800 dark:text-white">Connecté (0ms)</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl"><HardDrive size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Stockage</p>
                        <p className="text-sm font-black text-gray-800 dark:text-white">0% Utilisé</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl"><Activity size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Version App</p>
                        <p className="text-sm font-black text-gray-800 dark:text-white">v{systemSettings.appVersion}</p>
                    </div>
                </div>
            </div>

            {/* General Settings Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-gray-400" /> Configuration Générale
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
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
                                        onChange={() => onUpdateSystemSettings({...systemSettings, maintenanceMode: !systemSettings.maintenanceMode})}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email Support</label>
                            <input 
                                type="email" 
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                value={systemSettings.supportEmail}
                                onChange={(e) => onUpdateSystemSettings({...systemSettings, supportEmail: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Taux de Change (1 USD)</label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-3 text-gray-400 font-bold">FC</span>
                                    <input 
                                        type="number" 
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF] font-bold"
                                        value={rateInput}
                                        onChange={(e) => setRateInput(e.target.value)}
                                    />
                                </div>
                                <button onClick={handleSaveRateAndCommission} className="p-3 bg-[#2962FF] text-white rounded-xl hover:bg-blue-700 transition-colors">
                                    <Save size={20} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Commission Marketplace (%)</label>
                            <div className="relative">
                                <Percent size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                <input 
                                    type="number" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]"
                                    value={commissionInput}
                                    onChange={(e) => setCommissionInput(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-4">
                    <button 
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                    >
                        {isBackingUp ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                        Sauvegarder Données
                    </button>
                    <button 
                        onClick={handleClearCache}
                        disabled={isClearingCache}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-sm hover:bg-orange-100 transition-colors"
                    >
                        {isClearingCache ? <RefreshCw className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        Vider Cache Système
                    </button>
                </div>
            </div>
        </div>
    );

    const renderPOS = () => {
        // --- SUB-COMPONENT: HISTORY VIEW ---
        if (posView === 'history') {
            const filteredHistory = transactionHistory.filter(tx => 
                tx.id.toLowerCase().includes(historySearch.toLowerCase()) || 
                tx.clientName.toLowerCase().includes(historySearch.toLowerCase())
            );
            
            const totalRevenueFC = transactionHistory.reduce((acc, tx) => acc + tx.totalFC, 0);
            const totalTransactions = transactionHistory.length;

            return (
                <div className="h-full flex flex-col animate-fade-in pb-20 md:pb-0">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button onClick={() => setPosView('register')} className="px-4 py-2 text-sm font-bold text-gray-500 rounded-lg hover:text-gray-800 dark:hover:text-white transition-colors">
                                Caisse
                            </button>
                            <button onClick={() => setPosView('history')} className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm rounded-lg transition-colors">
                                Historique
                            </button>
                        </div>
                        <button 
                            onClick={handleExportCSV}
                            className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-200 transition-colors"
                        >
                            <FileSpreadsheet size={18} /> Exporter CSV
                        </button>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Ventes</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">{totalRevenueFC.toLocaleString()} FC</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                                <Receipt size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Transactions</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">{totalTransactions}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Panier Moyen</p>
                                <p className="text-xl font-black text-gray-800 dark:text-white">
                                    {totalTransactions > 0 ? Math.round(totalRevenueFC / totalTransactions).toLocaleString() : 0} FC
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-4 relative">
                        <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher une transaction (ID, Client)..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-gray-800 dark:text-white shadow-sm focus:ring-2 focus:ring-[#2962FF]"
                            value={historySearch}
                            onChange={(e) => setHistorySearch(e.target.value)}
                        />
                    </div>

                    {/* Table */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-750 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4">ID & Date</th>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Articles</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-center">Méthode</th>
                                        <th className="px-6 py-4 text-center">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-400">Aucune transaction trouvée.</td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-800 dark:text-white">{tx.id}</div>
                                                    <div className="text-xs text-gray-500">{tx.timestamp.toLocaleString()}</div>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{tx.clientName}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {tx.items.length} article(s)
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="font-black text-gray-800 dark:text-white">{tx.totalFC.toLocaleString()} FC</div>
                                                    <div className="text-xs text-gray-400">${tx.totalUSD}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        tx.paymentMethod === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                                    }`}>
                                                        {tx.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="flex justify-center">
                                                        {tx.status === 'completed' ? (
                                                            <CheckCircle size={18} className="text-green-500" />
                                                        ) : (
                                                            <XCircle size={18} className="text-red-500" />
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        // --- SUB-COMPONENT: REGISTER VIEW (Standard POS) ---
        return (
            <div className="h-full flex flex-col md:flex-row gap-6 animate-fade-in pb-20 md:pb-0">
                {/* LEFT COLUMN: CATALOG */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* View Switcher & Search */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                <button onClick={() => setPosView('register')} className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm rounded-lg transition-colors">
                                    Caisse
                                </button>
                                <button onClick={() => setPosView('history')} className="px-4 py-2 text-sm font-bold text-gray-500 rounded-lg hover:text-gray-800 dark:hover:text-white transition-colors">
                                    Historique
                                </button>
                            </div>
                            <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-100 transition-colors">
                                <User size={16} /> <span className="hidden lg:inline">Nouveau Client</span>
                            </button>
                        </div>
                        
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher client (Nom, Tel)..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none text-gray-800 dark:text-white"
                                value={customerSearch}
                                onChange={(e) => setCustomerSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Plans Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 px-1">Abonnements & Services</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {plans.map(plan => (
                                <button 
                                    key={plan.id}
                                    onClick={() => handleAddToCart(plan)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-transparent hover:border-[#2962FF] shadow-sm hover:shadow-md transition-all flex flex-col items-start text-left group h-full"
                                >
                                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <CreditCard size={20} />
                                    </div>
                                    <h4 className="font-bold text-gray-800 dark:text-white mb-1 line-clamp-1">{plan.name}</h4>
                                    <div className="mt-auto pt-2 w-full">
                                        <p className="text-lg font-black text-[#2962FF]">${plan.priceUSD}</p>
                                        <p className="text-[10px] text-gray-400">{(plan.priceUSD * exchangeRate).toLocaleString()} FC</p>
                                    </div>
                                </button>
                            ))}
                            
                            {/* Custom Amount Button */}
                            <button className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all flex flex-col items-center justify-center text-center group h-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <Plus size={24} className="mb-2 opacity-50 group-hover:opacity-100" />
                                <span className="font-bold text-sm">Montant Libre</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CART & CHECKOUT */}
                <div className="w-full md:w-[400px] flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Cart Header */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={20} /> Panier Actuel
                        </h3>
                        <div className="text-xs font-mono text-gray-400">#{Date.now().toString().slice(-6)}</div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-50">
                                <ShoppingCart size={64} strokeWidth={1} />
                                <p>Le panier est vide</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={`${item.id}-${idx}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{(item.priceUSD * exchangeRate).toLocaleString()} FC x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono font-bold text-gray-800 dark:text-white">
                                            ${(item.priceUSD * item.quantity).toFixed(0)}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 bg-white dark:bg-gray-600 rounded shadow hover:bg-gray-100"><Plus size={10} /></button>
                                            <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 bg-white dark:bg-gray-600 rounded shadow hover:bg-gray-100"><Minus size={10} /></button>
                                        </div>
                                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-400 hover:text-red-600 ml-1"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals & Payment */}
                    <div className="p-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Sous-total (USD)</span>
                                <span className="font-mono">${cartTotalUSD}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Taux de change</span>
                                <span className="font-mono">1$ = {exchangeRate} FC</span>
                            </div>
                            <div className="flex justify-between items-end pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="font-bold text-lg text-gray-800 dark:text-white">Total à Payer</span>
                                <span className="font-black text-2xl text-[#2962FF]">{cartTotalFC.toLocaleString()} FC</span>
                            </div>
                        </div>

                        {/* Payment Input Area */}
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600 shadow-inner">
                            <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Montant Reçu (Espèces)</label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-bold">FC</span>
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent font-mono text-xl font-bold text-gray-800 dark:text-white outline-none placeholder-gray-300"
                                    placeholder="0"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quick Cash Buttons */}
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {[5000, 10000, 20000, 50000].map(amt => (
                                <button 
                                    key={amt}
                                    onClick={() => handleQuickCash(amt)}
                                    className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-green-200 transition-colors"
                                >
                                    {amt/1000}k
                                </button>
                            ))}
                        </div>

                        {/* Change Display */}
                        {parseFloat(amountTendered) > 0 && (
                            <div className={`flex justify-between items-center px-2 py-1 rounded-lg ${changeDue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="text-xs font-bold uppercase">{changeDue >= 0 ? 'A Rendre (Change)' : 'Manque'}</span>
                                <span className="font-mono font-bold">{Math.abs(changeDue).toLocaleString()} FC</span>
                            </div>
                        )}

                        <button 
                            onClick={handleProcessPayment}
                            disabled={!isPaymentValid}
                            className="w-full py-4 bg-[#2962FF] hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={24} /> ENCAISSER
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderSecurityTab = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Security Policies */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <ShieldAlert size={20} className="text-[#2962FF]" /> Politiques de Sécurité
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Key size={20} /></div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">Force du mot de passe</p>
                                    <p className="text-xs text-gray-500">Exigence complexité</p>
                                </div>
                            </div>
                        </div>
                        <select 
                            className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-sm outline-none"
                            value={systemSettings.passwordPolicy}
                            onChange={(e) => onUpdateSystemSettings({...systemSettings, passwordPolicy: e.target.value as any})}
                        >
                            <option value="standard">Standard (8 chars)</option>
                            <option value="strong">Fort (AlphaNum + Special)</option>
                            <option value="strict">Strict (12+ chars, Rotation 90j)</option>
                        </select>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Clock size={20} /></div>
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">Session Timeout</p>
                                    <p className="text-xs text-gray-500">Déconnexion auto</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input 
                                type="range" 
                                min="15" max="240" step="15"
                                className="flex-1 accent-[#2962FF]"
                                value={systemSettings.sessionTimeout}
                                onChange={(e) => onUpdateSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                            />
                            <span className="font-mono font-bold text-sm w-16 text-right">{systemSettings.sessionTimeout} min</span>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg"><Smartphone size={20} /></div>
                            <div>
                                <p className="font-bold text-gray-800 dark:text-white text-sm">Authentification 2FA</p>
                                <p className="text-xs text-gray-500">Obligatoire pour Admin</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={systemSettings.force2FA}
                                onChange={() => onUpdateSystemSettings({...systemSettings, force2FA: !systemSettings.force2FA})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2962FF]"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
                    <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                        <FileText size={18} /> Journal d'Activités (Audit Log)
                    </h3>
                    <button className="text-xs text-blue-600 font-bold hover:underline">Exporter CSV</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase">
                            <tr>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">Utilisateur</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">IP Source</th>
                                <th className="px-4 py-3 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {MOCK_AUDIT_LOGS.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{log.action}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-xs">{log.user}</div>
                                        <div className="text-[10px] text-gray-400">{log.role}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{log.timestamp}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.ip}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-block w-2 h-2 rounded-full ${
                                            log.status === 'success' ? 'bg-green-500' : 
                                            log.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}></span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderPlansTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {plans.map(plan => (
                <div key={plan.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-transparent hover:border-[#2962FF] transition-all shadow-sm flex flex-col relative overflow-hidden group">
                    {plan.popular && (
                        <div className="absolute top-0 right-0 bg-[#00C853] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                            Populaire
                        </div>
                    )}
                    <div className="mb-4">
                        <h4 className="text-xl font-black text-gray-800 dark:text-white">{plan.name}</h4>
                        <p className="text-sm text-gray-500">{plan.schedule}</p>
                    </div>
                    <div className="mb-6">
                        <span className="text-3xl font-black text-[#2962FF]">${plan.priceUSD}</span>
                        <span className="text-sm text-gray-400">/mois</span>
                    </div>
                    <ul className="space-y-3 mb-6 flex-1">
                        {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                {feat}
                            </li>
                        ))}
                    </ul>
                    <button 
                        onClick={() => { setEditingPlan(plan); setEditForm({...plan}); }}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-[#2962FF] hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit2 size={16} /> Modifier
                    </button>
                </div>
            ))}
            
            {/* Edit Plan Modal Overlay */}
            {editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold dark:text-white">Modifier {editingPlan.name}</h3>
                            <button onClick={() => setEditingPlan(null)}><XCircle size={24} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du plan</label>
                                <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prix (USD)</label>
                                <input type="number" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={editForm.priceUSD} onChange={e => setEditForm({...editForm, priceUSD: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Planning</label>
                                <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={editForm.schedule} onChange={e => setEditForm({...editForm, schedule: e.target.value})} />
                            </div>
                            <button onClick={handleSavePlan} className="w-full py-3 bg-[#00C853] text-white font-bold rounded-xl hover:bg-green-600">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderBrandingTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in h-full pb-20">
            {/* --- LEFT COLUMN: CONTROLS --- */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                
                {/* PRESETS HEADER */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-500" /> Thèmes Rapides
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => applyPreset('eco')} className="p-3 border-2 border-transparent hover:border-[#00C853] bg-green-50 dark:bg-green-900/10 rounded-xl flex flex-col items-center gap-2 transition-all">
                            <div className="w-8 h-8 rounded-full bg-[#00C853] shadow-lg"></div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Eco Green</span>
                        </button>
                        <button onClick={() => applyPreset('corporate')} className="p-3 border-2 border-transparent hover:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex flex-col items-center gap-2 transition-all">
                            <div className="w-8 h-8 rounded-full bg-slate-800 shadow-lg"></div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Corporate</span>
                        </button>
                        <button onClick={() => applyPreset('neon')} className="p-3 border-2 border-transparent hover:border-purple-500 bg-purple-50 dark:bg-purple-900/10 rounded-xl flex flex-col items-center gap-2 transition-all">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-lg"></div>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Dark Neon</span>
                        </button>
                    </div>
                </div>

                {/* VISUAL IDENTITY */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Palette size={20} className="text-blue-500" /> Identité Visuelle
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Logo Upload */}
                        <div className="col-span-1 md:col-span-2 flex items-start gap-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 relative group cursor-pointer shrink-0"
                            >
                                <img src={brandingConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white" size={24} />
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logo')} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nom de l'App</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        value={brandingConfig.appName}
                                        onChange={(e) => setBrandingConfig({...brandingConfig, appName: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Slogan (Tagline)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        value={brandingConfig.tagline}
                                        onChange={(e) => setBrandingConfig({...brandingConfig, tagline: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Couleur Principale</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                                    value={brandingConfig.primaryColor}
                                    onChange={(e) => setBrandingConfig({...brandingConfig, primaryColor: e.target.value})}
                                />
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent font-mono text-sm dark:text-white"
                                    value={brandingConfig.primaryColor}
                                    onChange={(e) => setBrandingConfig({...brandingConfig, primaryColor: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Couleur Secondaire</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                                    value={brandingConfig.secondaryColor}
                                    onChange={(e) => setBrandingConfig({...brandingConfig, secondaryColor: e.target.value})}
                                />
                                <input 
                                    type="text" 
                                    className="flex-1 p-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent font-mono text-sm dark:text-white"
                                    value={brandingConfig.secondaryColor}
                                    onChange={(e) => setBrandingConfig({...brandingConfig, secondaryColor: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* UI & INTERFACE */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <LayoutTemplate size={20} className="text-purple-500" /> Interface (UI Kit)
                    </h3>
                    
                    <div className="space-y-6">
                        {/* Border Radius */}
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Arrondi des Bordures</label>
                                <span className="text-xs font-mono dark:text-white">{brandingConfig.borderRadius}</span>
                            </div>
                            <input 
                                type="range" min="0" max="32" step="4"
                                className="w-full accent-blue-600"
                                value={parseInt(brandingConfig.borderRadius)}
                                onChange={(e) => setBrandingConfig({...brandingConfig, borderRadius: `${e.target.value}px`})}
                            />
                        </div>

                        {/* Button Style */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Style des Boutons</label>
                            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                                {['flat', 'gradient', 'outline'].map(style => (
                                    <button 
                                        key={style}
                                        onClick={() => setBrandingConfig({...brandingConfig, buttonStyle: style as any})}
                                        className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-all ${brandingConfig.buttonStyle === style ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500'}`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Glassmorphism Toggle */}
                        <div className="flex items-center justify-between p-3 border rounded-xl dark:border-gray-600">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg"><Sliders size={18} /></div>
                                <span className="text-sm font-bold dark:text-white">Effet Glassmorphism</span>
                            </div>
                            <input 
                                type="checkbox" 
                                className="toggle accent-blue-600"
                                checked={brandingConfig.glassmorphism}
                                onChange={(e) => setBrandingConfig({...brandingConfig, glassmorphism: e.target.checked})}
                            />
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Typographie</label>
                            <div className="relative">
                                <Type size={18} className="absolute left-3 top-3 text-gray-400" />
                                <select 
                                    className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-transparent text-gray-800 dark:text-white outline-none"
                                    value={brandingConfig.fontFamily}
                                    onChange={(e) => setBrandingConfig({...brandingConfig, fontFamily: e.target.value})}
                                >
                                    <option value="Inter">Inter (Moderne)</option>
                                    <option value="Roboto">Roboto (Android)</option>
                                    <option value="Poppins">Poppins (Geometrique)</option>
                                    <option value="Serif">Serif (Classique)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-orange-500" /> Arrière-plan Login
                    </h3>
                    <div 
                        onClick={() => bgInputRef.current?.click()}
                        className="h-32 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden relative cursor-pointer group border-2 border-dashed border-gray-300 dark:border-gray-600"
                    >
                        <img src={brandingConfig.loginBgUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">Changer l'image</span>
                        </div>
                        <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'bg')} />
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: LIVE PREVIEW --- */}
            <div className="flex flex-col items-center sticky top-4 h-fit">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-4 flex items-center gap-2">
                    <Smartphone size={14} /> Prévisualisation Live
                </h4>
                
                {/* PHONE FRAME */}
                <div className="w-[320px] h-[650px] bg-black rounded-[45px] border-[8px] border-gray-900 relative overflow-hidden shadow-2xl flex flex-col ring-4 ring-gray-200 dark:ring-gray-800">
                    
                    {/* Status Bar */}
                    <div className="h-7 w-full bg-black text-white text-[10px] flex justify-between px-5 items-center z-20">
                        <span>09:41</span>
                        <div className="flex gap-1">
                            <Wifi size={10} />
                            <div className="w-5 h-2 bg-white rounded-[2px]"></div>
                        </div>
                    </div>

                    {/* App Content */}
                    <div className="flex-1 bg-gray-50 relative flex flex-col font-sans overflow-hidden" style={{ fontFamily: brandingConfig.fontFamily }}>
                        
                        {/* Header Area */}
                        <div className="p-5 pt-4 pb-12 transition-colors duration-500" style={{ backgroundColor: brandingConfig.primaryColor }}>
                            <div className="flex justify-between items-center text-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white rounded-lg p-1 shadow-sm">
                                        <img src={brandingConfig.logoUrl} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-black text-lg tracking-tight">{brandingConfig.appName}</span>
                                </div>
                                <div className="w-8 h-8 bg-white/20 rounded-full"></div>
                            </div>
                            <p className="text-white/80 text-xs mt-2 font-medium">{brandingConfig.tagline}</p>
                        </div>

                        {/* Floating Card (Glassmorphism Check) */}
                        <div 
                            className={`mx-4 -mt-6 p-4 bg-white rounded-[${brandingConfig.borderRadius}] shadow-lg relative z-10 transition-all duration-300`}
                            style={{ 
                                borderRadius: brandingConfig.borderRadius,
                                backgroundColor: brandingConfig.glassmorphism ? 'rgba(255, 255, 255, 0.85)' : '#ffffff',
                                backdropFilter: brandingConfig.glassmorphism ? 'blur(10px)' : 'none',
                                border: brandingConfig.glassmorphism ? '1px solid rgba(255,255,255,0.5)' : 'none'
                            }}
                        >
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Points Eco</p>
                                    <h3 className="text-2xl font-black text-gray-800">2,450</h3>
                                </div>
                                <div className="p-2 rounded-full text-white" style={{ backgroundColor: brandingConfig.secondaryColor }}>
                                    <Check size={16} />
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[70%]" style={{ backgroundColor: brandingConfig.primaryColor }}></div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div 
                                    key={i} 
                                    className="h-24 bg-white shadow-sm flex flex-col items-center justify-center gap-2 transition-all duration-300"
                                    style={{ borderRadius: brandingConfig.borderRadius }}
                                >
                                    <div 
                                        className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                        style={{ backgroundColor: `${brandingConfig.primaryColor}20`, color: brandingConfig.primaryColor }}
                                    >
                                        <div className="w-4 h-4 bg-current rounded-sm"></div>
                                    </div>
                                    <div className="h-2 w-16 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom CTA Button */}
                        <div className="p-4 mt-auto">
                            <button 
                                className="w-full py-3 text-white font-bold shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                                style={{ 
                                    borderRadius: brandingConfig.borderRadius,
                                    background: brandingConfig.buttonStyle === 'gradient' 
                                        ? `linear-gradient(135deg, ${brandingConfig.primaryColor}, ${brandingConfig.secondaryColor})`
                                        : brandingConfig.buttonStyle === 'outline'
                                            ? 'transparent'
                                            : brandingConfig.primaryColor,
                                    border: brandingConfig.buttonStyle === 'outline' ? `2px solid ${brandingConfig.primaryColor}` : 'none',
                                    color: brandingConfig.buttonStyle === 'outline' ? brandingConfig.primaryColor : '#fff'
                                }}
                            >
                                <span className="w-4 h-4 bg-current rounded-full"></span>
                                Action Principale
                            </button>
                        </div>

                        {/* Floating Tab Bar */}
                        <div className="mx-4 mb-2 h-14 bg-white rounded-full shadow-xl flex items-center justify-around px-2 relative z-20">
                             {[1,2,3,4].map(i => <div key={i} className={`w-6 h-6 rounded-full ${i===1 ? '' : 'bg-gray-200'}`} style={{ backgroundColor: i===1 ? brandingConfig.primaryColor : undefined }}></div>)}
                        </div>

                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center max-w-[250px]">
                    Le rendu est une approximation. Les changements sont appliqués instantanément.
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Administration Système</h2>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('system')} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'system' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-white shadow-sm' : 'text-gray-500'}`}><Settings size={16} /> Système</button>
                    <button onClick={() => setActiveTab('security')} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'security' ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-white shadow-sm' : 'text-gray-500'}`}><Shield size={16} /> Sécurité</button>
                    <button onClick={() => setActiveTab('plans')} className={`flex-1 min-w-[120px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'plans' ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-white shadow-sm' : 'text-gray-500'}`}><DollarSign size={16} /> Plans</button>
                    <button onClick={() => setActiveTab('branding')} className={`flex-1 min-w-[100px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'branding' ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-white shadow-sm' : 'text-gray-500'}`}><Palette size={16} /> Branding</button>
                    <button onClick={() => setActiveTab('pos')} className={`flex-1 min-w-[120px] py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'pos' ? 'bg-white dark:bg-gray-600 text-[#2962FF] dark:text-white shadow-sm' : 'text-gray-500'}`}><Receipt size={16} /> Caisse</button>
                </div>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6">
                {activeTab === 'system' && renderSystemTab()}
                {activeTab === 'security' && renderSecurityTab()}
                {activeTab === 'plans' && renderPlansTab()}
                {activeTab === 'branding' && renderBrandingTab()}
                {activeTab === 'pos' && renderPOS()}
            </div>
        </div>
    );
};
