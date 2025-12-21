
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    const [viewMode, setViewMode] = useState<'hybrid' | 'list'>('hybrid');
    const [selectedReport, setSelectedReport] = useState<WasteReport | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

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

    useEffect(() => {
        loadData(page);
    }, [page]);

    const loadData = async (pageNum: number) => {
        setIsLoading(true);
        try {
            // Fix: Removed the 4th argument 'true' as ReportsAPI.getAll only accepts 3 arguments (page, pageSize, filters).
            const data = await ReportsAPI.getAll(pageNum, 50, undefined);
            if (data.length < 50) setHasMore(false);
            setReports(prev => pageNum === 0 ? data : [...prev, ...data]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        setHasMore(true);
        loadData(0);
    };

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            <div className="bg-white dark:bg-gray-900 p-6 shadow-sm border-b dark:border-gray-800 flex flex-col gap-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"><ArrowLeft/></button>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">SIG Opérations (Paginated)</h2>
                    </div>
                    <form onSubmit={handleSearch} className="flex-1 max-w-md mx-6 relative">
                        <Search size={18} className="absolute left-4 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher à Kinshasa..." 
                            className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold text-sm dark:text-white"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-full md:w-[450px] bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                        {reports.map((report, index) => (
                            <div 
                                key={report.id} 
                                ref={index === reports.length - 1 ? lastElementRef : null}
                                onClick={() => setSelectedReport(report)}
                                className={`p-4 rounded-[2rem] border transition-all cursor-pointer ${selectedReport?.id === report.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-gray-800'}`}
                            >
                                <div className="flex gap-4">
                                    <img src={report.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black dark:text-white uppercase truncate text-sm">{report.wasteType}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1">{report.commune} • {new Date(report.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-500" /></div>}
                    </div>
                </div>
                
                <div className="flex-1 relative">
                    <MapContainer center={[-4.325, 15.322]} zoom={12} style={{height: '100%'}} zoomControl={false}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                        {reports.map(r => (
                            <Marker key={r.id} position={[r.lat, r.lng]} icon={reportIcon(r.status, r.urgency, selectedReport?.id === r.id)} />
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
};
