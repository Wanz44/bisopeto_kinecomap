
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, Trash2, Scale, Calculator, Plus, Save, Search, X, ChevronRight, QrCode, Camera, AlertTriangle, Zap, ZapOff, Image as ImageIcon, Bell, Siren, WifiOff, RefreshCw, Loader2, ThumbsUp, ThumbsDown, ScanLine, Calendar, Cloud, Eye, CloudOff } from 'lucide-react';
import { User as UserType, WasteReport } from '../types';
import { ReportsAPI } from '../services/api';
import { OfflineManager } from '../services/offlineManager';
import { validateCleanliness } from '../services/geminiService';

interface CollectorJobsProps {
    user: UserType;
    onBack: () => void;
    onNotify: (targetId: string | 'ADMIN', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const TODAY = new Date().toISOString().split('T')[0];

export const CollectorJobs: React.FC<CollectorJobsProps> = ({ user, onBack, onNotify, onToast }) => {
    const [activeTab, setActiveTab] = useState<'route' | 'special' | 'history'>('route');
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // AI Validation State
    const [isValidatingAI, setIsValidatingAI] = useState(false);
    const [validationResult, setValidationResult] = useState<{isClean: boolean, comment: string} | null>(null);
    const [jobToValidate, setJobToValidate] = useState<string | null>(null);
    const [proofPhoto, setProofPhoto] = useState<string | null>(null);
    const proofInputRef = useRef<HTMLInputElement>(null);

    // History State
    const [historyDate, setHistoryDate] = useState(TODAY);
    const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

    useEffect(() => {
        loadMyReports();
        const handleStatusChange = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    const loadMyReports = async () => {
        setIsLoading(true);
        try {
            const all = await ReportsAPI.getAll();
            // Filtrer les rapports assignés à ce collecteur ou en attente dans sa commune
            const myJobs = all.filter(r => r.assignedTo === user.id || (r.status === 'pending' && r.commune === user.commune));
            setReports(myJobs);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const initiateValidation = (jobId: string) => {
        setJobToValidate(jobId);
        setProofPhoto(null);
        setValidationResult(null);
        proofInputRef.current?.click();
    };

    const handleProofCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && jobToValidate !== null) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setProofPhoto(base64);
                
                if (navigator.onLine) {
                    setIsValidatingAI(true);
                    try {
                        const result = await validateCleanliness(base64);
                        setValidationResult(result);
                    } catch (err) {
                        setValidationResult({ isClean: true, comment: "Validation IA indisponible (Erreur)" });
                    } finally {
                        setIsValidatingAI(false);
                    }
                } else {
                    setValidationResult({ isClean: true, comment: "Mode hors ligne : Validation manuelle." });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmValidation = async () => {
        if (jobToValidate !== null) {
            const report = reports.find(r => r.id === jobToValidate);
            if (!report) return;

            try {
                if (navigator.onLine) {
                    await ReportsAPI.update({ ...report, status: 'resolved' });
                    onToast?.("Mission validée avec succès !", "success");
                    onNotify('ADMIN', 'Mission Terminée ✅', `Collecteur ${user.firstName} a nettoyé une zone à ${report.commune}`, 'success');
                } else {
                    OfflineManager.addToQueue('ADD_REPORT', { ...report, status: 'resolved' });
                    onToast?.("Validé localement. Sync au retour réseau.", "info");
                }
                setReports(prev => prev.map(r => r.id === jobToValidate ? { ...r, status: 'resolved' } : r));
            } catch (e) {
                onToast?.("Erreur de mise à jour", "error");
            }
            setJobToValidate(null);
            setProofPhoto(null);
            setValidationResult(null);
        }
    };

    const myRouteJobs = reports.filter(r => r.status !== 'resolved');
    const myHistoryJobs = reports.filter(r => r.status === 'resolved' && new Date(r.date).toISOString().split('T')[0] === historyDate);

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative">
            <input type="file" ref={proofInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleProofCapture} />

            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => onBack()} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                Missions Live
                                {!isOnline && <WifiOff size={16} className="text-red-500" />}
                            </h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secteur: {user.commune || 'KINSHASA'}</p>
                        </div>
                    </div>
                    <button onClick={loadMyReports} className="p-2 text-blue-500"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                </div>

                <div className="flex p-1 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    <button onClick={() => setActiveTab('route')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'route' ? 'bg-white dark:bg-gray-600 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}>Ma Route</button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-600 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}>Historique</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4 no-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : activeTab === 'route' ? (
                    myRouteJobs.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-black uppercase text-[10px] tracking-widest">Aucune mission en cours.</div>
                    ) : (
                        myRouteJobs.map(job => (
                            <div key={job.id} className={`bg-white dark:bg-gray-800 p-5 rounded-[2.5rem] border shadow-sm ${job.urgency === 'high' ? 'border-red-200' : 'border-gray-100'}`}>
                                <div className="flex gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100">
                                        <img src={job.imageUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm truncate">{job.wasteType}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${job.urgency === 'high' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>{job.urgency}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 line-clamp-1"><MapPin size={10} className="inline mr-1"/> {job.commune}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.lat},${job.lng}`)} className="flex-1 py-3 bg-blue-50 text-blue-600 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"><Navigation size={14}/> Itinéraire</button>
                                    <button onClick={() => initiateValidation(job.id)} className="flex-[1.5] py-3 bg-[#00C853] text-white rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"><Camera size={14}/> Valider Propreté</button>
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    <div className="space-y-4">
                        <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-[10px] uppercase tracking-widest shadow-sm" />
                        {myHistoryJobs.map(job => (
                            <div key={job.id} className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={18}/></div>
                                    <div>
                                        <p className="font-black text-gray-900 dark:text-white uppercase text-xs">{job.wasteType}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{job.commune}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-gray-300">{new Date(job.date).toLocaleTimeString()}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI VALIDATION MODAL */}
            {jobToValidate !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setJobToValidate(null)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in-up flex flex-col items-center">
                        <h3 className="text-lg font-black text-gray-800 dark:text-white mb-6 uppercase tracking-tighter">Validation IA Biso Peto</h3>
                        
                        {proofPhoto ? (
                            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden mb-6 shadow-lg border-4 border-white">
                                <img src={proofPhoto} alt="Preuve" className="w-full h-full object-cover" />
                                {isValidatingAI && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                        <Loader2 size={32} className="animate-spin mb-2 text-[#2962FF]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analyse visuelle...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300">
                                <p className="text-[10px] font-black uppercase text-gray-400">Capture requise</p>
                            </div>
                        )}

                        {validationResult && (
                            <div className={`w-full p-4 rounded-2xl mb-6 border-2 ${validationResult.isClean ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`flex items-center gap-2 font-black text-xs uppercase mb-1 ${validationResult.isClean ? 'text-green-700' : 'text-red-700'}`}>
                                    {validationResult.isClean ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
                                    {validationResult.isClean ? "Validé par IA" : "Zone encore sale"}
                                </div>
                                <p className="text-[10px] text-gray-500 font-bold italic">"{validationResult.comment}"</p>
                            </div>
                        )}

                        <div className="flex gap-3 w-full">
                            <button onClick={() => proofInputRef.current?.click()} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Reprendre</button>
                            <button 
                                onClick={confirmValidation}
                                disabled={!validationResult?.isClean && !isValidatingAI} 
                                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 ${
                                    !validationResult ? 'bg-gray-300' : validationResult.isClean ? 'bg-[#00C853]' : 'bg-red-500'
                                }`}
                            >
                                <CheckCircle size={16} /> Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
