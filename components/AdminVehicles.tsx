import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, Plus, Search, Battery, Signal, Truck, Settings, Trash2, 
    Radio, X, AlertTriangle, Filter, Layers, Sun, Moon, Globe, Wrench, 
    User, Fuel, Calendar, Edit2, Save, Activity, Map as MapIcon, List, 
    Navigation, Lock, Unlock, History, Zap, BarChart3, Gauge, MapPin 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line 
} from 'recharts';
import L from 'leaflet';
import { Vehicle } from '../types';
import { VehicleAPI } from '../services/api';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

// --- LEAFLET CONFIG ---
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons for Map
const getVehicleIcon = (status: string) => {
    const color = status === 'active' ? '#00C853' : status === 'maintenance' ? '#FF6D00' : '#FF5252';
    return L.divIcon({
        className: 'custom-vehicle-marker',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
        iconSize: [12, 12]
    });
};

// --- MOCK TELEMETRY DATA ---
const TELEMETRY_DATA = [
    { time: '08:00', speed: 0, battery: 100 },
    { time: '09:00', speed: 25, battery: 95 },
    { time: '10:00', speed: 45, battery: 88 },
    { time: '11:00', speed: 10, battery: 85 },
    { time: '12:00', speed: 0, battery: 85 },
    { time: '13:00', speed: 30, battery: 78 },
    { time: '14:00', speed: 55, battery: 65 },
    { time: '15:00', speed: 40, battery: 58 },
];

interface AdminVehiclesProps {
    onBack: () => void;
    onToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminVehicles: React.FC<AdminVehiclesProps> = ({ onBack, onToast }) => {
    // Main State
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    
    // Filtering
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'maintenance' | 'stopped'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Detail/Action States
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'telemetry' | 'maintenance'>('overview');

    // Form State
    const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
        type: 'moto',
        status: 'active',
        batteryLevel: 100,
        signalStrength: 100,
        heading: 0
    });

    useEffect(() => {
        loadVehicles();
        if (isSupabaseConfigured() && supabase) {
            const channel = supabase.channel('realtime:vehicles_admin')
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

    const loadVehicles = async () => {
        setIsLoading(true);
        try {
            // Pour Reset à 0: on vide la liste
            // const data = await VehicleAPI.getAll(); 
            setVehicles([]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    // --- ACTIONS ---

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
            heading: 0,
            lastUpdate: new Date().toISOString(),
            driverId: vehicleForm.driverId
        };

        try {
            if (vehicleForm.id) {
                // await VehicleAPI.update(vehicleData);
                setVehicles(prev => prev.map(v => v.id === vehicleData.id ? vehicleData : v));
                if (onToast) onToast("Véhicule mis à jour", "success");
            } else {
                // const created = await VehicleAPI.add(vehicleData);
                const created = { ...vehicleData, id: `v-${Date.now()}` }; // Simulation locale pour éviter d'appeler l'API réelle
                setVehicles([...vehicles, created]);
                if (onToast) onToast(`Véhicule ${created.name} ajouté`, "success");
            }
            setShowAddModal(false);
            setVehicleForm({ type: 'moto', status: 'active', batteryLevel: 100, signalStrength: 100 });
        } catch (e) {
            if (onToast) onToast("Erreur sauvegarde", "error");
        }
    };

    const handleLockEngine = (v: Vehicle) => {
        if (confirm(`SÉCURITÉ : Voulez-vous vraiment verrouiller le moteur de ${v.name} à distance ?`)) {
            // API Call simulation
            if (onToast) onToast(`Commande envoyée : Verrouillage moteur ${v.name}`, "info");
        }
    };

    const handlePingGPS = (v: Vehicle) => {
        if (onToast) onToast(`Ping GPS envoyé à ${v.name}...`, "info");
        setTimeout(() => {
            if (onToast) onToast("Position mise à jour : Signal fort", "success");
        }, 2000);
    };

    // --- FILTERS ---
    const filteredVehicles = vehicles.filter(v => {
        const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
        const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const activeCount = vehicles.filter(v => v.status === 'active').length;
    const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
    const alertCount = vehicles.filter(v => v.batteryLevel < 20 || v.signalStrength < 30).length;

    return (
        <div className="flex flex-col h-full bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
            
            {/* Header & KPI */}
            <div className="bg-white dark:bg-gray-800 p-4 shadow-sm flex flex-col gap-4 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Gestion Flotte</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{vehicles.length} véhicules enregistrés</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex">
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}
                            >
                                <List size={18} />
                            </button>
                            <button 
                                onClick={() => setViewMode('map')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}
                            >
                                <MapIcon size={18} />
                            </button>
                        </div>
                        <button 
                            onClick={() => { setVehicleForm({ type: 'moto', status: 'active' }); setShowAddModal(true); }}
                            className="bg-[#2962FF] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            <Plus size={18} /> <span className="hidden md:inline">Ajouter</span>
                        </button>
                    </div>
                </div>

                {/* KPI Bar */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><Activity size={16} /></div>
                        <div>
                            <span className="block text-xl font-black text-gray-800 dark:text-white">{activeCount}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Actifs</span>
                        </div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600"><Wrench size={16} /></div>
                        <div>
                            <span className="block text-xl font-black text-gray-800 dark:text-white">{maintenanceCount}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Maint.</span>
                        </div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600"><AlertTriangle size={16} /></div>
                        <div>
                            <span className="block text-xl font-black text-gray-800 dark:text-white">{alertCount}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Alertes</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {viewMode === 'list' && (
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-sm text-gray-800 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {['all', 'active', 'maintenance', 'stopped'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all ${
                                    filterStatus === status 
                                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                {status === 'all' ? 'Tous' : status}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="h-full overflow-y-auto p-4 pb-20 space-y-3">
                        {filteredVehicles.map(v => (
                            <div 
                                key={v.id} 
                                onClick={() => { setSelectedVehicle(v); setShowDetailDrawer(true); }}
                                className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${
                                            v.status === 'active' ? 'bg-[#00C853]' : v.status === 'maintenance' ? 'bg-orange-500' : 'bg-red-500'
                                        }`}>
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white">{v.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block mt-1">
                                                {v.plateNumber}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex gap-1 mb-1">
                                            {v.batteryLevel < 20 && <Battery size={16} className="text-red-500 animate-pulse" />}
                                            {v.signalStrength < 30 && <Signal size={16} className="text-red-500" />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                            v.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                            v.status === 'maintenance' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {v.status}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-50 dark:border-gray-700 pt-3 mt-3">
                                    <div className="flex items-center gap-1">
                                        <User size={12} /> {v.driverId || '---'}
                                    </div>
                                    <div className="flex items-center gap-1 justify-center">
                                        <Battery size={12} className={v.batteryLevel < 20 ? 'text-red-500' : 'text-green-500'} /> {v.batteryLevel}%
                                    </div>
                                    <div className="flex items-center gap-1 justify-end">
                                        <Signal size={12} /> {v.signalStrength}%
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredVehicles.length === 0 && (
                            <div className="text-center py-10 text-gray-400">Aucun véhicule trouvé.</div>
                        )}
                    </div>
                )}

                {/* MAP VIEW */}
                {viewMode === 'map' && (
                    <div className="h-full w-full relative z-0">
                        <MapContainer 
                            center={[-4.325, 15.322]} 
                            zoom={12} 
                            style={{ width: '100%', height: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                attribution='&copy; OpenStreetMap'
                            />
                            {filteredVehicles.map(v => (
                                <Marker 
                                    key={v.id} 
                                    position={[v.lat, v.lng]}
                                    icon={getVehicleIcon(v.status)}
                                    eventHandlers={{
                                        click: () => {
                                            setSelectedVehicle(v);
                                            setShowDetailDrawer(true);
                                        }
                                    }}
                                >
                                    <Popup closeButton={false}>
                                        <div className="text-xs font-bold">{v.name}</div>
                                        <div className="text-[10px] text-gray-500 capitalize">{v.status}</div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                        
                        {/* Map Overlay Stats */}
                        <div className="absolute bottom-6 left-4 right-4 z-[400] bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase">Flotte visible</p>
                                <p className="text-lg font-black text-gray-800 dark:text-white">{filteredVehicles.length}</p>
                            </div>
                            <button 
                                onClick={() => setViewMode('list')} 
                                className="bg-[#2962FF] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg"
                            >
                                Voir Liste
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* VEHICLE DETAIL DRAWER (360 VIEW) */}
            {selectedVehicle && showDetailDrawer && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetailDrawer(false)}></div>
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full relative z-10 shadow-2xl animate-fade-in-left flex flex-col border-l border-gray-200 dark:border-gray-700">
                        
                        {/* Drawer Header */}
                        <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white">{selectedVehicle.name}</h2>
                                <button onClick={() => setShowDetailDrawer(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${selectedVehicle.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    {selectedVehicle.status}
                                </span>
                                <span className="text-xs font-mono text-gray-500 bg-white dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600">
                                    {selectedVehicle.plateNumber}
                                </span>
                            </div>

                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-xl text-center border border-gray-100 dark:border-gray-600">
                                    <Battery size={16} className={`mx-auto mb-1 ${selectedVehicle.batteryLevel < 30 ? 'text-red-500' : 'text-green-500'}`} />
                                    <span className="text-xs font-bold dark:text-white">{selectedVehicle.batteryLevel}%</span>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-xl text-center border border-gray-100 dark:border-gray-600">
                                    <Signal size={16} className="mx-auto mb-1 text-blue-500" />
                                    <span className="text-xs font-bold dark:text-white">{selectedVehicle.signalStrength}%</span>
                                </div>
                                <div className="bg-white dark:bg-gray-700 p-2 rounded-xl text-center border border-gray-100 dark:border-gray-600">
                                    <Navigation size={16} className="mx-auto mb-1 text-purple-500" />
                                    <span className="text-xs font-bold dark:text-white">GPS OK</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-gray-800 px-4">
                            {[
                                { id: 'overview', label: 'Aperçu' },
                                { id: 'telemetry', label: 'Télémétrie' },
                                { id: 'maintenance', label: 'Maintenance' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDetailTab(tab.id as any)}
                                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${activeDetailTab === tab.id ? 'border-[#2962FF] text-[#2962FF]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/50">
                            
                            {/* OVERVIEW TAB */}
                            {activeDetailTab === 'overview' && (
                                <div className="space-y-6 animate-fade-in">
                                    {/* Mini Map */}
                                    <div className="h-48 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative shadow-sm">
                                        <MapContainer 
                                            center={[selectedVehicle.lat, selectedVehicle.lng]} 
                                            zoom={15} 
                                            style={{ width: '100%', height: '100%' }}
                                            zoomControl={false}
                                            dragging={false}
                                        >
                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                            <Marker position={[selectedVehicle.lat, selectedVehicle.lng]} icon={getVehicleIcon(selectedVehicle.status)} />
                                        </MapContainer>
                                        <div className="absolute bottom-2 right-2 z-[400] bg-white/90 dark:bg-black/80 px-2 py-1 rounded text-[10px] font-mono">
                                            {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}
                                        </div>
                                    </div>

                                    {/* Security Actions */}
                                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl">
                                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-3 flex items-center gap-2">
                                            <Lock size={14} /> Sécurité & Contrôle
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => handleLockEngine(selectedVehicle)}
                                                className="py-3 bg-white dark:bg-red-900/40 text-red-600 dark:text-red-300 rounded-xl text-xs font-bold shadow-sm border border-red-100 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/60 transition-colors flex flex-col items-center gap-1"
                                            >
                                                <Zap size={18} />
                                                Couper Moteur
                                            </button>
                                            <button 
                                                onClick={() => handlePingGPS(selectedVehicle)}
                                                className="py-3 bg-white dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-bold shadow-sm border border-blue-100 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors flex flex-col items-center gap-1"
                                            >
                                                <Navigation size={18} />
                                                Ping GPS
                                            </button>
                                        </div>
                                    </div>

                                    {/* Driver Info */}
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Chauffeur Assigné</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <User size={20} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-white text-sm">{selectedVehicle.driverId || 'Aucun'}</p>
                                                <p className="text-xs text-gray-400">ID: DRV-{Math.floor(Math.random()*1000)}</p>
                                            </div>
                                            <button className="ml-auto text-blue-600 text-xs font-bold hover:underline">Changer</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TELEMETRY TAB */}
                            {activeDetailTab === 'telemetry' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Vitesse (km/h) - 8h dernières</h4>
                                        <div className="h-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={TELEMETRY_DATA}>
                                                    <defs>
                                                        <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#2962FF" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                                    <XAxis dataKey="time" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                                    <Area type="monotone" dataKey="speed" stroke="#2962FF" fillOpacity={1} fill="url(#colorSpeed)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Niveau Batterie (%)</h4>
                                        <div className="h-40">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={TELEMETRY_DATA}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                                    <XAxis dataKey="time" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                                    <YAxis domain={[0, 100]} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                                    <Line type="monotone" dataKey="battery" stroke="#00C853" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MAINTENANCE TAB */}
                            {activeDetailTab === 'maintenance' && (
                                <div className="space-y-4 animate-fade-in">
                                    <button className="w-full py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl font-bold text-sm border border-orange-200 dark:border-orange-800 flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                                        <Plus size={16} /> Signaler Panne / Maintenance
                                    </button>

                                    <div className="space-y-3">
                                        {[1, 2].map((i) => (
                                            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex gap-4">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 text-gray-500">
                                                    <Wrench size={18} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-gray-800 dark:text-white text-sm">Vidange & Révision</h5>
                                                    <p className="text-xs text-gray-500">Effectué par Garage Central</p>
                                                    <span className="text-[10px] text-gray-400 mt-1 block">12 Mai 2024</span>
                                                </div>
                                                <div className="ml-auto">
                                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Terminé</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* ADD/EDIT MODAL (Simple Form) */}
            {showAddModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X size={20} className="text-gray-500" /></button>
                        <h3 className="text-xl font-bold mb-6 dark:text-white">{vehicleForm.id ? 'Modifier Véhicule' : 'Ajouter Véhicule'}</h3>
                        
                        <form onSubmit={handleSaveVehicle} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Identification</label>
                                <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]" placeholder="Nom (ex: Moto 1)" value={vehicleForm.name} onChange={e => setVehicleForm({...vehicleForm, name: e.target.value})} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Plaque</label>
                                    <input className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]" placeholder="Plaque" value={vehicleForm.plateNumber} onChange={e => setVehicleForm({...vehicleForm, plateNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                                    <select className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]" value={vehicleForm.type} onChange={e => setVehicleForm({...vehicleForm, type: e.target.value as any})}>
                                        <option value="moto">Moto</option>
                                        <option value="camion">Camion</option>
                                        <option value="tricycle">Tricycle</option>
                                        <option value="pickup">Pickup</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Chauffeur Assigné</label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-3.5 text-gray-400" />
                                    <input className="w-full pl-10 pr-3 py-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-[#2962FF]" placeholder="ID ou Nom du chauffeur" value={vehicleForm.driverId || ''} onChange={e => setVehicleForm({...vehicleForm, driverId: e.target.value})} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Annuler</button>
                                <button type="submit" className="flex-1 py-3 bg-[#2962FF] text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30">Sauvegarder</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};