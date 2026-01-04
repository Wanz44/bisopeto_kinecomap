
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
    ArrowLeft, Search, Loader2, Locate, MapPin, AlertTriangle, Info, 
    Truck, Zap, ChevronRight, Target, Layers, Map as MapIcon, 
    Activity, Radio, Clock, Globe, Navigation, Star, ExternalLink,
    Search as SearchIcon, Sparkles, X, ChevronUp, MoreVertical,
    BarChart3, Recycle, Droplets, Trash2, Check, LayoutGrid,
    Navigation2, Share2, Phone,
    // Fix: Added missing Battery icon import
    Battery
} from 'lucide-react';
import { User, UserType, WasteReport, Vehicle } from '../types';
import { ReportsAPI, VehicleAPI } from '../services/api';
import { findLocationsWithMaps } from '../services/geminiService';

const { BaseLayer } = LayersControl;

// --- CUSTOM MARKERS ---
const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const reportIcon = (urgency: string, isSelected: boolean) => new L.Icon({
    iconUrl: urgency === 'high' 
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' 
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: isSelected ? [35, 57] : [25, 41],
    iconAnchor: isSelected ? [17, 57] : [12, 41]
});

const poiIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const getTruckIcon = (v: Vehicle, isSelected: boolean) => {
    const color = v.status === 'active' ? '#2E7D32' : '#FBC02D';
    const size = isSelected ? 44 : 34;
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
                    border-radius: 10px;
                    padding: 5px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                    color: white;
                    transform: rotate(${rotation}deg);
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    ${isSelected ? 'border-color: #2962FF; scale: 1.15;' : ''}
                ">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>
                ${v.status === 'active' ? `<div style="position: absolute; inset: -4px; border: 2px solid ${color}; border-radius: 12px; animation: ping 2s infinite; opacity: 0.4;"></div>` : ''}
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
    const [isSearchingIA, setIsSearchingIA] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showTraffic, setShowTraffic] = useState(false);
    const [aiResults, setAiResults] = useState<any>(null);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);

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
                const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos); 
                setMapZoom(16);
                setIsLoading(false); 
            }, () => setIsLoading(false), { enableHighAccuracy: true });
        }
    };

    const handleIASearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsSearchingIA(true);
        setSelectedEntity(null);
        try {
            const results = await findLocationsWithMaps(searchQuery, position[0], position[1]);
            setAiResults(results);
            setShowDetailDrawer(true);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearchingIA(false);
        }
    };

    const handleEntitySelect = (entity: any, type: 'vehicle' | 'report' | 'poi') => {
        setSelectedEntity({ ...entity, mapType: type });
        setAiResults(null);
        setShowDetailDrawer(true);
        if (entity.lat && entity.lng) {
            setPosition([entity.lat, entity.lng]);
            setMapZoom(17);
        }
    };

    return (
        <div className="h-full w-full relative flex overflow-hidden bg-white dark:bg-gray-950 font-sans">
            {/* --- GOOGLE STYLE SEARCH BAR --- */}
            <div className="absolute top-6 left-6 right-6 z-[1000] pointer-events-none">
                <div className="max-w-2xl mx-auto flex flex-col gap-3 pointer-events-auto">
                    <div className="flex gap-2">
                        <button onClick={onBack} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 hover:scale-105 active:scale-95 transition-all text-gray-500">
                            <ArrowLeft size={22} />
                        </button>
                        <form onSubmit={handleIASearch} className="flex-1 bg-white dark:bg-gray-800 backdrop-blur-xl rounded-2xl p-2 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center px-4 focus-within:ring-4 ring-primary/10 transition-all">
                            <SearchIcon size={20} className="text-gray-400 mr-3" />
                            <input 
                                type="text" 
                                placeholder="Chercher un centre de tri, un camion..." 
                                className="bg-transparent w-full outline-none font-bold text-sm dark:text-white placeholder:text-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearchingIA ? (
                                <Loader2 className="animate-spin text-primary" size={20} />
                            ) : (
                                <button type="submit" className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all">
                                    <Sparkles size={18} />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Quick Category Chips */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { label: 'Centres de Tri', icon: Recycle, query: 'centres de tri plastique kinshasa' },
                            { label: 'Déchetteries', icon: Trash2, query: 'points de collecte ordures kinshasa' },
                            { label: 'Points Eau', icon: Droplets, query: 'stations forage ou eau potable kinshasa' },
                            { label: 'Services', icon: LayoutGrid, query: 'bureaux environnement' }
                        ].map((chip, i) => (
                            <button 
                                key={i}
                                onClick={() => { setSearchQuery(chip.label); handleIASearch(); }}
                                className="px-4 py-2.5 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-full border border-gray-100 dark:border-gray-700 shadow-lg flex items-center gap-2 whitespace-nowrap text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-200 hover:bg-primary hover:text-white transition-all active:scale-95"
                            >
                                <chip.icon size={14} /> {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- MAP ENGINE --- */}
            <MapContainer center={position} zoom={mapZoom} style={{ width: '100%', height: '100%' }} zoomControl={false}>
                <LayersControl position="bottomleft">
                    <BaseLayer checked name="Plan de Kinshasa">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    </BaseLayer>
                    <BaseLayer name="Vue Satellite">
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}" />
                    </BaseLayer>
                    {showTraffic && (
                        <LayersControl.Overlay checked name="Trafic Live">
                            <TileLayer url="https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=f6d53957f86443c683b5443329977826" opacity={0.5} />
                        </LayersControl.Overlay>
                    )}
                </LayersControl>

                <MapUpdater center={position} zoom={mapZoom} />
                
                {/* User Position */}
                <Marker position={position} icon={userIcon}>
                    <Popup className="custom-popup">Mbote ! Votre position actuelle.</Popup>
                </Marker>

                {/* Waste Reports SIG */}
                {reports.map(rep => (
                    <Marker 
                        key={rep.id} 
                        position={[rep.lat, rep.lng]} 
                        icon={reportIcon(rep.urgency, selectedEntity?.id === rep.id)}
                        eventHandlers={{ click: () => handleEntitySelect(rep, 'report') }}
                    />
                ))}

                {/* Real-time Fleet */}
                {vehicles.map(veh => (
                    <Marker 
                        key={veh.id} 
                        position={[veh.lat, veh.lng]} 
                        icon={getTruckIcon(veh, selectedEntity?.id === veh.id)}
                        eventHandlers={{ click: () => handleEntitySelect(veh, 'vehicle') }}
                    />
                ))}

                {/* AI Search Pins */}
                {aiResults?.places?.map((place: any, i: number) => (
                    place.lat && place.lng && (
                        <Marker 
                            key={i} 
                            position={[place.lat, place.lng]} 
                            icon={poiIcon}
                            eventHandlers={{ click: () => handleEntitySelect(place, 'poi') }}
                        />
                    )
                ))}
            </MapContainer>

            {/* --- FLOATING CONTROLS --- */}
            <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
                <button onClick={() => setShowTraffic(!showTraffic)} className={`p-4 rounded-2xl shadow-2xl transition-all ${showTraffic ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700'}`}>
                    <Navigation2 size={24} />
                </button>
                <button onClick={handleLocateMe} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 text-primary">
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Locate size={24} />}
                </button>
                {user.type === UserType.ADMIN && (
                    <button className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 text-blue-600">
                        <BarChart3 size={24} />
                    </button>
                )}
            </div>

            {/* --- PROFESSIONAL SIDE DRAWER (Google Maps Style) --- */}
            {showDetailDrawer && (
                <div className="absolute inset-y-0 left-0 w-full md:w-[420px] z-[2000] pointer-events-none flex flex-col justify-end md:justify-start p-6">
                    <div className="w-full bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.4)] pointer-events-auto animate-fade-in-up md:animate-fade-in-left flex flex-col max-h-[85vh] md:max-h-full border border-gray-100 dark:border-gray-800 overflow-hidden">
                        
                        {/* Drawer Header */}
                        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                    {selectedEntity?.mapType === 'vehicle' ? <Truck size={24} /> : selectedEntity?.mapType === 'report' ? <AlertTriangle size={24} /> : <MapPin size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-sm tracking-tighter dark:text-white leading-none">Détails du point</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Biso Peto SIG Cloud</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowDetailDrawer(false); setSelectedEntity(null); setAiResults(null); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-10">
                            
                            {/* Gemini Search Results */}
                            {aiResults && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                                            <Sparkles size={18} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Expertise Biso AI</span>
                                        </div>
                                        <p className="text-xs font-bold leading-relaxed text-blue-900 dark:text-blue-200">{aiResults.text}</p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Résultats Google Maps</p>
                                        {aiResults.places.length > 0 ? aiResults.places.map((place: any, i: number) => (
                                            <div key={i} className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-primary hover:shadow-md transition-all cursor-pointer">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:text-primary transition-colors"><MapPin size={20}/></div>
                                                    <span className="text-xs font-black dark:text-white uppercase truncate max-w-[180px]">{place.name}</span>
                                                </div>
                                                <a href={place.uri} target="_blank" rel="noopener noreferrer" className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-all">
                                                    <Navigation size={18} />
                                                </a>
                                            </div>
                                        )) : (
                                            <p className="text-center py-6 text-gray-400 font-bold uppercase text-[10px]">Aucun lieu spécifique trouvé</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Entity Panel */}
                            {selectedEntity && (
                                <div className="space-y-8 animate-fade-in">
                                    {selectedEntity.mapType === 'vehicle' && (
                                        <>
                                            <div className="text-center space-y-2">
                                                <h4 className="text-3xl font-black dark:text-white uppercase tracking-tighter leading-none">{selectedEntity.name}</h4>
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{selectedEntity.plateNumber}</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3">
                                                    <Battery size={24} className={selectedEntity.batteryLevel < 20 ? 'text-red-500 animate-pulse' : 'text-green-500'} />
                                                    <div className="text-center">
                                                        <span className="text-xl font-black dark:text-white">{selectedEntity.batteryLevel}%</span>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Énergie</p>
                                                    </div>
                                                </div>
                                                <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3">
                                                    <Radio size={24} className="text-blue-500" />
                                                    <div className="text-center">
                                                        <span className="text-xl font-black dark:text-white">{selectedEntity.status}</span>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">État Live</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <button className="w-full py-5 bg-primary text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-500/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                                                    <Navigation size={18} /> Suivre ce collecteur
                                                </button>
                                                <button className="w-full py-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3">
                                                    <Phone size={18} /> Contacter l'agent
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {selectedEntity.mapType === 'report' && (
                                        <>
                                            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl h-56 border-4 border-white dark:border-gray-800">
                                                <img src={selectedEntity.imageUrl} className="w-full h-full object-cover" alt="Déchet" />
                                                <div className={`absolute top-4 right-4 px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-lg ${selectedEntity.urgency === 'high' ? 'bg-red-500' : 'bg-orange-500'}`}>
                                                    {selectedEntity.urgency} Priority
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <h4 className="text-2xl font-black dark:text-white uppercase tracking-tighter leading-none">{selectedEntity.wasteType}</h4>
                                                    <p className="text-sm text-gray-500 font-bold italic mt-2">"{selectedEntity.comment}"</p>
                                                </div>
                                                
                                                <div className="flex flex-wrap gap-4 pt-4 border-t dark:border-gray-800">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase"><Clock size={14}/> {new Date(selectedEntity.date).toLocaleDateString()}</div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase"><MapPin size={14}/> {selectedEntity.commune}</div>
                                                </div>
                                            </div>

                                            {user.type === UserType.COLLECTOR && (
                                                <button className="w-full py-5 bg-[#2962FF] text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3">
                                                    <Check size={18} /> Accepter la collecte
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {selectedEntity.mapType === 'poi' && (
                                        <>
                                            <div className="text-center space-y-4">
                                                <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><Recycle size={40}/></div>
                                                <h4 className="text-3xl font-black dark:text-white uppercase tracking-tighter leading-none">{selectedEntity.name}</h4>
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-full border border-blue-100 font-black text-[9px] uppercase tracking-widest"><Globe size={12}/> Point de Tri Officiel</div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl space-y-4 border dark:border-gray-800">
                                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight"><span className="text-gray-400">Type</span><span className="dark:text-white">Collecte Plastique/Métal</span></div>
                                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight"><span className="text-gray-400">Horaires</span><span className="dark:text-white">08:00 - 18:00</span></div>
                                            </div>

                                            <div className="flex gap-3">
                                                <a href={selectedEntity.uri} target="_blank" rel="noopener noreferrer" className="flex-1 py-5 bg-primary text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-green-500/20 flex items-center justify-center gap-3">
                                                    <ExternalLink size={18} /> Google Maps
                                                </a>
                                                <button className="p-5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-[1.8rem] hover:text-blue-500 transition-colors"><Share2 size={22}/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {!selectedEntity && !aiResults && (
                                <div className="py-24 text-center space-y-6 opacity-30 animate-pulse">
                                    <MapIcon size={80} className="mx-auto text-gray-300" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400 px-10">Sélectionnez un élément sur la carte pour voir les détails SIG</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
