import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Search, Loader2, X, Locate, MapPin } from 'lucide-react';
import { User, UserType } from '../types';

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

// Custom Icons
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const collectorIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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

// Component to update map center
const MapUpdater = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
};

export const MapView: React.FC<MapViewProps> = ({ user, onBack }) => {
    const [position, setPosition] = useState<[number, number]>([-4.325, 15.322]); // Kinshasa default
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Mock collectors for demo
    const [collectors, setCollectors] = useState([
        { id: 1, name: 'Camion 01', lat: -4.320, lng: 15.320, status: 'active' },
        { id: 2, name: 'Tricycle 04', lat: -4.330, lng: 15.325, status: 'active' },
    ]);

    const isAdmin = user.type === UserType.ADMIN;

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPosition([pos.coords.latitude, pos.coords.longitude]);
                    setIsLoading(false);
                },
                (err) => {
                    console.error(err);
                    setIsLoading(false);
                    alert("Impossible de vous localiser.");
                }
            );
        }
    };

    // Real search using Nominatim API
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Search restricted to DRC (countrycodes=cd) for better relevance
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=cd&limit=5`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.map((item: any) => ({
                        id: item.place_id,
                        name: item.display_name.split(',')[0], // First part as title
                        address: item.display_name, // Full address
                        type: item.type,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon)
                    })));
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error("Geocoding error:", error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 800); // 800ms debounce

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectResult = (result: any) => {
        setPosition([result.lat, result.lng]);
        setSearchQuery(result.name);
        setIsSearching(false);
        setSearchResults([]);
    };

    return (
        <div className="h-full w-full relative">
            
            {/* Standard Search Bar (Only for Non-Admins) */}
            {!isAdmin && (
                <div className="absolute top-4 left-4 right-4 z-[900] flex flex-col items-center pointer-events-none">
                    <div className="w-full md:w-96 flex flex-col gap-2 pointer-events-auto">
                        <div className="flex gap-2 w-full">
                            <button onClick={onBack} className="md:hidden bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center shrink-0">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex-1 relative shadow-lg rounded-xl">
                                <div className="absolute left-3 top-3.5 text-gray-400">
                                    {isLoading ? <Loader2 size={20} className="animate-spin text-[#00C853]" /> : <Search size={20} />}
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Chercher une adresse..."
                                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-none outline-none focus:ring-2 focus:ring-[#00C853] transition-all shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsSearching(true);
                                    }}
                                    onFocus={() => setIsSearching(true)}
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                            <button 
                                onClick={handleLocateMe}
                                className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center shrink-0 transition-colors"
                                title="Ma Position"
                            >
                                <Locate size={20} />
                            </button>
                        </div>
                        {/* Results Dropdown */}
                        {isSearching && searchQuery.length >= 3 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 w-full">
                                {searchResults.length === 0 && !isLoading ? (
                                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucun résultat trouvé</div>
                                ) : (
                                    searchResults.map((result) => (
                                        <div 
                                            key={result.id}
                                            onClick={() => handleSelectResult(result)}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 border-b border-gray-50 dark:border-gray-700 last:border-none"
                                        >
                                            <MapPin size={16} className="text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-800 dark:text-white line-clamp-1">{result.name}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{result.address}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Map */}
            <MapContainer 
                center={position} 
                zoom={14} 
                style={{ width: '100%', height: '100%' }} 
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={position} />
                
                {/* User Marker */}
                <Marker position={position} icon={userIcon}>
                    <Popup>
                        Vous êtes ici.
                    </Popup>
                </Marker>

                {/* Collector Markers */}
                {collectors.map(collector => (
                    <Marker 
                        key={collector.id} 
                        position={[collector.lat, collector.lng]} 
                        icon={collectorIcon}
                    >
                        <Popup>
                            <div className="font-bold">{collector.name}</div>
                            <div className="text-xs text-green-600">En service</div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};