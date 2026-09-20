'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';

interface LocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  initialAddress?: string;
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    formatted_address: string;
    accuracy?: number;
  }) => void;
}

// Landmark quick-select points around Salem
const SALEM_PRESETS = [
  { name: 'Fairlands (Brindavan Rd)', lat: 11.672, lon: 78.138 },
  { name: 'Suramangalam (Junction)', lat: 11.671, lon: 78.125 },
  { name: 'Meyyanur (New Bus Stand)', lat: 11.663, lon: 78.133 },
  { name: 'Hasthampatti', lat: 11.676, lon: 78.156 },
  { name: 'Ammapet', lat: 11.654, lon: 78.175 },
];

export default function LocationPicker({
  initialLat = 11.6643,
  initialLon = 78.146,
  initialAddress = 'Salem, Tamil Nadu',
  onLocationSelected,
}: LocationPickerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lon, setLon] = useState(initialLon);
  const [address, setAddress] = useState(initialAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  // Initialize Leaflet Map safely on client
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      // Fix standard marker icons in Leaflet
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && isMounted) {
        const map = L.map(mapContainerRef.current).setView([lat, lon], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
        marker.bindPopup('Drag pin to your exact service location').openPopup();

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setLat(pos.lat);
          setLon(pos.lng);
          const customAddr = `Selected Location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
          setAddress(customAddr);
          onLocationSelected({
            latitude: pos.lat,
            longitude: pos.lng,
            formatted_address: customAddr,
          });
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setLat(e.latlng.lat);
          setLon(e.latlng.lng);
          const customAddr = `Selected Location (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`;
          setAddress(customAddr);
          onLocationSelected({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
            formatted_address: customAddr,
          });
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateLocation = (newLat: number, newLon: number, newAddr: string, acc?: number) => {
    setLat(newLat);
    setLon(newLon);
    setAddress(newAddr);
    setGeoError(null);

    if (mapInstanceRef.current && markerRef.current) {
      const map = mapInstanceRef.current as { setView: (coords: [number, number], zoom: number) => void };
      const marker = markerRef.current as { setLatLng: (coords: [number, number]) => void };
      map.setView([newLat, newLon], 15);
      marker.setLatLng([newLat, newLon]);
    }

    onLocationSelected({
      latitude: newLat,
      longitude: newLon,
      formatted_address: newAddr,
      accuracy: acc,
    });
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = position.coords;
        const autoAddr = `My GPS Location (±${Math.round(accuracy)}m)`;
        updateLocation(latitude, longitude, autoAddr, accuracy);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Please select your location from the map or quick presets below.');
        } else {
          setGeoError('Unable to detect location. Please select manually on the map.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Service Location <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={handleDetectCurrentLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Detecting GPS...' : 'Use My Current Location'}
        </button>
      </div>

      {geoError && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map display */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-56 bg-slate-100 z-0" />
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-xs shadow-sm flex items-center justify-between pointer-events-auto">
          <div className="truncate font-medium text-slate-700">
            <span className="text-slate-400 mr-1">Pin:</span>
            {address}
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-mono">
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Preset Quick Landmarks */}
      <div>
        <p className="text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1">
          <Compass className="w-3 h-3 text-slate-400" /> Or select landmark:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SALEM_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => updateLocation(preset.lat, preset.lon, `${preset.name}, Salem`)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
