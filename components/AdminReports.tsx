
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap,
    History, UserCog, Trash2, ArrowRight, CheckCircle2, AlertCircle, Ban,
    Maximize2, ChevronRight, MessageCircle, Check, Calendar, User, UserPlus,
    RotateCcw, Target, FileSpreadsheet, Eraser, CalendarDays, SlidersHorizontal,
    UserCircle, Activity, BarChart3, Image as ImageIcon, RefreshCw
} from 'lucide-react';
import { WasteReport, User as AppUser, UserType } from '../types';
import { ReportsAPI, UserAPI, mapReport } from '../services/api';
import { supabase } from '../services/supabaseClient';

const KINSHASA_COMMUNES = [
    "Barumbu", "Bumbu", "Bandalungwa", "Gombe", "Kalamu", "Kasa-Vubu", 
    "Kinshasa", "Kintambo", "Lingwala", "Lemba", "Limete", "Makala", 
    "Maluku", "Masina", "Matete", "Mont Ngafula", "Mbinza", "Ngaba", 
    "Ngaliema", "N’djili", "Nsele", "Selembao", "Kimbanseke", "Kisenso"
];

const WASTE_TYPES = ["Plastique", "Métal", "Électronique", "Organique", "Papier/Cardon", "Verre", "Médical", "Gravats", "Divers"];

const STATUSES = [
    { key: 'pending', label: 'En attente', color: 'bg-yellow-500', icon: Clock },
    { key: 'assigned', label: 'Assigné', color: 'bg-blue-500', icon: Truck },
    { key: 'resolved', label: 'Résolu', color: 'bg-green-500', icon: CheckCircle2 },
    { key: 'rejected', label: 'Rejeté', color: 'bg-gray-500', icon: Ban }
];

const reportIcon = (status: string, urgency: string, isSelected: boolean) => {
    const color = status === 'resolved' ? '#00C853' : status === 'rejected' ? '#9E9E9E' : urgency === 'high' ? '#FF5252' : '#FFB300';
    const size = isSelected ? 22 : 14;
    return L.divIcon({
        className: 'custom-report-marker',
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${isSelected ? color : 'rgba(0,0,0,0.2)'}; position: relative;">
            ${status === 'pending' ? '<div style="position:absolute; inset:-4px; border:2px solid #FFB300; border-radius:50%; animation:ping 2s infinite;"></div>' : ''}
        </div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

interface AdminReportsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onNotify: (targetId: string, title: string, message: string, type: string) => void;
    currentUser: AppUser;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ onBack, onToast, onNotify, currentUser }) => {
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [collectors, setCollectors] = useState<AppUser[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [viewProof, setViewProof] = useState(false);

    const [filters, setFilters] = useState({
        commune: 'all',
        status: 'all',
        wasteType: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node && observer.current) observer.current.observe(node);
    }, [isLoading, hasMore]);

    const loadData = async (pageNum: number, isNewSearch = false) => {
        setIsLoading(true);
        try {
            const [reportsData, usersData] = await Promise.all([
                ReportsAPI.getAll(pageNum, 50, filters),
                pageNum === 0 ? UserAPI.getAll() : Promise.resolve([])
            ]);
            
            if (reportsData.length < 50) setHasMore(false);
            setReports(prev => isNewSearch ? reportsData : [...prev, ...reportsData]);
            
            if (pageNum === 0) {
                setCollectors(usersData.filter(u => u.type === UserType.COLLECTOR));
            }
        } catch (e) {
            if (onToast) onToast("Erreur Cloud SIG", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (supabase) {
            const channel = supabase.channel('realtime_sig_reports_admin_v3')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waste_reports' }, (payload) => {
                    const newReport = mapReport(payload.new);
                    setReports(prev => [newReport, ...prev]);
                    onToast?.(`Nouveau Signalement : ${newReport.wasteType}`, "info");
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [onToast]);

    useEffect(() => {
        loadData(page);
    }, [page]);

    const handleApplyFilters = () => {
        setPage(0);
        setHasMore(true);
        loadData(0, true);
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setFilters({ commune: 'all', status: 'all', wasteType: 'all', dateFrom: '', dateTo: '' });
        setPage(0);
        setHasMore(true);
        setTimeout(() => loadData(0, true), 10);
    };

    const handleAssign = async (collectorId: string) => {
        if (!selectedReport) return;
        setIsAssigning(true);
        try {
            await ReportsAPI.update({ id: selectedReport.id, status: 'assigned', assignedTo: collectorId });
            onNotify(collectorId, "Nouvelle Mission ! 🚛", `Urgence ${selectedReport.urgency} détectée à ${selectedReport.commune}.`, "alert");
            onToast?.("Mission assignée avec succès", "success");
            setShowAssignModal(false);
            loadData(0, true);
        } catch (e) {
            if (onToast) onToast("Échec de l'affectation", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            {/* Header SIG */}
            <div className="bg-white dark:bg-gray-900 p-4 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><ArrowLeft size={18} /></button>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">SIG Opérations</h2>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Filtrage temporel et spatial</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showFilters ? 'bg-[#2962FF] text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                            <CalendarDays size={14} /> Calendrier
                        </button>
                        <button onClick={() => loadData(0, true)} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl hover:text-primary transition-all"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''}/></button>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border dark:border-gray-800 mt-4 animate-fade-in shadow-inner space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Début Période</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                                    <input 
                                        type="date" 
                                        value={filters.dateFrom} 
                                        onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border-none outline-none font-bold text-xs dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Fin Période</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-3 text-gray-400" />
                                    <input 
                                        type="date" 
                                        value={filters.dateTo} 
                                        onChange={e => setFilters({ ...filters, dateTo: e.target.value })} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl border-none outline-none font-bold text-xs dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone (Commune)</label>
                                <select 
                                    value={filters.commune} 
                                    onChange={e => setFilters({ ...filters, commune: e.target.value })}
                                    className="w-full p-2.5 bg-white dark:bg-gray-800 rounded-xl border-none outline-none font-black text-[10px] uppercase dark:text-white"
                                >
                                    <option value="all">Tout Kinshasa</option>
                                    {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Flux de Déchets</label>
                                <select 
                                    value={filters.wasteType} 
                                    onChange={e => setFilters({ ...filters, wasteType: e.target.value })}
                                    className="w-full p-2.5 bg-white dark:bg-gray-800 rounded-xl border-none outline-none font-black text-[10px] uppercase dark:text-white"
                                >
                                    <option value="all">Toutes catégories</option>
                                    {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                            <button onClick={handleResetFilters} className="px-4 py-2 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2"><Eraser size={14}/> Reset</button>
                            <button onClick={handleApplyFilters} className="px-6 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Appliquer</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar pb-32">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><List size={16}/> Rapports SIG</h3>
                            <span className="text-[10px] font-black text-blue-500 uppercase">{reports.length} missions</span>
                        </div>
                        
                        {reports.length === 0 && !isLoading ? (
                            <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
                                <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-xs font-black text-gray-400 uppercase">Aucun flux de données détecté</p>
                            </div>
                        ) : (
                            reports.map((report, idx) => (
                                <div 
                                    key={report.id}
                                    ref={idx === reports.length - 1 ? lastElementRef : null}
                                    onClick={() => { setSelectedReport(report); setViewProof(false); }}
                                    className={`p-5 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 transition-all cursor-pointer group flex items-center gap-5 ${selectedReport?.id === report.id ? 'border-blue-500 shadow-xl' : 'border-gray-50 dark:border-gray-800 shadow-sm'}`}
                                >
                                    <div className="relative">
                                        <img src={report.imageUrl} className="w-16 h-16 rounded-2xl object-cover border dark:border-gray-700" alt="Déchet" />
                                        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white ${report.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs truncate">{report.wasteType}</h4>
                                            <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-lg ${
                                                report.status === 'resolved' ? 'bg-green-500 text-white' : 
                                                report.status === 'assigned' ? 'bg-blue-500 text-white' : 'bg-yellow-500 text-white'
                                            }`}>{STATUSES.find(s=>s.key===report.status)?.label}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase truncate flex items-center gap-1"><MapPin size={10}/> {report.commune}</p>
                                        <p className="text-[8px] text-gray-400 font-black mt-2 uppercase tracking-widest flex items-center gap-1"><Clock size={10}/> {new Date(report.date).toLocaleDateString()}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" /></div>
                        )}
                    </div>

                    <div className="hidden xl:block">
                        <div className="sticky top-0 h-[600px] rounded-[3rem] overflow-hidden border-4 border-white dark:border-gray-800 shadow-2xl">
                             <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                {reports.map(r => (
                                    <Marker 
                                        key={r.id} 
                                        position={[r.lat, r.lng]} 
                                        icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)}
                                        eventHandlers={{ click: () => { setSelectedReport(r); setViewProof(false); } }}
                                    />
                                ))}
                             </MapContainer>
                        </div>
                    </div>
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedReport(null)}></div>
                    <div className="w-full max-w-xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col border-l dark:border-gray-800 overflow-hidden">
                        <div className="p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${selectedReport.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}><AlertTriangle size={24}/></div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Intervention Terrain</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ID SIG: {selectedReport.id.slice(0,8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-64 border-4 border-white dark:border-gray-800 bg-gray-100">
                                <img src={viewProof && selectedReport.proofUrl ? selectedReport.proofUrl : selectedReport.imageUrl} className="w-full h-full object-cover" alt="Déchet" />
                                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon size={14}/> {viewProof ? 'Vérification' : 'Signalement'}
                                </div>
                                {selectedReport.proofUrl && (
                                    <button 
                                        onClick={() => setViewProof(!viewProof)}
                                        className="absolute bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2"
                                    >
                                        <RefreshCw size={14}/> Basculer Vue
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Catégorie</span>
                                    <span className="font-black dark:text-white uppercase text-xs">{selectedReport.wasteType}</span>
                                </div>
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Zone</span>
                                    <span className="font-black dark:text-white uppercase text-xs">{selectedReport.commune}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes Citoyen</h4>
                                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-xs text-blue-900 dark:text-blue-200 font-bold italic leading-relaxed">"{selectedReport.comment || 'Sans commentaire particulier.'}"</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex gap-4 shrink-0 shadow-2xl">
                            {selectedReport.status === 'pending' && (
                                <button 
                                    onClick={() => setShowAssignModal(true)}
                                    className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                >
                                    <Truck size={20}/> Affecter Collecteur
                                </button>
                            )}
                            {selectedReport.status === 'assigned' && (
                                <div className="flex-1 p-5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-3xl border border-blue-200 font-black text-xs text-center uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Clock size={18} className="animate-spin"/> Mission en cours
                                </div>
                            )}
                            {selectedReport.status === 'resolved' && (
                                <div className="flex-1 p-5 bg-green-500 text-white rounded-3xl font-black text-xs text-center uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg">
                                    <CheckCircle2 size={20}/> Mission Terminée
                                </div>
                            )}
                            <button className="p-5 bg-white dark:bg-gray-800 text-gray-500 rounded-[1.8rem] border dark:border-gray-700 hover:text-blue-500 transition-colors"><Download size={20}/></button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Déploiement</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X/></button>
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar mb-8">
                            {collectors.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">Aucun agent disponible</p>
                            ) : (
                                collectors.map(coll => (
                                    <div 
                                        key={coll.id} 
                                        onClick={() => handleAssign(coll.id!)}
                                        className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">{coll.firstName[0]}</div>
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white uppercase text-xs">{coll.firstName} {coll.lastName}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{coll.commune}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                ))
                            )}
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">L'agent recevra une alerte PUSH instantanée.</p>
                    </div>
                </div>
            )}
        </div>
    );
};
