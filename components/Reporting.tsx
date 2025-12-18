
import React, { useState, useRef, useEffect } from 'react';
/* Fixed: Added missing 'Check' icon to imports from lucide-react */
import { ArrowLeft, Camera, Upload, MapPin, Loader2, CheckCircle, AlertTriangle, Info, Send, X, Trash2, Clock, Check } from 'lucide-react';
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
    
    // États pour le formulaire pré-rempli par l'IA
    const [wasteType, setWasteType] = useState('Divers');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [comment, setComment] = useState('');
    
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, (err) => {
                console.warn("Géolocalisation refusée, utilisation d'une position par défaut.");
                setLocation({ lat: -4.325, lng: 15.322 });
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
                    // APPEL À GEMINI POUR ANALYSER LA PHOTO
                    const result = await analyzeTrashReport(base64);
                    
                    // PRÉ-REMPLISSAGE DES CHAMPS
                    setWasteType(result.wasteType);
                    setUrgency(result.urgency);
                    setComment(result.comment);
                    
                    setStep('confirm');
                } catch (err) {
                    /* Fixed: Changed invalid toast type 'warning' to 'error' */
                    onToast?.("Erreur lors de l'analyse IA. Remplissage manuel requis.", "error");
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
            wasteType: wasteType,
            urgency: urgency,
            status: 'pending',
            date: new Date().toISOString(),
            comment: comment
        };

        try {
            await ReportsAPI.add(report);
            onToast?.("Signalement envoyé avec succès ! Merci pour votre engagement.", "success");
            onBack();
        } catch (e) {
            onToast?.("Erreur lors de l'envoi du signalement.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Signalement</h2>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                
                {/* Étape 1 : Capture Photo */}
                {step === 'camera' && (
                    <div className="flex flex-col items-center justify-center h-[70vh] gap-8 animate-fade-in">
                        <div className="relative">
                            <div className="w-32 h-32 bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] rounded-[2.5rem] flex items-center justify-center animate-pulse">
                                <Camera size={56} />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#00C853] text-white rounded-full flex items-center justify-center shadow-lg">
                                <Check size={20} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="text-center space-y-3">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Biso Peto Alert</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto font-medium">
                                Prenez une photo nette du tas de déchets pour une identification instantanée par notre IA.
                            </p>
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#2962FF] text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-widest"
                        >
                            <Camera size={24} /> Ouvrir la caméra
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageCapture} />
                    </div>
                )}

                {/* Étape 2 : Analyse en cours */}
                {step === 'analysis' && (
                    <div className="flex flex-col items-center justify-center h-[70vh] gap-8 animate-fade-in">
                        <div className="relative">
                             <Loader2 size={80} className="text-[#2962FF] animate-spin" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-4 h-4 bg-primary rounded-full animate-ping"></div>
                             </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Biso Peto AI analyse...</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] tracking-widest">Identification du type et de l'urgence</p>
                        </div>
                    </div>
                )}

                {/* Étape 3 : Confirmation et Édition */}
                {step === 'confirm' && (
                    <div className="max-w-xl mx-auto space-y-6 animate-scale-up pb-10">
                        {/* Preview Image */}
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-72 border-4 border-white dark:border-gray-800">
                            <img src={capturedImage!} className="w-full h-full object-cover" alt="Capture" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50">
                                <MapPin size={18} className="text-red-500" />
                                <span className="text-[11px] font-black uppercase text-gray-800">Zone Gombe localisée</span>
                            </div>
                        </div>

                        {/* Formulaire pré-rempli */}
                        <div className="bg-white dark:bg-gray-800 rounded-[3rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl"><Info size={20}/></div>
                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Confirmez les détails</h4>
                            </div>
                            
                            <div className="space-y-5">
                                {/* Type de déchet */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de Déchets</label>
                                    <div className="relative">
                                        <Trash2 className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                        <select 
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-bold outline-none border-none focus:ring-2 focus:ring-blue-500"
                                            value={wasteType}
                                            onChange={(e) => setWasteType(e.target.value)}
                                        >
                                            <option value="Plastique">Plastique (Bouteilles, Sacs)</option>
                                            <option value="Organique">Organique (Reste nourriture)</option>
                                            <option value="Gravats">Gravats (Construction)</option>
                                            <option value="Électronique">Électronique (Câbles, TV)</option>
                                            <option value="Métal">Métal / Ferraille</option>
                                            <option value="Divers">Divers / Mélangé</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Urgence */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Degré d'Urgence</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['low', 'medium', 'high'].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setUrgency(level as any)}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                                    urgency === level 
                                                    ? level === 'high' ? 'bg-red-500 border-red-500 text-white shadow-lg' : 
                                                      level === 'medium' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 
                                                      'bg-green-500 border-green-500 text-white shadow-lg'
                                                    : 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-400'
                                                }`}
                                            >
                                                {level === 'low' ? 'Faible' : level === 'medium' ? 'Moyen' : 'Critique'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Commentaire */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Commentaire (IA)</label>
                                    <textarea 
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl text-sm font-bold dark:text-white outline-none border-none focus:ring-2 focus:ring-blue-500 resize-none italic"
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Décrivez la situation ici..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={handleFinalSubmit}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-[#00C853] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-green-500/30 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <Send size={24} />}
                                {isSubmitting ? "Envoi en cours..." : "Lancer l'alerte"}
                            </button>
                            <button 
                                onClick={() => setStep('camera')} 
                                className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 font-black uppercase text-xs tracking-widest py-2 hover:text-gray-700 dark:hover:text-white transition-colors"
                            >
                                <X size={16}/> Annuler et reprendre
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
