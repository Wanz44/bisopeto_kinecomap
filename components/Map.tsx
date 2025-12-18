
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Search, Loader2, X, Locate, MapPin, AlertTriangle, Info, Truck, Battery, Signal, Navigation } from 'lucide-react';
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

// Icône personnalisée pour les camions de collecte
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
        // Simulation de rafraîchissement "live" toutes les 15 secondes
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
                    </div>
                </div>
            </div>

            {/* Bottom Legend Overlay */}
            <div className="absolute bottom-10 left-4 z-[900] bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border dark:border-gray-700 hidden sm:block">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Légende</h4>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase">Vous</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase">Déchets signalés</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full border-2 border-white"></div>
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase">Camion en mouvement</span>
                    </div>
                </div>
            </div>

            <MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapUpdater center={position} />
                
                {/* Marqueur Utilisateur */}
                <Marker position={position} icon={userIcon}>
                    <Popup>
                        <div className="p-1 font-bold text-xs uppercase">Votre position actuelle</div>
                    </Popup>
                </Marker>

                {/* Marqueurs Signalements */}
                {reports.map(rep => (
                    <Marker key={rep.id} position={[rep.lat, rep.lng]} icon={reportIcon}>
                        <Popup>
                            <div className="p-2 space-y-3 max-w-[200px]">
                                <div className="relative h-24 rounded-lg overflow-hidden shadow-inner">
                                    <img src={rep.imageUrl} className="w-full h-full object-cover" alt="Signalement" />
                                    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-black text-white ${rep.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                        {rep.urgency.toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-black text-gray-600 dark:text-gray-300 uppercase tracking-tighter">{rep.wasteType}</span>
                                        <span className="text-[8px] text-gray-400 font-bold uppercase">{new Date(rep.date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 italic leading-tight">"{rep.comment}"</p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Marqueurs Collecteurs (Camions) */}
                {showVehicles && vehicles.map(veh => (
                    <Marker 
                        key={veh.id} 
                        position={[veh.lat, veh.lng]} 
                        icon={getTruckIcon(veh.status)}
                    >
                        <Popup>
                            <div className="p-3 space-y-3 min-w-[180px]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase leading-none">{veh.name}</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 tracking-widest">{veh.plateNumber}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 border-t dark:border-gray-700 pt-3">
                                    <div className="flex items-center gap-1.5">
                                        <Battery size={14} className={veh.batteryLevel < 25 ? 'text-red-500' : 'text-green-600'} />
                                        <span className="text-[10px] font-bold dark:text-gray-300">{veh.batteryLevel}%</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 justify-end">
                                        <Signal size={14} className="text-blue-500" />
                                        <span className="text-[10px] font-bold dark:text-gray-300">{veh.signalStrength}%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex items-center justify-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${veh.status === 'active' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{veh.status === 'active' ? 'En Collecte' : 'Arrêt Temporaire'}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
