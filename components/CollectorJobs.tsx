
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, Trash2, Scale, Calculator, Plus, Save, Search, X, ChevronRight, QrCode, Camera, AlertTriangle, Zap, ZapOff, Image as ImageIcon, Bell, Siren, WifiOff, RefreshCw, Loader2, ThumbsUp, ThumbsDown, ScanLine, Calendar, Cloud, Eye, CloudOff } from 'lucide-react';
import { User as UserType, WasteReport } from '../types';
import { ReportsAPI, AuditAPI, StorageAPI } from '../services/api';
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
            setReports(all.filter(r => r.assignedTo === user.id || (r.status === 'pending' && r.commune === user.commune)));
        } finally { setIsLoading(false); }
    };

    const handleProofCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && jobToValidate) {
            setIsValidatingAI(true);
            try {
                // Compression
                const compressed = await ImageService.compressImage(file);
                setProofFile(compressed);
                const base64 = await ImageService.fileToBase64(compressed);
                setProofPhoto(base64);
                
                if (navigator.onLine) {
                    // COMPARISON IA ENTERPRISE
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

            const updateData = { id: jobToValidate.id, status: 'resolved' as const, proofUrl: proofUrl || undefined };
            await ReportsAPI.update(updateData);
            
            await AuditAPI.log({ userId: user.id, action: 'JOB_RESOLVED', entity: 'REPORT', entityId: jobToValidate.id, metadata: { aiResult: validationResult } });

            setReports(prev => prev.map(r => r.id === jobToValidate.id ? { ...r, ...updateData } : r));
            onToast?.("Mission validée !", "success");
            setJobToValidate(null);
        } catch (e) { onToast?.("Erreur validation", "error"); }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900">
            <input type="file" ref={proofInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleProofCapture} />

            <div className="p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 hover:bg-gray-100 rounded-2xl"><ArrowLeft/></button>
                    <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">Missions Terrain</h2>
                </div>
                <button onClick={loadMyReports} className="text-blue-500"><RefreshCw className={isLoading ? 'animate-spin' : ''}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar pb-32">
                {reports.filter(r => r.status !== 'resolved').map(job => (
                    <div key={job.id} className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex gap-6 mb-6">
                            <img src={job.imageUrl} className="w-20 h-20 rounded-2xl object-cover" />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-gray-900 dark:text-white uppercase truncate">{job.wasteType}</h4>
                                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1 mt-1 uppercase"><MapPin size={10}/> {job.commune}</p>
                            </div>
                        </div>
                        <button onClick={() => { setJobToValidate(job); setProofPhoto(null); setValidationResult(null); proofInputRef.current?.click(); }} className="w-full py-4 bg-[#00C853] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"><Camera size={18}/> Valider Collecte</button>
                    </div>
                ))}
            </div>

            {/* AI COMPARISON MODAL */}
            {jobToValidate && proofPhoto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setJobToValidate(null)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] w-full max-w-lg p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-8 text-center">Preuve de Collecte IA</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase text-center tracking-widest">Avant</p>
                                <img src={jobToValidate.imageUrl} className="aspect-square rounded-2xl object-cover border-2 border-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-blue-400 uppercase text-center tracking-widest">Après</p>
                                <img src={proofPhoto} className="aspect-square rounded-2xl object-cover border-2 border-blue-100" />
                            </div>
                        </div>

                        {isValidatingAI ? (
                            <div className="p-8 text-center bg-gray-50 dark:bg-white/5 rounded-3xl mb-8">
                                <Loader2 className="animate-spin text-blue-500 mx-auto mb-3" />
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Comparaison des zones...</p>
                            </div>
                        ) : validationResult && (
                            <div className={`p-6 rounded-[2rem] border-2 mb-8 ${validationResult.isCleaned ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    {validationResult.isCleaned ? <ThumbsUp size={24}/> : <ThumbsDown size={24}/>}
                                    <span className="font-black uppercase tracking-tight">{validationResult.isCleaned ? 'Collecte Confirmée' : 'Résidus Détectés'}</span>
                                </div>
                                <p className="text-xs font-bold italic opacity-70 leading-relaxed">"{validationResult.comment}"</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => proofInputRef.current?.click()} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">Reprendre</button>
                            <button 
                                onClick={confirmValidation}
                                disabled={isValidatingAI}
                                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2 ${validationResult?.isCleaned ? 'bg-[#00C853] shadow-green-500/20' : 'bg-orange-500 shadow-orange-500/20'}`}
                            >
                                <CheckCircle size={14}/> Finaliser Mission
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
