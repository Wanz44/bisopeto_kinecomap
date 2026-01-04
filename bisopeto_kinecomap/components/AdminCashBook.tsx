
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Plus, Wallet, TrendingUp, TrendingDown, Calendar, 
    FileText, Search, DownloadCloud, Trash2, Filter, Loader2,
    CheckCircle2, AlertCircle, X, ChevronRight, Hash, Tag, User, 
    DollarSign, Receipt, Printer, History, RefreshCw, BarChart3, Wifi
} from 'lucide-react';
import { CashBookEntry, User as AppUser } from '../types';
import { CashBookAPI } from '../services/api';
import { supabase } from '../services/supabaseClient';

const CASH_CATEGORIES = {
    in: ["Abonnement", "Dépôt Marketplace", "Partenariat Ads", "Autre Recette"],
    out: ["Fournitures", "Carburant", "Entretien Véhicule", "Salaires", "Frais Fixes", "Autre Dépense"]
};

interface AdminCashBookProps {
    onBack: () => void;
    currentUser: AppUser;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminCashBook: React.FC<AdminCashBookProps> = ({ onBack, currentUser, onToast }) => {
    const [entries, setEntries] = useState<CashBookEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
    const [isLive, setIsLive] = useState(false);

    // CHARGEMENT INITIAL + REAL-TIME
    useEffect(() => {
        loadData();

        if (supabase) {
            const channel = supabase.channel('realtime_cash_book')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_book' }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newRow = payload.new;
                        const mapped: CashBookEntry = {
                            id: newRow.id,
                            date: newRow.created_at,
                            ref: newRow.ref,
                            label: newRow.label,
                            type: newRow.type,
                            category: newRow.category,
                            amount: newRow.amount,
                            userId: newRow.user_id,
                            userName: newRow.user_name
                        };
                        setEntries(prev => [mapped, ...prev]);
                    } else if (payload.eventType === 'DELETE') {
                        setEntries(prev => prev.filter(e => e.id !== payload.old.id));
                    }
                })
                .subscribe((status) => {
                    setIsLive(status === 'SUBSCRIBED');
                });

            return () => { supabase.removeChannel(channel); };
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await CashBookAPI.getAll();
            setEntries(data);
        } catch (e) {
            onToast?.("Erreur chargement cloud", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEntry = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.amount || !newEntry.label) return;
        
        setIsSaving(true);
        try {
            const entry = await CashBookAPI.add({
                ...newEntry,
                userId: currentUser.id,
                userName: `${currentUser.firstName} ${currentUser.lastName}`
            });
            if (entry) {
                setShowAddModal(false);
                onToast?.("Écriture comptable enregistrée", "success");
                setNewEntry({ type: 'in', category: 'Abonnement', amount: 0, label: '', ref: '' });
            }
        } catch (e) {
            onToast?.("Erreur lors de la sauvegarde", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const [newEntry, setNewEntry] = useState<Partial<CashBookEntry>>({
        type: 'in',
        category: 'Abonnement',
        amount: 0,
        label: '',
        ref: ''
    });

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer définitivement cette écriture ?")) return;
        try {
            const success = await CashBookAPI.delete(id);
            if (success) {
                onToast?.("Écriture supprimée", "info");
            }
        } catch (e) {
            onToast?.("Erreur suppression", "error");
        }
    };

    const stats = useMemo(() => {
        const recettes = entries.filter(e => e.type === 'in').reduce((sum, e) => sum + Number(e.amount), 0);
        const depenses = entries.filter(e => e.type === 'out').reduce((sum, e) => sum + Number(e.amount), 0);
        return {
            totalIn: recettes,
            totalOut: depenses,
            balance: recettes - depenses
        };
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries
            .filter(e => {
                const matchesType = filterType === 'all' || e.type === filterType;
                const matchesSearch = e.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     (e.ref && e.ref.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesType && matchesSearch;
            });
    }, [entries, filterType, searchQuery]);

    const exportCSV = () => {
        const headers = ["Date", "Référence", "Libellé", "Catégorie", "Type", "Montant (FC)", "Auteur"];
        const rows = entries.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.ref || 'N/A',
            e.label,
            e.category,
            e.type === 'in' ? 'Recette' : 'Dépense',
            e.amount,
            e.userName
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(r => r.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bisopeto_livre_caisse_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast?.("Export comptable généré", "info");
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 overflow-hidden">
            
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Livre de Caisse</h2>
                                {isLive && <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100 animate-pulse"><Wifi size={10}/><span className="text-[7px] font-black uppercase">Live</span></div>}
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Wallet size={12} className="text-blue-500" /> Comptabilité Espèces (Cash)
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 xl:max-w-3xl">
                        {[
                            { label: 'Solde en Caisse', val: `${stats.balance.toLocaleString()} FC`, icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Total Recettes', val: `${stats.totalIn.toLocaleString()} FC`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Total Dépenses', val: `${stats.totalOut.toLocaleString()} FC`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' }
                        ].map((kpi, i) => (
                            <div key={i} className={`${kpi.bg} dark:bg-gray-800/50 p-4 rounded-2xl border dark:border-gray-700 flex items-center gap-4 shadow-inner`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 ${kpi.color} shadow-sm`}>
                                    <kpi.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{kpi.label}</p>
                                    <p className="text-sm font-black dark:text-white leading-none whitespace-nowrap">{kpi.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={exportCSV} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl hover:scale-105 transition-all shadow-sm" title="Exporter le journal"><DownloadCloud size={20}/></button>
                        <button onClick={() => setShowAddModal(true)} className="bg-[#2962FF] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                            <Plus size={18}/> Nouvelle Écriture
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher par libellé ou référence..." 
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'all' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}>Tous</button>
                        <button onClick={() => setFilterType('in')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'in' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500'}`}>Entrées</button>
                        <button onClick={() => setFilterType('out')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filterType === 'out' ? 'bg-white dark:bg-gray-700 text-red-600 shadow-sm' : 'text-gray-500'}`}>Sorties</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                        <Loader2 className="animate-spin text-blue-500" size={40}/>
                        <p className="text-[10px] font-black uppercase tracking-widest">Lecture des registres...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400 opacity-20 uppercase font-black text-sm tracking-widest gap-4">
                        <FileText size={80}/>
                        <span>Aucune opération enregistrée</span>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border dark:border-gray-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                <tr>
                                    <th className="p-5">Date & Pièce</th>
                                    <th className="p-5">Libellé / Catégorie</th>
                                    <th className="p-5 text-right">Recette (In)</th>
                                    <th className="p-5 text-right">Dépense (Out)</th>
                                    <th className="p-5 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredEntries.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${e.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                    {e.type === 'in' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black dark:text-white">{new Date(e.date).toLocaleDateString()}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase"># {e.ref || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-xs font-black dark:text-white uppercase leading-none mb-1">{e.label}</p>
                                            <span className="text-[8px] font-black text-blue-500 uppercase px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-900/30">{e.category}</span>
                                        </td>
                                        <td className="p-5 text-right">
                                            {e.type === 'in' ? <span className="font-black text-green-600 text-sm">{Number(e.amount).toLocaleString()} FC</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="p-5 text-right">
                                            {e.type === 'out' ? <span className="font-black text-red-500 text-sm">({Number(e.amount).toLocaleString()}) FC</span> : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="p-5 text-center">
                                            <button onClick={() => handleDelete(e.id)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <form onSubmit={handleAddEntry} className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-lg p-10 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Nouvelle Saisie</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Écriture au Grand Livre Cash</p>
                            </div>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X/></button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border dark:border-gray-700">
                                <button type="button" onClick={() => setNewEntry({...newEntry, type: 'in', category: CASH_CATEGORIES.in[0]})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newEntry.type === 'in' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-500'}`}>
                                    <TrendingUp size={14}/> Recette
                                </button>
                                <button type="button" onClick={() => setNewEntry({...newEntry, type: 'out', category: CASH_CATEGORIES.out[0]})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newEntry.type === 'out' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-500'}`}>
                                    <TrendingDown size={14}/> Dépense
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Montant FC</label>
                                    <div className="relative">
                                        <DollarSign size={16} className="absolute left-4 top-3.5 text-gray-400"/>
                                        <input required type="number" className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white" placeholder="0.00" value={newEntry.amount || ''} onChange={e => setNewEntry({...newEntry, amount: Number(e.target.value)})} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Catégorie</label>
                                    <select className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-[10px] uppercase dark:text-white appearance-none" value={newEntry.category} onChange={e => setNewEntry({...newEntry, category: e.target.value})}>
                                        {newEntry.type === 'in' 
                                            ? CASH_CATEGORIES.in.map(c => <option key={c} value={c}>{c}</option>)
                                            : CASH_CATEGORIES.out.map(c => <option key={c} value={c}>{c}</option>)
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Référence Pièce (Facture, Reçu...)</label>
                                <div className="relative">
                                    <Hash size={16} className="absolute left-4 top-3.5 text-gray-400"/>
                                    <input className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white uppercase" placeholder="REF-0000" value={newEntry.ref} onChange={e => setNewEntry({...newEntry, ref: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Libellé de l'opération</label>
                                <div className="relative">
                                    <FileText size={16} className="absolute left-4 top-3.5 text-gray-400"/>
                                    <input required className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white" placeholder="ex: Achat bacs Gombe..." value={newEntry.label} onChange={e => setNewEntry({...newEntry, label: e.target.value})} />
                                </div>
                            </div>

                            <button disabled={isSaving} className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${newEntry.type === 'in' ? 'bg-[#00C853] shadow-green-500/20' : 'bg-red-500 shadow-red-500/20'} text-white`}>
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Receipt size={20}/>}
                                Enregistrer l'écriture
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
