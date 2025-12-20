
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap,
    History, UserCog, Trash2, ArrowRight, CheckCircle2, AlertCircle, Ban,
    Maximize2, ChevronRight, MessageCircle, Check, Calendar, User, UserPlus,
    RotateCcw, Target, FileSpreadsheet, Eraser
} from 'lucide-react';
import { WasteReport, User as AppUser, UserType } from '../types';
import { ReportsAPI, UserAPI } from '../services/api';

const reportIcon = (status: string, urgency: string, isSelected: boolean) => {
    const color = status === 'resolved' ? '#00C853' : status === 'rejected' ? '#9E9E9E' : urgency === 'high' ? '#FF5252' : '#FFB300';
    const size = isSelected ? 22 : 14;
    const border = isSelected ? '4px' : '3px';
    
    return L.divIcon({
        className: 'custom-report-marker',
        html: `
            <div style="
                background-color: ${color}; 
                width: ${size}px; 
                height: ${size}px; 
                border-radius: 50%; 
                border: ${border} solid white; 
                box-shadow: 0 0 15px ${isSelected ? color : 'rgba(0,0,0,0.2)'};
                transition: all 0.3s ease-out;
                position: relative;
            ">
                ${isSelected ? '<div style="position: absolute; inset: -8px; border: 2px solid ' + color + '; border-radius: 50%; animate: ping 2s infinite;"></div>' : ''}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);
    return null;
};

interface AdminReportsProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
    onNotify: (targetId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
    currentUser?: AppUser;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ onBack, onToast, onNotify, currentUser }) => {
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [collectors, setCollectors] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'hybrid' | 'list'>('hybrid');
    const [filterCommune, setFilterCommune] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterWasteType, setFilterWasteType] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-4.325, 15.322]);
    const [mapZoom, setMapZoom] = useState(12);
    
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    const canExport = currentUser?.permissions?.includes('export_data') || currentUser?.type === UserType.ADMIN;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [repData, userData] = await Promise.all([
                ReportsAPI.getAll(),
                UserAPI.getAll()
            ]);
            setReports(repData);
            setCollectors(userData.filter(u => u.type === UserType.COLLECTOR));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectReport = (report: WasteReport) => {
        setSelectedReport(report);
        setMapCenter([report.lat, report.lng]);
        setMapZoom(16);
    };

    const handleResetFilters = () => {
        setFilterCommune('all');
        setFilterStatus('all');
        setFilterWasteType('all');
        setFilterStartDate('');
        setFilterEndDate('');
        setSearchQuery('');
        if (onToast) onToast("Filtres réinitialisés", "info");
    };

    const handleUpdateStatus = async (report: WasteReport, newStatus: WasteReport['status']) => {
        try {
            await ReportsAPI.update({ ...report, id: report.id, status: newStatus });
            const updatedReports = reports.map(r => r.id === report.id ? { ...r, status: newStatus } : r);
            setReports(updatedReports);
            
            if (selectedReport?.id === report.id) {
                setSelectedReport({ ...selectedReport, status: newStatus });
            }

            if (onToast) onToast(`Signalement passé en état : ${newStatus.toUpperCase()}`, "success");
            
            if (newStatus === 'resolved' && report.reporterId !== 'anonymous') {
                onNotify(report.reporterId, "Zone Nettoyée ! ✨", `Mbote! Le signalement de déchets que vous avez fait a été traité. Merci !`, 'success');
            }
        } catch (e) {
            if (onToast) onToast("Erreur lors de la mise à jour", "error");
        }
    };

    const handleDeleteReport = async (reportId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce signalement ?")) return;
        
        try {
            await ReportsAPI.delete(reportId);
            setReports(prev => prev.filter(r => r.id !== reportId));
            if (selectedReport?.id === reportId) setSelectedReport(null);
            if (onToast) onToast("Signalement supprimé avec succès", "success");
        } catch (e) {
            if (onToast) onToast("Erreur lors de la suppression", "error");
        }
    };

    const handleAssign = async (collectorId: string) => {
        if (!selectedReport) return;
        try {
            await ReportsAPI.update({ ...selectedReport, id: selectedReport.id, status: 'assigned', assignedTo: collectorId });
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'assigned', assignedTo: collectorId } : r));
            
            if (selectedReport.id) {
                onNotify(collectorId, "Mission Prioritaire ! 🚛", `Affectation : Signalement #${selectedReport.id.slice(-4)}.`, 'info');
            }
            
            if (onToast) onToast("Collecteur affecté avec succès", "success");
            setShowAssignModal(false);
            setSelectedReport({ ...selectedReport, status: 'assigned', assignedTo: collectorId });
        } catch (e) {
            if (onToast) onToast("Erreur d'assignation", "error");
        }
    };

    const handleExportCSV = () => {
        if (filteredReports.length === 0) {
            onToast?.("Aucune donnée à exporter avec les filtres actuels", "info");
            return;
        }

        const headers = ["ID_REPORT", "DATE_CREATION", "TYPE_DECHET", "NIVEAU_URGENCE", "STATUT_ACTUEL", "COMMUNE", "GPS_LAT", "GPS_LNG", "LIEN_IMAGE", "COMMENTAIRE_ADMIN"];
        const rows = filteredReports.map(r => [
            r.id,
            new Date(r.date).toISOString(),
            r.wasteType,
            r.urgency,
            r.status,
            r.commune || "Non spécifié",
            r.lat,
            r.lng,
            r.imageUrl,
            `"${(r.comment || "").replace(/"/g, '""')}"`
        ]);

        const csvContent = "\ufeff" + [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BisoPeto_SIG_Export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (onToast) onToast(`${filteredReports.length} signalements exportés vers CSV`, "success");
    };

    // Logique de filtrage consolidée
    const filteredReports = reports.filter(r => {
        const matchesCommune = filterCommune === 'all' || r.commune === filterCommune;
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesWasteType = filterWasteType === 'all' || r.wasteType === filterWasteType;
        
        // Recherche textuelle dans les commentaires ET le type de déchet
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === '' || 
            (r.comment && r.comment.toLowerCase().includes(searchLower)) || 
            (r.wasteType && r.wasteType.toLowerCase().includes(searchLower)) ||
            (r.id && r.id.toLowerCase().includes(searchLower));
        
        const reportDate = new Date(r.date);
        const start = filterStartDate ? new Date(filterStartDate) : null;
        const end = filterEndDate ? new Date(filterEndDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const matchesDate = (!start || reportDate >= start) && (!end || reportDate <= end);

        return matchesCommune && matchesStatus && matchesWasteType && matchesSearch && matchesDate;
    });

    const assignedCollector = selectedReport?.assignedTo ? collectors.find(c => c.id === selectedReport.assignedTo) : null;

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            {/* ImageViewer Plein Écran */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 animate-fade-in backdrop-blur-sm" onClick={() => setFullScreenImage(null)}>
                    <button className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10">
                        <X size={32} />
                    </button>
                    <img 
                        src={fullScreenImage} 
                        className="max-w-[95%] max-h-[95%] object-contain shadow-2xl animate-scale-up rounded-2xl border-4 border-white/10" 
                        alt="Zoom déchet" 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* Header Toolbar avec filtres avancés */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" /></button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">SIG Opérations</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                                {filteredReports.length} filtrés sur {reports.length} incidents
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canExport && (
                            <button 
                                onClick={handleExportCSV} 
                                className="relative group p-3 px-5 rounded-[1.2rem] bg-[#00C853] text-white hover:bg-green-600 transition-all flex items-center gap-3 shadow-xl shadow-green-500/20 active:scale-95 overflow-hidden"
                            >
                                <FileSpreadsheet size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Exporter CSV</span>
                            </button>
                        )}
                        <button onClick={handleResetFilters} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#2962FF] rounded-2xl transition-all border dark:border-gray-700" title="Réinitialiser les filtres">
                            <Eraser size={20} />
                        </button>
                        <button onClick={() => setShowTraffic(!showTraffic)} className={`p-3 rounded-2xl transition-all ${showTraffic ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} title="Trafic Live"><Zap size={20} /></button>
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex border dark:border-gray-700">
                            <button onClick={() => setViewMode('hybrid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'hybrid' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><MapIcon size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><List size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Filtres Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
                    {/* Recherche Keywords */}
                    <div className="lg:col-span-3 relative">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Recherche par mots-clés</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Comm., Type, ID..." 
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none text-sm font-bold dark:text-white shadow-inner focus:ring-2 ring-blue-500/20" 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                            />
                        </div>
                    </div>

                    {/* Statut */}
                    <div className="lg:col-span-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">État</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-[10px] font-black uppercase outline-none dark:text-gray-300 shadow-inner cursor-pointer focus:ring-2 ring-blue-500/20">
                            <option value="all">Tous les statuts</option>
                            <option value="pending">En Attente (Nouveau)</option>
                            <option value="assigned">En Cours (Assigné)</option>
                            <option value="resolved">Résolu (Nettoyé)</option>
                            <option value="rejected">Rejeté (Fausse Alerte)</option>
                        </select>
                    </div>

                    {/* Commune */}
                    <div className="lg:col-span-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Commune</label>
                        <select value={filterCommune} onChange={(e) => setFilterCommune(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-[10px] font-black uppercase outline-none dark:text-gray-300 shadow-inner cursor-pointer focus:ring-2 ring-blue-500/20">
                            <option value="all">Toutes Communes</option>
                            <option value="Gombe">Gombe</option>
                            <option value="Ngaliema">Ngaliema</option>
                            <option value="Limete">Limete</option>
                            <option value="Kintambo">Kintambo</option>
                        </select>
                    </div>

                    {/* Type de déchet */}
                    <div className="lg:col-span-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Catégorie</label>
                        <select value={filterWasteType} onChange={(e) => setFilterWasteType(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-[10px] font-black uppercase outline-none dark:text-gray-300 shadow-inner cursor-pointer focus:ring-2 ring-blue-500/20">
                            <option value="all">Tous les types</option>
                            <option value="Plastique">Plastique</option>
                            <option value="Organique">Organique</option>
                            <option value="Gravats">Gravats</option>
                            <option value="Électronique">Électronique</option>
                            <option value="Métal">Métal</option>
                            <option value="Divers">Divers</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="lg:col-span-3">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Période du signalement</label>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-1.5 rounded-2xl border dark:border-gray-700 shadow-inner">
                            <Calendar size={14} className="text-gray-400 shrink-0" />
                            <div className="flex items-center gap-1 w-full">
                                <input type="date" className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none w-full cursor-pointer" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} title="Début" />
                                <span className="text-gray-400 text-xs font-bold">/</span>
                                <input type="date" className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none w-full cursor-pointer" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} title="Fin" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Liste Latérale */}
                <div className={`w-full md:w-[400px] xl:w-[450px] bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'hybrid' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Signalements Filtrés</h3>
                        <div className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black">{filteredReports.length}</div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
                        {filteredReports.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-4">
                                <Search size={48} className="opacity-10" />
                                <p className="font-black uppercase text-[10px] tracking-widest">Aucun résultat trouvé</p>
                            </div>
                        ) : filteredReports.map(report => (
                            <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 rounded-[2rem] border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 shadow-md scale-[1.02]' : 'bg-white dark:bg-gray-900 border-gray-100 hover:border-blue-200'}`}>
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 shadow-inner">
                                        <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase truncate tracking-tighter">{report.wasteType}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                                report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                            }`}>{report.urgency}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 truncate">#{report.id.slice(-6)} • {report.comment || 'Sans commentaire'}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[9px] font-black uppercase text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-500" /> {report.commune || 'Ksh'}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(report.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Vue Carte */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        <MapUpdater center={mapCenter} zoom={mapZoom} />
                        {filteredReports.map(r => (
                            <Marker key={r.id} position={[r.lat, r.lng]} icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)} eventHandlers={{ click: () => handleSelectReport(r) }} />
                        ))}
                    </MapContainer>

                    {/* FICHE DÉTAILLÉE LATÉRALE */}
                    {selectedReport && (
                        <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] z-[1000] animate-fade-in-left flex shadow-2xl">
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setSelectedReport(null)}></div>
                            <div className="w-full h-full bg-white dark:bg-gray-950 relative flex flex-col border-l border-gray-100 dark:border-gray-800">
                                
                                <div className="p-6 pb-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800 shrink-0">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Fiche Incident</h3>
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                selectedReport.status === 'resolved' ? 'bg-green-500 text-white' : 
                                                selectedReport.status === 'assigned' ? 'bg-orange-500 text-white' : 
                                                'bg-blue-500 text-white'
                                            }`}>{selectedReport.status === 'assigned' ? 'En Cours' : selectedReport.status}</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID #{selectedReport.id.slice(-12)} • SIG Analysis</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm"><X size={20}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
                                    <div className="space-y-4">
                                        <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-800 group transition-all duration-500 hover:rotate-1">
                                            <img src={selectedReport.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-1000" alt="Incident déchet" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                                            
                                            <button 
                                                onClick={() => setFullScreenImage(selectedReport.imageUrl)}
                                                className="absolute top-6 right-6 p-4 bg-white/20 hover:bg-[#2962FF] backdrop-blur-xl rounded-2xl text-white shadow-2xl transition-all group/zoom hover:scale-110 active:scale-95 flex items-center gap-2 border border-white/20"
                                            >
                                                <Maximize2 size={24} />
                                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Zoom HD</span>
                                            </button>

                                            <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl border border-white/20">
                                                <div className={`w-3 h-3 rounded-full ${selectedReport.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                                <span className="text-xs font-black uppercase text-gray-900 dark:text-white">Urgence : {selectedReport.urgency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Catégorie AI</span>
                                            <span className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-2 leading-none"><Trash2 size={20} className="text-blue-500"/> {selectedReport.wasteType}</span>
                                        </div>
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                                            <span className="text-[10px] font-black text-gray-400 uppercase block mb-2 tracking-widest">Localisation</span>
                                            <span className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-2 leading-none"><MapPin size={20} className="text-red-500"/> {selectedReport.commune || 'KINSHASA'}</span>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] border-2 border-blue-100 dark:border-blue-900/30 relative overflow-hidden group">
                                        <div className="absolute -right-4 -top-4 opacity-5 rotate-12 transition-transform group-hover:rotate-45 duration-700"><Info size={120} className="text-blue-600"/></div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <Info size={20} className="text-blue-600"/>
                                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">Observations</span>
                                        </div>
                                        <p className="text-base text-blue-800 dark:text-blue-300 font-medium italic leading-relaxed relative z-10">
                                            "{selectedReport.comment || 'Aucune observation spécifique.'}"
                                        </p>
                                    </div>

                                    <div className="space-y-8 mt-12">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-2"><History size={18} className="text-gray-400"/> Chronologie</h4>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Suivi terrain</span>
                                        </div>
                                        
                                        <div className="space-y-12 pl-6 border-l-4 border-gray-100 dark:border-gray-800 relative">
                                            <div className="relative">
                                                <div className="absolute -left-[30px] top-0 w-5 h-5 rounded-full bg-green-500 border-4 border-white dark:border-gray-950 shadow-xl"></div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black dark:text-white uppercase tracking-tight">Signalement Utilisateur</span>
                                                    <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1.5"><Clock size={12}/> {new Date(selectedReport.date).toLocaleString('fr-FR')}</span>
                                                </div>
                                            </div>

                                            {assignedCollector ? (
                                                <div className="relative">
                                                    <div className="absolute -left-[30px] top-0 w-5 h-5 rounded-full bg-orange-500 border-4 border-white dark:border-gray-950 shadow-xl"></div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-black dark:text-white uppercase tracking-tight">Affectation Terrain</span>
                                                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border dark:border-gray-800 shadow-sm group">
                                                            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center font-black text-lg shadow-inner group-hover:scale-110 transition-transform">{assignedCollector.firstName[0]}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black dark:text-white uppercase truncate">{assignedCollector.firstName} {assignedCollector.lastName}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Zone {assignedCollector.commune}</p>
                                                            </div>
                                                            <button className="p-3 text-blue-500 hover:bg-white dark:hover:bg-gray-700 rounded-xl shadow-sm transition-all"><MessageCircle size={18}/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <div className="absolute -left-[30px] top-0 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-950"></div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-gray-400 uppercase tracking-tight italic">En attente d'affectation...</span>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedReport.status === 'resolved' && (
                                                <div className="relative">
                                                    <div className="absolute -left-[32px] top-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-4 border-white dark:border-gray-950 shadow-2xl animate-scale-up">
                                                        <Check size={12} className="text-white" strokeWidth={5}/>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-black text-green-600 uppercase tracking-tight">Mission Clôturée - Résolu</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800 shrink-0 sticky bottom-0">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-3">
                                            {(selectedReport.status === 'pending' || selectedReport.status === 'assigned') && (
                                                <button 
                                                    onClick={() => setShowAssignModal(true)} 
                                                    className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    <UserPlus size={20}/> {selectedReport.assignedTo ? 'Ré-affecter' : 'Affecter Agent'}
                                                </button>
                                            )}
                                            {selectedReport.status !== 'resolved' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'resolved')} 
                                                    className="flex-1 py-5 bg-[#00C853] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                >
                                                    <CheckCircle2 size={20}/> Marquer Résolu
                                                </button>
                                            )}
                                            {selectedReport.status === 'resolved' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'pending')} 
                                                    className="w-full py-5 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95"
                                                >
                                                    <RotateCcw size={20}/> Rouvrir le Ticket
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            {selectedReport.status !== 'rejected' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'rejected')} 
                                                    className="flex-1 py-4 border-2 border-orange-100 dark:border-orange-900/30 text-orange-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
                                                >
                                                    <Ban size={16}/> Rejeter (Fausse Alerte)
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteReport(selectedReport.id)} 
                                                className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
                                                title="Supprimer définitivement"
                                            >
                                                <Trash2 size={22}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ASSIGNMENT MODAL */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Sélection Agent</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Zone : {selectedReport?.commune || 'KSH'}</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"><X/></button>
                        </div>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-2 pb-2">
                            {collectors.length === 0 ? (
                                <div className="text-center py-16 text-gray-400">
                                    <User size={48} className="mx-auto mb-4 opacity-10"/>
                                    <p className="text-xs font-black uppercase tracking-widest">Aucun collecteur dispo</p>
                                </div>
                            ) : (
                                collectors.map(c => (
                                    <button 
                                        key={c.id} 
                                        onClick={() => handleAssign(c.id!)} 
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-transparent hover:border-blue-500 transition-all flex items-center gap-4 group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-sm">{c.firstName[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black dark:text-white uppercase tracking-tight truncate">{c.firstName} {c.lastName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{c.zone || 'Zone Libre'}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"/>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
