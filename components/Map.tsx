
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Loader2, X, Locate, MapPin, AlertTriangle, Info, 
    Truck, Battery, Signal, Navigation, Zap, ChevronRight, Target, 
    Layers, Map as MapIcon, Wifi, User as UserIcon, Activity
} from 'lucide-react';
import { User, UserType, WasteReport, Vehicle } from '../types';
import { ReportsAPI, VehicleAPI } from '../services/api';

const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: iconShadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const reportIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const getTruckIcon = (status: string, isSelected: boolean) => {
    const color = status === 'active' ? '#2E7D32' : '#FBC02D';
    const size = isSelected ? 48 : 36;
    
    return L.divIcon({
        className: 'custom-truck-marker',
        html: `
            <div style="
                background-color: ${color}; 
                border: 3px solid white; 
                border-radius: 14px; 
                padding: 6px; 
                box-shadow: 0 4px 15px rgba(0,0,0,0.3); 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                color: white;
                width: ${size}px;
                height: ${size}px;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ${isSelected ? 'transform: scale(1.2); border-color: #2962FF;' : ''}
            ">
                <svg xmlns="http://www.w3.org/2000/svg" width="${size - 12}" height="${size - 12}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                ${isSelected ? '<div style="position: absolute; inset: -10px; border: 2px solid ' + color + '; border-radius: 18px; animation: ping 2s infinite;"></div>' : ''}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

interface MapViewProps {
    user: User;
    onBack: () => void;
}

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom?: number }) => {
    const map = useMap();
    useEffect(() => { 
        if (center) {
            map.flyTo(center, zoom || map.getZoom(), {
                duration: 1.2,
                easeLinearity: 0.25
            }); 
        }
    }, [center, zoom, map]);
    return null;
};

export const MapView: React.FC<MapViewProps> = ({ user, onBack }) => {
    const [position, setPosition] = useState<[number, number]>([-4.325, 15.322]);
    const [mapZoom, setMapZoom] = useState(14);
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showVehicles, setShowVehicles] = useState(true);
    const [showTraffic, setShowTraffic] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const loadData = async () => {
        try {
            const [repData, vehData] = await Promise.all([
                ReportsAPI.getAll(),
                VehicleAPI.getAll()
            ]);
            setReports(repData);
            setVehicles(vehData);
        } catch (e) {
            console.error("Erreur lors du chargement des données de la carte:", e);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 10000); // Mise à jour fréquente pour le suivi
        return () => clearInterval(interval);
    }, []);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => { 
                    const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setPosition(newPos); 
                    setMapZoom(16);
                    setIsLoading(false); 
                },
                () => {
                    setIsLoading(false);
                    alert("Localisation impossible.");
                },
                { enableHighAccuracy: true }
            );
        }
    };

    const handleSelectVehicle = (v: Vehicle) => {
        setSelectedVehicleId(v.id);
        setPosition([v.lat, v.lng]);
        setMapZoom(17);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const activeVehicles = vehicles.filter(v => v.status === 'active');

    return (
        <div className="h-full w-full relative flex overflow-hidden bg-gray-50 dark:bg-gray-950">
            
            {/* Sidebar de la Flotte */}
            <div className={`fixed inset-y-0 left-0 z-[1000] w-full md:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border-r border-gray-100 dark:border-gray-800 shadow-2xl transition-all duration-500 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                           <Target size={20} className="text-[#2962FF]" /> Live Flotte
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{activeVehicles.length} véhicules en ligne</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                    {vehicles.map(v => (
                        <div 
                            key={v.id} 
                            onClick={() => handleSelectVehicle(v)}
                            className={`p-4 rounded-[1.5rem] border-2 transition-all cursor-pointer group ${selectedVehicleId === v.id ? 'bg-[#2962FF]/5 border-[#2962FF]' : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-800 hover:border-blue-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${v.status === 'active' ? 'bg-[#00C853]' : 'bg-orange-500'}`}>
                                    <Truck size={22} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm uppercase truncate ${selectedVehicleId === v.id ? 'text-[#2962FF]' : 'text-gray-900 dark:text-white'}`}>{v.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                            <Battery size={10} className={v.batteryLevel < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'} /> {v.batteryLevel}%
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                            <Signal size={10} className="text-blue-500" /> {v.signalStrength}%
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={16} className={`transition-all ${selectedVehicleId === v.id ? 'text-[#2962FF] translate-x-1' : 'text-gray-300'}`} />
                            </div>
                        </div>
                    ))}
                    {vehicles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                            <Activity size={40} className="opacity-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Aucune donnée de flotte</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-t dark:border-gray-800">
                    <p className="text-[8px] font-black text-blue-500 dark:text-blue-300 uppercase tracking-[0.2em] leading-relaxed">
                        Les données GPS sont rafraîchies toutes les 10 secondes pour garantir une traçabilité optimale.
                    </p>
                </div>
            </div>

            {/* Main Map Container */}
            <div className="flex-1 relative h-full">
                {/* Top UI Overlay */}
                <div className="absolute top-4 left-4 right-4 z-[900] flex flex-col items-center pointer-events-none">
                    <div className="w-full max-w-lg flex flex-col gap-3 pointer-events-auto">
                        <div className="flex gap-2 w-full">
                            <button onClick={onBack} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all border dark:border-gray-700">
                                <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
                            </button>
                            <div className="flex-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="p-2 bg-[#2962FF]/10 text-[#2962FF] rounded-xl hover:bg-[#2962FF]/20 transition-all"
                                    >
                                        <Layers size={20} />
                                    </button>
                                    <div>
                                        <p className="text-xs font-black dark:text-white uppercase tracking-tight">Kinshasa Live tracking</p>
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">
                                            {vehicles.length} Collecteurs • {reports.length} Alertes SIG
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#4CAF50]"></div>
                                    <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Flux Actif</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleLocateMe} 
                                disabled={isLoading}
                                className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl transition-all border dark:border-gray-700 ${isLoading ? 'animate-pulse' : 'hover:scale-105 active:scale-95'}`}
                            >
                                {isLoading ? <Loader2 size={22} className="animate-spin text-primary" /> : <Locate size={22} className="text-[#2962FF]" />}
                            </button>
                        </div>

                        {/* Quick Filter Bar */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            <button 
                                onClick={() => setShowVehicles(!showVehicles)}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 shadow-lg ${
                                    showVehicles 
                                    ? 'bg-[#2962FF] text-white border-[#2962FF]' 
                                    : 'bg-white dark:bg-gray-800 text-gray-500 border-transparent'
                                }`}
                            >
                                <Truck size={14} /> Voir Flotte
                            </button>
                            <button 
                                onClick={() => setShowTraffic(!showTraffic)}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 shadow-lg ${
                                    showTraffic 
                                    ? 'bg-orange-500 text-white border-orange-500' 
                                    : 'bg-white dark:bg-gray-800 text-gray-500 border-transparent'
                                }`}
                            >
                                <Zap size={14} /> Flux Trafic
                            </button>
                        </div>
                    </div>
                </div>

                <MapContainer center={position} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    {showTraffic && (
                        <TileLayer 
                            url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826" 
                            opacity={0.5}
                            zIndex={10}
                        />
                    )}

                    <MapUpdater center={position} zoom={mapZoom} />
                    
                    <Marker position={position} icon={userIcon}>
                        <Popup><div className="p-2 font-black text-[10px] uppercase tracking-widest text-blue-600">Votre Position</div></Popup>
                    </Marker>

                    {reports.map(rep => (
                        <Marker key={rep.id} position={[rep.lat, rep.lng]} icon={reportIcon}>
                            <Popup>
                                <div className="p-3 space-y-3 max-w-[220px]">
                                    <div className="h-28 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                                        <img src={rep.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-red-600 tracking-tighter mb-1">{rep.wasteType}</p>
                                        <p className="text-[9px] text-gray-500 font-bold italic leading-tight">"{rep.comment || 'Sans commentaire'}"</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {showVehicles && vehicles.map(veh => (
                        <Marker 
                            key={veh.id} 
                            position={[veh.lat, veh.lng]} 
                            icon={getTruckIcon(veh.status, selectedVehicleId === veh.id)}
                            eventHandlers={{
                                click: () => setSelectedVehicleId(veh.id)
                            }}
                        >
                            <Popup>
                                <div className="p-4 min-w-[200px] space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-sm uppercase text-[#2962FF] tracking-tighter">{veh.name}</p>
                                            <p className="text-[9px] text-gray-400 font-black uppercase">{veh.plateNumber}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${veh.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{veh.status}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 py-2 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <Battery size={12} className={veh.batteryLevel < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'} />
                                            <span className="text-[10px] font-black">{veh.batteryLevel}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Signal size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-black">{veh.signalStrength}%</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleSelectVehicle(veh)}
                                        className="w-full py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all"
                                    >
                                        Détails Télémétrie
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Mobile FAB to open sidebar */}
                {!isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden absolute bottom-6 right-6 z-[900] w-14 h-14 bg-[#2962FF] text-white rounded-2xl shadow-2xl flex items-center justify-center animate-bounce"
                    >
                        <Truck size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};
