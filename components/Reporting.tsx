
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

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 overflow-hidden">
            <div className="bg-white dark:bg-gray-900 p-4 shadow-sm flex items-center justify-between border-b dark:border-gray-800 shrink-0 z-50 safe-pt">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"><ArrowLeft size={20}/></button>
                    <h2 className="text-sm font-black dark:text-white uppercase tracking-tighter">Biso Peto Alert</h2>
                </div>
                <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center animate-pulse"><AlertTriangle className="w-3 h-3 text-red-500" /></div>
            </div>

            <div className="flex-1 relative flex flex-col overflow-hidden">
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center h-full p-6 gap-8 animate-fade-in">
                        <div className="relative">
                            <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-[2.5rem] flex items-center justify-center animate-float shadow-inner"><Camera className="w-12 h-12" /></div>
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-xl"><Sparkles size={16} className="animate-pulse" /></div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">Photo Obligatoire</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-[200px] mx-auto">Prenez une photo claire pour que l'IA puisse identifier les déchets.</p>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-primary text-white py-5 rounded-3xl font-black uppercase shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all text-sm">Lancer l'Appareil <Camera size={20} /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Bot className="w-8 h-8 text-primary" /></div>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Analyse Gemini Vision...</p>
                    </div>
                )}

                {step === 'location' && (
                    <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex-1 relative">
                            <MapContainer center={location ? [location.lat, location.lng] : [-4.325, 15.322]} zoom={16} zoomControl={false} style={{height: '100%', width: '100%'}}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                <LocationPicker initialPos={location!} onLocationChange={setLocation} />
                            </MapContainer>
                            <div className="absolute top-4 left-4 right-4 z-[1000] p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">Localisation SIG</p>
                                <p className="text-xs font-bold dark:text-white truncate flex items-center gap-2"><MapPin size={14} className="text-red-500"/> Déplacez la carte pour pointer le tas.</p>
                            </div>
                            <button onClick={handleLocateMe} className="absolute bottom-28 right-4 z-[1000] p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"><Locate className="text-primary w-6 h-6"/></button>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-900 border-t dark:border-gray-800 safe-pb">
                            <button onClick={() => setStep('confirm')} className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Confirmer Position <ChevronRight size={18}/></button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="p-6 space-y-6 animate-scale-up h-full overflow-y-auto no-scrollbar safe-pb">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl h-56 border-4 border-white dark:border-gray-800 shrink-0">
                            <img src={capturedImage!} className="w-full h-full object-cover" alt="Capture" />
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border dark:border-gray-700 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rapport IA</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Type</p>
                                    <p className="text-xs font-black dark:text-white truncate">{wasteType}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${urgency === 'high' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                    <p className="text-[8px] font-black uppercase mb-1 opacity-50">Urgence</p>
                                    <p className="text-xs font-black truncate uppercase">{urgency}</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold italic leading-relaxed">"{comment || 'Analyse visuelle terminée.'}"</p>
                        </div>
                        <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-5 rounded-[1.8rem] font-black bg-[#00C853] text-white shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95 transition-all">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send size={20} /> Diffuser Alerte SIG</>}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="flex flex-col items-center justify-center h-full p-8 gap-8 animate-scale-up text-center">
                        <div className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-500 shadow-inner">
                            <CheckCircle2 size={56} strokeWidth={3} className="animate-bounce" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">Signalement Reçu !</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                                Merci {user.firstName}! Votre alerte a été transmise à la base opérationnelle de **{user.commune}**.
                            </p>
                        </div>
                        <button onClick={onBack} className="w-full max-w-xs py-5 bg-gray-900 dark:bg-white dark:text-black text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Fermer</button>
                    </div>
                )}
            </div>
        </div>
    );
    
    function handleLocateMe() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }
};
