
import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowLeft, Camera, Upload, MapPin, Loader2, CheckCircle, 
    AlertTriangle, Info, Send, X, Trash2, Clock, Check, 
    Search, Filter, List, Plus, ChevronRight, Calendar, Sparkles,
    MessageCircle, Zap, ShieldAlert, Bot
} from 'lucide-react';
import { analyzeTrashReport, chatAboutWasteImage } from '../services/geminiService';
import { ReportsAPI, StorageAPI } from '../services/api';
import { WasteReport, User } from '../types';

interface ReportingProps {
    user: User;
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const WASTE_TYPES = [
    "Plastique", "Organique", "Gravats", "Électronique", "Métal", "Divers"
];

export const Reporting: React.FC<ReportingProps> = ({ user, onBack, onToast }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    
    // États pour le flux de création
    const [step, setStep] = useState<'camera' | 'analysis' | 'confirm'>('camera');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [wasteType, setWasteType] = useState('Divers');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [comment, setComment] = useState('');
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image Chat State
    const [imageChatQuestion, setImageChatQuestion] = useState('');
    const [imageChatResponse, setImageChatResponse] = useState<string | null>(null);
    const [isChatting, setIsChatting] = useState(false);
    
    // États pour l'historique (Liste)
    const [myReports, setMyReports] = useState<WasteReport[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [filterWasteType, setFilterWasteType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewMode === 'list') {
            loadMyReports();
        }
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, (err) => {
                console.warn("Géolocalisation refusée, utilisation d'une position par défaut.");
                setLocation({ lat: -4.325, lng: 15.322 });
            });
        }
    }, [viewMode]);

    const loadMyReports = async () => {
        setIsLoadingList(true);
        try {
            const all = await ReportsAPI.getAll();
            const mine = all.filter(r => r.reporterId === user.id || r.reporterId === 'anonymous');
            setMyReports(mine);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingList(false);
        }
    };

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setCapturedImage(base64);
                setStep('analysis');
                setIsAnalyzing(true);
                setImageChatResponse(null);
                setImageChatQuestion('');
                
                try {
                    const result = await analyzeTrashReport(base64);
                    setAnalysisData(result);
                    setWasteType(result.wasteType);
                    setUrgency(result.urgency);
                    setComment(result.comment);
                    setStep('confirm');
                } catch (err) {
                    onToast?.("Erreur d'analyse IA. Saisie manuelle.", "error");
                    setStep('confirm');
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAskQuestion = async () => {
        if (!imageChatQuestion.trim() || !capturedImage || isChatting) return;
        setIsChatting(true);
        try {
            const response = await chatAboutWasteImage(capturedImage, imageChatQuestion);
            setImageChatResponse(response);
            setImageChatQuestion('');
        } catch (e) {
            onToast?.("Erreur lors de la conversation IA.", "error");
        } finally {
            setIsChatting(false);
        }
    };

    const handleFinalSubmit = async () => {
        if (!capturedImage || !location) return;
        setIsSubmitting(true);

        const report: WasteReport = {
            id: '',
            reporterId: user.id || 'anonymous',
            lat: location.lat,
            lng: location.lng,
            imageUrl: capturedImage,
            wasteType: wasteType,
            urgency: urgency,
            status: 'pending',
            date: new Date().toISOString(),
            comment: comment
        };

        try {
            await ReportsAPI.add(report);
            onToast?.("Signalement envoyé ! Merci pour votre action.", "success");
            setViewMode('list');
            setStep('camera');
        } catch (e) {
            onToast?.("Erreur lors de l'envoi.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredReports = myReports.filter(r => {
        const matchesType = filterWasteType === 'all' || r.wasteType.toLowerCase().includes(filterWasteType.toLowerCase());
        const matchesSearch = searchQuery === '' || 
            (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) || 
            r.wasteType.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={viewMode === 'create' ? () => setViewMode('list') : onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
                                {viewMode === 'list' ? 'Mes Signalements' : 'Nouvelle Alerte'}
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Biso Peto Alert SIG</p>
                        </div>
                    </div>
                    {viewMode === 'list' && (
                        <button 
                            onClick={() => setViewMode('create')}
                            className="p-3 bg-[#00C853] text-white rounded-2xl shadow-lg shadow-green-500/20 hover:scale-110 active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {viewMode === 'list' && (
                    <div className="space-y-6 animate-fade-in pb-24">
                        <div className="space-y-4">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher dans mes alertes..." 
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-900 border-none outline-none text-sm font-bold shadow-sm dark:text-white" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Trier par type de déchet</label>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    <button 
                                        onClick={() => setFilterWasteType('all')}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${filterWasteType === 'all' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-900 border-transparent text-gray-400'}`}
                                    >
                                        Tous
                                    </button>
                                    {WASTE_TYPES.map(type => (
                                        <button 
                                            key={type}
                                            onClick={() => setFilterWasteType(type)}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${filterWasteType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white dark:bg-gray-900 border-transparent text-gray-400'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {isLoadingList ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Récupération des données...</p>
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center gap-4">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center">
                                    <List size={32} className="opacity-20" />
                                </div>
                                <p className="font-black uppercase text-xs tracking-widest">Aucun signalement trouvé</p>
                                <button onClick={() => setViewMode('create')} className="text-blue-500 font-bold text-sm uppercase underline">Signaler un déchet maintenant</button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredReports.map(report => (
                                    <div key={report.id} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 group transition-all hover:shadow-md">
                                        <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden shrink-0 border-2 border-gray-50 dark:border-gray-800">
                                            <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Déchet" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight truncate">{report.wasteType}</h4>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                    report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                                    report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'
                                                }`}>{report.status}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold line-clamp-1 italic mb-2">"{report.comment || 'Sans commentaire'}"</p>
                                            <div className="flex items-center gap-3 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(report.date).toLocaleDateString()}</span>
                                                <span className="flex items-center gap-1"><MapPin size={10} className="text-red-500"/> Kinshasa</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'create' && (
                    <div className="space-y-6 animate-fade-in pb-20">
                        {step === 'camera' && (
                            <div className="flex flex-col items-center justify-center h-[65vh] gap-8">
                                <div className="relative">
                                    <div className="w-40 h-40 bg-blue-50 dark:bg-blue-900/10 text-[#2962FF] rounded-[3rem] flex items-center justify-center animate-pulse">
                                        <Camera size={64} />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#00C853] text-white rounded-2xl flex items-center justify-center shadow-2xl rotate-12">
                                        <Sparkles size={24} />
                                    </div>
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Identifier Déchet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto font-medium leading-relaxed">
                                        Mbote! Photographiez le tas de déchets, notre IA Gemini 3 Pro s'occupe de l'analyse experte.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-[#2962FF] text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest"
                                >
                                    <Camera size={24} /> Ouvrir l'objectif
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                            </div>
                        )}

                        {step === 'analysis' && (
                            <div className="flex flex-col items-center justify-center h-[65vh] gap-8">
                                <div className="relative">
                                     <Loader2 size={80} className="text-[#2962FF] animate-spin" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-5 h-5 bg-primary rounded-full animate-ping"></div>
                                     </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Gemini 3 Pro Vision</h3>
                                    <p className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] animate-pulse">Deep analysis of the urban scene...</p>
                                </div>
                            </div>
                        )}

                        {step === 'confirm' && (
                            <div className="max-w-xl mx-auto space-y-8 animate-scale-up">
                                <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl h-80 border-4 border-white dark:border-gray-800 group">
                                    <img src={capturedImage!} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Capture" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                    <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">IA Analysée par Gemini Pro</span>
                                    </div>
                                    <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/20">
                                        <MapPin size={20} className="text-red-500" />
                                        <span className="text-xs font-black uppercase text-gray-900 dark:text-white">Géolocalisation Active</span>
                                    </div>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Type & Urgence</label>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-lg font-black dark:text-white uppercase tracking-tight">{wasteType}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                urgency === 'high' ? 'bg-red-500 text-white' : 
                                                urgency === 'medium' ? 'bg-orange-500 text-white' : 
                                                'bg-green-500 text-white'
                                            }`}>Niveau {urgency}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 font-bold leading-relaxed italic">"{comment}"</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2.5rem] shadow-sm border border-blue-100 dark:border-blue-800">
                                        <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                                            <ShieldAlert size={12}/> Impact Local
                                        </label>
                                        <p className="text-xs text-blue-800 dark:text-blue-300 font-bold leading-relaxed">
                                            {analysisData?.environmentalImpact || "Analyse d'impact en cours..."}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-[3rem] border border-green-100 dark:border-green-800 relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 opacity-5 rotate-12 transition-transform group-hover:rotate-45 duration-700"><CheckCircle size={120} className="text-green-600"/></div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Zap size={20} className="text-green-600"/>
                                        <span className="text-[11px] font-black text-green-600 uppercase tracking-[0.2em]">Conseil Biso Peto AI</span>
                                    </div>
                                    <p className="text-sm text-green-800 dark:text-green-300 font-medium italic leading-relaxed relative z-10">
                                        "{analysisData?.immediateAdvice || "Soyez vigilant dans cette zone."}"
                                    </p>
                                </div>

                                {/* IMAGE CHAT COMPONENT */}
                                <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Bot size={20}/></div>
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Une question sur cette photo ?</h4>
                                    </div>

                                    {imageChatResponse && (
                                        <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border dark:border-gray-700 animate-fade-in">
                                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{imageChatResponse}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className="flex-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:ring-2 ring-blue-500"
                                            placeholder="Posez une question sur ces déchets..."
                                            value={imageChatQuestion}
                                            onChange={(e) => setImageChatQuestion(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                                        />
                                        <button 
                                            onClick={handleAskQuestion}
                                            disabled={isChatting || !imageChatQuestion.trim()}
                                            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isChatting ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button 
                                        onClick={handleFinalSubmit}
                                        disabled={isSubmitting}
                                        className="w-full py-6 bg-[#00C853] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-green-500/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={28}/> : <Send size={28} />}
                                        {isSubmitting ? "Signalement..." : "Confirmer l'alerte"}
                                    </button>
                                    <button 
                                        onClick={() => setStep('camera')} 
                                        className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 font-black uppercase text-[10px] tracking-widest py-3 hover:text-red-500 transition-colors"
                                    >
                                        <X size={14}/> Annuler et reprendre la photo
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
