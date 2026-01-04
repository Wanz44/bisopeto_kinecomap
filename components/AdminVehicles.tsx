
import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Plus, Search, Battery, Signal, Truck, Settings, Trash2, 
    Radio, X, AlertTriangle, Filter, Layers, Sun, Moon, Globe, Wrench, 
    User, Fuel, Calendar, Edit2, Save, Activity, Map as MapIcon, List, 
    Navigation, Lock, Unlock, History, Zap, BarChart3, Gauge, MapPin,
    Eye, ChevronRight, Loader2, Info, Clock, Check, Users, PhoneCall, UserCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line 
} from 'recharts';
import L from 'leaflet';
import { Vehicle, User as AppUser, UserType } from '../types';
import { VehicleAPI, UserAPI } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

// --- MAP CONSTANTS ---
const TILES = {
    streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
    traffic: 'https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826'
};

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
};

const getVehicleIcon = (v: Vehicle, isSelected: boolean) => {
    const color = v.status === 'active' ? '#00C853' : v.status === 'maintenance' ? '#FF6D00' : '#FF5252';
    const size = isSelected ? 48 : 36;
    const rotation = v.heading || 0;

    return L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
            <div style="
                width: ${size}px; 
                height: ${size}px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            ">
                <div style="
                    background-color: ${color}; 
                    width: 100%; 
                    height: 100%; 
                    border-radius: 12px; 
                    border: 3px solid white; 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: white;
                    transform: rotate(${rotation}deg);
                    transition: transform 0.5s ease-in-out;
                    ${isSelected ? 'border-color: #2962FF; box-shadow: 0 0 20px #2962FF;' : ''}
                ">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
    });
};

const TELEMETRY_DATA = [
    { time: '08:00', speed: 0, battery: 100, consumption: 0 },
    { time: '09:00', speed: 25, battery: 95, consumption: 5 },
    { time: '10:00', speed: 45, battery: 88, consumption: 12 },
    { time: '11:00', speed: 10, battery: 85, consumption: 8 },
    { time: '12:00', speed: 0, battery: 85, consumption: 0 },
    { time: '13:00', speed: 30, battery: 78, consumption: 7 },
    { time: '14:00', speed: 55, battery: 65, consumption: 15 },
    { time: '15:00', speed: 40, battery: 58, consumption: 10 },
];

interface AdminVehiclesProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminVehicles: React.FC<AdminVehiclesProps> = ({ onBack, onToast }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [collectors, setCollectors] = useState<AppUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [sidebarTab, setSidebarTab] = useState<'vehicles' | 'collectors'>('vehicles');
    
    const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
    const [showTraffic, setShowTraffic] = useState(false);
    const [mapCenter, setMapCenter] = useState<[number, number]>([-4.325, 15.322]);
    const [mapZoom, setMapZoom] = useState(13);

    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'stopped'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'telemetry' | 'maintenance'>('overview');

    const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
        type: 'moto',
        status: 'active',
        batteryLevel: 100,
        signalStrength: 100,
        heading: 0
    });

    useEffect(() => {
        loadData();
        if (isSupabaseConfigured() && supabase) {
            const channel = supabase.channel('realtime:vehicles_admin_v2')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, (payload) => {
                    const v = payload.new as Vehicle;
                    setVehicles(prev => {
                        const idx = prev.findIndex(item => item.id === v.id);
                        if (idx > -1) {
                            const newArr = [...prev];
                            newArr[idx] = v;
                            return newArr;
                        }
                        return [...prev, v];
                    });
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); }
        }
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [vData, uData] = await Promise.all([
                VehicleAPI.getAll(),
                UserAPI.getAll()
            ]);
            setVehicles(vData);
            setCollectors(uData.filter(u => u.type === UserType.COLLECTOR));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectVehicle = (v: Vehicle) => {
        setSelectedVehicle(v);
        setMapCenter([v.lat, v.lng]);
        setMapZoom(16);
        setShowDetailDrawer(true);
    };

    const handleSaveVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        const vehicleData: Vehicle = {
            id: vehicleForm.id || '', 
            name: vehicleForm.name || 'Nouvel Engin',
            type: vehicleForm.type || 'moto',
            plateNumber: vehicleForm.plateNumber || 'N/A',
            gpsId: vehicleForm.gpsId || `GPS-${Math.floor(Math.random()*10000)}`,
            status: vehicleForm.status || 'active',
            batteryLevel: vehicleForm.batteryLevel || 100,
            signalStrength: vehicleForm.signalStrength || 100,
            lat: vehicleForm.lat || -4.325,
            lng: vehicleForm.lng || 15.322,
            heading: vehicleForm.heading || 0,
            lastUpdate: new Date().toISOString(),
            driverId: vehicleForm.driverId
        };

        try {
            if (vehicleForm.id) {
                await VehicleAPI.update(vehicleData);
                setVehicles(prev => prev.map(v => v.id === vehicleData.id ? vehicleData : v));
                onToast?.("Véhicule mis à jour", "success");
            } else {
                const created = await VehicleAPI.add(vehicleData);
                setVehicles([...vehicles, created]);
                onToast?.(`Véhicule ${created.name} ajouté`, "success");
            }
            setShowAddModal(false);
            setVehicleForm({ type: 'moto', status: 'active', batteryLevel: 100, signalStrength: 100 });
        } catch (e) {
            onToast?.("Erreur sauvegarde", "error");
        }
    };

    const handleDeleteVehicle = async (id: string) => {
        if (!window.confirm("Supprimer définitivement ce véhicule ?")) return;
        try {
            await VehicleAPI.delete(id);
            setVehicles(prev => prev.filter(v => v.id !== id));
            setSelectedVehicle(null);
            setShowDetailDrawer(false);
            onToast?.("Véhicule supprimé", "success");
        } catch (e) {
            onToast?.("Erreur suppression", "error");
        }
    };

    const filteredVehicles = vehicles.filter(v => {
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const filteredCollectors = collectors.filter(c => {
        return `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (c.commune || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden">
            
            {/* Header Toolbar */}
            <div className="bg-white dark:bg-gray-900 p-4 shadow-sm border-b dark:border-gray-800 sticky top-0 z-40 shrink-0">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">Supervision Flotte</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                <Radio size={12} className="text-red-500 animate-pulse" /> Télémétrie & Agents Live
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl border dark:border-gray-700">
                            <button 
                                onClick={() => setMapType('streets')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${mapType === 'streets' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}
                            >
                                <MapIcon size={14} /> Plan
                            </button>
                            <button 
                                onClick={() => setMapType('satellite')}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${mapType === 'satellite' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-500'}`}
                            >
                                <Globe size={14} /> Satellite
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowTraffic(!showTraffic)}
                            className={`p-3 rounded-2xl transition-all border dark:border-gray-700 flex items-center gap-2 ${showTraffic ? 'bg-orange-500 text-white shadow-lg border-orange-500' : 'bg-white dark:bg-gray-800 text-gray-500'}`}
                        >
                            <Zap size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Trafic</span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden md:block"></div>

                        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex border dark:border-gray-700">
                            <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow text-[#2962FF]' : 'text-gray-400'}`}><List size={18} /></button>
                            <button onClick={() => setViewMode('map')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-700 shadow text-[#2962FF]' : 'text-gray-400'}`}><MapIcon size={18} /></button>
                        </div>

                        <button 
                            onClick={() => { setVehicleForm({ type: 'moto', status: 'active' }); setShowAddModal(true); }}
                            className="bg-[#2962FF] text-white p-3 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                
                {/* Lateral Fleet List */}
                <div className={`w-full md:w-96 bg-white dark:bg-gray-950 border-r dark:border-gray-800 flex flex-col overflow-hidden ${viewMode === 'map' ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-6 space-y-4 border-b dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                        {/* Selector Tab for Sidebar */}
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-2">
                            <button 
                                onClick={() => setSidebarTab('vehicles')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${sidebarTab === 'vehicles' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-400'}`}
                            >
                                <Truck size={14}/> Engins
                            </button>
                            <button 
                                onClick={() => setSidebarTab('collectors')}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${sidebarTab === 'collectors' ? 'bg-white dark:bg-gray-700 text-[#2962FF] shadow-sm' : 'text-gray-400'}`}
                            >
                                <Users size={14}/> Agents
                            </button>
                        </div>

                        <div className="relative">
                            <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder={sidebarTab === 'vehicles' ? "Plaque, Nom..." : "Rechercher agent..."}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border-none text-sm font-bold shadow-inner outline-none focus:ring-2 ring-blue-500/20 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {sidebarTab === 'vehicles' && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {['all', 'active', 'maintenance', 'stopped'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setFilterStatus(s as any)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 whitespace-nowrap ${filterStatus === s ? 'bg-gray-900 border-gray-900 text-white shadow-lg' : 'bg-white dark:bg-gray-800 border-transparent text-gray-400'}`}
                                    >
                                        {s === 'all' ? 'Tous' : s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialisation SIG...</p>
                            </div>
                        ) : sidebarTab === 'vehicles' ? (
                            filteredVehicles.map(v => (
                                <div 
                                    key={v.id} 
                                    onClick={() => handleSelectVehicle(v)}
                                    className={`p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer group ${selectedVehicle?.id === v.id ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-100'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${v.status === 'active' ? 'bg-[#00C853]' : v.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'}`}>
                                            <Truck size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight truncate leading-none mb-1">{v.name}</h4>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${v.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{v.status}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{v.plateNumber}</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500">
                                                    <Battery size={10} className={v.batteryLevel < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'} /> {v.batteryLevel}%
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500">
                                                    <Navigation size={10} className="text-blue-500" /> {v.heading || 0}°
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            filteredCollectors.map(agent => (
                                <div key={agent.id} className="p-5 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${agent.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {agent.firstName[0]}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-black text-gray-900 dark:text-white uppercase text-xs truncate">{agent.firstName} {agent.lastName}</h4>
                                                {agent.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>}
                                            </div>
                                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1">{agent.commune || 'Zone non définie'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a href={`tel:${agent.phone}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><PhoneCall size={16}/></a>
                                        <button className="p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-xl"><UserCheck size={16}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                        {!isLoading && sidebarTab === 'collectors' && filteredCollectors.length === 0 && (
                            <div className="py-20 text-center text-gray-400 font-black uppercase text-[10px] tracking-widest opacity-50">Aucun collecteur trouvé</div>
                        )}
                    </div>
                </div>

                {/* Main Interactive Map */}
                <div className="flex-1 relative bg-gray-100 dark:bg-gray-900 z-0">
                    <MapContainer center={mapCenter} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                        <TileLayer url={TILES[mapType]} attribution='&copy; Biso Peto SIG' />
                        
                        {showTraffic && (
                            <TileLayer url={TILES.traffic} opacity={0.6} zIndex={10} />
                        )}

                        <MapUpdater center={mapCenter} zoom={mapZoom} />
                        
                        {filteredVehicles.map(v => (
                            <Marker 
                                key={v.id} 
                                position={[v.lat, v.lng]} 
                                icon={getVehicleIcon(v, selectedVehicle?.id === v.id)}
                                eventHandlers={{ click: () => handleSelectVehicle(v) }}
                            />
                        ))}
                    </MapContainer>

                    {/* VEHICLE DETAIL DRAWER (ADMIN) */}
                    {selectedVehicle && showDetailDrawer && (
                        <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] z-[1000] animate-fade-in-left flex shadow-2xl">
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:hidden" onClick={() => setShowDetailDrawer(false)}></div>
                            <div className="w-full h-full bg-white dark:bg-gray-950 relative flex flex-col border-l dark:border-gray-800">
                                
                                <div className="p-8 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 shrink-0">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl ${selectedVehicle.status === 'active' ? 'bg-[#00C853]' : 'bg-orange-500'}`}>
                                                <Truck size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedVehicle.name}</h3>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <span className="text-[10px] font-black bg-gray-900 text-white dark:bg-white dark:text-black px-3 py-1 rounded-lg uppercase tracking-widest">{selectedVehicle.plateNumber}</span>
                                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${selectedVehicle.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{selectedVehicle.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowDetailDrawer(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-2xl transition-all shadow-sm"><X size={24}/></button>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 text-center shadow-sm group">
                                            <Battery size={20} className={`mx-auto mb-2 group-hover:scale-110 transition-transform ${selectedVehicle.batteryLevel < 30 ? 'text-red-500' : 'text-green-500'}`} />
                                            <p className="text-lg font-black dark:text-white leading-none">{selectedVehicle.batteryLevel}%</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Batterie</p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 text-center shadow-sm group">
                                            <Gauge size={20} className="mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-lg font-black dark:text-white leading-none">{selectedVehicle.heading || 0}°</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Direction</p>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 text-center shadow-sm group">
                                            <Signal size={20} className="mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-lg font-black dark:text-white leading-none">{selectedVehicle.signalStrength}%</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Signal GPS</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex border-b dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
                                    {[
                                        { id: 'overview', label: 'Télémétrie', icon: Activity },
                                        { id: 'telemetry', label: 'Historique', icon: History },
                                        { id: 'maintenance', label: 'Maint.', icon: Wrench }
                                    ].map(tab => (
                                        <button 
                                            key={tab.id}
                                            onClick={() => setActiveDetailTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${
                                                activeDetailTab === tab.id ? 'border-blue-500 text-blue-600 bg-blue-50/20' : 'border-transparent text-gray-400'
                                            }`}
                                        >
                                            <tab.icon size={14}/> {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-32">
                                    {activeDetailTab === 'overview' && (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Gauge size={100}/></div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2"><Navigation size={12}/> Position GPS</p>
                                                    <p className="text-sm font-black dark:text-white font-mono">{selectedVehicle.lat.toFixed(6)}, {selectedVehicle.lng.toFixed(6)}</p>
                                                    <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase">Validé par Galiléo</p>
                                                </div>
                                                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] border dark:border-gray-800 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12 group-hover:scale-110 transition-transform"><Zap size={100}/></div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-4 flex items-center gap-2"><Clock size={12}/> Dernière MAJ</p>
                                                    <p className="text-sm font-black dark:text-white">{new Date(selectedVehicle.lastUpdate || '').toLocaleTimeString()}</p>
                                                    <p className="text-[9px] text-green-500 font-bold mt-1 uppercase">Transmission Active</p>
                                                </div>
                                            </div>

                                            <div className="bg-red-50 dark:bg-red-900/10 border-2 border-dashed border-red-200 dark:border-red-900/40 p-8 rounded-[3rem] space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-black text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-3"><Lock size={20}/> Sécurité Remote</h4>
                                                    <span className="text-[9px] font-black text-red-500 uppercase px-2 py-0.5 bg-white dark:bg-black rounded-lg border border-red-100">Droit Admin</span>
                                                </div>
                                                <p className="text-xs text-red-500/70 font-medium italic">Attention : L'immobilisation à distance ne doit être utilisée qu'en cas de vol avéré ou danger imminent.</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <button className="py-5 bg-white dark:bg-gray-900 text-red-600 border-2 border-red-100 dark:border-red-900/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-500/10 active:scale-95">Couper Moteur</button>
                                                    <button className="py-5 bg-[#00C853] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95 flex items-center justify-center gap-2"><Unlock size={14}/> Rétablir</button>
                                                </div>
                                            </div>

                                            <div className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] border dark:border-gray-800 shadow-sm space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Activity size={16} className="text-blue-500"/> Courbe de Vitesse</h4>
                                                    <span className="text-[10px] font-bold text-gray-400">Dernières 8h (km/h)</span>
                                                </div>
                                                <div className="h-48 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={TELEMETRY_DATA}>
                                                            <defs>
                                                                <linearGradient id="colorSpeedAdm" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                                                    <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                                                            <XAxis dataKey="time" tick={{fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                                                            <Area type="monotone" dataKey="speed" stroke="#2962FF" strokeWidth={3} fillOpacity={1} fill="url(#colorSpeedAdm)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeDetailTab === 'maintenance' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <button className="w-full py-5 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-3xl text-orange-500 font-black uppercase text-[10px] tracking-widest hover:bg-orange-50 transition-all flex items-center justify-center gap-3"><Plus size={18}/> Planifier Maintenance</button>
                                            
                                            <div className="space-y-4">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="p-6 bg-white dark:bg-gray-900 rounded-[2.2rem] border dark:border-gray-800 shadow-sm flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"><Wrench size={24}/></div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">Révision Système GPS</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Effectué le 14/05/2024</p>
                                                        </div>
                                                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Check size={18} strokeWidth={4}/></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex gap-4 shrink-0 shadow-2xl">
                                    <button 
                                        onClick={() => { setShowAddModal(true); setVehicleForm(selectedVehicle); setShowDetailDrawer(false); }}
                                        className="flex-1 py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Edit2 size={20}/> Éditer Fiche
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteVehicle(selectedVehicle.id)}
                                        className="p-5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-[1.8rem] hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100 dark:border-red-900/30"
                                    >
                                        <Trash2 size={24}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
                    <form onSubmit={handleSaveVehicle} className="bg-white dark:bg-gray-950 rounded-[3rem] w-full max-w-md p-10 relative z-10 shadow-2xl border dark:border-gray-800 animate-scale-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{vehicleForm.id ? 'Éditer' : 'Nouveau'}</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Identification</label>
                                <input required className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" placeholder="Nom (ex: Moto 1)" value={vehicleForm.name} onChange={e => setVehicleForm({...vehicleForm, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Plaque</label>
                                    <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" placeholder="Plaque" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Type</label>
                                    <select className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner appearance-none" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value as any})}>
                                        <option value="moto">Moto</option><option value="camion">Camion</option><option value="tricycle">Tricycle</option><option value="pickup">Pickup</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Identifiant GPS</label>
                                <input className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none font-black text-sm dark:text-white shadow-inner" placeholder="GPS-XXXX" value={vehicleForm.gpsId} onChange={e => setVehicleForm({...vehicleForm, gpsId: e.target.value})} />
                            </div>
                            <button type="submit" className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Sauvegarder l'engin</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
