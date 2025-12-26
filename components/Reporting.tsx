
import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowLeft, Camera, MapPin, Loader2, CheckCircle, 
    AlertTriangle, Info, Send, X, Clock, Check, 
    ChevronRight, Sparkles, Zap, ShieldAlert, Bot,
    Navigation, Target, Locate, WifiOff, Cloud, Upload,
    CheckCircle2, PartyPopper, Satellite
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
                }
                setStep('location');
            } catch (err) {
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
                id: '',
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

            // Notification immédiate pour les administrateurs
            if (onNotifyAdmin) {
                onNotifyAdmin(
                    `Nouveau Signalement : ${wasteType} 🚨`,
                    `Un tas d'immondices (${urgency}) a été signalé à ${user.commune} par ${user.firstName}.`
                );
            }

            setStep('success');
            onToast?.("Signalement transmis au Centre SIG", "success");
        } catch (e) {
            onToast?.("Erreur lors de l'envoi", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden">
            {/* Header Interne propre à la vue */}
            <div className="bg-white dark:bg-gray-900 p-5 shadow-md flex items-center justify-between border-b dark:border-gray-800 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><ArrowLeft className="w-5 h-5"/></button>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Biso Peto Alert</h2>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center animate-pulse"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 animate-fade-in">
                        <div className="relative">
                            <div className="w-40 h-40 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-[3rem] flex items-center justify-center animate-float shadow-inner"><Camera className="w-16 h-16" /></div>
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-3 rounded-2xl shadow-xl"><Sparkles className="w-5 h-5 animate-pulse" /></div>
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Capture d'Urgence</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto">Prenez une photo claire des déchets. Notre IA s'occupe de l'identification.</p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-sm bg-primary text-white py-5 rounded-[2rem] font-black uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">Lancer l'Appareil <Camera className="w-5 h-5" /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Bot className="w-10 h-10 text-primary" /></div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Traitement IA en cours</p>
                            <p className="text-sm font-bold dark:text-white mt-2">Identification du type de déchet...</p>
                        </div>
                    </div>
                )}

                {step === 'location' && (
                    <div className="animate-fade-in flex flex-col h-full gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-xl flex-1 flex flex-col min-h-[400px]">
                            <h3 className="text-lg font-black dark:text-white uppercase mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-red-500" /> Précisez le lieu</h3>
                            <div className="flex-1 rounded-[2rem] overflow-hidden border-2 border-gray-100 dark:border-gray-800 relative shadow-inner">
                                <MapContainer center={location ? [location.lat, location.lng] : [-4.325, 15.322]} zoom={16} zoomControl={false} style={{height: '100%', width: '100%'}}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <LocationPicker initialPos={location!} onLocationChange={setLocation} />
                                </MapContainer>
                                <div className="absolute bottom-4 right-4 z-[1000]"><button onClick={() => setLocation(location)} className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"><Locate className="text-primary w-6 h-6"/></button></div>
                            </div>
                            <button onClick={() => setStep('confirm')} className="w-full mt-6 py-5 bg-[#2962FF] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Valider la position <ChevronRight className="w-5 h-5"/></button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="animate-scale-up space-y-6 pb-20">
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-[300px] border-4 border-white dark:border-gray-800">
                            <img src={capturedImage!} className="w-full h-full object-cover" alt="Capture" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">Aperçu SIG</div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border dark:border-gray-700 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-black dark:text-white uppercase tracking-widest">Analyse Automatique</h4>
                                <span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle className="w-3 h-3"/> IA OK</span>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Type détecté</p>
                                    <p className="text-base font-black dark:text-white uppercase">{wasteType}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Observation IA</p>
                                    <p className="text-xs text-gray-500 font-bold italic leading-relaxed">"{comment || 'Aucun commentaire'}"</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-6 rounded-[2rem] font-black bg-[#00C853] text-white shadow-2xl shadow-green-500/20 flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-all">
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /> Envoyer au Centre SIG</>}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center min-h-[75vh] gap-10 animate-scale-up text-center">
                        <div className="relative">
                            <div className="w-32 h-32 bg-green-50 rounded-[3rem] flex items-center justify-center text-green-500 shadow-inner">
                                <CheckCircle2 size={64} strokeWidth={3} className="animate-bounce" />
                            </div>
                            <div className="absolute -top-4 -right-4 p-3 bg-blue-600 text-white rounded-2xl shadow-xl animate-pulse">
                                <Satellite size={24} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h3 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Signalement Reçu !</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Code SIG: BP-{Date.now().toString().slice(-6)}</p>
                            </div>
                            <div className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-xl space-y-4 max-w-sm">
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                                    Félicitations {user.firstName}! Votre alerte a été transmise au centre de commandement de **{user.commune}**. 
                                </p>
                                <div className="flex items-center gap-2 justify-center py-3 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
                                    <Zap size={14} className="fill-current"/>
                                    <span className="text-[10px] font-black uppercase tracking-widest">+50 Eco-Points en attente</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold italic">Nos équipes de collecte vont analyser l'urgence dans les plus brefs délais.</p>
                            </div>
                        </div>
                        <button onClick={onBack} className="w-full max-w-xs py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Retour au Dashboard</button>
                    </div>
                )}
            </div>
        </div>
    );
};
