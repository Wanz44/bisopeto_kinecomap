
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Search, User, DollarSign, Check, X, Printer, 
    Download, QrCode as QrIcon, Calendar, Clock, ShieldCheck, 
    Loader2, Receipt, Phone, MapPin, ChevronRight, Filter, AlertTriangle
} from 'lucide-react';
import { User as AppUser, Payment, UserType } from '../types';
import { UserAPI, PaymentsAPI } from '../services/api';

const KINSHASA_COMMUNES = [
    "Barumbu", "Bumbu", "Bandalungwa", "Gombe", "Kalamu", "Kasa-Vubu", 
    "Kinshasa", "Kintambo", "Lingwala", "Lemba", "Limete", "Makala", 
    "Maluku", "Masina", "Matete", "Mont Ngafula", "Mbinza", "Ngaba", 
    "Ngaliema", "N’djili", "Nsele", "Selembao", "Kimbanseke", "Kisenso"
];

interface AdminRecoveryProps {
    onBack: () => void;
    currentUser: AppUser;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminRecovery: React.FC<AdminRecoveryProps> = ({ onBack, currentUser, onToast }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCommune, setFilterCommune] = useState('all');
    
    // Recovery Logic States
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [amount, setAmount] = useState('');
    const [period, setPeriod] = useState(() => {
        const date = new Date();
        return `${date.toLocaleString('fr-FR', { month: 'long' })} ${date.getFullYear()}`;
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedInvoice, setGeneratedInvoice] = useState<Payment | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [uData, pData] = await Promise.all([
                UserAPI.getAll(),
                PaymentsAPI.getAll()
            ]);
            setUsers(uData.filter(u => u.type !== UserType.ADMIN));
            setPayments(pData);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleProcessPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || !amount || isProcessing) return;

        setIsProcessing(true);
        try {
            const amountNum = parseFloat(amount);
            const invoiceId = `BISO-${Date.now().toString().slice(-8)}`;
            
            const paymentData: Payment = {
                id: invoiceId,
                userId: selectedUser.id!,
                userName: `${selectedUser.firstName} ${selectedUser.lastName}`,
                amountFC: amountNum,
                currency: 'FC',
                method: 'cash',
                period: period,
                collectorId: currentUser.id!,
                collectorName: `${currentUser.firstName} ${currentUser.lastName}`,
                createdAt: new Date().toISOString(),
                qrCodeData: `VALIDATE:${invoiceId}:${selectedUser.id}:${amountNum}`,
                status: 'released'
            };

            const saved = await PaymentsAPI.record(paymentData);
            setPayments([saved, ...payments]);
            setGeneratedInvoice(saved);
            
            if (onToast) onToast("Paiement encaissé et facture générée", "success");
            setAmount('');
            setSelectedUser(null);
        } catch (e) {
            if (onToast) onToast("Échec du recouvrement", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = `${u.firstName} ${u.lastName} ${u.phone}`.toLowerCase().includes(search.toLowerCase());
        const matchesCommune = filterCommune === 'all' || u.commune === filterCommune;
        return matchesSearch && matchesCommune;
    });

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Recouvrement Cash</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Encaissement Physique & Facturation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <span className="text-[10px] font-black text-blue-400 uppercase block">Total Cash Jour</span>
                            <span className="text-xl font-black dark:text-white">
                                {payments
                                    .filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString())
                                    .reduce((acc, p) => acc + p.amountFC, 0)
                                    .toLocaleString()} FC
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left: User Selection */}
                <div className="w-full md:w-1/3 flex flex-col border-r dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
                    <div className="p-6 space-y-4 shrink-0">
                        <div className="relative">
                            <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher client..." 
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white focus:ring-2 ring-blue-500"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button 
                                onClick={() => setFilterCommune('all')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${filterCommune === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                            >
                                Toutes
                            </button>
                            {KINSHASA_COMMUNES.map(c => (
                                <button 
                                    key={c} 
                                    onClick={() => setFilterCommune(c)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${filterCommune === c ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs">Aucun client trouvé</div>
                        ) : (
                            filteredUsers.map(user => (
                                <div 
                                    key={user.id} 
                                    onClick={() => setSelectedUser(user)}
                                    className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group ${selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${selectedUser?.id === user.id ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                            {user.firstName[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">{user.firstName} {user.lastName}</h4>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1"><Phone size={10}/> {user.phone}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${user.subscription === 'premium' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>{user.subscription}</span>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">{user.commune}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Payment Action & History */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 no-scrollbar bg-gray-50 dark:bg-gray-950">
                    {/* Payment Form */}
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800 animate-fade-in">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <DollarSign className="text-green-500"/> Encaisser Cash
                        </h3>

                        {selectedUser ? (
                            <form onSubmit={handleProcessPayment} className="space-y-6">
                                <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4 relative">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><User size={24}/></div>
                                    <div>
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Client sélectionné</p>
                                        <p className="font-black text-gray-900 dark:text-white uppercase">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{selectedUser.commune} • {selectedUser.neighborhood}</p>
                                    </div>
                                    <button type="button" onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-1 hover:bg-white rounded-full text-gray-400"><X size={16}/></button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Montant Encaissé (FC)</label>
                                        <div className="relative group">
                                            <DollarSign size={18} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                                            <input 
                                                required
                                                type="number" 
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-lg text-green-600 dark:text-green-400 focus:ring-2 ring-green-500/20"
                                                placeholder="ex: 28000"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Période Couverte</label>
                                        <div className="relative group">
                                            <Calendar size={18} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input 
                                                required
                                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-black text-sm dark:text-white focus:ring-2 ring-green-500/20"
                                                value={period}
                                                onChange={e => setPeriod(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex items-start gap-3">
                                    <AlertTriangle className="text-orange-500 shrink-0 mt-1" size={16}/>
                                    <p className="text-[10px] text-orange-600 dark:text-orange-300 font-bold uppercase leading-relaxed">
                                        En validant, vous confirmez avoir reçu le montant physique. Une facture numérique avec QR Code sera générée pour le client.
                                    </p>
                                </div>

                                <button 
                                    disabled={isProcessing}
                                    className="w-full py-5 bg-[#00C853] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                                    {isProcessing ? "Encaissement..." : "Valider et Générer Facture"}
                                </button>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-4">
                                <User size={48} className="opacity-10" />
                                <p className="font-black uppercase text-xs tracking-widest">Sélectionnez un client à gauche pour commencer</p>
                            </div>
                        )}
                    </div>

                    {/* Recent History */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transactions récentes</h3>
                        {payments.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 text-xs italic">Aucune transaction enregistrée</p>
                        ) : (
                            payments.slice(0, 5).map(pay => (
                                <div key={pay.id} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Receipt size={18}/></div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase text-xs">{pay.userName}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">{pay.id} • {pay.period}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 dark:text-white">{pay.amountFC.toLocaleString()} FC</p>
                                        <button onClick={() => setGeneratedInvoice(pay)} className="text-[9px] font-black text-blue-500 uppercase hover:underline">Reçu QR</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* INVOICE MODAL with QR CODE */}
            {generatedInvoice && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setGeneratedInvoice(null)}></div>
                    <div className="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        {/* Digital Receipt Design */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-8 opacity-10"><Receipt size={120} /></div>
                             <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/30">
                                <ShieldCheck size={40} />
                             </div>
                             <h3 className="text-2xl font-black uppercase tracking-tighter">Paiement Validé</h3>
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Reçu Officiel Biso Peto</p>
                        </div>
                        
                        <div className="p-8 space-y-8">
                            <div className="flex justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 relative group">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generatedInvoice.qrCodeData)}&bgcolor=f9fafb`} 
                                    alt="QR Code Facture"
                                    className="w-40 h-40 dark:invert-[0.1]"
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 rounded-[2.5rem] transition-opacity">
                                    <QrIcon className="text-blue-500" size={32}/>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between border-b dark:border-gray-800 pb-2 text-sm font-bold uppercase tracking-tight">
                                    <span className="text-gray-400">Client</span>
                                    <span className="dark:text-white text-right">{generatedInvoice.userName}</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-800 pb-2 text-sm font-bold uppercase tracking-tight">
                                    <span className="text-gray-400">Montant</span>
                                    <span className="text-green-500">{generatedInvoice.amountFC.toLocaleString()} FC</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-800 pb-2 text-sm font-bold uppercase tracking-tight">
                                    <span className="text-gray-400">Période</span>
                                    <span className="dark:text-white">{generatedInvoice.period}</span>
                                </div>
                                <div className="flex justify-between border-b dark:border-gray-800 pb-2 text-sm font-bold uppercase tracking-tight">
                                    <span className="text-gray-400">N° Facture</span>
                                    <span className="text-blue-500">{generatedInvoice.id}</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200"><Printer size={16}/> Imprimer</button>
                                <button className="flex-1 py-4 bg-[#2962FF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"><Download size={16}/> Partager</button>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center">
                             <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Généré le {new Date(generatedInvoice.createdAt).toLocaleString('fr-FR')} par {generatedInvoice.collectorName}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
