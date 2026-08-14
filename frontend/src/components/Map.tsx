import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet + Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
    <div style={{ height: '500px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', zIndex: 10 }}>
      <MapContainer center={center} zoom={3} style={{ height: '100%', width: '100%' }}>
        {/* CartoDB Voyager Tiles - Premium, modern, clean */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {opportunities.map((opp) => {
          // Deterministically pick a hub
          const hub = HUBS[opp.id % HUBS.length];
          // Add a tiny deterministic jitter so multiple pins at the same hub don't perfectly overlap
          const jitterLat = (opp.id % 13 - 6) * 0.05;
          const jitterLng = (opp.id % 17 - 8) * 0.05;
          
          return (
            <Marker key={opp.id} position={[hub.lat + jitterLat, hub.lng + jitterLng]}>
              <Popup>
                <div className="font-sans" style={{ minWidth: '180px' }}>
                  <h3 className="font-bold text-slate-800 text-[13px] leading-tight mb-2">{opp.name}</h3>
                  <p className="text-[11px] text-slate-500 mb-2">{opp.funder || 'Unknown Funder'}</p>
                  <p className="text-[10px] uppercase font-bold text-[#007AFF] tracking-wider">{opp.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
