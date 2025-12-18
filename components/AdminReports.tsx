
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation, Zap
} from 'lucide-react';
import { WasteReport, User, UserType } from '../types';
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
}

export const AdminReports: React.FC<AdminReportsProps> = ({ onBack, onToast, onNotify }) => {
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
                        <button 
                            onClick={() => setShowTraffic(!showTraffic)}
                            className={`p-3 rounded-2xl transition-all ${showTraffic ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                        >
                            <Zap size={20} />
                        </button>
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex">
                            <button onClick={() => setViewMode('hybrid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'hybrid' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><MapIcon size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><List size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className={`w-full md:w-[450px] bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'hybrid' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {filteredReports.map(report => (
                            <div key={report.id} onClick={() => handleSelectReport(report)} className={`p-4 rounded-[2rem] border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-100'}`}>
                                <div className="flex gap-4">
                                    <img src={report.imageUrl} className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                                    <div>
                                        <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase">{report.wasteType}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold">{report.commune} • {report.status}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
                </div>
            </div>
        </div>
    );
};
