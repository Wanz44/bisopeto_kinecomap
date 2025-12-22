import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap,
    History, UserCog, Trash2, ArrowRight, CheckCircle2, AlertCircle, Ban,
    Maximize2, ChevronRight, MessageCircle, Check, Calendar, User, UserPlus,
    RotateCcw, Target, FileSpreadsheet, Eraser, CalendarDays, SlidersHorizontal
} from 'lucide-react';
import { WasteReport, User as AppUser, UserType } from '../types';
import { ReportsAPI, UserAPI } from '../services/api';

const KINSHASA_COMMUNES = [
    "Barumbu", "Bumbu", "Bandalungwa", "Gombe", "Kalamu", "Kasa-Vubu", 
    "Kinshasa", "Kintambo", "Lingwala", "Lemba", "Limete", "Makala", 
    "Maluku", "Masina", "Matete", "Mont Ngafula", "Mbinza", "Ngaba", 
    "Ngaliema", "N’djili", "Nsele", "Selembao", "Kimbanseke", "Kisenso"
];

const WASTE_TYPES = ["Plastique", "Métal", "Électronique", "Organique", "Papier/Carton", "Verre", "Médical", "Gravats", "Divers"];
const STATUSES = [
    { key: 'pending', label: 'En attente', color: 'bg-yellow-500' },
    { key: 'assigned', label: 'Assigné', color: 'bg-blue-500' },
    { key: 'resolved', label: 'Résolu', color: 'bg-green-500' },
    { key: 'rejected', label: 'Rejeté', color: 'bg-gray-500' }
];

const reportIcon = (status: string, urgency: string, isSelected: boolean) => {
    const color = status === 'resolved' ? '#00C853' : status === 'rejected' ? '#9E9E9E' : urgency === 'high' ? '#FF5252' : '#FFB300';
    const size = isSelected ? 22 : 14;
    return L.divIcon({
        className: 'custom-report-marker',
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${isSelected ? color : 'rgba(0,0,0,0.2)'}; position: relative;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

export const AdminReports: React.FC<any> = ({ onBack, onToast, onNotify, currentUser }) => {
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filter States
    const [filters, setFilters] = useState({
        commune: 'all',
        status: 'all',
        wasteType: 'all',
        dateFrom: '',
        dateTo: ''
    });

    const observer = useRef<IntersectionObserver>();
    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    const loadData = async (pageNum: number, isNewSearch = false) => {
        setIsLoading(true);
        try {
            const data = await ReportsAPI.getAll(pageNum, 50, filters);
            if (data.length < 50) setHasMore(false);
            setReports(prev => isNewSearch ? data : [...prev, ...data]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

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
        // On attend le prochain cycle pour s'assurer que filters est à jour
        setTimeout(() => loadData(0, true), 10);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            {/* Header / Search & Toggle Filter */}
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">SIG Opérations</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1.5">Analyse cartographique & terrain</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${showFilters ? 'bg-[#2962FF] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                            <Filter size={16} /> Filtres {(filters.commune !== 'all' || filters.status !== 'all' || filters.wasteType !== 'all') && '•'}
                        </button>
                    </div>
                </div>

                {/* Expanded Filters Panel */}
                {showFilters && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-[2.5rem] border dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Commune</label>
                            <select 
                                value={filters.commune} 
                                onChange={e => setFilters({...filters, commune: e.target.value})}
                                className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-xs font-black outline-none border-none dark:text-white shadow-sm"
                            >
                                <option value="all">Toutes les communes</option>
                                {KINSHASA_COMMUNES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Type de déchet</label>
                            <select 
                                value={filters.wasteType} 
                                onChange={e => setFilters({...filters, wasteType: e.target.value})}
                                className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-xs font-black outline-none border-none dark:text-white shadow-sm"
                            >
                                <option value="all">Tous les types</option>
                                {WASTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Statut</label>
                            <select 
                                value={filters.status} 
                                onChange={e => setFilters({...filters, status: e.target.value})}
                                className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl text-xs font-black outline-none border-none dark:text-white shadow-sm"
                            >
                                <option value="all">Tous les statuts</option>
                                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">Période (Début / Fin)</label>
                            <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={filters.dateFrom} 
                                    onChange={e => setFilters({...filters, dateFrom: e.target.value})}
                                    className="flex-1 p-3 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-black outline-none border-none dark:text-white shadow-sm" 
                                />
                                <input 
                                    type="date" 
                                    value={filters.dateTo} 
                                    onChange={e => setFilters({...filters, dateTo: e.target.value})}
                                    className="flex-1 p-3 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-black outline-none border-none dark:text-white shadow-sm" 
                                />
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={handleApplyFilters} className="flex-1 py-3 bg-[#00C853] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all">Appliquer</button>
                            <button onClick={handleResetFilters} className="p-3 bg-gray-100 dark:bg-gray-900 text-gray-500 rounded-xl hover:text-red-500 transition-all"><RotateCcw size={16}/></button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Lateral List Section */}
                <div className="hidden lg:flex w-[450px] bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {reports.length === 0 && !isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <Search size={48} className="opacity-10" />
                                <p className="font-black uppercase text-xs tracking-widest">Aucun signalement trouvé</p>
                            </div>
                        ) : (
                            reports.map((report, index) => (
                                <div 
                                    key={report.id} 
                                    ref={index === reports.length - 1 ? lastElementRef : null}
                                    onClick={() => setSelectedReport(report)}
                                    className={`p-5 rounded-[2.2rem] border-2 transition-all cursor-pointer group flex flex-col gap-4 ${selectedReport?.id === report.id ? 'border-[#2962FF] bg-blue-50/30 dark:bg-blue-900/10 shadow-xl' : 'border-gray-50 dark:border-gray-900 hover:border-gray-100'}`}
                                >
                                    <div className="flex gap-5">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white dark:border-gray-800 shadow-md">
                                            <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-black dark:text-white uppercase truncate text-sm leading-none">{report.wasteType}</h4>
                                                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase text-white ${report.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                        Urgence {report.urgency}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center gap-1 uppercase"><MapPin size={10}/> {report.commune}</p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white ${STATUSES.find(s=>s.key===report.status)?.color}`}>
                                                    {STATUSES.find(s=>s.key===report.status)?.label}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-mono">{new Date(report.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center py-10 gap-3">
                                <Loader2 className="animate-spin text-[#2962FF]" size={24} />
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mise à jour SIG...</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Full Map View */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%', width: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; Biso Peto SIG" />
                        {reports.map(r => (
                            <Marker 
                                key={r.id} 
                                position={[r.lat, r.lng]} 
                                icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)}
                                eventHandlers={{ click: () => setSelectedReport(r) }}
                            />
                        ))}
                    </MapContainer>

                    {/* Quick Info Overlay for mobile/list view */}
                    {selectedReport && (
                        <div className="absolute bottom-8 left-8 right-8 z-[1000] animate-fade-in-up">
                            <div className="max-w-xl mx-auto bg-white dark:bg-gray-950 p-6 rounded-[3rem] shadow-2xl border-4 border-blue-500/20 flex flex-col md:flex-row gap-6 relative overflow-hidden">
                                <div className="absolute top-4 right-4"><button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={20}/></button></div>
                                <img src={selectedReport.imageUrl} className="w-full md:w-32 h-32 rounded-[2rem] object-cover border dark:border-gray-800" />
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter leading-none">{selectedReport.wasteType}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">{selectedReport.commune} • Signalé le {new Date(selectedReport.date).toLocaleString()}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="flex-1 py-3 bg-[#2962FF] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Assigner Equipe</button>
                                        <button className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl"><ExternalLink size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};