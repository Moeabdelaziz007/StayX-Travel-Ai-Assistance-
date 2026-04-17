'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix default icon issue with Leaflet and Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export function InteractiveMap({ locations }: { locations: { lat: number; lng: number; title: string }[] }) {
  // Center map on the first location
  const center = locations.length > 0 ? [locations[0].lat, locations[0].lng] : [0, 0];

  return (
    <MapContainer center={center as any} zoom={13} className="h-full w-full rounded-[2rem]">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc, i) => (
        <Marker key={i} position={[loc.lat, loc.lng] as any}>
          <Popup>{loc.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
