
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/hooks/useLocation";
import { useState, useEffect } from "react";
type LocationPickerMapProps = {
  onLocationSelect?: (position: [number, number]) => void;

  selectedLocation?: {
    latitude: number;
    longitude: number;
  } | null;
};
function MapClickHandler({
  onSelect,
}: {
  onSelect: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

function FlyToLocation({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);

  return null;
}
export default function LocationPickerMap({
  onLocationSelect,
  selectedLocation,
}: LocationPickerMapProps) {
    const { location } = useLocation();

const lat = location?.latitude ?? 51.1857;
const lng = location?.longitude ?? 3.5701;
const [selectedPosition, setSelectedPosition] = useState<[number, number]>(() => [
  lat,
  lng,
]);
useEffect(() => {
  if (selectedLocation) {
    setSelectedPosition([
      selectedLocation.latitude,
      selectedLocation.longitude,
    ]);
  }
}, [selectedLocation]);
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {selectedLocation && (
  <FlyToLocation
    latitude={selectedLocation.latitude}
    longitude={selectedLocation.longitude}
  />
)}
      <Marker position={selectedPosition} />
      <MapClickHandler
  onSelect={(position) => {
    setSelectedPosition(position);
    onLocationSelect?.(position);
  }}
/>
    </MapContainer>
  );
}