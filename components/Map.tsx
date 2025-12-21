
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Loader2, Locate, MapPin, AlertTriangle, Info, 
    Truck, Zap, ChevronRight, Target, Layers, Map as MapIcon, 
    Activity, Radio, Clock, Globe
} from 'lucide-react';
import { User, UserType, WasteReport, Vehicle } from '../types';
import { ReportsAPI, VehicleAPI } from '../services/api';

const { BaseLayer } = LayersControl;

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const reportIcon = (urgency: string) => new L.Icon({
    iconUrl: urgency === 'high' ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const getTruckIcon = (v: Vehicle, isSelected: boolean) => {
    const color = v.status === 'active' ? '#2E7D32' : '#FBC02D';
    const size = isSelected ? 48 : 38;
    const rotation = v.heading || 0;
    
    return L.divIcon({
        className: 'custom-truck-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            ">
                <div style="
                    background: ${color};
                    border: 3px solid white;
                    border-radius: 12px;
                    padding: 5px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    color: white;
                    transform: rotate(${rotation}deg);
                    transition: transform 0.5s ease;
                    ${isSelected ? 'border-color: #2962FF; scale: 1.1;' : ''}
                ">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>
                ${v.status === 'active' ? `<div style="position: absolute; inset: -5px; border: 2px solid ${color}; border-radius: 14px; animation: ping 2s infinite; opacity: 0.5;"></div>` : ''}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
};

const MapUpdater = ({ center, zoom }: { center: [number, number], zoom?: number }) => {
    const map = useMap();
    useEffect(() => { 
        if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 1.5 }); 
    }, [center, zoom, map]);
    return null;
};

// Defined missing MapViewProps interface to resolve the TypeScript error
interface MapViewProps {
    user: User;
    onBack: () => void;
}

export const MapView: React.FC<MapViewProps> = ({ user, onBack }) => {
    const [position, setPosition] = useState<[number, number]>([-4.325, 15.322]);
    const [mapZoom, setMapZoom] = useState(13);
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTraffic, setShowTraffic] = useState(false);

    const loadData = async () => {
        try {
            const [repData, vehData] = await Promise.all([ReportsAPI.getAll(), VehicleAPI.getAll()]);
            setReports(repData);
            setVehicles(vehData);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 8000);
        return () => clearInterval(interval);
    }, []);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition((pos) => { 
                setPosition([pos.coords.latitude, pos.coords.longitude]); 
                setMapZoom(16);
                setIsLoading(false); 
            }, () => setIsLoading(false), { enableHighAccuracy: true });
        }
    };

    const filteredVehicles = vehicles.filter(v => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full w-full relative flex overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Overlay UI */}
            <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none">
                <div className="max-w-xl mx-auto flex flex-col gap-4 pointer-events-auto">
                    <div className="flex gap-2">
                        <button onClick={onBack} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border dark:border-gray-700 hover:scale-105 active:scale-95 transition-all">
                            <ArrowLeft size={22} />
                        </button>
                        <div className="flex-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-xl border dark:border-gray-700 flex items-center px-4">
                            <Search size={18} className="text-gray-400 mr-3" />
                            <input 
                                type="text" 
                                placeholder="Rechercher camion..." 
                                className="bg-transparent w-full outline-none font-bold text-sm dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={handleLocateMe} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border dark:border-gray-700">
                            {isLoading ? <Loader2 className="animate-spin text-primary" /> : <Locate className="text-primary" />}
                        </button>
                    </div>
                </div>
            </div>

            <MapContainer center={position} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <LayersControl position="bottomleft">
                    <BaseLayer checked name="Plan (Streets)">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    </BaseLayer>
                    <BaseLayer name="Satellite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}" />
                    </BaseLayer>
                    
                    {showTraffic && (
                        <LayersControl.Overlay checked name="Trafic Live">
                            <TileLayer url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826" opacity={0.5} />
                        </LayersControl.Overlay>
                    )}
                </LayersControl>

                <MapUpdater center={position} zoom={mapZoom} />
                
                <Marker position={position} icon={userIcon}><Popup>Moi</Popup></Marker>

                {reports.map(rep => (
                    <Marker key={rep.id} position={[rep.lat, rep.lng]} icon={reportIcon(rep.urgency)}>
                        <Popup>
                            <div className="p-2 text-center">
                                <img src={rep.imageUrl} className="w-32 h-20 object-cover rounded-lg mb-2" />
                                <p className="font-black text-[10px] uppercase text-red-600">{rep.wasteType}</p>
                                <p className="text-[9px] text-gray-500 italic mt-1 leading-tight">"{rep.comment}"</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {filteredVehicles.map(veh => (
                    <Marker 
                        key={veh.id} 
                        position={[veh.lat, veh.lng]} 
                        icon={getTruckIcon(veh, selectedId === veh.id)}
                        eventHandlers={{ click: () => setSelectedId(veh.id) }}
                    >
                        <Popup>
                            <div className="p-3 min-w-[180px]">
                                <h4 className="font-black uppercase text-[#2962FF]">{veh.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 mb-2">{veh.plateNumber}</p>
                                <div className="flex items-center justify-between text-[11px] font-black border-t pt-2">
                                    <span className="flex items-center gap-1"><Radio size={12} className="text-green-500 animate-pulse" /> LIVE</span>
                                    <span className="text-gray-400">{new Date(veh.lastUpdate!).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Floating Quick Action */}
            <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
                <button onClick={() => setShowTraffic(!showTraffic)} className={`p-4 rounded-2xl shadow-2xl transition-all ${showTraffic ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800'}`}>
                    <Activity size={24} />
                </button>
            </div>
        </div>
    );
};
