'use client';

import React, { useEffect, useRef } from 'react';
import { MatchedWorker } from '@/types';

interface DispatchMapProps {
  customerLat: number;
  customerLon: number;
  customerName: string;
  customerAddress: string;
  workers: MatchedWorker[];
  searchRadiusKm?: number;
  selectedWorkerId?: string;
  onSelectWorker?: (workerId: string) => void;
}

export default function DispatchMap({
  customerLat,
  customerLon,
  customerName,
  customerAddress,
  workers,
  searchRadiusKm = 15,
  selectedWorkerId,
  onSelectWorker,
}: DispatchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<{ [key: string]: unknown }>({});
  const circleRef = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      const L = (await import('leaflet')).default;

      if (!mapInstanceRef.current && isMounted) {
        const map = L.map(mapContainerRef.current).setView([customerLat, customerLon], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current as {
          setView: (coords: [number, number], zoom: number) => void;
          fitBounds: (bounds: unknown) => void;
        };

        // Clear existing markers
        Object.values(markersRef.current).forEach((m) => {
          (m as { remove: () => void }).remove();
        });
        markersRef.current = {};

        if (circleRef.current) {
          (circleRef.current as { remove: () => void }).remove();
          circleRef.current = null;
        }

        // Draw Search Radius Circle
        const circle = L.circle([customerLat, customerLon], {
          radius: searchRadiusKm * 1000,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 6',
        }).addTo(mapInstanceRef.current as unknown as import('leaflet').Map);
        circleRef.current = circle;

        // Custom icon for Customer (Red Pin)
        const customerIcon = L.divIcon({
          className: 'custom-customer-icon',
          html: `
            <div style="background-color: #ef4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3); font-size: 11px;">
              REQ
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const custMarker = L.marker([customerLat, customerLon], { icon: customerIcon })
          .addTo(mapInstanceRef.current as unknown as import('leaflet').Map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
              <strong style="color: #b91c1c;">📍 Customer Requirement</strong><br/>
              <strong>${customerName}</strong><br/>
              <span style="color: #64748b;">${customerAddress}</span>
            </div>
          `);
        markersRef.current['customer'] = custMarker;

        // Worker Markers (Emerald if uncontacted, Blue if contacted/accepted, Amber if selected)
        workers.forEach((worker, index) => {
          const isSelected = worker.worker_id === selectedWorkerId;
          const bgCol = isSelected
            ? '#3b82f6'
            : worker.has_been_contacted
            ? '#64748b'
            : '#10b981';

          const workerIcon = L.divIcon({
            className: 'custom-worker-icon',
            html: `
              <div style="background-color: ${bgCol}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.25); font-size: 11px;">
                #${index + 1}
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          if (worker.latitude && worker.longitude) {
            const wMarker = L.marker([worker.latitude, worker.longitude], { icon: workerIcon })
              .addTo(mapInstanceRef.current as unknown as import('leaflet').Map)
              .bindPopup(`
                <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4;">
                  <strong>#${index + 1} ${worker.full_name}</strong><br/>
                  <span style="color: #059669; font-weight: 600;">${worker.distance_km} km away</span><br/>
                  <span style="color: #64748b;">${worker.base_location_name} • ${worker.experience_years} yrs exp</span>
                </div>
              `);

            if (onSelectWorker) {
              wMarker.on('click', () => onSelectWorker(worker.worker_id));
            }
            markersRef.current[`worker-${worker.worker_id}`] = wMarker;
          }
        });
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
  }, [customerLat, customerLon, searchRadiusKm, workers, selectedWorkerId]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px] bg-slate-100" />
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-md z-[1000] flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block border border-white" />
          <span className="text-slate-600 font-medium">Customer</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white" />
          <span className="text-slate-600 font-medium">Verified Workers</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>Radius: {searchRadiusKm} km</span>
        </div>
      </div>
    </div>
  );
}
