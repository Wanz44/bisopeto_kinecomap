
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Search, Loader2, X, Locate, MapPin, AlertTriangle, Info } from 'lucide-react';
import { User, UserType, WasteReport } from '../types';
import { ReportsAPI } from '../services/api';

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
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadReports = async () => {
            const data = await ReportsAPI.getAll();
            setReports(data);
        };
        loadReports();
    }, []);

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => { setPosition([pos.coords.latitude, pos.coords.longitude]); setIsLoading(false); },
                () => setIsLoading(false)
            );
        }
    };

    return (
        <div className="h-full w-full relative">
            <div className="absolute top-4 left-4 right-4 z-[900] flex flex-col items-center pointer-events-none">
                <div className="w-full md:w-96 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex gap-2 w-full">
                        <button onClick={onBack} className="md:hidden bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg flex items-center gap-3">
                            <Info size={20} className="text-[#2962FF]" />
                            <span className="text-xs font-bold dark:text-white">Affichage des signalements et camions</span>
                        </div>
                        <button onClick={handleLocateMe} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg">
                            <Locate size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <MapContainer center={position} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater center={position} />
                
                <Marker position={position} icon={userIcon}>
                    <Popup>Vous êtes ici</Popup>
                </Marker>

                {reports.map(rep => (
                    <Marker key={rep.id} position={[rep.lat, rep.lng]} icon={reportIcon}>
                        <Popup>
                            <div className="p-2 space-y-2 max-w-[200px]">
                                <img src={rep.imageUrl} className="w-full h-24 object-cover rounded-lg" alt="Signalement" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-red-600">Urgence: {rep.urgency}</span>
                                    <span className="text-[10px] bg-gray-100 p-1 rounded font-bold">{rep.wasteType}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 italic">"{rep.comment}"</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
