
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

export const AdminReports: React.FC<any> = ({ onBack, onToast, onNotify, currentUser }) => {
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

    // REAL-TIME LISTENER POUR LES NOUVEAUX RAPPORTS
    useEffect(() => {
        if (supabase) {
            const channel = supabase.channel('realtime_sig_reports')
                .on('postgres_changes', { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'waste_reports' 
                }, (payload) => {
                    const newReport = mapReport(payload.new);
                    setReports(prev => [newReport, ...prev]);
                    onToast?.(`Nouveau Signalement : ${newReport.wasteType} à ${newReport.commune}`, "info");
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'waste_reports'
                }, (payload) => {
                    const updated = mapReport(payload.new);
                    setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                    if (selectedReport?.id === updated.id) {
                        setSelectedReport(updated);
                    }
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [onToast, selectedReport?.id]);

    useEffect(() => {
        loadData(page);
    }, [page]);

    const handleAssign = async (collectorId: string) => {
        if (!selectedReport) return;
        setIsAssigning(true);
        try {
            const collector = collectors.find(c => c.id === collectorId);
            await ReportsAPI.update({ 
                id: selectedReport.id, 
                status: 'assigned', 
                assignedTo: collectorId 
            });
            
            if (onNotify) {
                onNotify(collectorId, "Nouvelle Mission ! 🚛", `Urgence ${selectedReport.urgency} detectée à ${selectedReport.commune}.`, "alert");
            }
            
            if (onToast) onToast(`Mission assignée à ${collector?.firstName}`, "success");
            setShowAssignModal(false);
            setSelectedReport(null);
        } catch (e) {
            if (onToast) onToast("Échec de l'assignation", "error");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassign = async () => {
        if (!selectedReport) return;
        if (!confirm("Retirer cette mission du collecteur actuel ?")) return;
        
        setIsAssigning(true);
        try {
            await ReportsAPI.update({ id: selectedReport.id, status: 'pending', assignedTo: undefined });
            setSelectedReport(null);
            onToast?.("Mission remise en attente", "info");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleApplyFilters = () => {
        setPage(0); setHasMore(true);
        loadData(0, true);
        setShowFilters(false);
    };

    const handleResetFilters = () => {
        setFilters({ commune: 'all', status: 'all', wasteType: 'all', dateFrom: '', dateTo: '' });
        setPage(0); setHasMore(true);
        setTimeout(() => loadData(0, true), 10);
    };

    const stats = {
        pending: reports.filter(r => r.status === 'pending').length,
        urgent: reports.filter(r => r.urgency === 'high' && r.status !== 'resolved').length,
        assigned: reports.filter(r => r.status === 'assigned').length
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
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Analyse & Gestion Terrain</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => loadData(0, true)} className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl hover:text-primary transition-all"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''}/></button>
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${showFilters ? 'bg-[#2962FF] text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                            <SlidersHorizontal size={14} /> Filtres
                        </button>
                    </div>
                </div>

                {/* Bandeau Stats Dynamique */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex items-center justify-between">
                        <div><p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">En attente</p><p className="text-xl font-black text-orange-600 leading-none mt-1">{stats.pending}</p></div>
                        <Clock size={20} className="text-orange-500 opacity-30" />
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between">
                        <div><p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Urgent High</p><p className="text-xl font-black text-red-600 leading-none mt-1">{stats.urgent}</p></div>
                        <AlertTriangle size={20} className="text-red-500 opacity-30" />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
                        <div><p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Missions Live</p><p className="text-xl font-black text-blue-600 leading-none mt-1">{stats.assigned}</p></div>
                        <Truck size={20} className="text-blue-500 opacity-30" />
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2rem] border dark:border-gray-800 mt-4 animate-fade-in shadow-inner space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zone</label>
                                <select value={filters.commune} onChange={e => setFilters({...filters, commune: e.target.value})} className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-black outline-none appearance-none border dark:border-gray-700 shadow-sm">
                                    <option value="all">Toutes les communes</option>
                                    {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Type de Déchet</label>
                                <select value={filters.wasteType} onChange={e => setFilters({...filters, wasteType: e.target.value})} className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-black outline-none appearance-none border dark:border-gray-700 shadow-sm">
                                    <option value="all">Tous types</option>
                                    {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Statut</label>
                                <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-black outline-none appearance-none border dark:border-gray-700 shadow-sm">
                                    <option value="all">Tous statuts</option>
                                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Période : Du (Début)</label>
                                <input type="date" value={filters.dateFrom} onChange={e=>setFilters({...filters, dateFrom:e.target.value})} className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-black outline-none border dark:border-gray-700 shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Au (Fin)</label>
                                <input type="date" value={filters.dateTo} onChange={e=>setFilters({...filters, dateTo:e.target.value})} className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-black outline-none border dark:border-gray-700 shadow-sm" />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button onClick={handleApplyFilters} className="flex-1 py-3 bg-[#2962FF] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Appliquer les filtres</button>
                            <button onClick={handleResetFilters} className="px-6 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2"><Eraser size={14}/> Réinitialiser</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Liste latérale ultra-compacte */}
                <div className="hidden lg:flex w-[350px] bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
                        {reports.length === 0 && !isLoading && (
                            <div className="py-20 text-center opacity-30">
                                <Activity size={48} className="mx-auto mb-4"/>
                                <p className="text-[10px] font-black uppercase tracking-widest">Aucun signalement</p>
                            </div>
                        )}
                        {reports.map((report, index) => (
                            <div key={report.id} ref={index === reports.length - 1 ? lastElementRef : null} onClick={() => { setSelectedReport(report); setViewProof(false); }} className={`p-4 rounded-[1.8rem] border transition-all cursor-pointer group flex flex-col gap-2 ${selectedReport?.id === report.id ? 'border-[#2962FF] bg-blue-50/30 shadow-lg' : 'border-gray-50 dark:border-gray-900 hover:border-gray-100'}`}>
                                <div className="flex gap-3">
                                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative">
                                        <img src={report.imageUrl} className="w-full h-full object-cover" />
                                        {report.status === 'pending' && <div className="absolute inset-0 bg-yellow-500/20 animate-pulse"></div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start"><h4 className="font-black dark:text-white uppercase truncate text-[10px]">{report.wasteType}</h4><span className={`px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase text-white ${report.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>{report.urgency}</span></div>
                                        <p className="text-[8px] text-gray-400 font-bold mt-0.5 uppercase truncate"><MapPin size={8}/> {report.commune}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase text-white ${STATUSES.find(s=>s.key===report.status)?.color}`}>{STATUSES.find(s=>s.key===report.status)?.label}</span>
                                            <span className="text-[7px] text-gray-300 font-mono">{new Date(report.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto" /></div>}
                    </div>
                </div>
                
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; Biso Peto SIG" />
                        {reports.map(r => <Marker key={r.id} position={[r.lat, r.lng]} icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)} eventHandlers={{ click: () => { setSelectedReport(r); setViewProof(false); } }} />)}
                    </MapContainer>

                    {selectedReport && (
                        <div className="absolute bottom-6 left-6 right-6 lg:left-auto lg:right-6 lg:bottom-6 z-[1000] animate-fade-in-up">
                            <div className="w-full lg:w-[400px] bg-white dark:bg-gray-950 p-5 rounded-[2.2rem] shadow-2xl border-2 border-blue-500/20 flex flex-col gap-4 relative overflow-hidden group">
                                <div className="absolute top-3 right-3"><button onClick={() => setSelectedReport(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"><X size={16}/></button></div>
                                
                                {viewProof && selectedReport.proofUrl ? (
                                    <div className="space-y-4 animate-fade-in">
                                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest text-center">Vérification terrain</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1"><p className="text-[7px] font-black uppercase text-center text-gray-400">Avant</p><img src={selectedReport.imageUrl} className="aspect-square rounded-2xl object-cover border" /></div>
                                            <div className="space-y-1"><p className="text-[7px] font-black uppercase text-center text-green-500">Après</p><img src={selectedReport.proofUrl} className="aspect-square rounded-2xl object-cover border-2 border-green-500" /></div>
                                        </div>
                                        <button onClick={() => setViewProof(false)} className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-black uppercase text-[8px] tracking-widest">Retour détails</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 border dark:border-gray-800"><img src={selectedReport.imageUrl} className="w-full h-full object-cover" /></div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black dark:text-white uppercase tracking-tight truncate leading-tight">{selectedReport.wasteType}</h3>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={9}/> {selectedReport.commune}</p>
                                            <p className="text-[8px] text-gray-400 mt-2 font-medium line-clamp-2 italic">"{selectedReport.comment || 'Aucune observation...'}"</p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-800">
                                    {selectedReport.status === 'pending' ? (
                                        <button onClick={() => setShowAssignModal(true)} className="flex-1 py-2.5 bg-[#2962FF] text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95 transition-all">Assigner Équipe</button>
                                    ) : selectedReport.status === 'assigned' ? (
                                        <button onClick={handleUnassign} className="flex-1 py-2.5 bg-orange-50 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg active:scale-95 transition-all">Réaffecter</button>
                                    ) : selectedReport.status === 'resolved' ? (
                                        <button onClick={() => setViewProof(!viewProof)} className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg flex items-center justify-center gap-2"><ImageIcon size={14}/> {viewProof ? 'Détails' : 'Voir Preuve'}</button>
                                    ) : (
                                        <div className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-gray-400 font-black text-[9px] uppercase tracking-widest">Clôturé</div>
                                    )}
                                    <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:text-[#2962FF] transition-colors"><ExternalLink size={16}/></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL ASSIGNATION COLLECTEURS */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-8">
                            <div><h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">Déploiement</h3><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Choisir un collecteur pour cette mission</p></div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar mb-8">
                            {collectors.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px]">Aucun collecteur actif trouvé</p>
                            ) : (
                                collectors.map(c => (
                                    <div key={c.id} onClick={() => !isAssigning && handleAssign(c.id!)} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent hover:border-primary transition-all cursor-pointer flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-primary shadow-sm"><UserCircle size={24}/></div>
                                            <div><p className="font-black text-xs dark:text-white uppercase">{c.firstName} {c.lastName}</p><p className="text-[9px] text-gray-400 font-bold uppercase">{c.commune}</p></div>
                                        </div>
                                        {isAssigning ? <Loader2 className="animate-spin text-blue-500" size={16}/> : <ChevronRight className="text-gray-300 group-hover:text-primary" size={16}/>}
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={() => setShowAssignModal(false)} className="w-full py-4 text-gray-400 font-black uppercase text-[10px] tracking-widest">Annuler</button>
                    </div>
                </div>
            )}
        </div>
    );
};
