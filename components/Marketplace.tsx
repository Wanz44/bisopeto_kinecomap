import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, Search, Filter, DollarSign, Scale, Tag, Check, Loader2, Image as ImageIcon, MapPin, X, Plus, Phone, MessageCircle, ChevronDown, SlidersHorizontal, ArrowUpRight, Sparkles, User, Info, Star, ShieldCheck, Lock, CreditCard, Smartphone, ShoppingBag, Calendar, ExternalLink, PackageCheck, AlertTriangle } from 'lucide-react';
import { MarketplaceItem, User as UserType, SystemSettings } from '../types';
import { analyzeWasteItem } from '../services/geminiService';
import { MarketplaceAPI, StorageAPI } from '../services/api';

interface MarketplaceProps {
    user: UserType;
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    systemSettings: SystemSettings;
}

const CATEGORIES = [
    { id: 'all', label: 'Tout', icon: null },
    { id: 'electronics', label: 'Électronique', icon: '💻' },
    { id: 'metal', label: 'Métaux', icon: '🔩' },
    { id: 'plastic', label: 'Plastique', icon: '🥤' },
    { id: 'other', label: 'Autre', icon: '📦' },
];

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onBack, onToast, systemSettings }) => {
    const [view, setView] = useState<'browse' | 'sell' | 'history'>('browse');
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    
    // Ratings State (Simulé pour l'instant)
    const [sellerRatings, setSellerRatings] = useState<Record<string, { average: number, count: number }>>({
        'u2': { average: 4.5, count: 12 },
        'u3': { average: 4.8, count: 30 }
    });

    // Filters & Search
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'price_asc' | 'price_desc'>('date');
    const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

    // Transaction & Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
    const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card'>('mobile');

    // Contact Modal State
    const [contactItem, setContactItem] = useState<MarketplaceItem | null>(null);

    // Sell Form State
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null); // New state for file
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [analysisStep, setAnalysisStep] = useState(0); 
    const [sellForm, setSellForm] = useState<Partial<MarketplaceItem>>({
        category: 'electronics',
        price: 0,
        weight: 0,
        title: '',
        description: ''
    });
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Data Loading ---
    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setIsLoadingItems(true);
        try {
            const data = await MarketplaceAPI.getAll();
            setItems(data);
        } catch (error) {
            console.error("Failed to load marketplace items", error);
            if (onToast) onToast("Erreur de chargement des annonces", "error");
        } finally {
            setIsLoadingItems(false);
        }
    };

    // --- Logic ---

    const handleContactClick = (e: React.MouseEvent, item: MarketplaceItem) => {
        e.stopPropagation();
        setContactItem(item);
    };

    const handleStartChat = () => {
        if (onToast) onToast(`Chat ouvert avec ${contactItem?.sellerName}`, "info");
        setContactItem(null);
        // Ici, redirection vers le module de chat
    };

    const handleCall = () => {
        window.open('tel:+243000000000');
        setContactItem(null);
    };

    const handleWhatsApp = () => {
        window.open(`https://wa.me/?text=Bonjour ${contactItem?.sellerName}, je suis intéressé par votre annonce : ${contactItem?.title}`);
        setContactItem(null);
    };

    const handleBuyClick = (e: React.MouseEvent, item: MarketplaceItem) => {
        e.stopPropagation();
        setSelectedItem(item);
        setPaymentStep('details');
        setShowPaymentModal(true);
    };

    const handleProcessPayment = async () => {
        if (!selectedItem) return;

        setPaymentStep('processing');
        setTimeout(async () => {
            if (selectedItem) {
                // Change status to pending_delivery instead of sold immediately
                const updatedItem = { ...selectedItem, status: 'pending_delivery' as const };
                await MarketplaceAPI.update(updatedItem);
                setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
                
                setPaymentStep('success');
                if (onToast) onToast("Fonds bloqués et sécurisés. En attente de livraison.", "success");
            }
        }, 2000);
    };

    const handleConfirmReceipt = async (item: MarketplaceItem) => {
        const confirmed = window.confirm(
            `Confirmez-vous avoir bien reçu l'article "${item.title}" ?\n\n` +
            `Cette action est irréversible et libérera les fonds au vendeur.`
        );

        if (confirmed) {
            const updatedItem = { ...item, status: 'sold' as const };
            await MarketplaceAPI.update(updatedItem);
            setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
            if (onToast) onToast("Réception confirmée. Fonds libérés au vendeur.", "success");
        }
    };

    const handleDispute = (item: MarketplaceItem) => {
        alert("Un ticket de support a été ouvert pour cette transaction. Les fonds restent bloqués jusqu'à résolution.");
        if (onToast) onToast("Litige signalé. Support contacté.", "info");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file); // Store file for upload
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setCapturedImage(base64);
                
                setIsAnalyzing(true);
                setAnalysisStep(1);
                
                setTimeout(() => setAnalysisStep(2), 1000);
                setTimeout(() => setAnalysisStep(3), 2500);

                try {
                    const analysis = await analyzeWasteItem(base64);
                    setTimeout(() => {
                        setSellForm({
                            ...sellForm,
                            title: analysis.title,
                            category: analysis.category,
                            weight: analysis.weight,
                            price: analysis.price,
                            description: analysis.description
                        });
                        setIsAnalyzing(false);
                        setAnalysisStep(0);
                        if (onToast) onToast("Analyse terminée !", "success");
                    }, 3500); 
                    
                } catch (err) {
                    setIsAnalyzing(false);
                    setAnalysisStep(0);
                    if (onToast) onToast("Erreur d'analyse.", "error");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sellForm.title || !sellForm.price || !capturedImage) {
            if (onToast) onToast("Champs manquants.", "error");
            return;
        }

        setIsPublishing(true);

        // Upload Image First
        let imageUrl = capturedImage;
        if (imageFile) {
            const uploadedUrl = await StorageAPI.uploadImage(imageFile, 'marketplace');
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                if (onToast) onToast("Erreur upload image, utilisation locale.", "error");
            }
        }

        const newItem: MarketplaceItem = {
            id: '', // Sera généré par l'API
            sellerId: user.id || 'unknown',
            sellerName: `${user.firstName} ${user.lastName?.charAt(0)}.`,
            title: sellForm.title,
            category: sellForm.category as any,
            description: sellForm.description || '',
            weight: Number(sellForm.weight),
            price: Number(sellForm.price),
            imageUrl: imageUrl, // Use the uploaded URL
            date: new Date().toLocaleDateString('fr-FR'),
            status: 'available'
        };

        try {
            const createdItem = await MarketplaceAPI.add(newItem);
            setItems([createdItem, ...items]);
            if (onToast) onToast("Annonce publiée !", "success");
            setView('browse');
            setCapturedImage(null);
            setImageFile(null);
            setSellForm({ category: 'electronics', price: 0, weight: 0, title: '', description: '' });
        } catch (e) {
             if (onToast) onToast("Erreur lors de la publication.", "error");
        } finally {
            setIsPublishing(false);
        }
    };

    const filteredItems = items
        .filter(i => filterCategory === 'all' || i.category === filterCategory)
        .filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.description.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            return 0;
        });

    const pendingItems = items.filter(i => i.status === 'pending_delivery');
    const soldItems = items.filter(i => i.status === 'sold');

    const ItemCard: React.FC<{ item: MarketplaceItem }> = ({ item }) => {
        const ratingData = sellerRatings[item.sellerId] || { average: 0, count: 0 };

        return (
            <div onClick={() => setSelectedItem(item)} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col h-full relative">
                <div className="h-40 bg-gray-200 relative overflow-hidden">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
                        {CATEGORIES.find(c => c.id === item.category)?.icon} {item.category}
                    </div>
                    {item.status !== 'available' && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                            <span className={`${item.status === 'sold' ? 'bg-red-500' : 'bg-orange-500'} text-white font-bold px-4 py-1 rounded-full border-2 border-white transform -rotate-12`}>
                                {item.status === 'sold' ? 'VENDU' : 'RÉSERVÉ'}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="p-3 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-800 dark:text-white text-sm line-clamp-1 mb-1">{item.title}</h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{item.sellerName}</span>
                        <div className="flex items-center gap-0.5">
                            <Star size={10} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{ratingData.average > 0 ? ratingData.average.toFixed(1) : '-'}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-50 dark:border-gray-700">
                        <div className="text-[#00C853] font-black">{item.price.toLocaleString()} FC</div>
                         <div className="flex gap-1">
                            <button 
                                onClick={(e) => handleContactClick(e, item)} 
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1"
                                title="Contacter"
                            >
                                <MessageCircle size={16}/>
                                <span className="hidden sm:inline text-xs font-bold">Chat</span>
                            </button>
                            {item.status === 'available' && (
                                <button 
                                    onClick={(e) => handleBuyClick(e, item)} 
                                    className="px-3 py-2 bg-[#2962FF] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Acheter
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const SecurePaymentModal = () => { 
        if (!showPaymentModal || !selectedItem) return null;
        
        const commissionRate = systemSettings.marketplaceCommission || 0.05;
        const fee = selectedItem.price * commissionRate;
        const total = selectedItem.price + fee;

        return (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-scale-up">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5 text-white flex justify-between items-center">
                        <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck size={20} className="text-[#00C853]"/> Paiement Sécurisé</h3>
                        <button onClick={()=>setShowPaymentModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
                    </div>
                    
                    {paymentStep === 'details' && (
                        <div className="p-6">
                            <div className="mb-6 text-center">
                                <p className="text-gray-500 text-sm mb-1">Montant à payer</p>
                                <h2 className="text-3xl font-black text-gray-800 dark:text-white">{total.toLocaleString()} FC</h2>
                            </div>

                            <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Prix de l'article</span>
                                    <span className="font-bold dark:text-white">{selectedItem.price.toLocaleString()} FC</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-1"><Info size={12}/> Frais de protection</span>
                                    <span className="font-bold dark:text-white">{fee.toLocaleString()} FC</span>
                                </div>
                                <div className="h-px bg-gray-200 dark:bg-gray-600 my-1"></div>
                                <div className="flex justify-between text-sm font-bold">
                                    <span className="text-gray-800 dark:text-white">Total</span>
                                    <span className="text-[#2962FF]">{total.toLocaleString()} FC</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3 mb-6">
                                <Lock size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    <strong>Fonds bloqués (Escrow) :</strong> Le vendeur ne recevra l'argent qu'une fois que vous aurez confirmé la réception de l'article conforme.
                                </p>
                            </div>

                            <button onClick={handleProcessPayment} className="w-full py-4 bg-[#00C853] hover:bg-green-600 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all">
                                <CreditCard size={18} /> Payer et Sécuriser
                            </button>
                        </div>
                    )}

                    {paymentStep === 'processing' && (
                        <div className="p-10 flex flex-col items-center justify-center text-center">
                            <Loader2 size={48} className="text-[#2962FF] animate-spin mb-4" />
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Sécurisation des fonds...</h3>
                            <p className="text-sm text-gray-500">Veuillez ne pas fermer cette fenêtre.</p>
                        </div>
                    )}

                    {paymentStep === 'success' && (
                        <div className="p-8 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-[#00C853] mb-4 animate-bounce">
                                <ShieldCheck size={40} />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">Paiement Validé !</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Les fonds sont bloqués. Contactez le vendeur pour récupérer votre article.
                            </p>
                            <button onClick={() => { setShowPaymentModal(false); setView('history'); }} className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold">
                                Voir mes commandes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const ContactOptionModal = () => {
        if (!contactItem) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setContactItem(null)}></div>
                <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-scale-up">
                    <button onClick={() => setContactItem(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                    </button>
                    
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-600 shadow-sm relative">
                            <User size={40} className="text-gray-400 dark:text-gray-300" />
                            <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"></div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">{contactItem.sellerName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Vendeur certifié • Réponse &lt; 1h</p>
                    </div>

                    <div className="space-y-3">
                        <button onClick={handleStartChat} className="w-full py-4 bg-[#2962FF] hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-500/20">
                            <MessageCircle size={20} />
                            Démarrer le chat
                        </button>
                        
                        <button onClick={handleCall} className="w-full py-4 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors">
                            <Phone size={20} />
                            Appeler le vendeur
                        </button>

                        <button onClick={handleWhatsApp} className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-green-500/20">
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            WhatsApp
                        </button>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-xs text-gray-400">
                            Ne communiquez jamais vos informations personnelles bancaires hors de l'application.
                        </p>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
             <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"><ArrowLeft size={20} /></button>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                        {view === 'history' ? 'Mes Achats' : 'Marketplace'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    {view === 'browse' && (
                        <>
                            <button 
                                onClick={() => setView('history')} 
                                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                                title="Mes Achats"
                            >
                                <ShoppingBag size={20} />
                                {pendingItems.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                                        {pendingItems.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setView('sell')} 
                                className="bg-[#00C853] text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-lg"
                            >
                                <Camera size={18} /> <span className="hidden md:inline">Vendre</span>
                            </button>
                        </>
                    )}
                    {(view === 'sell' || view === 'history') && (
                        <button 
                            onClick={() => setView('browse')} 
                            className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Fermer
                        </button>
                    )}
                </div>
            </div>

            {view === 'browse' && (
                <div className="flex-1 overflow-y-auto p-4">
                     {/* Enhanced Search Bar */}
                     <div className="mb-4 sticky top-0 z-20 bg-[#F5F7FA] dark:bg-gray-900 pb-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                placeholder="Rechercher des articles..." 
                                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-[#2962FF] transition-all shadow-sm" 
                                value={searchQuery} 
                                onChange={e => setSearchQuery(e.target.value)} 
                            />
                        </div>
                        
                        {/* Categories Chips */}
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setFilterCategory(cat.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                                        filterCategory === cat.id 
                                        ? 'bg-[#2962FF] text-white shadow-md' 
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
                                    }`}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                     </div>
                     
                     {isLoadingItems ? (
                         <div className="flex justify-center py-20"><Loader2 size={40} className="animate-spin text-[#2962FF]" /></div>
                     ) : (
                         <>
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 flex flex-col items-center gap-2">
                                    <Search size={48} className="opacity-20" />
                                    <p>Aucune annonce trouvée.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                                    {filteredItems.map(item => <ItemCard key={item.id} item={item} />)}
                                </div>
                            )}
                         </>
                     )}
                </div>
            )}

            {view === 'sell' && (
                 <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
                    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Nouvelle Annonce</h2>
                        
                        <div className="mb-4 relative h-48 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                            {capturedImage ? <img src={capturedImage} className="w-full h-full object-cover" /> : <div className="text-center text-gray-400"><Camera size={32} className="mx-auto mb-2" />Photo</div>}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            {isAnalyzing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white flex-col gap-2"><Loader2 className="animate-spin" /> Analyse IA...</div>}
                        </div>

                        <form onSubmit={handlePublish} className="space-y-4">
                            <input type="text" placeholder="Titre" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={sellForm.title} onChange={e => setSellForm({...sellForm, title: e.target.value})} />
                            <input type="number" placeholder="Prix (FC)" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={sellForm.price} onChange={e => setSellForm({...sellForm, price: parseFloat(e.target.value)})} />
                            <textarea rows={3} placeholder="Description" className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" value={sellForm.description} onChange={e => setSellForm({...sellForm, description: e.target.value})} />
                            
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setView('browse')} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Annuler</button>
                                <button 
                                    type="submit" 
                                    disabled={isPublishing}
                                    className="flex-1 py-3 bg-[#2962FF] text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                    {isPublishing ? 'Envoi...' : 'Publier'}
                                </button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}

            {/* --- HISTORY VIEW --- */}
            {view === 'history' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {pendingItems.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <PackageCheck size={16} /> En cours de livraison ({pendingItems.length})
                            </h3>
                            {pendingItems.map(item => (
                                <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border-2 border-orange-100 dark:border-orange-900/30 flex flex-col gap-4 animate-fade-in">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-800 dark:text-white line-clamp-1">{item.title}</h4>
                                                <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Bloqué</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Vendeur: {item.sellerName}</p>
                                            <p className="text-[#00C853] font-bold mt-2">{item.price.toLocaleString()} FC</p>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-xs text-orange-800 dark:text-orange-300 flex gap-2">
                                        <Lock size={16} className="shrink-0" />
                                        Fonds sécurisés. Confirmez la réception uniquement si l'article est conforme.
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => handleDispute(item)}
                                            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                                        >
                                            <AlertTriangle size={14} /> Signaler
                                        </button>
                                        <button 
                                            onClick={() => handleConfirmReceipt(item)}
                                            className="flex-[2] py-2.5 bg-[#00C853] hover:bg-green-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            <Check size={14} /> J'ai reçu l'article
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <ShoppingBag size={16} /> Terminés ({soldItems.length})
                        </h3>
                        {soldItems.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">Aucun achat terminé.</div>
                        ) : (
                            soldItems.map(item => {
                                const commissionRate = systemSettings.marketplaceCommission || 0.05;
                                const fee = item.price * commissionRate;
                                const total = item.price + fee;

                                return (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden shrink-0">
                                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-800 dark:text-white line-clamp-1">{item.title}</h4>
                                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Payé</span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vendeur: {item.sellerName}</p>
                                            </div>
                                            
                                            <div className="flex justify-between items-end mt-2">
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Calendar size={12} /> {item.date}
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-[#2962FF]">{total.toLocaleString()} FC</div>
                                                    <div className="text-[10px] text-gray-400">Dont frais: {fee.toLocaleString()} FC</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
            
            {/* Modals */}
            <SecurePaymentModal />
            <ContactOptionModal />
        </div>
    );
};