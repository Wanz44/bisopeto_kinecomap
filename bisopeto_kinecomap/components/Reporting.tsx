import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowLeft, Camera, MapPin, Loader2, CheckCircle, 
    AlertTriangle, Info, Send, X, Clock, Check, 
    ChevronRight, Sparkles, Zap, ShieldAlert, Bot,
    Navigation, Target, Locate, WifiOff, Cloud, Upload,
    CheckCircle2, PartyPopper, Satellite, Map as MapIcon, ChevronLeft,
    // Fix: Added missing RefreshCw icon
    RefreshCw
} from 'lucide-react';
import { analyzeTrashReport } from '../services/geminiService';
import { ReportsAPI, StorageAPI } from '../services/api';
import { WasteReport, User } from '../types';
import { OfflineManager } from '../services/offlineManager';
import { ImageService } from '../services/imageService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface ReportingProps {
    user: User;
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onNotifyAdmin?: (title: string, message: string) => void;
}

const LocationPicker = ({ onLocationChange, initialPos }: { onLocationChange: (pos: {lat: number, lng: number}) => void, initialPos: {lat: number, lng: number} }) => {
    const [pos, setPos] = useState(initialPos);
    useMapEvents({
        click(e) {
            const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
            setPos(newPos);
            onLocationChange(newPos);
        },
    });
    return <Marker position={[pos.lat, pos.lng]} icon={new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    })} />;
};

export const Reporting: React.FC<ReportingProps> = ({ user, onBack, onToast, onNotifyAdmin }) => {
    const [step, setStep] = useState<'camera' | 'analysis' | 'location' | 'confirm' | 'success'>('camera');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [wasteType, setWasteType] = useState('Divers');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [comment, setComment] = useState('');
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, () => setLocation({ lat: -4.325, lng: 15.322 }), { enableHighAccuracy: true });
        }
    }, []);

    const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setStep('analysis');
            setIsAnalyzing(true);
            try {
                const compressedFile = await ImageService.compressImage(file);
                setOriginalFile(compressedFile);
                const base64 = await ImageService.fileToBase64(compressedFile);
                setCapturedImage(base64);
                if (navigator.onLine) {
                    const result = await analyzeTrashReport(base64);
                    setWasteType(result.wasteType);
                    setUrgency(result.urgency);
                    setComment(result.comment);
                } else {
                    setWasteType('Mixte');
                    setUrgency('medium');
                    setComment('Photo capturée en mode hors-ligne.');
                }
                setStep('location');
            } catch (err) {
                console.error(err);
                setStep('location');
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleFinalSubmit = async () => {
        if (!capturedImage || !location) return;
        setIsSubmitting(true);
        try {
            let cloudUrl = capturedImage;
            if (isOnline && originalFile) {
                const url = await StorageAPI.uploadImage(originalFile);
                if (url) cloudUrl = url;
            }
            const report: WasteReport = {
                id: `rep-${Date.now()}`,
                reporterId: user.id || 'anonymous',
                lat: location.lat,
                lng: location.lng,
                imageUrl: cloudUrl,
                wasteType: wasteType,
                urgency: urgency,
                status: 'pending',
                date: new Date().toISOString(),
                comment: comment,
                commune: user.commune || 'Kinshasa'
            };
            
            if (isOnline) {
                await ReportsAPI.add(report);
            } else {
                OfflineManager.addToQueue('ADD_REPORT', report);
            }

            if (onNotifyAdmin) {
                onNotifyAdmin(
                    `Signalement : ${wasteType} 🚨`,
                    `Un tas d'immondices (${urgency}) à ${user.commune}.`
                );
            }

            setStep('success');
        } catch (e) {
            onToast?.("Erreur lors de l'envoi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#050505] overflow-hidden relative">
            {/* Header Mobile - Transparent over Camera/Map */}
            <div className={`absolute top-0 left-0 right-0 z-[1100] p-5 flex items-center justify-between transition-all ${step === 'confirm' || step === 'success' ? 'bg-white dark:bg-gray-900 border-b dark:border-white/5' : 'bg-transparent'}`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-3 bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-white/5"><ArrowLeft size={22} className="dark:text-white"/></button>
                    {(step === 'confirm' || step === 'success') && (
                        <h2 className="text-lg font-black dark:text-white uppercase tracking-tighter leading-none">Signalement SIG</h2>
                    )}
                </div>
                {step !== 'success' && (
                    <div className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/5 flex items-center justify-center animate-pulse"><AlertTriangle size={20} className="text-red-500" /></div>
                )}
            </div>

            <div className="flex-1 relative flex flex-col overflow-hidden">
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center h-full p-8 gap-10 animate-fade-in relative z-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent -z-10"></div>
                        <div className="relative">
                            <div className="w-40 h-40 bg-white dark:bg-[#111827] text-blue-600 rounded-[3rem] flex items-center justify-center animate-float shadow-2xl border border-gray-100 dark:border-white/5"><Camera size={56} strokeWidth={1.5} /></div>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-xl border-4 border-white dark:border-[#050505]"><Sparkles size={24} className="animate-pulse" /></div>
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">Photo de l'alerte</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">Assurez-vous que le tas de déchets soit bien visible pour une analyse IA précise.</p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm bg-primary text-white py-6 rounded-[2rem] font-black uppercase shadow-2xl shadow-green-500/30 flex items-center justify-center gap-4 active:scale-95 transition-all text-sm tracking-widest">OUVRIR L'APPAREIL <Camera size={24} /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Bot size={32} className="text-primary" /></div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Expertise Biso AI</p>
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Analyse de la scène urbaine via Gemini...</p>
                        </div>
                    </div>
                )}

                {step === 'location' && (
                    <div className="flex flex-col h-full animate-fade-in relative z-0">
                        <div className="flex-1 relative">
                            <MapContainer center={location ? [location.lat, location.lng] : [-4.325, 15.322]} zoom={17} zoomControl={false} style={{height: '100%', width: '100%'}}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <LocationPicker initialPos={location!} onLocationChange={setLocation} />
                            </MapContainer>
                            
                            {/* Floating Overlay for Map Info */}
                            <div className="absolute top-24 left-6 right-6 z-[1000] p-5 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/5 flex items-center gap-4 animate-fade-in-up">
                                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 shrink-0"><MapPin size={24}/></div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Localisation SIG</p>
                                    <p className="text-xs font-bold dark:text-white leading-tight mt-0.5">Glissez la carte pour positionner le repère exactement sur le tas.</p>
                                </div>
                            </div>

                            <button onClick={handleLocateMe} className="absolute bottom-32 right-6 z-[1000] p-5 bg-white dark:bg-gray-800 text-primary rounded-[1.8rem] shadow-2xl border border-gray-100 dark:border-white/5 active:scale-90 transition-all"><Locate size={28}/></button>
                        </div>
                        
                        <div className="p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-white dark:bg-[#111827] border-t dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
                            <button onClick={() => setStep('confirm')} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-green-500/20 active:scale-95 transition-all text-sm">CONFIRMER POSITION <ChevronRight size={22}/></button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="flex-1 overflow-y-auto no-scrollbar pt-28 px-6 pb-12 space-y-8 animate-scale-up scroll-container">
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-64 border-4 border-white dark:border-gray-800 shrink-0 group">
                            <img src={capturedImage!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Capture" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                    <span className="text-white font-black uppercase text-[10px] tracking-widest">Preuve Visuelle SIG</span>
                                </div>
                                <button onClick={() => setStep('camera')} className="p-2.5 bg-white/20 backdrop-blur rounded-xl text-white hover:bg-white/40 transition-all"><RefreshCw size={16}/></button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#111827] p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Bot size={18} className="text-primary" />
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Rapport Intelligent</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Catégorie</p>
                                    <p className="text-xs font-black dark:text-white truncate uppercase">{wasteType}</p>
                                </div>
                                <div className={`p-4 rounded-2xl border border-transparent ${urgency === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <p className="text-[9px] font-black uppercase mb-1 opacity-50">Urgence</p>
                                    <p className="text-xs font-black truncate uppercase tracking-tighter">{urgency}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t dark:border-white/5">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold italic leading-relaxed text-center">"{comment || 'Analyse visuelle terminée par Biso AI.'}"</p>
                            </div>
                        </div>

                        <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-6 rounded-[2.2rem] font-black bg-[#00C853] text-white shadow-2xl shadow-green-500/30 flex items-center justify-center gap-4 uppercase tracking-widest text-sm active:scale-95 transition-all">
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send size={24} /> DIFFUSER L'ALERTE</>}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center h-full p-10 gap-10 animate-scale-up text-center relative overflow-hidden">
                        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/5 blur-[100px] rounded-full"></div>
                        <div className="w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-[3.5rem] flex items-center justify-center text-green-500 shadow-2xl shadow-green-500/10 relative z-10 border border-green-100 dark:border-green-800">
                            <CheckCircle2 size={72} strokeWidth={2.5} className="animate-bounce" />
                        </div>
                        <div className="space-y-5 relative z-10">
                            <h3 className="text-4xl font-black dark:text-white uppercase tracking-tighter leading-none">Alerte Transmise !</h3>
                            <p className="text-base text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                                Merci pour votre engagement, {user.firstName}! <br/> Un agent Biso Peto de **{user.commune}** va être dépêché sur zone.
                            </p>
                            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                                <Zap size={14} className="fill-current" /> +50 Points Eco Gagnés
                            </div>
                        </div>
                        <button onClick={onBack} className="w-full max-w-xs py-6 bg-gray-900 dark:bg-white dark:text-black text-white rounded-[2.2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all relative z-10">TERMINER</button>
                    </div>
                )}
            </div>
        </div>
    );
};