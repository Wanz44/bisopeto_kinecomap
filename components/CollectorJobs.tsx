
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, Trash2, Scale, Calculator, Plus, Save, Search, X, ChevronRight, QrCode, Camera, AlertTriangle, Zap, ZapOff, Image as ImageIcon, Bell, Siren, WifiOff, RefreshCw, Loader2, ThumbsUp, ThumbsDown, ScanLine, Calendar, Cloud, Eye, CloudOff, Timer, AlertCircle } from 'lucide-react';
import { User as UserType, WasteReport } from '../types';
import { ReportsAPI, AuditAPI, StorageAPI, UserAPI, NotificationsAPI } from '../services/api';
import { OfflineManager } from '../services/offlineManager';
import { compareBeforeAfter } from '../services/geminiService';
import { ImageService } from '../services/imageService';

interface CollectorJobsProps {
    user: UserType;
    onBack: () => void;
    onNotify: (targetId: string | 'ADMIN', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CollectorJobs: React.FC<CollectorJobsProps> = ({ user, onBack, onNotify, onToast }) => {
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isValidatingAI, setIsValidatingAI] = useState(false);
    const [validationResult, setValidationResult] = useState<any>(null);
    const [jobToValidate, setJobToValidate] = useState<WasteReport | null>(null);
    const [proofPhoto, setProofPhoto] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const proofInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadMyReports(); }, []);

    const loadMyReports = async () => {
        setIsLoading(true);
        try {
            const all = await ReportsAPI.getAll();
            // Source: Missions assignées à l'ID de l'utilisateur connecté via Supabase
            setReports(all.filter(r => r.assignedTo === user.id || (r.status === 'pending' && r.commune === user.commune)));
        } finally { setIsLoading(false); }
    };

    const handleProofCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && jobToValidate) {
            setIsValidatingAI(true);
            try {
                const compressed = await ImageService.compressImage(file);
                setProofFile(compressed);
                const base64 = await ImageService.fileToBase64(compressed);
                setProofPhoto(base64);
                
                if (navigator.onLine) {
                    const result = await compareBeforeAfter(jobToValidate.imageUrl, base64);
                    setValidationResult(result);
                } else {
                    setValidationResult({ isCleaned: true, comment: "Mode Offline. Validé localement." });
                }
            } finally { setIsValidatingAI(false); }
        }
    };

    const confirmValidation = async () => {
        if (!jobToValidate) return;
        try {
            let proofUrl = proofPhoto;
            if (navigator.onLine && proofFile) {
                const url = await StorageAPI.uploadImage(proofFile);
                if (url) proofUrl = url;
            }

            // 1. MISE À JOUR DU RAPPORT DANS SUPABASE
            await ReportsAPI.update({ 
                id: jobToValidate.id, 
                status: 'resolved', 
                proofUrl: proofUrl || undefined 
            });
            
            // 2. RÉCOMPENSE DU CITOYEN (Source of Truth: users table)
            if (jobToValidate.reporterId && jobToValidate.reporterId !== 'anonymous') {
                const reporter = await UserAPI.getById(jobToValidate.reporterId);
                if (reporter) {
                    const bonusPoints = jobToValidate.urgency === 'high' ? 100 : 50;
                    await UserAPI.update({ 
                        id: reporter.id!, 
                        points: (reporter.points || 0) + bonusPoints,
                        collections: (reporter.collections || 0) + 1
                    });
                    
                    // 3. PERSISTANCE DE LA NOTIFICATION POUR LE CITOYEN
                    await NotificationsAPI.add({
                        targetUserId: reporter.id!,
                        title: "Bravo ! Zone Peto ✨",
                        message: `Votre signalement à ${jobToValidate.commune} a été traité. +${bonusPoints} Eco-Points gagnés !`,
                        type: 'success'
                    });
                }
            }
            
            await AuditAPI.log({ 
                userId: user.id, 
                action: 'JOB_RESOLVED', 
                entity: 'REPORT', 
                entityId: jobToValidate.id, 
                metadata: { aiResult: validationResult } 
            });

            setReports(prev => prev.map(r => r.id === jobToValidate.id ? { ...r, status: 'resolved', proofUrl: proofUrl || undefined } : r));
            onToast?.("Collecte validée et points distribués !", "success");
            setJobToValidate(null);
        } catch (e) { 
            onToast?.("Erreur lors de la synchronisation Supabase", "error"); 
        }
    };

    const getTimeElapsed = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return "Récent";
        return `${hours}h écoulées`;
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-[#050505]">
            <input type="file" ref={proofInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleProofCapture} />

            <div className="p-6 bg-white dark:bg-gray-900 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white leading-none">Missions Terrain</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Opérateur: {user.firstName}</p>
                    </div>
                </div>
                <button onClick={loadMyReports} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-2xl"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                        <Loader2 className="animate-spin text-blue-500" size={40}/>
                        <p className="text-[10px] font-black uppercase tracking-widest">Chargement SIG...</p>
                    </div>
                ) : reports.filter(r => r.status !== 'resolved').length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                        <div className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-500 shadow-inner"><CheckCircle size={40}/></div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-tighter text-center">Aucune mission assignée.<br/>Quartier propre !</p>
                    </div>
                ) : (
                    reports.filter(r => r.status !== 'resolved').map(job => (
                        <div key={job.id} className={`bg-white dark:bg-gray-900 p-6 rounded-[3rem] border-2 shadow-sm relative overflow-hidden group transition-all hover:scale-[1.02] ${job.urgency === 'high' ? 'border-red-100 dark:border-red-900/30' : 'border-gray-50 dark:border-gray-800'}`}>
                            {job.urgency === 'high' && (
                                <div className="absolute top-0 right-0 p-4 opacity-5 text-red-500 rotate-12 group-hover:rotate-0 transition-transform"><AlertCircle size={80} /></div>
                            )}
                            
                            <div className="flex gap-6 mb-6">
                                <div className="relative">
                                    <img src={job.imageUrl} className="w-24 h-24 rounded-[2rem] object-cover border dark:border-gray-800" />
                                    <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-[7px] font-black uppercase text-white shadow-lg ${job.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}>{job.urgency}</div>
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white uppercase truncate text-sm leading-none">{job.wasteType}</h4>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{job.commune}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-widest"><Clock size={10}/> {getTimeElapsed(job.date)}</div>
                                        <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase tracking-widest"><Navigation size={10}/> Itinéraire</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button onClick={() => { setJobToValidate(job); setProofPhoto(null); setValidationResult(null); proofInputRef.current?.click(); }} className="flex-1 py-4 bg-[#00C853] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"><Camera size={16}/> Valider Collecte</button>
                                <button className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl hover:text-blue-500 transition-colors"><Navigation size={20}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL DE VALIDATION IA */}
            {jobToValidate && proofPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setJobToValidate(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter mb-8 text-center">Contrôle de Conformité IA</h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="space-y-2"><p className="text-[8px] font-black text-gray-400 uppercase text-center tracking-widest">Signalement initial</p><img src={jobToValidate.imageUrl} className="aspect-square rounded-[2rem] object-cover border-2 border-gray-100" /></div>
                            <div className="space-y-2"><p className="text-[8px] font-black text-blue-400 uppercase text-center tracking-widest">Action Collecteur</p><img src={proofPhoto} className="aspect-square rounded-[2rem] object-cover border-2 border-blue-100" /></div>
                        </div>
                        {isValidatingAI ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl mb-8"><Loader2 className="animate-spin text-blue-500 mx-auto mb-3" /><p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Analyse des pixels...</p></div>
                        ) : validationResult && (
                            <div className={`p-6 rounded-[2.5rem] border-2 mb-8 ${validationResult.isCleaned ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                <div className="flex items-center gap-3 mb-2">{validationResult.isCleaned ? <ThumbsUp size={24}/> : <ThumbsDown size={24}/>}<span className="font-black uppercase tracking-tight">{validationResult.isCleaned ? 'Collecte Confirmée' : 'Résidus Détectés'}</span></div>
                                <p className="text-[10px] font-bold italic opacity-70 leading-relaxed">"{validationResult.comment}"</p>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <button onClick={() => proofInputRef.current?.click()} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">Reprendre Photo</button>
                            <button onClick={confirmValidation} disabled={isValidatingAI} className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2 ${validationResult?.isCleaned ? 'bg-[#00C853] shadow-green-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}><CheckCircle size={14}/> Finaliser</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
