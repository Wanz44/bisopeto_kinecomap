
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, Search, Filter, DollarSign, Scale, Tag, Check, Loader2, Image as ImageIcon, MapPin, X, Plus, Phone, MessageCircle, ChevronDown, SlidersHorizontal, ArrowUpRight, Sparkles, User, Info, Star, ShieldCheck, Lock, CreditCard, Smartphone, ShoppingBag, Calendar, ExternalLink, PackageCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { MarketplaceItem, User as UserType, SystemSettings, Payment } from '../types';
import { analyzeWasteItem } from '../services/geminiService';
import { MarketplaceAPI, StorageAPI, PaymentsAPI, AuditAPI } from '../services/api';
import { ImageService } from '../services/imageService';

interface MarketplaceProps {
    user: UserType;
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    systemSettings: SystemSettings;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onBack, onToast, systemSettings }) => {
    const [view, setView] = useState<'browse' | 'sell' | 'history'>('browse');
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    
    // Logic States
    const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [sellForm, setSellForm] = useState<Partial<MarketplaceItem>>({ category: 'electronics', price: 0, weight: 0, title: '', description: '' });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadItems(); }, []);

    const loadItems = async () => {
        setIsLoadingItems(true);
        try {
            const data = await MarketplaceAPI.getAll();
            setItems(data);
        } finally { setIsLoadingItems(false); }
    };

    const handleBuyClick = (item: MarketplaceItem) => {
        setSelectedItem(item);
        setPaymentStep('details');
        setShowPaymentModal(true);
    };

    const handleProcessPayment = async () => {
        if (!selectedItem) return;
        setPaymentStep('processing');

        try {
            const paymentId = `ESC-${Date.now().toString().slice(-6)}`;
            const payment: Payment = {
                id: paymentId,
                userId: user.id!,
                userName: user.firstName,
                amountFC: selectedItem.price,
                currency: 'FC',
                method: 'mobile_money',
                period: 'Immediate',
                collectorId: 'SYSTEM',
                collectorName: 'Escrow Wallet',
                createdAt: new Date().toISOString(),
                qrCodeData: `ESCROW:${paymentId}`,
                status: 'escrow'
            };

            await PaymentsAPI.record(payment);
            await MarketplaceAPI.update({ id: selectedItem.id, status: 'pending_delivery', buyerId: user.id });
            
            await AuditAPI.log({ userId: user.id, action: 'ESCROW_PAYMENT', entity: 'MARKETPLACE', entityId: selectedItem.id, metadata: { paymentId } });

            setItems(prev => prev.map(i => i.id === selectedItem.id ? { ...i, status: 'pending_delivery', buyerId: user.id } : i));
            setPaymentStep('success');
        } catch (e) { onToast?.("Échec du paiement", "error"); }
    };

    const handleConfirmReceipt = async (item: MarketplaceItem) => {
        if (!confirm("Avez-vous bien reçu l'article conforme ? L'argent sera versé au vendeur.")) return;
        
        try {
            await MarketplaceAPI.update({ id: item.id, status: 'sold' });
            // Simulation libération des fonds
            await AuditAPI.log({ userId: user.id, action: 'RELEASE_FUNDS', entity: 'PAYMENT', entityId: item.id });
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'sold' } : i));
            onToast?.("Fonds débloqués. Merci pour votre achat !", "success");
        } catch (e) { onToast?.("Erreur lors de la validation", "error"); }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsAnalyzing(true);
            try {
                const compressed = await ImageService.compressImage(file);
                setImageFile(compressed);
                const b64 = await ImageService.fileToBase64(compressed);
                setCapturedImage(b64);
                
                const analysis = await analyzeWasteItem(b64);
                setSellForm({ ...sellForm, ...analysis });
            } finally { setIsAnalyzing(false); }
        }
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPublishing(true);
        try {
            let finalUrl = capturedImage;
            if (imageFile) {
                const url = await StorageAPI.uploadImage(imageFile);
                if (url) finalUrl = url;
            }

            const newItem: MarketplaceItem = {
                id: '',
                sellerId: user.id!,
                sellerName: `${user.firstName} ${user.lastName?.charAt(0)}.`,
                title: sellForm.title!,
                category: sellForm.category as any,
                description: sellForm.description || '',
                weight: Number(sellForm.weight),
                price: Number(sellForm.price),
                imageUrl: finalUrl!,
                date: new Date().toLocaleDateString('fr-FR'),
                status: 'available'
            };

            const created = await MarketplaceAPI.add(newItem);
            setItems([created, ...items]);
            onToast?.("Annonce publiée !", "success");
            setView('browse');
        } finally { setIsPublishing(false); }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative">
             <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft/></button>
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">{view === 'history' ? 'Mes Transactions' : 'Marché Biso Peto'}</h2>
                </div>
                <div className="flex gap-2">
                    {view === 'browse' && (
                        <button onClick={() => setView('history')} className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 dark:text-white relative"><ShoppingBag size={20}/></button>
                    )}
                    {view === 'browse' && (
                        <button onClick={() => setView('sell')} className="bg-[#00C853] text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg"><Camera size={18}/> Vendre</button>
                    )}
                    {view !== 'browse' && (
                        <button onClick={() => setView('browse')} className="p-2 dark:text-white font-black uppercase text-[10px]">Retour</button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
                {view === 'browse' && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.filter(i => i.status === 'available').map(item => (
                            <div key={item.id} onClick={() => handleBuyClick(item)} className="bg-white dark:bg-gray-800 rounded-[2.5rem] border dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col">
                                <div className="h-40 relative overflow-hidden">
                                    <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-white font-black text-[10px] uppercase">{item.price.toLocaleString()} FC</div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col justify-between">
                                    <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs truncate leading-none mb-2">{item.title}</h4>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">S</div>
                                        {item.sellerName}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'sell' && (
                    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-[3.5rem] p-8 shadow-2xl border dark:border-gray-700 animate-scale-up">
                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-8">Vendre un objet</h3>
                        <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-gray-50 dark:bg-white/5 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 mb-8 flex flex-col items-center justify-center gap-4 cursor-pointer relative overflow-hidden">
                            {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <><ImageIcon size={40} className="text-gray-300"/><span className="text-[10px] font-black uppercase text-gray-400">Photo de l'objet</span></>}
                            {isAnalyzing && <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin mb-2" /><span className="text-[10px] font-black uppercase">Analyse IA...</span></div>}
                        </div>
                        <form onSubmit={handlePublish} className="space-y-4">
                            <input className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white" placeholder="Titre" value={sellForm.title} onChange={e=>setSellForm({...sellForm, title: e.target.value})} required />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-sm dark:text-white" placeholder="Prix FC" value={sellForm.price} onChange={e=>setSellForm({...sellForm, price: Number(e.target.value)})} required />
                                <select className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none font-black text-[10px] uppercase dark:text-white" value={sellForm.category} onChange={e=>setSellForm({...sellForm, category: e.target.value as any})}>
                                    <option value="electronics">Électronique</option><option value="metal">Métaux</option><option value="plastic">Plastique</option><option value="other">Autre</option>
                                </select>
                            </div>
                            <button disabled={isPublishing} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                {isPublishing ? <Loader2 className="animate-spin" /> : <><Check size={20}/> Publier l'annonce</>}
                            </button>
                        </form>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                )}

                {view === 'history' && (
                    <div className="space-y-6">
                        {items.filter(i => i.buyerId === user.id || i.sellerId === user.id).map(item => (
                            <div key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-700 flex gap-6 animate-fade-in">
                                <img src={item.imageUrl} className="w-24 h-24 rounded-3xl object-cover shrink-0" />
                                <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-black dark:text-white uppercase text-sm tracking-tight">{item.title}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{item.sellerId === user.id ? 'Vous vendez' : `Vendu par ${item.sellerName}`}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase text-white ${item.status === 'pending_delivery' ? 'bg-orange-500' : 'bg-blue-500'}`}>{item.status}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-4">
                                        <div className="font-black text-blue-600">{item.price.toLocaleString()} FC</div>
                                        {item.status === 'pending_delivery' && item.buyerId === user.id && (
                                            <button onClick={()=>handleConfirmReceipt(item)} className="px-4 py-2 bg-[#00C853] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20">Confirmer Réception</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECURE ESCROW MODAL */}
            {showPaymentModal && selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={()=>setShowPaymentModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] w-full max-w-sm overflow-hidden relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
                            <h3 className="font-black uppercase text-sm flex items-center gap-2"><ShieldCheck className="text-green-500"/> Escrow Sécurisé</h3>
                            <button onClick={()=>setShowPaymentModal(false)}><X size={20}/></button>
                        </div>
                        
                        {paymentStep === 'details' && (
                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Montant à bloquer</p>
                                    <h2 className="text-3xl font-black dark:text-white">{selectedItem.price.toLocaleString()} FC</h2>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 mb-8 flex gap-4">
                                    <Lock className="text-blue-500 shrink-0" size={24}/>
                                    <p className="text-[10px] text-blue-800 dark:text-blue-300 font-bold uppercase leading-relaxed">Les fonds sont bloqués par Biso Peto. Le vendeur n'est payé que si vous confirmez la livraison sans litige.</p>
                                </div>
                                <button onClick={handleProcessPayment} className="w-full py-5 bg-[#00C853] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"><CreditCard size={18}/> Payer et Sécuriser</button>
                            </div>
                        )}

                        {paymentStep === 'processing' && (
                            <div className="p-16 text-center">
                                <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={40}/>
                                <p className="font-black uppercase text-[10px] text-gray-400 tracking-widest">Création de l'escrow...</p>
                            </div>
                        )}

                        {paymentStep === 'success' && (
                            <div className="p-10 text-center animate-fade-in">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6"><Check size={40} strokeWidth={4}/></div>
                                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter mb-2">Fonds Sécurisés !</h3>
                                <p className="text-xs text-gray-500 font-bold mb-8">Contactez maintenant le vendeur pour organiser la remise de l'article.</p>
                                <button onClick={()=>{setShowPaymentModal(false); setView('history');}} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Fermer</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
