import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, CheckCircle, Navigation, Clock, Trash2, Scale, Calculator, Plus, Save, Search, X, ChevronRight, QrCode, Camera, AlertTriangle, Zap, ZapOff, Image as ImageIcon, Bell, Siren, WifiOff, RefreshCw, Loader2, ThumbsUp, ThumbsDown, ScanLine, Calendar, Cloud, Eye, CloudOff } from 'lucide-react';
import { User as UserType } from '../types';
import { OfflineManager } from '../services/offlineManager';
import { validateCleanliness } from '../services/geminiService';

interface CollectorJobsProps {
    user: UserType;
    onBack: () => void;
    onNotify: (targetId: string | 'ADMIN', title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Job {
    id: number;
    name: string;
    address: string;
    wasteType: string;
    status: 'pending' | 'completed';
    distance: string;
    time: string;
    date?: string; // Ajout pour l'historique
    qrCode?: string; 
    isUrgent?: boolean;
    syncStatus?: 'synced' | 'pending';
    proofImage?: string;
}

interface SpecialCollection {
    id: string;
    clientName: string;
    wasteType: string;
    weight: number;
    pricePerKg: number;
    totalAmount: number;
    timestamp: string;
    pointsEarned: number;
    syncStatus?: 'synced' | 'pending';
}

const TODAY = new Date().toISOString().split('T')[0];

const MOCK_JOBS: Job[] = [
    { id: 1, name: 'Famille Mapele', address: 'Av. Lukusa 12, Gombe', wasteType: 'Ménager', status: 'pending', distance: '0.5 km', time: '10:00', date: TODAY, qrCode: 'USER-001', syncStatus: 'synced' },
    { id: 2, name: 'Restaurant Chez Ntemba', address: 'Av. Libération, Gombe', wasteType: 'Organique & Verre', status: 'pending', distance: '1.2 km', time: '10:30', date: TODAY, qrCode: 'USER-002', syncStatus: 'synced' },
    { id: 3, name: 'Immeuble Futur', address: 'Blvd du 30 Juin', wasteType: 'Papier & Plastique', status: 'completed', distance: '2.0 km', time: '09:15', date: TODAY, qrCode: 'USER-003', syncStatus: 'synced', proofImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=500&q=60' },
    { id: 4, name: 'Famille Kabeya', address: 'Rue de la Paix', wasteType: 'Ménager', status: 'pending', distance: '0.8 km', time: '11:00', date: TODAY, qrCode: 'USER-004', syncStatus: 'synced' },
    { id: 5, name: 'Kiosque Central', address: 'Place Victoire', wasteType: 'Ménager', status: 'completed', distance: '5.0 km', time: '08:00', date: '2023-10-25', qrCode: 'USER-005', syncStatus: 'synced' },
];

const MOCK_CLIENTS = [
    { id: 'c1', name: 'Kinshasa Food SARL', address: 'Gombe' },
    { id: 'c2', name: 'Hôtel Memling', address: 'Gombe' },
    { id: 'c3', name: 'Supermarché Kin Mart', address: 'Gombe' },
    { id: 'c4', name: 'Bracongo', address: 'Lingwala' },
];

export const CollectorJobs: React.FC<CollectorJobsProps> = ({ user, onBack, onNotify, onToast }) => {
    const [activeTab, setActiveTab] = useState<'route' | 'special' | 'history'>('route');
    const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // AI Validation State
    const [isValidatingAI, setIsValidatingAI] = useState(false);
    const [validationResult, setValidationResult] = useState<{isClean: boolean, comment: string} | null>(null);
    const [jobToValidate, setJobToValidate] = useState<number | null>(null);
    const [proofPhoto, setProofPhoto] = useState<string | null>(null);
    const proofInputRef = useRef<HTMLInputElement>(null);

    // QR Scanner State
    const [isScanning, setIsScanning] = useState(false);
    const [jobToScan, setJobToScan] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    
    // Special Collection State
    const [showSpecialForm, setShowSpecialForm] = useState(false);
    const [specialHistory, setSpecialHistory] = useState<SpecialCollection[]>([]);
    const [specialForm, setSpecialForm] = useState({
        clientId: '',
        wasteType: 'Plastique',
        weight: '',
        pricePerKg: '500', 
    });
    const [generatedTime, setGeneratedTime] = useState('');

    // History State
    const [historyDate, setHistoryDate] = useState(TODAY);
    const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

    // Network Listener
    useEffect(() => {
        const handleStatusChange = () => {
            const status = navigator.onLine;
            setIsOnline(status);
            if (status) {
                // Try to sync offline queue when back online
                OfflineManager.processQueue((task) => console.log('Synced:', task));
                
                setJobs(prev => prev.map(j => j.syncStatus === 'pending' ? { ...j, syncStatus: 'synced' } : j));
                setSpecialHistory(prev => prev.map(s => s.syncStatus === 'pending' ? { ...s, syncStatus: 'synced' } : s));
            }
        };
        window.addEventListener('online', handleStatusChange);
        window.addEventListener('offline', handleStatusChange);
        return () => {
            window.removeEventListener('online', handleStatusChange);
            window.removeEventListener('offline', handleStatusChange);
        };
    }, []);

    useEffect(() => {
        if (showSpecialForm) {
            const now = new Date();
            setGeneratedTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
        }
    }, [showSpecialForm]);

    // --- AI PROOF LOGIC ---
    const initiateValidation = (jobId: number) => {
        setJobToValidate(jobId);
        setProofPhoto(null);
        setValidationResult(null);
        // Trigger camera immediately
        proofInputRef.current?.click();
    };

    const handleProofCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && jobToValidate !== null) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                setProofPhoto(base64);
                
                // Start AI Analysis
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
                    // Offline fallback
                    setValidationResult({ isClean: true, comment: "Mode hors ligne : Validation manuelle." });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmValidation = () => {
        if (jobToValidate !== null) {
            updateJobStatus(jobToValidate, 'completed', proofPhoto || undefined);
            setJobToValidate(null);
            setProofPhoto(null);
            setValidationResult(null);
        }
    };

    const updateJobStatus = (jobId: number, status: 'completed' | 'pending', proof?: string) => {
        setJobs(prev => prev.map(job => 
            job.id === jobId 
            ? { ...job, status: status, syncStatus: navigator.onLine ? 'synced' : 'pending', proofImage: proof, date: TODAY } 
            : job
        ));

        // Logique de file d'attente hors ligne
        if (!navigator.onLine) {
            OfflineManager.addToQueue('VALIDATE_JOB', { jobId: jobId, timestamp: Date.now(), proof: proof });
            if (onToast) onToast("Action enregistrée hors ligne.", "info");
        } else {
            onNotify('ALL', 'Mission Mise à jour', `Statut: ${status}`, 'success');
            if (onToast) onToast("Mission mise à jour avec succès !", "success");
        }
    };

    // --- QR SCANNING LOGIC ---
    
    const stopScanner = () => {
        setIsScanning(false);
        setJobToScan(null);
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const startScanner = async (jobId: number) => {
        setJobToScan(jobId);
        setIsScanning(true);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video to be ready
                videoRef.current.setAttribute("playsinline", "true"); // required to tell iOS safari we don't want fullscreen
                videoRef.current.play();
                requestAnimationFrame(tick);
            }
        } catch (err) {
            console.error("Erreur caméra:", err);
            if (onToast) onToast("Impossible d'accéder à la caméra.", "error");
            stopScanner();
        }
    };

    const tick = () => {
        if (!videoRef.current || !canvasRef.current || !isScanning) return;

        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Use global jsQR if available (loaded via CDN in index.html)
                const jsQR = (window as any).jsQR;
                
                if (jsQR) {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        handleScanSuccess(code.data);
                        return; // Stop loop on success
                    }
                }
            }
        }
        animationFrameRef.current = requestAnimationFrame(tick);
    };

    const handleScanSuccess = (data: string) => {
        if (!jobToScan) return;
        
        const job = jobs.find(j => j.id === jobToScan);
        if (job) {
            if (job.qrCode === data) {
                // Success Match
                if (navigator.vibrate) navigator.vibrate(200);
                updateJobStatus(jobToScan, 'completed');
                stopScanner();
            } else {
                // Wrong QR
                if (onToast) onToast(`QR Code incorrect. Attendu: ${job.qrCode}, Reçu: ${data}`, "error");
                // Delay slightly to avoid spamming toast
                setTimeout(() => {
                    if (isScanning) requestAnimationFrame(tick);
                }, 2000);
                return;
            }
        }
    };

    // --- Special Collection Logic ---
    const handleSpecialSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(specialForm.weight);
        const price = parseFloat(specialForm.pricePerKg);
        
        if (!specialForm.clientId || isNaN(weight) || isNaN(price)) return;

        const client = MOCK_CLIENTS.find(c => c.id === specialForm.clientId);
        const total = weight * price;
        const points = Math.floor(weight * 2);

        const newCollection: SpecialCollection = {
            id: Date.now().toString(),
            clientName: client?.name || 'Client Inconnu',
            wasteType: specialForm.wasteType,
            weight: weight,
            pricePerKg: price,
            totalAmount: total,
            timestamp: generatedTime,
            pointsEarned: points,
            syncStatus: navigator.onLine ? 'synced' : 'pending'
        };

        if (!navigator.onLine) {
            OfflineManager.addToQueue('ADD_ITEM', newCollection);
            if (onToast) onToast("Enregistré hors ligne.", "info");
        } else {
            onNotify('ADMIN', 'Nouvelle Pesée', `Collecteur ${user.firstName}: ${weight}kg`, 'info');
            if (onToast) onToast("Collecte spéciale enregistrée !", "success");
        }

        setSpecialHistory([newCollection, ...specialHistory]);
        setShowSpecialForm(false);
        setSpecialForm({
            clientId: '',
            wasteType: 'Plastique',
            weight: '',
            pricePerKg: '500',
        });
    };

    const pendingJobs = jobs.filter(j => j.status === 'pending');
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const historyJobs = jobs.filter(j => j.status === 'completed' && j.date === historyDate);

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative">
            {/* Input caché pour la photo de preuve */}
            <input 
                type="file" 
                ref={proofInputRef} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={handleProofCapture} 
            />

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={() => onBack()} className="mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Espace Collecte
                                {!isOnline && <WifiOff size={16} className="text-red-500" />}
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Zone: {user.zone || 'Non assignée'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('route')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'route' ? 'bg-white dark:bg-gray-600 text-[#2962FF] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <MapPin size={16} /> Ma Route
                    </button>
                    <button 
                        onClick={() => setActiveTab('special')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'special' ? 'bg-white dark:bg-gray-600 text-[#2962FF] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Scale size={16} /> Spécial
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'history' ? 'bg-white dark:bg-gray-600 text-[#2962FF] dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        <Clock size={16} /> Historique
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-4">
                
                {/* === ROUTE TAB === */}
                {activeTab === 'route' && (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-800 dark:text-white">Aujourd'hui ({pendingJobs.length})</h3>
                            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{completedJobs.length} faits</span>
                        </div>

                        {jobs.filter(j => j.date === TODAY).map(job => (
                            <div key={job.id} className={`bg-white dark:bg-gray-800 p-4 rounded-2xl border transition-all ${job.status === 'completed' ? 'border-gray-100 dark:border-gray-700 opacity-80' : job.isUrgent ? 'border-red-500 border-2 shadow-red-200 dark:shadow-none' : 'border-gray-200 dark:border-gray-600 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 ${job.status === 'completed' ? 'bg-green-500' : job.isUrgent ? 'bg-red-500 animate-pulse' : 'bg-[#2962FF]'}`}>
                                            {job.status === 'completed' ? <CheckCircle size={20} /> : job.isUrgent ? <AlertTriangle size={20} /> : <Trash2 size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                {job.name}
                                                {job.isUrgent && <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Urgent</span>}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{job.address}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                            <Clock size={12} /> {job.time}
                                        </span>
                                        {job.syncStatus === 'pending' && (
                                            <span className="text-[10px] text-orange-500 flex items-center gap-1 mt-1 font-bold">
                                                <RefreshCw size={10} className="animate-spin" /> Sync
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 pl-[52px]">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{job.wasteType}</span>
                                    <span>{job.distance}</span>
                                </div>

                                {job.status === 'pending' && (
                                    <div className="flex gap-2 pl-[52px]">
                                        <button 
                                            onClick={() => startScanner(job.id)}
                                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-[#2962FF] rounded-xl font-bold flex-1 flex items-center justify-center gap-2 text-sm hover:bg-blue-100 transition-colors"
                                        >
                                            <QrCode size={16} /> Scan QR
                                        </button>
                                        <button 
                                            onClick={() => initiateValidation(job.id)}
                                            className="p-2 bg-[#00C853] text-white rounded-xl font-bold flex-1 flex items-center justify-center gap-2 text-sm hover:bg-green-600 transition-colors"
                                        >
                                            <Camera size={16} /> Preuve
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* === SPECIAL TAB === */}
                {activeTab === 'special' && (
                    <div className="animate-fade-in space-y-6">
                        <button 
                            onClick={() => setShowSpecialForm(true)}
                            className="w-full py-4 bg-[#2962FF] hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <Plus size={20} /> Nouvelle Pesée
                        </button>
                        {/* Liste historique (simplifiée pour l'exemple) */}
                        <div className="text-center py-10 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                            {specialHistory.length > 0 ? (
                                <div>{specialHistory.length} pesées aujourd'hui</div>
                            ) : (
                                <p>Aucune collecte spéciale.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* === HISTORY TAB === */}
                {activeTab === 'history' && (
                    <div className="animate-fade-in space-y-4">
                        {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <Calendar size={20} className="text-gray-400" />
                            <input 
                                type="date" 
                                value={historyDate}
                                onChange={(e) => setHistoryDate(e.target.value)}
                                className="bg-transparent text-gray-800 dark:text-white font-bold outline-none flex-1"
                            />
                        </div>

                        {/* History List */}
                        {historyJobs.length === 0 ? (
                            <div className="text-center py-16 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                <p>Aucune mission complétée à cette date.</p>
                            </div>
                        ) : (
                            historyJobs.map(job => (
                                <div key={job.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-600">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{job.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{job.address}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-800 dark:text-white">{job.time}</p>
                                            <div className={`text-[10px] font-bold flex items-center gap-1 mt-1 justify-end ${job.syncStatus === 'synced' ? 'text-blue-500' : 'text-orange-500'}`}>
                                                {job.syncStatus === 'synced' ? <Cloud size={10} /> : <RefreshCw size={10} className="animate-spin" />}
                                                {job.syncStatus === 'synced' ? 'Sync' : 'Attente'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-3">
                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">{job.wasteType}</span>
                                        {job.proofImage ? (
                                            <button 
                                                onClick={() => setSelectedProofImage(job.proofImage || null)}
                                                className="text-xs font-bold text-[#2962FF] flex items-center gap-1 hover:underline"
                                            >
                                                <Eye size={12} /> Voir Preuve
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic">Pas de photo</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* SCANNER OVERLAY */}
            {isScanning && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                        <div className="text-white">
                            <h3 className="font-bold text-lg">Scan QR Code</h3>
                            <p className="text-xs opacity-80">Pointez le code de la poubelle</p>
                        </div>
                        <button onClick={() => stopScanner()} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Camera View */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        <video 
                            ref={videoRef} 
                            className="absolute inset-0 w-full h-full object-cover" 
                            muted 
                            playsInline 
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* Scanner Guide UI */}
                        <div className="relative z-10 w-64 h-64 border-2 border-[#00C853] rounded-3xl shadow-[0_0_0_1000px_rgba(0,0,0,0.6)] flex items-center justify-center">
                            <div className="w-full h-0.5 bg-[#00C853] absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_10px_#00C853]"></div>
                            <ScanLine size={48} className="text-white/20 animate-ping" />
                        </div>
                    </div>

                    <div className="p-6 bg-black text-center text-white z-20">
                        <p className="text-sm font-medium">Recherche de code...</p>
                    </div>
                </div>
            )}

            {/* AI VALIDATION MODAL */}
            {jobToValidate !== null && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setJobToValidate(null)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in-up flex flex-col items-center">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Validation du Nettoyage</h3>
                        
                        {proofPhoto ? (
                            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-lg">
                                <img src={proofPhoto} alt="Preuve" className="w-full h-full object-cover" />
                                {isValidatingAI && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                                        <Loader2 size={32} className="animate-spin mb-2 text-[#2962FF]" />
                                        <p className="text-xs font-bold animate-pulse">Biso Peto AI analyse...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                <p className="text-xs text-gray-500">Aucune photo prise</p>
                            </div>
                        )}

                        {validationResult && (
                            <div className={`w-full p-3 rounded-xl mb-4 text-center ${validationResult.isClean ? 'bg-green-50 dark:bg-green-900/30 border border-green-200' : 'bg-red-50 dark:bg-red-900/30 border border-red-200'}`}>
                                <div className={`flex items-center justify-center gap-2 font-bold mb-1 ${validationResult.isClean ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {validationResult.isClean ? <ThumbsUp size={18} /> : <ThumbsDown size={18} />}
                                    {validationResult.isClean ? "Validé par IA" : "Attention : Zone sale"}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic">"{validationResult.comment}"</p>
                            </div>
                        )}

                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => proofInputRef.current?.click()}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold text-sm"
                            >
                                Reprendre
                            </button>
                            <button 
                                onClick={() => confirmValidation()}
                                disabled={!validationResult?.isClean && !isValidatingAI} 
                                className={`flex-1 py-3 text-white rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 ${
                                    !validationResult 
                                    ? 'bg-gray-300 cursor-not-allowed' 
                                    : validationResult.isClean 
                                        ? 'bg-[#00C853] hover:bg-green-600' 
                                        : 'bg-red-500 hover:bg-red-600'
                                }`}
                            >
                                <CheckCircle size={16} /> Confirmer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROOF IMAGE VIEW MODAL */}
            {selectedProofImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedProofImage(null)}>
                    <div className="relative max-w-lg w-full">
                        <button 
                            onClick={() => setSelectedProofImage(null)} 
                            className="absolute -top-12 right-0 text-white p-2 hover:bg-white/20 rounded-full"
                        >
                            <X size={24} />
                        </button>
                        <img src={selectedProofImage} alt="Preuve de service" className="w-full h-auto rounded-xl shadow-2xl" />
                        <div className="mt-4 text-center">
                            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                Preuve Validée
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Special Form Modal (Existing code) */}
            {showSpecialForm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSpecialForm(false)}></div>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 relative z-10 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Collecte Spéciale</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> {generatedTime}</p>
                            </div>
                            <button onClick={() => setShowSpecialForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSpecialSubmit} className="space-y-5">
                            <button type="submit" className="w-full py-4 bg-[#00C853] hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                <Save size={20} /> Valider
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};