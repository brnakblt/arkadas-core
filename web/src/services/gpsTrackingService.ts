/**
 * GPS Tracking Service
 * API calls for service routes, location updates, and tracking
 */

const API_BASE = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface LocationUpdate {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    routeId?: string;
}

interface ServiceRoute {
    id: number;
    documentId: string;
    name: string;
    vehiclePlate: string;
    capacity: number;
    isActive: boolean;
    morningDepartureTime: string;
    afternoonDepartureTime: string;
    driver?: { id: number; username: string };
    assistant?: { id: number; username: string };
    stops?: RouteStop[];
}

interface RouteStop {
    id: number;
    documentId: string;
    name: string;
    latitude: number;
    longitude: number;
    stopOrder: number;
    estimatedArrivalOffsetMinutes: number;
}

interface LocationLog {
    id: number;
    latitude: number;
    longitude: number;
    speedKmh?: number;
    recordedAt: string;
    route?: { id: number };
}

class GPSTrackingService {
    private token: string | null = null;

    setAuthToken(token: string) {
        this.token = token;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    /**
     * Get all service routes
     */
    async getRoutes(): Promise<ServiceRoute[]> {
        const response = await fetch(`${API_BASE}/api/service-routes?populate=*`, {
            headers: this.getHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch routes');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get single route with stops
     */
    async getRoute(id: string): Promise<ServiceRoute | null> {
        const response = await fetch(
            `${API_BASE}/api/service-routes/${id}?populate[stops][sort]=stopOrder:asc&populate=driver&populate=assistant`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch route');
        }

        const data = await response.json();
        return data.data || null;
    }

    /**
     * Get active routes (currently in transit)
     */
    async getActiveRoutes(): Promise<ServiceRoute[]> {
        const response = await fetch(
            `${API_BASE}/api/service-routes?filters[isActive][$eq]=true&populate=*`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch active routes');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Submit current location (for drivers)
     */
    async updateLocation(location: LocationUpdate): Promise<LocationLog> {
        const response = await fetch(`${API_BASE}/api/location-logs`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                data: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracyMeters: location.accuracy,
                    speedKmh: location.speed ? location.speed * 3.6 : undefined, // m/s to km/h
                    heading: location.heading,
                    recordedAt: new Date().toISOString(),
                    source: 'gps',
                    route: location.routeId,
                },
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit location');
        }

        const data = await response.json();
        return data.data;
    }

    /**
     * Get latest location for a route
     */
    async getLatestLocation(routeId: string): Promise<LocationLog | null> {
        const response = await fetch(
            `${API_BASE}/api/location-logs?filters[route][id][$eq]=${routeId}&sort=recordedAt:desc&pagination[limit]=1`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch location');
        }

        const data = await response.json();
        return data.data?.[0] || null;
    }

    /**
     * Get location history for a route
     */
    async getLocationHistory(routeId: string, since?: Date): Promise<LocationLog[]> {
        let url = `${API_BASE}/api/location-logs?filters[route][id][$eq]=${routeId}&sort=recordedAt:asc`;

        if (since) {
            url += `&filters[recordedAt][$gte]=${since.toISOString()}`;
        }

        const response = await fetch(url, { headers: this.getHeaders() });

        if (!response.ok) {
            throw new Error('Failed to fetch location history');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Get route stops
     */
    async getRouteStops(routeId: string): Promise<RouteStop[]> {
        const response = await fetch(
            `${API_BASE}/api/route-stops?filters[route][id][$eq]=${routeId}&sort=stopOrder:asc`,
            { headers: this.getHeaders() }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch stops');
        }

        const data = await response.json();
        return data.data || [];
    }

    /**
     * Calculate ETA based on current location and remaining stops
     */
    calculateETA(
        currentLocation: { lat: number; lng: number },
        remainingStops: RouteStop[],
        averageSpeedKmh: number = 30
    ): { stopId: number; eta: Date }[] {
        const results: { stopId: number; eta: Date }[] = [];
        let totalDistanceKm = 0;
        let prevPoint = currentLocation;

        for (const stop of remainingStops) {
            // Haversine formula for distance
            const R = 6371; // Earth's radius in km
            const dLat = this.toRad(stop.latitude - prevPoint.lat);
            const dLon = this.toRad(stop.longitude - prevPoint.lng);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRad(prevPoint.lat)) *
                Math.cos(this.toRad(stop.latitude)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            totalDistanceKm += distance;
            const timeHours = totalDistanceKm / averageSpeedKmh;
            const eta = new Date(Date.now() + timeHours * 60 * 60 * 1000);

            results.push({ stopId: stop.id, eta });
            prevPoint = { lat: stop.latitude, lng: stop.longitude };
        }

        return results;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}

export const gpsTrackingService = new GPSTrackingService();
export type { ServiceRoute, RouteStop, LocationLog, LocationUpdate };
