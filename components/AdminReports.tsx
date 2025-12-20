
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap
} from 'lucide-react';
import { WasteReport, User, UserType, UserPermission } from '../types';
import { ReportsAPI, UserAPI } from '../services/api';

const reportIcon = (status: string, urgency: string, isSelected: boolean) => {
    const color = status === 'resolved' ? '#00C853' : urgency === 'high' ? '#FF5252' : '#FFB300';
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
            setReports(reports.map(r => r.id === report.id ? { ...r, status: newStatus } : r));
            if (onToast) onToast(`Statut mis à jour : ${newStatus}`, "success");
            setSelectedReport(null);
        } catch (e) {
            if (onToast) onToast("Erreur lors de la mise à jour", "error");
        }
    };

    const handleAssign = async (collectorId: string) => {
        if (!selectedReport) return;
        try {
            await ReportsAPI.update({ ...selectedReport, id: selectedReport.id, status: 'assigned', assignedTo: collectorId });
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'assigned', assignedTo: collectorId } : r));
            onNotify(collectorId, "Mission Prioritaire ! 🚛", `Affectation : Signalement #${selectedReport.id.slice(-4)}.`, 'info');
            if (onToast) onToast("Assigné avec succès", "success");
            setShowAssignModal(false);
            setSelectedReport(null);
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

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300">
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
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className={`w-full md:w-[450px] bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'hybrid' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {filteredReports.map(report => (
                            <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 rounded-[2rem] border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-100'}`}>
                                <div className="flex gap-4">
                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                                        <img src={report.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase truncate">{report.wasteType}</h4>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>{report.urgency}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 truncate">{report.comment}</p>
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

                <div className="flex-1 relative">
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

                    {/* Report Preview Panel */}
                    {selectedReport && (
                        <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-96 z-[900] animate-fade-in-up">
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                                <div className="h-40 relative group">
                                    <img src={selectedReport.imageUrl} className="w-full h-full object-cover" />
                                    <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white"><X size={18}/></button>
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white ${selectedReport.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-[#2962FF]'}`}>{selectedReport.status}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">{selectedReport.wasteType}</h3>
                                    <p className="text-xs text-gray-500 font-bold mb-6 line-clamp-2">"{selectedReport.comment}"</p>
                                    
                                    <div className="flex gap-2">
                                        {selectedReport.status === 'pending' && (
                                            <button 
                                                onClick={() => setShowAssignModal(true)}
                                                className="flex-1 py-3 bg-[#2962FF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                            >
                                                <Truck size={16}/> Affecter
                                            </button>
                                        )}
                                        {selectedReport.status === 'assigned' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedReport, 'resolved')}
                                                className="flex-1 py-3 bg-[#00C853] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                            >
                                                <CheckCircle size={16}/> Clôturer
                                            </button>
                                        )}
                                        <button className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl hover:text-[#2962FF] transition-colors"><ExternalLink size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-sm p-8 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">Assignation</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar">
                            {collectors.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-xs font-black uppercase">Aucun collecteur actif</p>
                            ) : (
                                collectors.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => handleAssign(c.id!)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 transition-all flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">{c.firstName[0]}</div>
                                        <div className="text-left">
                                            <p className="text-sm font-black dark:text-white uppercase tracking-tight">{c.firstName} {c.lastName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">{c.zone || 'Secteur Indéfini'}</p>
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
