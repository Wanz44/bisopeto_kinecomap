
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap,
    History, UserCog, Trash2, ArrowRight, CheckCircle2, AlertCircle, Ban,
    Maximize2, ChevronRight, MessageCircle, Check
} from 'lucide-react';
import { WasteReport, User, UserType, UserPermission } from '../types';
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
    currentUser?: User;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ onBack, onToast, onNotify, currentUser }) => {
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [collectors, setCollectors] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'hybrid' | 'list'>('hybrid');
    const [filterCommune, setFilterCommune] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-4.325, 15.322]);
    const [mapZoom, setMapZoom] = useState(12);
    
    // États pour l'agrandissement d'image
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

    const handleUpdateStatus = async (report: WasteReport, newStatus: WasteReport['status']) => {
        try {
            await ReportsAPI.update({ ...report, id: report.id, status: newStatus });
            const updatedReports = reports.map(r => r.id === report.id ? { ...r, status: newStatus } : r);
            setReports(updatedReports);
            
            // Mettre à jour l'objet sélectionné aussi
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
            
            // Mettre à jour l'UI locale
            setSelectedReport({ ...selectedReport, status: 'assigned', assignedTo: collectorId });
        } catch (e) {
            if (onToast) onToast("Erreur d'assignation", "error");
        }
    };

    const handleExportCSV = () => {
        if (!canExport) {
            onToast?.("Accès refusé : Permission 'Export' requise.", "error");
            return;
        }

        const filtered = filteredReports;
        if (filtered.length === 0) {
            onToast?.("Aucune donnée à exporter", "info");
            return;
        }

        const headers = ["ID", "Type", "Urgence", "Statut", "Commune", "Date", "Commentaire", "ReporterID", "AssignedTo"];
        const csvRows = [
            headers.join(','),
            ...filtered.map(r => [
                r.id,
                r.wasteType,
                r.urgency,
                r.status,
                r.commune || '',
                r.date,
                `"${(r.comment || '').replace(/"/g, '""')}"`,
                r.reporterId,
                r.assignedTo || ''
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BisoPeto_Reports_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (onToast) onToast("Exportation réussie", "success");
    };

    const filteredReports = reports.filter(r => {
        const matchesCommune = filterCommune === 'all' || r.commune === filterCommune;
        const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchesSearch = searchQuery === '' || r.comment.toLowerCase().includes(searchQuery.toLowerCase()) || r.wasteType.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCommune && matchesStatus && matchesSearch;
    });

    const assignedCollector = selectedReport?.assignedTo ? collectors.find(c => c.id === selectedReport.assignedTo) : null;

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            {/* Full Screen Image Viewer */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 animate-fade-in">
                    <button 
                        onClick={() => setFullScreenImage(null)}
                        className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={fullScreenImage} 
                        className="max-w-full max-h-full object-contain shadow-2xl animate-scale-up rounded-2xl" 
                        alt="Zoom" 
                    />
                </div>
            )}

            {/* Header Toolbar */}
            <div className="bg-white dark:bg-gray-900 p-4 md:p-6 shadow-sm border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">SIG & OPÉRATIONS</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{reports.length} Incidents</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {canExport && (
                            <button 
                                onClick={handleExportCSV}
                                className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#2962FF] transition-all"
                                title="Exporter en CSV"
                            >
                                <Download size={20} />
                            </button>
                        )}
                        <button 
                            onClick={() => setShowTraffic(!showTraffic)}
                            className={`p-3 rounded-2xl transition-all ${showTraffic ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                            title="Trafic Live"
                        >
                            <Zap size={20} />
                        </button>
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex">
                            <button onClick={() => setViewMode('hybrid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'hybrid' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><MapIcon size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><List size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Filtrer incidents..." 
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none text-sm font-bold dark:text-white" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-xs font-black uppercase outline-none dark:text-gray-300">
                        <option value="all">Tous Statuts</option>
                        <option value="pending">En Attente</option>
                        <option value="assigned">Assigné</option>
                        <option value="resolved">Résolu</option>
                        <option value="rejected">Rejeté</option>
                    </select>
                    <select value={filterCommune} onChange={(e) => setFilterCommune(e.target.value)} className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-xs font-black uppercase outline-none dark:text-gray-300">
                        <option value="all">Toutes Communes</option>
                        <option value="Gombe">Gombe</option>
                        <option value="Ngaliema">Ngaliema</option>
                        <option value="Limete">Limete</option>
                        <option value="Kintambo">Kintambo</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                <div className={`w-full md:w-[400px] xl:w-[450px] bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'hybrid' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {filteredReports.map(report => (
                            <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 rounded-[2rem] border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 shadow-md' : 'bg-white dark:bg-gray-900 border-gray-100 hover:border-blue-200'}`}>
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700">
                                        <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase truncate">{report.wasteType}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                                                report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                            }`}>{report.urgency}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 truncate">#{report.id.slice(-6)} • {report.comment}</p>
                                        <div className="flex items-center gap-3 mt-2 text-[9px] font-black uppercase text-gray-500">
                                            <span className="flex items-center gap-1"><MapPin size={10} className="text-blue-500" /> {report.commune || 'Ksh'}</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(report.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredReports.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <Info size={48} className="opacity-10 mb-4" />
                                <p className="font-black uppercase text-xs tracking-widest">Aucun signalement trouvé</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {showTraffic && (
                            <TileLayer url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826" opacity={0.5} zIndex={10} />
                        )}
                        <MapUpdater center={mapCenter} zoom={mapZoom} />
                        {filteredReports.map(r => (
                            <Marker 
                                key={r.id} 
                                position={[r.lat, r.lng]} 
                                icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)}
                                eventHandlers={{ click: () => handleSelectReport(r) }}
                            />
                        ))}
                    </MapContainer>

                    {/* Report Detail Side Drawer */}
                    {selectedReport && (
                        <div className="absolute inset-y-0 right-0 w-full sm:w-[450px] z-[1000] animate-fade-in-left flex">
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm sm:hidden" onClick={() => setSelectedReport(null)}></div>
                            <div className="w-full h-full bg-white dark:bg-gray-950 shadow-2xl relative flex flex-col border-l border-gray-100 dark:border-gray-800">
                                
                                {/* Drawer Header */}
                                <div className="p-6 pb-4 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-800 shrink-0">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Fiche Incident</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID #{selectedReport.id.slice(-8)}</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all"><X size={20}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                                    
                                    {/* Media Section */}
                                    <div className="space-y-4">
                                        <div 
                                            onClick={() => setFullScreenImage(selectedReport.imageUrl)}
                                            className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 group cursor-zoom-in"
                                        >
                                            <img src={selectedReport.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="Incident" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                            <button className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-xl text-white group-hover:bg-blue-600 transition-colors">
                                                <Maximize2 size={16}/>
                                            </button>
                                            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                                                <div className={`w-2 h-2 rounded-full ${selectedReport.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                                <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">Alerte {selectedReport.urgency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Type de déchets</span>
                                            <span className="text-sm font-black dark:text-white uppercase tracking-tight">{selectedReport.wasteType}</span>
                                        </div>
                                        <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                            <span className="text-[9px] font-black text-gray-400 uppercase block mb-1">Commune</span>
                                            <span className="text-sm font-black dark:text-white uppercase tracking-tight">{selectedReport.commune || 'KINSHASA'}</span>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Info size={16} className="text-blue-600"/>
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Observations Reporter</span>
                                        </div>
                                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium italic leading-relaxed">
                                            "{selectedReport.comment || 'Aucun commentaire'}"
                                        </p>
                                    </div>

                                    {/* Intervention Status / History */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><History size={14}/> Journal des actions</h4>
                                        <div className="space-y-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                                            
                                            {/* History Step: Creation */}
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-green-500 border-4 border-white dark:border-gray-950"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black dark:text-white uppercase">Incident Signalé</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">{new Date(selectedReport.date).toLocaleString('fr-FR')}</span>
                                                </div>
                                            </div>

                                            {/* History Step: AI Validation (Simulated) */}
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-500 border-4 border-white dark:border-gray-950"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black dark:text-white uppercase">Validé par Biso Peto AI</span>
                                                    <span className="text-[10px] text-gray-400 font-bold">Analyse visuelle terminée</span>
                                                </div>
                                            </div>

                                            {/* History Step: Assignment */}
                                            {assignedCollector && (
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-orange-500 border-4 border-white dark:border-gray-950"></div>
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-[11px] font-black dark:text-white uppercase">Assigné au collecteur</span>
                                                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">{assignedCollector.firstName[0]}</div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-black dark:text-white uppercase">{assignedCollector.firstName} {assignedCollector.lastName}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold">Agent Terrain • Zone {assignedCollector.commune}</p>
                                                            </div>
                                                            <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><MessageCircle size={14}/></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Final Status */}
                                            {selectedReport.status === 'resolved' && (
                                                <div className="relative">
                                                    <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border-4 border-white dark:border-gray-950 shadow-sm"><Check size={8} className="text-white"/></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-green-600 uppercase">Clôturé - Zone Propre</span>
                                                        <span className="text-[10px] text-gray-400 font-bold">Intervention réussie</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Control Bar */}
                                <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-800 shrink-0">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            {selectedReport.status === 'pending' && (
                                                <button 
                                                    onClick={() => setShowAssignModal(true)}
                                                    className="flex-1 py-4 bg-[#2962FF] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                                >
                                                    <Truck size={18}/> Affecter Terrain
                                                </button>
                                            )}
                                            {(selectedReport.status === 'assigned' || selectedReport.status === 'pending') && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'resolved')}
                                                    className="flex-1 py-4 bg-[#00C853] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-green-500/20 active:scale-95 transition-all"
                                                >
                                                    <CheckCircle2 size={18}/> Résolu
                                                </button>
                                            )}
                                            {selectedReport.status === 'resolved' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'pending')}
                                                    className="flex-1 py-4 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                                >
                                                    Ré-ouvrir l'incident
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedReport.status !== 'rejected' && (
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'rejected')}
                                                    className="flex-1 py-3 border-2 border-orange-100 dark:border-orange-900/30 text-orange-500 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
                                                >
                                                    <Ban size={14}/> Rejeter (Fausse Alerte)
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDeleteReport(selectedReport.id)}
                                                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                title="Supprimer définitivement"
                                            >
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Modal (Identique mais stylé) */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Choix du Collecteur</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Zone {selectedReport?.commune || 'KINSHASA'}</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
                        </div>
                        
                        <div className="relative mb-6">
                            <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                            <input type="text" placeholder="Rechercher agent..." className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 rounded-2xl border-none outline-none text-sm font-bold dark:text-white" />
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-2">
                            {collectors.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-xs font-black uppercase">Aucun collecteur actif</p>
                            ) : (
                                collectors.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => handleAssign(c.id!)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-transparent hover:border-blue-500 hover:bg-blue-50/10 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-black group-hover:scale-110 transition-transform">{c.firstName[0]}</div>
                                        <div className="text-left flex-1 min-w-0">
                                            <p className="text-sm font-black dark:text-white uppercase tracking-tight truncate">{c.firstName} {c.lastName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{c.zone || 'Secteur Non Défini'}</p>
                                        </div>
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight size={14} className="text-blue-500"/>
                                        </div>
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
