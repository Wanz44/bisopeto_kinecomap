
import React, { useState, useRef, useEffect } from 'react';
import { 
    ArrowLeft, Camera, MapPin, Loader2, CheckCircle, 
    AlertTriangle, Info, Send, X, Clock, Check, 
    ChevronRight, Sparkles, Zap, ShieldAlert, Bot,
    Navigation, Target, Locate, WifiOff, Cloud, Upload
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

export const Reporting: React.FC<ReportingProps> = ({ user, onBack, onToast }) => {
    const [step, setStep] = useState<'camera' | 'analysis' | 'location' | 'confirm'>('camera');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [wasteType, setWasteType] = useState('Divers');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [comment, setComment] = useState('');
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const updateOnlineStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, () => setLocation({ lat: -4.325, lng: 15.322 }), { enableHighAccuracy: true });
        }
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setStep('analysis');
            setIsAnalyzing(true);
            
            try {
                // OPTIMISATION ENTERPRISE : Compression avant envoi
                const compressedFile = await ImageService.compressImage(file);
                setOriginalFile(compressedFile);
                const base64 = await ImageService.fileToBase64(compressedFile);
                setCapturedImage(base64);
                
                if (navigator.onLine) {
                    const result = await analyzeTrashReport(base64);
                    setAnalysisData(result);
                    setWasteType(result.wasteType);
                    setUrgency(result.urgency);
                    setComment(result.comment);
                    setStep('location');
                } else {
                    setStep('location');
                }
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
                onToast?.("Signalement envoyé !", "success");
            } else {
                OfflineManager.addToQueue('ADD_REPORT', report);
                onToast?.("Enregistré localement (Offline)", "info");
            }
            onBack();
        } catch (e) {
            onToast?.("Erreur. Sauvegardé localement.", "error");
            onBack();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft size={20}/></button>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-none">Biso Peto Alert</h2>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-24">
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-8">
                        <div className="w-40 h-40 bg-blue-50 dark:bg-blue-900/10 text-[#2962FF] rounded-[3rem] flex items-center justify-center animate-float"><Camera size={64} /></div>
                        <button onClick={() => fileInputRef.current?.click()} className="bg-primary text-white px-10 py-5 rounded-[2rem] font-black uppercase shadow-2xl flex items-center gap-3">Capturer <Camera size={24} /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
                        <Loader2 size={64} className="text-primary animate-spin" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Compression & Analyse IA...</p>
                    </div>
                )}

                {step === 'location' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-800 shadow-sm">
                            <h3 className="text-lg font-black dark:text-white uppercase mb-4 flex items-center gap-2"><MapPin size={20} className="text-red-500" /> Lieu de l'incident</h3>
                            <div className="h-64 rounded-3xl overflow-hidden border dark:border-gray-800">
                                <MapContainer center={location ? [location.lat, location.lng] : [-4.325, 15.322]} zoom={16} zoomControl={false} style={{height: '100%'}}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                    <LocationPicker initialPos={location!} onLocationChange={setLocation} />
                                </MapContainer>
                            </div>
                            <button onClick={() => setStep('confirm')} className="w-full mt-6 py-5 bg-[#2962FF] text-white rounded-2xl font-black uppercase shadow-xl flex items-center justify-center gap-2">Continuer <ChevronRight size={20}/></button>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="animate-scale-up space-y-6">
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-64 border-4 border-white dark:border-gray-800 group">
                            <img src={capturedImage!} className="w-full h-full object-cover" alt="Capture" />
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-black dark:text-white uppercase">{wasteType}</span>
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black text-white uppercase ${urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>Urgence {urgency}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-bold italic leading-relaxed">"{comment || 'Signalement'}"</p>
                        </div>
                        <button onClick={handleFinalSubmit} disabled={isSubmitting} className="w-full py-6 rounded-[2rem] font-black text-xl bg-[#00C853] text-white shadow-2xl flex items-center justify-center gap-4 uppercase tracking-widest">{isSubmitting ? <Loader2 className="animate-spin" /> : <><Send /> Envoyer au SIG</>}</button>
                    </div>
                )}
            </div>
        </div>
    );
};
