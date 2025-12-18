
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Check, X, ShoppingBag, Eye, Trash2, ShieldCheck, Tag, Info, Loader2, AlertCircle, ExternalLink, Filter, TrendingUp, DollarSign, Package, CheckCircle2 } from 'lucide-react';
import { MarketplaceItem } from '../types';
import { MarketplaceAPI } from '../services/api';

interface AdminMarketplaceProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminMarketplace: React.FC<AdminMarketplaceProps> = ({ onBack, onToast }) => {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'available' | 'sold' | 'pending_delivery'>('all');
    const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const data = await MarketplaceAPI.getAll();
            setItems(data);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const handleModerate = async (id: string, action: 'approve' | 'delete') => {
        if (action === 'delete' && !confirm("Supprimer définitivement cette annonce ?")) return;
        
        if (action === 'delete') {
            setItems(prev => prev.filter(i => i.id !== id));
            if (onToast) onToast("Annonce supprimée", "info");
        } else {
            if (onToast) onToast("Annonce approuvée et publiée", "success");
        }
        setSelectedItem(null);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Marketplace Modération</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flux d'économie circulaire</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                            <span className="text-[10px] font-black text-blue-400 uppercase block">Volume</span>
                            <span className="text-lg font-black dark:text-white">{items.length}</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-2xl border border-green-100 dark:border-green-900/30">
                            <span className="text-[10px] font-black text-green-400 uppercase block">Vendus</span>
                            <span className="text-lg font-black dark:text-white">{items.filter(i => i.status === 'sold').length}</span>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                            <span className="text-[10px] font-black text-orange-400 uppercase block">Attente</span>
                            <span className="text-lg font-black dark:text-white">{items.filter(i => i.status === 'pending_delivery').length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full max-w-lg mt-6 overflow-x-auto no-scrollbar">
                    {['all', 'available', 'pending_delivery', 'sold'].map(f => (
                        <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${filter === f ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}>
                            {f === 'available' ? 'En ligne' : f === 'sold' ? 'Historique' : f === 'pending_delivery' ? 'En cours' : 'Tous'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#2962FF]" size={40} /></div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">Aucune annonce marketplace</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.filter(i => filter === 'all' || i.status === filter).map(item => (
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                                <div className="h-40 relative overflow-hidden">
                                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-4 right-4"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase text-white ${item.status === 'available' ? 'bg-green-500' : item.status === 'sold' ? 'bg-red-500' : 'bg-orange-500'}`}>{item.status}</span></div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate flex-1">{item.title}</h4>
                                        <div className="text-[#00C853] font-black text-sm ml-2">{item.price.toLocaleString()} FC</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                        <Package size={14} className="text-blue-500" /> {item.sellerName}
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-800 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.date}</span>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            <button className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600"><Eye size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Item Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedItem(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="h-48 rounded-3xl overflow-hidden mb-6">
                            <img src={selectedItem.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">{selectedItem.title}</h3>
                        <p className="text-sm text-gray-500 font-bold mb-6 italic">"{selectedItem.description}"</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Prix de vente</span>
                                <span className="text-lg font-black text-[#00C853]">{selectedItem.price.toLocaleString()} FC</span>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                                <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Catégorie</span>
                                <span className="text-lg font-black text-blue-600 uppercase">{selectedItem.category}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => handleModerate(selectedItem.id, 'approve')} className="flex-1 py-4 bg-[#00C853] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20 flex items-center justify-center gap-2"><Check size={18}/> Approuver</button>
                            <button onClick={() => handleModerate(selectedItem.id, 'delete')} className="flex-1 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">Supprimer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
