import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Major hubs across Africa and Global
const HUBS = [
  { name: 'Nairobi, Kenya', lat: -1.2921, lng: 36.8219 },
  { name: 'Lagos, Nigeria', lat: 6.5244, lng: 3.3792 },
  { name: 'Cape Town, SA', lat: -33.9249, lng: 18.4241 },
  { name: 'Kigali, Rwanda', lat: -1.9441, lng: 30.0619 },
  { name: 'Accra, Ghana', lat: 5.6037, lng: -0.1870 },
  { name: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  { name: 'Pretoria, SA', lat: -25.7479, lng: 28.2293 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 }
];

interface Opportunity {
  id: number;
  name: string;
  funder: string;
  status: string;
}

export default function Map({ opportunities }: { opportunities: Opportunity[] }) {
  // Center map on Africa
  const center: [number, number] = [3, 20];

  return (
    <div style={{ height: '100%', width: '100%', zIndex: 0, position: 'absolute', inset: 0 }}>
      <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }} zoomControl={false}>
        {/* CartoDB Voyager Tiles - Premium, modern, clean */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {opportunities.map((opp) => {
          // Deterministically pick a hub
          const hub = HUBS[opp.id % HUBS.length];
          // Add a tiny deterministic jitter so multiple pins at the same hub don't perfectly overlap
          const jitterLat = (opp.id % 13 - 6) * 0.05;
          const jitterLng = (opp.id % 17 - 8) * 0.05;
          
          const colorClass = opp.status === 'open' ? 'bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.2)]' : 'bg-[#007AFF] shadow-[0_0_0_6px_rgba(0,122,255,0.2)]';
          
          // Create a custom modern HTML dot icon using Tailwind classes!
          const modernIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="w-3 h-3 rounded-full animate-pulse border-2 border-white ${colorClass}"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          });

          return (
            <Marker key={opp.id} position={[hub.lat + jitterLat, hub.lng + jitterLng]} icon={modernIcon}>
              <Popup>
                <div className="font-sans" style={{ minWidth: '180px' }}>
                  <h3 className="font-bold text-slate-800 text-[13px] leading-tight mb-2">{opp.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-2">{opp.funder || 'Unknown Funder'}</p>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${opp.status === 'open' ? 'text-emerald-500' : 'text-[#007AFF]'}`}>{opp.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
