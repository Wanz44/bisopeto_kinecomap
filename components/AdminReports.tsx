
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
    Timer, Flame, DownloadCloud, Layers, Radio
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
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'before' | 'after'>('before');
    const [mapDisplay, setMapDisplay] = useState<'markers' | 'heatmap'>('markers');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
        if (supabase) {
            const channel = supabase.channel('realtime_sig_reports_admin_v6')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, (payload) => {
                    const mapped = mapReport(payload.new);
                    setReports(prev => {
                        const idx = prev.findIndex(r => r.id === mapped.id);
                        if (idx > -1) {
                            const newArr = [...prev];
                            newArr[idx] = mapped;
                            return newArr;
                        }
                        return [mapped, ...prev];
                    });
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [onToast]);

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
            onNotify(collectorId, "Missions Terrain 🚛", `${targets.length} nouveau(x) point(s) de collecte assigné(s).`, "alert");
            onToast?.(`${targets.length} mission(s) assignée(s)`, "success");
            setShowAssignModal(false);
            setSelectedIds([]);
            loadData(0, true);
        } catch (e) {
            if (onToast) onToast("Échec de l'affectation", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteReport = async (id: string) => {
        if (!window.confirm("Voulez-vous supprimer définitivement ce signalement du Cloud ?")) return;
        setIsDeleting(true);
        try {
            await ReportsAPI.delete(id);
            setReports(prev => prev.filter(r => r.id !== id));
            if (selectedReport?.id === id) setSelectedReport(null);
            onToast?.("Supprimé avec succès", "success");
        } catch (e) {
            onToast?.("Erreur lors de la suppression", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBatchDelete = async () => {
        if (!window.confirm(`Supprimer définitivement les ${selectedIds.length} signalements sélectionnés ?`)) return;
        setIsDeleting(true);
        try {
            await Promise.all(selectedIds.map(id => ReportsAPI.delete(id)));
            setReports(prev => prev.filter(r => !selectedIds.includes(r.id)));
            onToast?.(`${selectedIds.length} signalements supprimés`, "success");
            setSelectedIds([]);
        } catch (e) {
            onToast?.("Erreur lors de la suppression groupée", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "Type", "Urgence", "Status", "Commune", "Date", "Commentaire"];
        const rows = reports.map(r => [r.id, r.wasteType, r.urgency, r.status, r.commune, r.date, `"${r.comment}"`]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `biso_peto_sig_export_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getSLADelay = (date: string) => {
        const start = new Date(date).getTime();
        const now = Date.now();
        const diffHours = Math.floor((now - start) / (1000 * 60 * 60));
        if (diffHours < 1) return { text: "Récent", color: "text-green-500" };
        if (diffHours < 24) return { text: `${diffHours}h`, color: "text-orange-500" };
        return { text: `${Math.floor(diffHours/24)}j`, color: "text-red-500 font-black" };
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft size={20} /></button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Console SIG Pro</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5 flex items-center gap-2"><Radio size={12} className="text-red-500 animate-pulse" /> Surveillance Terrain Live</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 xl:max-w-2xl">
                        {[
                            { label: 'Total SIG', val: stats.total, icon: FileText, color: 'text-blue-600' },
                            { label: 'Attente', val: stats.pending, icon: Clock, color: 'text-orange-500' },
                            { label: 'Critiques', val: stats.highUrgency, icon: AlertTriangle, color: 'text-red-500', pulse: stats.highUrgency > 0 },
                            { label: 'Succès SLA', val: `${stats.successRate}%`, icon: CheckCircle2, color: 'text-green-500' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl flex items-center gap-3 border dark:border-gray-700">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-white dark:bg-gray-900 ${kpi.color} shadow-sm`}>
                                    <kpi.icon size={16} className={kpi.pulse ? 'animate-bounce' : ''} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">{kpi.label}</p>
                                    <p className="text-sm font-black dark:text-white leading-none">{kpi.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button onClick={exportToCSV} className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl hover:scale-105 transition-all" title="Exporter CSV"><DownloadCloud size={20}/></button>
                        <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-2xl transition-all ${showFilters ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}><SlidersHorizontal size={20}/></button>
                        <button onClick={() => loadData(0, true)} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl"><RefreshCw size={20} className={isLoading ? 'animate-spin' : ''}/></button>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-4 bg-primary text-white rounded-2xl mb-4 animate-fade-in-up shadow-xl">
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} éléments sélectionnés</span>
                            <button onClick={() => setSelectedIds([])} className="text-white/60 hover:text-white"><X size={16}/></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><Truck size={14}/> Déploiement groupé</button>
                            <button onClick={handleBatchDelete} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg"><Trash2 size={16}/></button>
                        </div>
                    </div>
                )}

                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border dark:border-gray-800 mt-2 animate-fade-in shadow-inner grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone Kinshasa</label>
                            <select value={filters.commune} onChange={e => setFilters({...filters, commune: e.target.value})} className="w-full p-2.5 bg-white dark:bg-gray-800 rounded-xl border-none outline-none font-black text-[10px] uppercase">
                                <option value="all">Tout Kinshasa</option>
                                {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <button onClick={handleApplyFilters} className="md:col-start-3 lg:col-start-4 bg-gray-900 dark:bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest self-end">Filtrer les Flux</button>
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-full md:w-[450px] bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32">
                        {reports.length === 0 && !isLoading ? (
                            <div className="py-20 text-center opacity-30"><ImageIcon size={48} className="mx-auto mb-4" /><p className="text-xs font-black uppercase">Aucun flux de données</p></div>
                        ) : reports.map((report) => {
                            const sla = getSLADelay(report.date);
                            const isSelected = selectedIds.includes(report.id);
                            return (
                                <div 
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={`p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer relative group flex items-center gap-4 ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-400 shadow-lg' : 'bg-white dark:bg-gray-900 border-gray-50 dark:border-gray-800'}`}
                                >
                                    <div onClick={(e) => { e.stopPropagation(); isSelected ? setSelectedIds(selectedIds.filter(id => id !== report.id)) : setSelectedIds([...selectedIds, report.id]); }} className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary text-white shadow-inner' : 'bg-gray-50 dark:bg-gray-800 border-gray-200'}`}>
                                        {isSelected && <Check size={12} strokeWidth={4}/>}
                                    </div>
                                    <div className="relative shrink-0">
                                        <img src={report.imageUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border dark:border-gray-700" />
                                        <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${report.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 dark:text-white uppercase text-[11px] truncate leading-none mb-1">{report.wasteType}</h4>
                                            <span className={`text-[9px] font-black uppercase ${sla.color} flex items-center gap-1 shrink-0 ml-2`}><Timer size={10}/> {sla.text}</span>
                                        </div>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{report.commune} • {new Date(report.date).toLocaleDateString()}</p>
                                        <div className="flex items-center justify-between mt-2">
                                             <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase text-white ${STATUSES.find(s=>s.key===report.status)?.color}`}>{report.status}</span>
                                             <div className="flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                                                <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" /></div>}
                    </div>
                </div>

                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {mapDisplay === 'markers' && reports.map(r => (
                            <Marker 
                                key={r.id} 
                                position={[r.lat, r.lng]} 
                                icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id || selectedIds.includes(r.id))}
                                eventHandlers={{ click: () => setSelectedReport(r) }}
                            />
                        ))}
                        {mapDisplay === 'heatmap' && reports.map(r => (
                            <Circle 
                                key={`h-${r.id}`}
                                center={[r.lat, r.lng]}
                                radius={400}
                                pathOptions={{ fillColor: r.urgency === 'high' ? 'red' : 'orange', fillOpacity: 0.15, color: 'transparent' }}
                            />
                        ))}
                    </MapContainer>

                    <div className="absolute top-6 right-6 z-[500] flex flex-col gap-3">
                        <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-2xl border dark:border-gray-800 flex flex-col gap-1">
                            <button onClick={() => setMapDisplay('markers')} className={`p-3 rounded-xl transition-all ${mapDisplay === 'markers' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`} title="Mode Marqueurs"><MapIcon size={20}/></button>
                            <button onClick={() => setMapDisplay('heatmap')} className={`p-3 rounded-xl transition-all ${mapDisplay === 'heatmap' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`} title="Analyse de Densité"><Flame size={20}/></button>
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
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Traitement SIG</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">SLA STATUS: {getSLADelay(selectedReport.date).text.toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                             <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-80 border-4 border-white dark:border-gray-800 bg-gray-100">
                                <img src={viewMode === 'before' ? selectedReport.imageUrl : selectedReport.proofUrl} className="w-full h-full object-cover" alt="Preuve" />
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <div className={`px-4 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 ${viewMode === 'before' ? 'bg-orange-500' : 'bg-[#00C853]'}`}>
                                        {viewMode === 'before' ? 'Vue Initiale' : 'Traitement'}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Localité</span>
                                    <span className="font-black dark:text-white uppercase text-xs truncate flex items-center gap-2"><MapPin size={12} className="text-red-500"/> {selectedReport.commune}</span>
                                </div>
                                <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800">
                                    <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Catégorie</span>
                                    <span className="font-black dark:text-white uppercase text-xs">{selectedReport.wasteType}</span>
                                </div>
                            </div>

                            <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Analyse du signalement</h4>
                                <p className="text-xs text-blue-900 dark:text-blue-200 font-bold italic leading-relaxed">"{selectedReport.comment || 'Analyse automatique Gemini Vision.'}"</p>
                            </div>
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex flex-wrap gap-4 shrink-0 shadow-2xl items-center">
                            {selectedReport.status === 'pending' && (
                                <button onClick={() => setShowAssignModal(true)} className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"><Truck size={20}/> Déployer Collecteur</button>
                            )}
                            {selectedReport.status === 'assigned' && (
                                <div className="flex-1 p-5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-3xl border border-blue-200 font-black text-xs text-center uppercase tracking-widest flex items-center justify-center gap-2"><Clock size={18} className="animate-spin"/> Mission Terrain en cours</div>
                            )}
                            <button disabled={isDeleting} onClick={() => handleDeleteReport(selectedReport.id)} className="p-5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[1.8rem] hover:bg-red-600 hover:text-white transition-all shadow-sm">{isDeleting ? <Loader2 className="animate-spin" size={24}/> : <Trash2 size={24}/>}</button>
                        </div>
                    </div>
                </div>
            )}

            {showAssignModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <div><h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Affectation</h3><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Déploiement opérationnel</p></div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar mb-8">
                            {collectors.length === 0 ? <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">Aucun agent disponible</p> : collectors.map(coll => (
                                <div key={coll.id} onClick={() => handleAssign(coll.id!)} className="p-5 bg-gray-50 dark:bg-gray-900 rounded-3xl border dark:border-gray-800 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center font-black">{coll.firstName[0]}</div>
                                        <div><p className="font-black text-gray-900 dark:text-white uppercase text-xs">{coll.firstName} {coll.lastName}</p><p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{coll.commune}</p></div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
