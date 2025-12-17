
// Service pour la géolocalisation avancée et le routing

// Interface pour la réponse OSRM simplifiée
interface RouteInfo {
    coordinates: [number, number][]; // Pour tracer la ligne
    distance: number; // en mètres
    duration: number; // en secondes
}

export const GeoService = {
    /**
     * Génère un Plus Code (Open Location Code) à partir de coordonnées lat/lng
     * Utile pour Kinshasa où les adresses sont parfois imprécises.
     */
    getPlusCode: (lat: number, lng: number): string => {
        try {
            // @ts-ignore - Chargé via CDN dans index.html
            const OLC = window.OpenLocationCode;
            
            if (OLC) {
                // Parfois la librairie expose l'objet directement ou imbriqué
                // @ts-ignore
                if (typeof OLC.encode === 'function') {
                    // @ts-ignore
                    return OLC.encode(lat, lng, 11);
                } 
                // @ts-ignore
                else if (OLC.OpenLocationCode && typeof OLC.OpenLocationCode.encode === 'function') {
                    // @ts-ignore
                    return OLC.OpenLocationCode.encode(lat, lng, 11);
                }
            }
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (e) {
            console.error("Plus Code Error", e);
            return "Code indisponible";
        }
    },

    /**
     * Obtient un itinéraire réel via OSRM (Open Source Routing Machine)
     * Utilise le profil "driving" par défaut.
     */
    getRoute: async (startLat: number, startLng: number, endLat: number, endLng: number): Promise<RouteInfo | null> => {
        try {
            // Utilisation du serveur de démo OSRM (Gratuit, mais soumis à limites. En prod, héberger son propre OSRM ou utiliser Mapbox)
            const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error("Erreur routing");
            
            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                // Conversion GeoJSON [lng, lat] vers Leaflet [lat, lng]
                const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
                
                return {
                    coordinates,
                    distance: route.distance,
                    duration: route.duration
                };
            }
            return null;
        } catch (error) {
            console.error("Erreur calcul itinéraire:", error);
            return null;
        }
    },

    /**
     * Formate la distance en mètres ou km
     */
    formatDistance: (meters: number): string => {
        if (meters < 1000) return `${Math.round(meters)} m`;
        return `${(meters / 1000).toFixed(1)} km`;
    },

    /**
     * Formate la durée en min ou heures
     */
    formatDuration: (seconds: number): string => {
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMin = minutes % 60;
        return `${hours}h ${remainingMin}min`;
    }
};
