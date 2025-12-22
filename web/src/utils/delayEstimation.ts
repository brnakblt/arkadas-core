
export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface RouteStop {
    id: string;
    latitude: number;
    longitude: number;
    order: number;
    estimatedTime: string; // HH:mm
}

/**
 * Calculates distance between two points in kilometers
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Estimates arrival time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param averageSpeedKmph Average speed in km/h (default: 30km/h for city bus)
 * @returns Estimated minutes to arrival
 */
export function estimateTravelTime(distanceKm: number, averageSpeedKmph: number = 25): number {
    // Add 20% buffer for traffic/stops
    return Math.round((distanceKm / averageSpeedKmph) * 60 * 1.2);
}

/**
 * Calculates delay status for a stop
 * @return delay in minutes (positive = late, negative = early)
 */
export function calculateDelay(
    currentLocation: GeoPoint,
    nextStop: RouteStop,
    currentTime: Date = new Date()
): number {
    const distance = calculateDistance(currentLocation, nextStop);
    const minutesToNext = estimateTravelTime(distance);

    // Parse estimated time (HH:mm) to Date for today
    const [hours, mins] = nextStop.estimatedTime.split(':').map(Number);
    const targetTime = new Date(currentTime);
    targetTime.setHours(hours, mins, 0, 0);

    const estimatedArrival = new Date(currentTime.getTime() + minutesToNext * 60000);

    // Difference in minutes
    return Math.round((estimatedArrival.getTime() - targetTime.getTime()) / 60000);
}
