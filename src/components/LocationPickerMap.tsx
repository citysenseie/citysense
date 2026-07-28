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
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/hooks/useLocation";
import { useState } from "react";
type LocationPickerMapProps = {
  onLocationSelect?: (position: [number, number]) => void;
};

export default function LocationPickerMap({
  onLocationSelect,
}: LocationPickerMapProps) {
    const { location } = useLocation();

const lat = location?.latitude ?? 51.1857;
const lng = location?.longitude ?? 3.5701;
const [selectedPosition, setSelectedPosition] = useState<[number, number]>(() => [
  lat,
  lng,
]);
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