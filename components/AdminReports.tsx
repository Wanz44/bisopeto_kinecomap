
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap,
    History, UserCog, Trash2, ArrowRight, CheckCircle2, AlertCircle, Ban,
    Maximize2, ChevronRight, MessageCircle, Check, Calendar, User, UserPlus,
    RotateCcw, Target, FileSpreadsheet, Eraser, CalendarDays, SlidersHorizontal,
    UserCircle, Activity, BarChart3, Image as ImageIcon, RefreshCw, SortAsc, SortDesc,
    // Added Bot icon to fix 'Cannot find name Bot' error
    Timer, Flame, DownloadCloud, Layers, Radio, ZoomIn, Bot
} from 'lucide-react';
import { WasteReport, User as AppUser, UserType } from '../types';
import { ReportsAPI, UserAPI, mapReport } from '../services/api';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

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
    onNotify: (targetId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'before' | 'after'>('before');
    const [mapDisplay, setMapDisplay] = useState<'markers' | 'heatmap'>('markers');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isZoomed, setIsZoomed] = useState(false);

    const [filters, setFilters] = useState({
        commune: 'all',
        status: 'all',
        wasteType: 'all',
        dateFrom: '',
        dateTo: '',
        sortBy: 'date',
        sortOrder: 'desc'
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
        const q = query(collection(db, 'waste_reports'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedReports = snapshot.docs.map(doc => mapReport(doc.data(), doc.id));
            setReports(updatedReports);
        }, (error) => {
            console.error("AdminReports Snapshot Error:", error);
        });

        return () => unsubscribe();
    }, [selectedReport, onToast]);

    useEffect(() => {
        loadData(page);
    }, [page]);

    const stats = useMemo(() => {
        const total = reports.length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const pending = reports.filter(r => r.status === 'pending').length;
        const highUrgency = reports.filter(r => r.urgency === 'high' && r.status !== 'resolved').length;
        const successRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
        return { total, resolved, pending, highUrgency, successRate };
    }, [reports]);

    const handleApplyFilters = () => {
        setPage(0);
        setHasMore(true);
        loadData(0, true);
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setFilters({ commune: 'all', status: 'all', wasteType: 'all', dateFrom: '', dateTo: '', sortBy: 'date', sortOrder: 'desc' });
        setPage(0);
        setHasMore(true);
        setTimeout(() => loadData(0, true), 10);
    };

    const handleAssign = async (collectorId: string) => {
        if (!selectedReport && selectedIds.length === 0) return;
        setIsAssigning(true);
        try {
            const targets = selectedReport ? [selectedReport.id] : selectedIds;
            await Promise.all(targets.map(id => 
                ReportsAPI.update({ id, status: 'assigned', assignedTo: collectorId })
            ));
            
            onNotify(collectorId, "Missions Assignées 🚛", `${targets.length} nouveau(x) point(s) de collecte à traiter immédiatement.`, "alert");
            onToast?.(`${targets.length} mission(s) assignée(s) avec succès`, "success");
            
            setShowAssignModal(false);
            setSelectedIds([]);
            // Force reload after assignment
            await loadData(0, true);
        } catch (e) {
            onToast?.("Échec de l'affectation cloud", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (!window.confirm("Action Irréversible : Supprimer ce signalement du Cloud ?")) return;
        setIsDeleting(true);
        try {
            const success = await ReportsAPI.delete(id);
            if (success) {
                // Optimistic UI update
                setReports(prev => prev.filter(r => r.id !== id));
                if (selectedReport?.id === id) setSelectedReport(null);
                onToast?.("Signalement purgé de la BDD", "success");
                // Confirm with real database state
                await loadData(0, true);
            }
        } catch (e: any) {
            console.error(e);
            onToast?.("Erreur Cloud : suppression refusée", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(`Confirmer la suppression de ${selectedIds.length} signalements ?`)) return;
        setIsDeleting(true);
        try {
            const success = await ReportsAPI.deleteMultiple(selectedIds);
            if (success) {
                setReports(prev => prev.filter(r => !selectedIds.includes(r.id)));
                onToast?.(`${selectedIds.length} rapports purgés du système`, "success");
                setSelectedIds([]);
                // Sync complete list from server
                await loadData(0, true);
            }
        } catch (e) {
            onToast?.("Erreur lors de l'opération groupée", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "Type", "Urgence", "Status", "Commune", "Date", "Commentaire"];
        const rows = reports.map(r => [r.id, r.wasteType, r.urgency, r.status, r.commune, r.date, `"${r.comment.replace(/"/g, '""')}"`]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `biso_peto_sig_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast?.("Fichier CSV généré", "info");
    };

    const getSLADelay = (date: string) => {
        const start = new Date(date).getTime();
        const now = Date.now();
        const diffHours = Math.floor((now - start) / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            return { 
                text: "Récent", 
                badgeClass: "bg-green-50 text-green-600 border-green-100", 
                iconColor: "text-green-500" 
            };
        }
        if (diffHours < 24) {
            return { 
                text: `${diffHours}h`, 
                badgeClass: "bg-orange-50 text-orange-600 border-orange-100", 
                iconColor: "text-orange-500" 
            };
        }
        return { 
            text: `${Math.floor(diffHours/24)}j+`, 
            badgeClass: "bg-red-50 text-red-600 border-red-100 font-black shadow-sm", 
            iconColor: "text-red-600" 
        };
    };

    const zoomedImage = viewMode === 'before' ? selectedReport?.imageUrl : selectedReport?.proofUrl;

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            
            <div className="bg-white dark:bg-gray-900 px-6 py-5 shadow-sm border-b dark:border-gray-800 sticky top-0 z-50 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm"><ArrowLeft size={20} /></button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Centre SIG</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Radio size={12} className="text-red-500 animate-pulse" /> Surveillance Flux Live
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 xl:max-w-2xl">
                        {[
                            { label: 'Total Signalements', val: stats.total, icon: FileText, color: 'text-blue-600' },
                            { label: 'En attente', val: stats.pending, icon: Clock, color: 'text-orange-500' },
                            { label: 'Urgences Critiques', val: stats.highUrgency, icon: AlertTriangle, color: 'text-red-500', pulse: stats.highUrgency > 0 },
                            { label: 'Efficacité SLA', val: `${stats.successRate}%`, icon: CheckCircle2, color: 'text-green-500' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex items-center gap-3 border dark:border-gray-700 shadow-inner">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 ${kpi.color} shadow-sm`}>
                                    <kpi.icon size={16} className={kpi.pulse ? 'animate-bounce' : ''} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1.5">{kpi.label}</p>
                                    <p className="text-sm font-black dark:text-white leading-none">{kpi.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={exportToCSV} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:scale-105 transition-all shadow-sm" title="Exporter CSV"><DownloadCloud size={20}/></button>
                        <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-2xl transition-all shadow-sm ${showFilters ? 'bg-[#2962FF] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}><SlidersHorizontal size={20}/></button>
                        <button onClick={() => loadData(0, true)} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-blue-500 transition-colors shadow-sm"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-[#2962FF] text-white rounded-[1.8rem] mb-4 animate-fade-in-up shadow-2xl">
                        <div className="flex items-center gap-4 ml-2">
                            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} éléments sélectionnés</span>
                            <button onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white"><X size={16}/></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAssignModal(true)} className="px-6 py-3 bg-white text-[#2962FF] rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"><Truck size={14}/> Déploiement groupé</button>
                            <button onClick={handleBatchDelete} disabled={isDeleting} className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50">
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                            </button>
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2.5rem] border dark:border-gray-800 mt-2 animate-fade-in shadow-inner grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone Kinshasa</label>
                            <select value={filters.commune} onChange={e => setFilters({...filters, commune: e.target.value})} className="w-full p-3.5 bg-white dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-[11px] uppercase dark:text-white appearance-none shadow-sm">
                                <option value="all">Tout Kinshasa</option>
                                {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">État Mission</label>
                            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full p-3.5 bg-white dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-[11px] uppercase dark:text-white appearance-none shadow-sm">
                                <option value="all">Tous les statuts</option>
                                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Flux de déchets</label>
                            <select value={filters.wasteType} onChange={e => setFilters({...filters, wasteType: e.target.value})} className="w-full p-3.5 bg-white dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-[11px] uppercase dark:text-white appearance-none shadow-sm">
                                <option value="all">Toutes catégories</option>
                                {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                             <button onClick={handleResetFilters} className="flex-1 py-4 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">Reset</button>
                             <button onClick={handleApplyFilters} className="flex-[2] py-4 bg-gray-900 dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Appliquer</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* List View with Responsive Width */}
                <div className="w-full lg:w-[450px] bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col overflow-hidden shrink-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {reports.length === 0 && !isLoading ? (
                            <div className="py-32 text-center opacity-30">
                                <ImageIcon size={64} className="mx-auto mb-6" />
                                <p className="text-xs font-black uppercase tracking-widest">Aucun flux de données</p>
                            </div>
                        ) : reports.map((report, idx) => {
                            const sla = getSLADelay(report.date);
                            const isSelected = selectedIds.includes(report.id);
                            return (
                                <div 
                                    key={report.id}
                                    ref={idx === reports.length - 1 ? lastElementRef : null}
                                    onClick={() => { setSelectedReport(report); setViewMode('before'); }}
                                    className={`p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer relative group flex items-center gap-5 ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-[#2962FF] shadow-lg' : 'bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800'}`}
                                >
                                    <div 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            isSelected ? setSelectedIds(selectedIds.filter(id => id !== report.id)) : setSelectedIds([...selectedIds, report.id]); 
                                        }} 
                                        className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-[#2962FF] border-[#2962FF] text-white shadow-inner' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 shadow-sm'}`}
                                    >
                                        {isSelected && <Check size={14} strokeWidth={5}/>}
                                    </div>
                                    
                                    <div className="relative shrink-0">
                                        <img src={report.imageUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border dark:border-gray-700 shadow-md" alt="Déchet" />
                                        <div className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full border-[3px] border-white dark:border-gray-900 ${report.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase text-[12px] truncate leading-none">{report.wasteType}</h4>
                                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1.5 shrink-0 border ${sla.badgeClass}`} title="Temps écoulé">
                                                <Timer size={10} className={sla.iconColor}/> {sla.text}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate mb-2">{report.commune} • {new Date(report.date).toLocaleDateString()}</p>
                                        <div className="flex items-center justify-between">
                                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase text-white shadow-sm ${STATUSES.find(s=>s.key===report.status)?.color || 'bg-gray-500'}`}>
                                                 {STATUSES.find(s=>s.key===report.status)?.label || report.status}
                                             </span>
                                             <div className="flex gap-1.5 items-center">
                                                <button disabled={isDeleting} onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isDeleting && selectedReport?.id === report.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                                </button>
                                                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#2962FF] transition-all transform group-hover:translate-x-1" />
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#2962FF]" size={32} /></div>}
                    </div>
                </div>

                {/* Map Interface - Expands to fill available space */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0 h-[40vh] lg:h-auto border-t lg:border-t-0 dark:border-gray-800">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        
                        {mapDisplay === 'markers' && reports.map(r => (
                            <Marker 
                                key={r.id} 
                                position={[r.lat, r.lng]} 
                                icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id || selectedIds.includes(r.id))}
                                eventHandlers={{ click: () => { setSelectedReport(r); setViewMode('before'); } }}
                            />
                        ))}

                        {mapDisplay === 'heatmap' && reports.map(r => (
                            <Circle 
                                key={`h-${r.id}`}
                                center={[r.lat, r.lng]}
                                radius={450}
                                pathOptions={{ 
                                    fillColor: r.urgency === 'high' ? '#FF5252' : '#FFB300', 
                                    fillOpacity: 0.25, 
                                    color: 'transparent' 
                                }}
                            />
                        ))}
                    </MapContainer>

                    <div className="absolute top-6 right-6 z-[500] flex flex-col gap-3">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border dark:border-gray-800 flex flex-col gap-1.5">
                            <button onClick={() => setMapDisplay('markers')} className={`p-3.5 rounded-xl transition-all shadow-sm ${mapDisplay === 'markers' ? 'bg-[#2962FF] text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`} title="Mode Marqueurs"><MapIcon size={22}/></button>
                            <button onClick={() => setMapDisplay('heatmap')} className={`p-3.5 rounded-xl transition-all shadow-sm ${mapDisplay === 'heatmap' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`} title="Analyse de Densité"><Flame size={22}/></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* FULL DETAIL PANEL SLIDE-OUT */}
            {selectedReport && (
                <div className="fixed inset-0 z-[1000] flex justify-end">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedReport(null)}></div>
                    <div className="w-full max-w-xl bg-white dark:bg-gray-950 h-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-fade-in-left flex flex-col border-l dark:border-gray-800 overflow-hidden">
                        
                        <div className="p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${selectedReport.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                    <AlertTriangle size={28}/>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Traitement SIG</h3>
                                    <div className="mt-2.5 flex items-center gap-2">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2 border shadow-sm ${getSLADelay(selectedReport.date).badgeClass}`}>
                                            <Timer size={14}/> SLA STATUS: {getSLADelay(selectedReport.date).text.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-3.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all bg-white dark:bg-gray-900 shadow-sm"><X size={26}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
                            <div className="space-y-5">
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit shadow-inner">
                                    <button onClick={() => setViewMode('before')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'before' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Signalement</button>
                                    {selectedReport.proofUrl && (
                                        <button onClick={() => setViewMode('after')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'after' ? 'bg-[#00C853] text-white shadow-sm' : 'text-gray-400'}`}>Preuve Collecte</button>
                                    )}
                                </div>
                                <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-80 border-[10px] border-white dark:border-gray-800 bg-gray-100 group">
                                    <img src={viewMode === 'before' ? selectedReport.imageUrl : selectedReport.proofUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Preuve Terrain" />
                                    <div className={`absolute bottom-6 right-6 px-5 py-2.5 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-2 backdrop-blur-md ${viewMode === 'before' ? 'bg-orange-500/80' : 'bg-[#00C853]/80'}`}>
                                        {viewMode === 'before' ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                                        {viewMode === 'before' ? 'Vue Initiale' : 'Traitement Effectué'}
                                    </div>
                                    <button 
                                        onClick={() => setIsZoomed(true)}
                                        className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl hover:bg-white/40 transition-all shadow-xl"
                                    >
                                        <Maximize2 size={24} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-inner group">
                                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Localité SIG</span>
                                    <span className="font-black dark:text-white uppercase text-sm flex items-center gap-2 truncate group-hover:text-blue-500 transition-colors"><MapPin size={14} className="text-red-500"/> {selectedReport.commune}</span>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-inner">
                                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Catégorie</span>
                                    <span className="font-black dark:text-white uppercase text-sm group-hover:text-blue-500 transition-colors">{selectedReport.wasteType}</span>
                                </div>
                            </div>

                            <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] border border-blue-100 dark:border-blue-900/30 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 text-blue-500 -rotate-12 group-hover:rotate-0 transition-transform"><Bot size={150}/></div>
                                <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-3 relative z-10"><Info size={16}/> Rapport Intelligent AI</h4>
                                <p className="text-[13px] text-blue-900 dark:text-blue-200 font-bold italic leading-relaxed relative z-10">"{selectedReport.comment || 'Analyse automatique Gemini Vision en attente.'}"</p>
                            </div>
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-wrap gap-4 shrink-0 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] items-center">
                            {selectedReport.status === 'pending' && (
                                <button 
                                    onClick={() => setShowAssignModal(true)} 
                                    className="flex-1 py-6 bg-[#2962FF] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(41,98,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 text-xs"
                                >
                                    <Truck size={22}/> Déployer Collecteur
                                </button>
                            )}
                            {selectedReport.status === 'assigned' && (
                                <div className="flex-1 p-6 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-[2.2rem] border border-blue-200 font-black text-xs text-center uppercase tracking-widest flex items-center justify-center gap-3">
                                    <Clock size={20} className="animate-spin"/> Mission en cours
                                </div>
                            )}
                            {selectedReport.status === 'resolved' && (
                                <div className="flex-1 p-6 bg-green-500 text-white rounded-[2.2rem] font-black text-xs text-center uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">
                                    <CheckCircle2 size={24}/> Mission Terminée
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button 
                                    disabled={isDeleting} 
                                    onClick={() => handleDeleteReport(selectedReport.id)} 
                                    className="p-6 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[2rem] hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30 active:scale-95"
                                >
                                    {isDeleting ? <Loader2 className="animate-spin" size={28}/> : <Trash2 size={28}/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isZoomed && zoomedImage && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 animate-fade-in p-4 md:p-10">
                    <button 
                        onClick={() => setIsZoomed(false)}
                        className="absolute top-8 right-8 p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-2xl z-20 shadow-2xl active:scale-90"
                    >
                        <X size={36} />
                    </button>
                    <div className="w-full h-full flex items-center justify-center relative">
                        <img 
                            src={zoomedImage} 
                            className="max-w-full max-h-full object-contain rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)] animate-scale-up border border-white/5" 
                            alt="Vue détaillée" 
                        />
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-10 py-5 bg-black/50 backdrop-blur-xl rounded-full border border-white/10 text-white font-black uppercase text-[11px] tracking-[0.4em] shadow-2xl whitespace-nowrap">
                            Biso Peto SIG • Haute Résolution
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[4rem] w-full max-w-lg p-10 relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] border dark:border-gray-800 animate-scale-up flex flex-col max-h-[85vh]">
                        <div className="flex justify-between items-center mb-10 shrink-0">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Affectation</h3>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2">Sélection du collecteur disponible</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-inner"><X size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
                            {collectors.length === 0 ? (
                                <div className="py-24 text-center text-gray-400 font-black uppercase text-xs tracking-widest opacity-30">Aucun agent disponible</div> 
                            ) : collectors.map(coll => (
                                <div 
                                    key={coll.id} 
                                    onClick={() => handleAssign(coll.id!)} 
                                    className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border-2 border-transparent hover:border-blue-500 hover:bg-white dark:hover:bg-gray-800 transition-all group cursor-pointer flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-105 transition-transform">{coll.firstName[0]}</div>
                                        <div>
                                            <p className="font-black text-gray-900 dark:text-white uppercase text-sm leading-none mb-1.5">{coll.firstName} {coll.lastName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={10} className="text-blue-500"/> {coll.commune}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={22} className="text-gray-300 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
