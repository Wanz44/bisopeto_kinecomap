
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, Upload, MapPin, Loader2, CheckCircle, AlertTriangle, Info, Send, X } from 'lucide-react';
import { analyzeTrashReport } from '../services/geminiService';
import { ReportsAPI, StorageAPI } from '../services/api';
import { WasteReport, User } from '../types';

interface ReportingProps {
    user: User;
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Reporting: React.FC<ReportingProps> = ({ user, onBack, onToast }) => {
    const [step, setStep] = useState<'camera' | 'analysis' | 'confirm'>('camera');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, []);

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setCapturedImage(base64);
                setStep('analysis');
                setIsAnalyzing(true);
                
                try {
                    const result = await analyzeTrashReport(base64);
                    setAnalysis(result);
                    setStep('confirm');
                } catch (err) {
                    onToast?.("Erreur lors de l'analyse IA", "error");
                    setStep('confirm');
                } finally {
                    setIsAnalyzing(false);
                }
            };
            reader.readAsDataURL(file);
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
            wasteType: analysis?.wasteType || "Divers",
            urgency: analysis?.urgency || "medium",
            status: 'pending',
            date: new Date().toISOString(),
            comment: analysis?.comment || "Aucun commentaire."
        };

        try {
            await ReportsAPI.add(report);
            onToast?.("Signalement envoyé avec succès ! Merci de participer à la propreté de Kinshasa.", "success");
            onBack();
        } catch (e) {
            onToast?.("Erreur lors de l'envoi.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-xl font-bold dark:text-white">Signaler un Problème</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 animate-fade-in">
                        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center animate-bounce">
                            <Camera size={40} />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black dark:text-white">Biso Peto Alert</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                Prenez une photo des déchets pour que nos collecteurs interviennent rapidement.
                            </p>
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#2962FF] text-white px-10 py-5 rounded-3xl font-black text-lg shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3"
                        >
                            <Camera size={24} /> OUVRE L'APPAREIL
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center h-[70vh] gap-6 animate-fade-in">
                        <Loader2 size={64} className="text-[#00C853] animate-spin" />
                        <div className="text-center">
                            <h3 className="text-xl font-bold dark:text-white">Analyse IA en cours...</h3>
                            <p className="text-gray-500">Identification des déchets et évaluation de l'urgence.</p>
                        </div>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-6 animate-scale-up">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl h-64 border-4 border-white dark:border-gray-800">
                            <img src={capturedImage!} className="w-full h-full object-cover" alt="Capture" />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg flex items-center gap-2">
                                <MapPin size={16} className="text-red-500" />
                                <span className="text-[10px] font-black uppercase">Localisé</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border dark:border-gray-700 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold dark:text-white">Analyse de Biso Peto AI</h4>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                    analysis?.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                }`}>
                                    Urgence : {analysis?.urgency || 'medium'}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Type de déchets :</span>
                                    <span className="font-bold dark:text-white">{analysis?.wasteType}</span>
                                </div>
                                <p className="text-xs text-gray-500 italic">"{analysis?.comment}"</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-[#00C853] text-white rounded-[2rem] font-black text-xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                                ENVOYER LE SIGNALEMENT
                            </button>
                            <button onClick={() => setStep('camera')} className="text-gray-500 font-bold py-2">Reprendre la photo</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
