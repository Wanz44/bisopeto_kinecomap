
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Filter, MapPin, CheckCircle, X, AlertTriangle, 
    Truck, Clock, Info, Loader2, Map as MapIcon, List, UserCheck, 
    MoreVertical, Eye, Download, FileText, ExternalLink, Navigation
} from 'lucide-react';
import { WasteReport, User, UserType } from '../types';
import { ReportsAPI, UserAPI } from '../services/api';

// Config Icônes Leaflet
const reportIcon = (status: string, urgency: string) => {
    const color = status === 'resolved' ? '#00C853' : urgency === 'high' ? '#FF5252' : '#FFB300';
    return L.divIcon({
        className: 'custom-report-marker',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
        iconSize: [14, 14]
    });
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
        const collector = collectors.find(c => c.id === collectorId);
        
        try {
            await ReportsAPI.update({ ...selectedReport, id: selectedReport.id, status: 'assigned', assignedTo: collectorId });
            setReports(reports.map(r => r.id === selectedReport.id ? { ...r, status: 'assigned', assignedTo: collectorId } : r));
            
            onNotify(collectorId, "Mission Prioritaire ! 🚛", `Affectation : Signalement #${selectedReport.id.slice(-4)} à ${selectedReport.commune || 'votre zone'}.`, 'info');
            
            if (onToast) onToast(`Assigné avec succès à ${collector?.firstName}`, "success");
            setShowAssignModal(false);
            setSelectedReport(null);
        } catch (e) {
            if (onToast) onToast("Erreur d'assignation", "error");
        }
    };

    const handleExport = () => {
        if (onToast) onToast("Génération du rapport CSV...", "info");
        // Simulation d'export
        setTimeout(() => {
            if (onToast) onToast("Rapport téléchargé", "success");
        }, 1500);
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
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">SIGNALEMENTS & SIG</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{reports.length} Incidents enregistrés</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExport} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-[#2962FF] transition-all"><Download size={20} /></button>
                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex">
                            <button onClick={() => setViewMode('hybrid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'hybrid' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><MapIcon size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-lg text-[#2962FF]' : 'text-gray-400'}`}><List size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={18} className="absolute left-4 top-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher (type, commentaire...)" 
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none text-sm font-bold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <select value={filterCommune} onChange={(e)=>setFilterCommune(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none">
                        <option value="all">Communes (Toutes)</option>
                        <option value="Gombe">Gombe</option>
                        <option value="Limete">Limete</option>
                        <option value="Ngaliema">Ngaliema</option>
                    </select>
                    <select value={filterStatus} onChange={(e)=>setFilterStatus(e.target.value)} className="px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-xs font-black uppercase border-none outline-none">
                        <option value="all">Statuts (Tous)</option>
                        <option value="pending">En attente</option>
                        <option value="assigned">Assignés</option>
                        <option value="resolved">Résolus</option>
                        <option value="rejected">Rejetés</option>
                    </select>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* List Side (Hidden on mobile hybrid mode if map selected, but let's make it responsive) */}
                <div className={`w-full md:w-[450px] bg-white dark:bg-gray-950 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'hybrid' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-[#2962FF]" size={40} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Accès aux serveurs...</p>
                            </div>
                        ) : filteredReports.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">Aucun signalement trouvé</div>
                        ) : (
                            filteredReports.map(report => (
                                <div 
                                    key={report.id} 
                                    onClick={() => setSelectedReport(report)}
                                    className={`p-4 rounded-[2rem] border transition-all cursor-pointer group ${selectedReport?.id === report.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-100 dark:hover:border-blue-900/30'}`}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                                            <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${report.urgency === 'high' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>Urgence : {report.urgency}</span>
                                                <span className="text-[9px] font-bold text-gray-400">{new Date(report.date).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm truncate uppercase tracking-tight">{report.wasteType}</h4>
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                                                <MapPin size={10} className="text-[#2962FF]" /> {report.commune || 'Zone non définie'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-800 flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${report.status === 'pending' ? 'bg-orange-500 animate-pulse' : report.status === 'assigned' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                            <span className="text-[10px] font-black uppercase text-gray-500">{report.status}</span>
                                        </div>
                                        <button className="text-[10px] font-black text-[#2962FF] uppercase tracking-widest group-hover:translate-x-1 transition-transform">Détails →</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Map Main View */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {filteredReports.map(r => (
                            <Marker 
                                key={r.id} 
                                position={[r.lat, r.lng]} 
                                icon={reportIcon(r.status, r.urgency)}
                                eventHandlers={{ click: () => setSelectedReport(r) }}
                            />
                        ))}
                    </MapContainer>

                    {/* Report Selection Float Overlay */}
                    {selectedReport && (
                        <div className="absolute inset-x-4 bottom-8 z-[1000] lg:inset-x-auto lg:right-8 lg:top-8 lg:bottom-auto lg:w-96 animate-fade-in-up">
                            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                                <div className="h-48 relative">
                                    <img src={selectedReport.imageUrl} className="w-full h-full object-cover" />
                                    <button onClick={() => setSelectedReport(null)} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white"><X size={18} /></button>
                                    <div className="absolute bottom-4 left-4 flex gap-2">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-black uppercase">{selectedReport.wasteType}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-1">Détails de l'alerte</h3>
                                            <p className="text-xs text-gray-500 font-bold italic">"{selectedReport.comment}"</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black text-white ${selectedReport.status === 'pending' ? 'bg-orange-500' : 'bg-green-500'}`}>
                                            {selectedReport.status}
                                        </div>
                                    </div>

                                    {/* Action Workflow */}
                                    <div className="space-y-3">
                                        {selectedReport.status === 'pending' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => setShowAssignModal(true)}
                                                    className="bg-[#2962FF] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Truck size={16} /> Affecter
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateStatus(selectedReport, 'rejected')}
                                                    className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                                                >
                                                    Rejeter
                                                </button>
                                            </div>
                                        )}
                                        {selectedReport.status === 'assigned' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedReport, 'resolved')}
                                                className="w-full bg-[#00C853] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Forcer Résolution
                                            </button>
                                        )}
                                        <div className="flex gap-2">
                                            <button className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border dark:border-gray-700">
                                                <FileText size={14} /> Fiche PDF
                                            </button>
                                            <button className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 border dark:border-gray-700">
                                                <Navigation size={14} /> Itinéraire
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Affectation Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}></div>
                    <div className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-scale-up border dark:border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Choisir un Collecteur</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} /></button>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                            {collectors.length === 0 ? (
                                <p className="text-center py-8 text-gray-400 font-bold uppercase text-[10px]">Aucun collecteur disponible</p>
                            ) : collectors.map(c => (
                                <button 
                                    key={c.id} 
                                    onClick={() => handleAssign(c.id!)}
                                    className="w-full p-4 rounded-[2rem] bg-gray-50 dark:bg-gray-900 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 border-2 border-transparent transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 font-black text-lg shadow-sm">
                                            {c.firstName[0]}
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{c.firstName} {c.lastName}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={10} /> {c.zone || 'Zone libre'}</p>
                                        </div>
                                    </div>
                                    <Truck size={18} className="text-gray-300 group-hover:text-blue-500" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
