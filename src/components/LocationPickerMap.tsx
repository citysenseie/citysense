import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation } from "@/hooks/useLocation";
import { useState, useEffect } from "react";
import L from "leaflet";

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
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

const selectedIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #4ADE80;
      border: 4px solid #0F1E1E;
      box-shadow: 0 4px 14px rgba(0,0,0,.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">
      📍
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

export default function LocationPickerMap({
  onLocationSelect,
  selectedLocation,
}: LocationPickerMapProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const [selectedPosition, setSelectedPosition] = useState<
    [number, number]
  >(() => [lat, lng]);

  useEffect(() => {
    if (!selectedLocation) return;

    setSelectedPosition([
      selectedLocation.latitude,
      selectedLocation.longitude,
    ]);
  }, [selectedLocation]);

  const handleSelect = (position: [number, number]) => {
    setSelectedPosition(position);
    onLocationSelect?.(position);
  };

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      zoomControl={true}
      scrollWheelZoom={true}
      dragging={true}
      doubleClickZoom={true}
      touchZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <ResizeMap />

      {selectedLocation && (
        <FlyToLocation
          latitude={selectedLocation.latitude}
          longitude={selectedLocation.longitude}
        />
      )}

      <Marker
        position={selectedPosition}
        icon={selectedIcon}
      />

      <MapClickHandler onSelect={handleSelect} />
    </MapContainer>
  );
}