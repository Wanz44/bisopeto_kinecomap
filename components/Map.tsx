
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Search, Loader2, X, Locate, MapPin, AlertTriangle, Info, Truck, Battery, Signal, Navigation, Zap } from 'lucide-react';
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

const getTruckIcon = (status: string) => {
    const color = status === 'active' ? '#2E7D32' : '#FBC02D';
    return L.divIcon({
        className: 'custom-truck-marker',
        html: `
            <div style="background-color: ${color}; border: 2px solid white; border-radius: 12px; padding: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

interface MapViewProps {
    user: User;
    onBack: () => void;
}

const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => { map.flyTo(center, map.getZoom()); }, [center, map]);
    return null;
};

export const MapView: React.FC<MapViewProps> = ({ user, onBack }) => {
    const [position, setPosition] = useState<[number, number]>([-4.325, 15.322]);
    const [reports, setReports] = useState<WasteReport[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showVehicles, setShowVehicles] = useState(true);
    const [showTraffic, setShowTraffic] = useState(false);

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
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => { 
                    setPosition([pos.coords.latitude, pos.coords.longitude]); 
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

    return (
        <div className="h-full w-full relative">
            {/* Top UI Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[900] flex flex-col items-center pointer-events-none">
                <div className="w-full md:w-[450px] flex flex-col gap-3 pointer-events-auto">
                    <div className="flex gap-2 w-full">
                        <button onClick={onBack} className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all border dark:border-gray-700">
                            <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
                        </button>
                        <div className="flex-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-3 shadow-xl border dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Navigation size={20} className="text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs font-black dark:text-white uppercase tracking-tight">Kinshasa Live Map</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                        {vehicles.length} Collecteurs • {reports.length} Alertes
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-lg">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[8px] font-black text-green-600 uppercase">Live</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleLocateMe} 
                            disabled={isLoading}
                            className={`bg-white dark:bg-gray-800 p-3.5 rounded-2xl shadow-xl transition-all border dark:border-gray-700 ${isLoading ? 'animate-pulse' : 'hover:scale-105 active:scale-95'}`}
                        >
                            {isLoading ? <Loader2 size={22} className="animate-spin text-primary" /> : <Locate size={22} className="text-primary" />}
                        </button>
                    </div>

                    {/* Filter Chips */}
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowVehicles(!showVehicles)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
                                showVehicles 
                                ? 'bg-primary text-white border-primary shadow-lg' 
                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-transparent dark:text-gray-400'
                            }`}
                        >
                            <Truck size={14} /> Voir Collecteurs
                        </button>
                        <button 
                            onClick={() => setShowTraffic(!showTraffic)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border-2 ${
                                showTraffic 
                                ? 'bg-orange-500 text-white border-orange-500 shadow-lg' 
                                : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-transparent dark:text-gray-400'
                            }`}
                        >
                            <Zap size={14} /> Flux Trafic
                        </button>
                    </div>
                </div>
            </div>

            <MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                {/* Traffic Overlay Layer (Simulated with high contrast roads) */}
                {showTraffic && (
                    <TileLayer 
                        url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826" 
                        opacity={0.6}
                        zIndex={10}
                    />
                )}

                <MapUpdater center={position} />
                
                <Marker position={position} icon={userIcon}>
                    <Popup><div className="p-1 font-bold text-xs uppercase">Votre position</div></Popup>
                </Marker>

                {reports.map(rep => (
                    <Marker key={rep.id} position={[rep.lat, rep.lng]} icon={reportIcon}>
                        <Popup>
                            <div className="p-2 space-y-2 max-w-[200px]">
                                <div className="h-24 rounded-lg overflow-hidden">
                                    <img src={rep.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                                <p className="text-xs font-black uppercase text-red-600">{rep.wasteType}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {showVehicles && vehicles.map(veh => (
                    <Marker key={veh.id} position={[veh.lat, veh.lng]} icon={getTruckIcon(veh.status)}>
                        <Popup>
                            <div className="p-2">
                                <p className="font-black text-xs uppercase">{veh.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold">{veh.plateNumber}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
