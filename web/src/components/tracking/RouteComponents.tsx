'use client';

import { useState, useEffect } from 'react';

interface Stop {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    order: number;
    estimatedTime: string;
}

interface ServiceRoute {
    id: string;
    name: string;
    vehiclePlate: string;
    driver: string;
    assistant?: string;
    capacity: number;
    assignedStudents: number;
    morningDeparture: string;
    afternoonDeparture: string;
    stops: Stop[];
    isActive: boolean;
}

interface RouteCardProps {
    route: ServiceRoute;
    onSelect?: (route: ServiceRoute) => void;
    isSelected?: boolean;
}

export function RouteCard({ route, onSelect, isSelected }: RouteCardProps) {
    return (
        <div
            onClick={() => onSelect?.(route)}
            className={`bg-white rounded-xl shadow-sm border-2 p-5 cursor-pointer transition-all hover:shadow-md ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                }`}
        >
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">{route.name}</h3>
                    <p className="text-gray-500">{route.vehiclePlate}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${route.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                    }`}>
                    {route.isActive ? 'Aktif' : 'Pasif'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">👤</span>
                    <span className="text-gray-700">{route.driver}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">👥</span>
                    <span className="text-gray-700">{route.assignedStudents}/{route.capacity}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">🌅</span>
                    <span className="text-gray-700">{route.morningDeparture}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">🌆</span>
                    <span className="text-gray-700">{route.afternoonDeparture}</span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{route.stops.length} durak</span>
                    <div className="flex -space-x-1">
                        {route.stops.slice(0, 4).map((stop, i) => (
                            <div
                                key={stop.id}
                                className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs text-blue-700"
                            >
                                {i + 1}
                            </div>
                        ))}
                        {route.stops.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                                +{route.stops.length - 4}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface RouteStopsListProps {
    stops: Stop[];
    currentStopId?: string;
}

export function RouteStopsList({ stops, currentStopId }: RouteStopsListProps) {
    return (
        <div className="space-y-2">
            {stops.map((stop, index) => {
                const isCurrent = stop.id === currentStopId;
                const isPast = currentStopId ? stops.findIndex(s => s.id === currentStopId) > index : false;

                return (
                    <div
                        key={stop.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${isCurrent
                            ? 'bg-blue-50 border border-blue-200'
                            : isPast
                                ? 'bg-gray-50 opacity-60'
                                : 'bg-white'
                            }`}
                    >
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${isCurrent
                                ? 'bg-blue-500 text-white'
                                : isPast
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                {isPast ? '✓' : index + 1}
                            </div>
                            {index < stops.length - 1 && (
                                <div className={`w-0.5 h-8 mt-1 ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                            )}
                        </div>

                        {/* Stop info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {stop.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{stop.address}</p>
                                </div>
                                <span className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'
                                    }`}>
                                    {stop.estimatedTime}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export { ServiceRoute, Stop };
export type { RouteInfo, GeoLocation };
