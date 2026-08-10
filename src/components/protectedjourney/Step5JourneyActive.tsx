import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  CheckCircle2,
  LocateFixed,
  MapPin,
  ShieldCheck,
  Siren,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

type TravelMode =
  | "walking"
  | "cycling"
  | "driving"
  | "public_transport";

type LocationPoint = {
  latitude: number;
  longitude: number;
};

type Props = {
  destination: string;
  destinationLatitude: number;
  destinationLongitude: number;
  travelMode: TravelMode;
  currentLocation: LocationPoint | null;
  onEndJourney: () => void;
};

type RoutePoint = [number, number];

function FollowUser({
  location,
}: {
  location: LocationPoint | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.setView(
      [location.latitude, location.longitude],
      Math.max(map.getZoom(), 16),
      { animate: true }
    );
  }, [location, map]);

  return null;
}

function FitRoute({
  points,
}: {
  points: RoutePoint[];
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, {
      padding: [50, 50],
    });
  }, [points, map]);

  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:50%;
      background:#2563EB;
      border:4px solid white;
      box-shadow:0 0 0 9px rgba(37,99,235,.22);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const destinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:42px;
      height:42px;
      display:flex;
      align-items:center;
      justify-content:center;
      border-radius:50%;
      background:#4ADE80;
      border:4px solid #0F1E1E;
      box-shadow:0 4px 16px rgba(0,0,0,.35);
      font-size:20px;
    ">📍</div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function getRouteProfile(travelMode: TravelMode) {
  switch (travelMode) {
    case "walking":
      return "routed-foot";

    case "cycling":
      return "routed-bike";

    case "driving":
      return "routed-car";

    default:
      return null;
  }
}

function getTravelLabel(travelMode: TravelMode) {
  switch (travelMode) {
    case "walking":
      return "🚶 Walking";

    case "cycling":
      return "🚲 Cycling";

    case "driving":
      return "🚗 Driving";

    case "public_transport":
      return "🚌 Public Transport";
  }
}

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Step5JourneyActive({
  destination,
  destinationLatitude,
  destinationLongitude,
  travelMode,
  currentLocation,
  onEndJourney,
}: Props) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationSeconds, setRouteDurationSeconds] =
    useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [routeError, setRouteError] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const travelLabel = useMemo(
    () => getTravelLabel(travelMode),
    [travelMode]
  );

  const remainingDistance = currentLocation
    ? getDistanceKm(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationLatitude,
        destinationLongitude
      )
    : null;

  const etaMinutes =
    routeDurationSeconds !== null && routeDistanceKm
      ? Math.max(
          1,
          Math.ceil(
            routeDurationSeconds *
              ((remainingDistance ?? routeDistanceKm) / routeDistanceKm)
          ) / 60
        )
      : null;

  useEffect(() => {
    if (!currentLocation) return;

    const profile = getRouteProfile(travelMode);

    // We deliberately do not fake public-transport navigation.
    // The live map still works, but transit routing will be connected
    // separately when the transit routing provider is wired in.
    if (!profile) {
      setLoadingRoute(false);
      setRoutePoints([]);
      return;
    }

    let cancelled = false;

    const calculateRoute = async () => {
      setLoadingRoute(true);
      setRouteError(false);

      try {
        const url =
          `https://routing.openstreetmap.de/${profile}/route/v1/driving/` +
          `${currentLocation.longitude},${currentLocation.latitude};` +
          `${destinationLongitude},${destinationLatitude}` +
          `?overview=full&geometries=geojson&steps=false`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Route request failed: ${response.status}`);
        }

        const data = await response.json();
        const route = data?.routes?.[0];

        if (!route) {
          throw new Error("No route returned");
        }

        const points: RoutePoint[] =
          route.geometry.coordinates.map(
            ([longitude, latitude]: [number, number]) => [
              latitude,
              longitude,
            ]
          );

        if (cancelled) return;

        setRoutePoints(points);
        setRouteDistanceKm(route.distance / 1000);
        setRouteDurationSeconds(route.duration);
      } catch (error) {
        console.error("Protected Journey routing error:", error);

        if (!cancelled) {
          setRouteError(true);
          setRoutePoints([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRoute(false);
        }
      }
    };

    void calculateRoute();

    return () => {
      cancelled = true;
    };
  }, [
    currentLocation,
    destinationLatitude,
    destinationLongitude,
    travelMode,
  ]);

  if (!currentLocation) {
    return (
      <div className="min-h-screen bg-[#0F1E1E] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#4ADE8020] flex items-center justify-center">
            <LocateFixed className="w-7 h-7 text-[#4ADE80] animate-pulse" />
          </div>

          <h2 className="text-xl font-bold">
            Getting your location…
          </h2>

          <p className="mt-2 text-sm text-[#7BA3A1]">
            CitySense is waiting for your GPS position.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0F1E1E] text-white">
      {/* MAP */}
      <MapContainer
        center={[
          currentLocation.latitude,
          currentLocation.longitude,
        ]}
        zoom={16}
        zoomControl={false}
        className="absolute inset-0 z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FollowUser location={currentLocation} />

        {routePoints.length > 1 && (
          <FitRoute points={routePoints} />
        )}

        <Marker
          position={[
            currentLocation.latitude,
            currentLocation.longitude,
          ]}
          icon={userIcon}
        />

        <Marker
          position={[
            destinationLatitude,
            destinationLongitude,
          ]}
          icon={destinationIcon}
        />

        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#4ADE80",
              weight: 7,
              opacity: 0.95,
            }}
          />
        )}
      </MapContainer>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4">
        <div className="rounded-3xl bg-[#0F1E1E]/95 backdrop-blur-xl border border-[#4ADE8040] px-4 py-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4ADE8020] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#4ADE80]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#4ADE80]">
                Protected Journey
              </p>

              <p className="text-base font-bold truncate">
                {destination}
              </p>

              <p className="text-xs text-[#7BA3A1] mt-0.5">
                {travelLabel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" />

              <span className="text-xs font-bold text-[#4ADE80]">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ROUTE STATUS */}
      <div className="absolute top-28 left-4 right-4 z-[1000]">
        <div className="rounded-2xl bg-[#0F1E1E]/90 backdrop-blur-xl border border-[#2D5A5860] px-4 py-3">
          {loadingRoute ? (
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E8A838] animate-pulse" />
              <span className="text-sm text-[#7BA3A1]">
                Calculating route…
              </span>
            </div>
          ) : routeError ? (
            <div>
              <p className="text-sm font-semibold text-[#FBBF24]">
                Route unavailable
              </p>
              <p className="text-xs text-[#7BA3A1] mt-1">
                Live location tracking is still active.
              </p>
            </div>
          ) : travelMode === "public_transport" ? (
            <div>
              <p className="text-sm font-semibold">
                Public transport selected
              </p>
              <p className="text-xs text-[#7BA3A1] mt-1">
                Live map active. Transit routing will be connected separately.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase text-[#7BA3A1]">
                  Destination
                </p>

                <p className="font-bold truncate max-w-[190px]">
                  {destination}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase text-[#7BA3A1]">
                  ETA
                </p>

                <p className="text-lg font-black text-[#4ADE80]">
                  {etaMinutes ? `${etaMinutes} min` : "—"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RECENTER */}
      <button
        type="button"
        onClick={() => {
          const map = document.querySelector(".leaflet-container");

          if (map) {
            window.dispatchEvent(new Event("citysense-recenter"));
          }
        }}
        className="absolute right-4 bottom-[285px] z-[1000] w-12 h-12 rounded-2xl bg-[#0F1E1E]/95 backdrop-blur-xl border border-[#2D5A5860] flex items-center justify-center shadow-xl"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-[#4ADE80]" />
      </button>

      {/* BOTTOM NAVIGATION PANEL */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <div className="rounded-t-[32px] bg-[#0F1E1E]/97 backdrop-blur-xl border-t border-[#4ADE8030] px-5 pt-5 pb-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#4ADE8020] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#4ADE80]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1]">
                Going to
              </p>

              <p className="font-bold truncate">
                {destination}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-2xl bg-[#1A2E2D] p-3">
              <p className="text-[10px] text-[#7BA3A1]">
                REMAINING
              </p>

              <p className="font-black text-[#4ADE80] mt-1">
                {remainingDistance !== null
                  ? `${remainingDistance.toFixed(1)} km`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#1A2E2D] p-3">
              <p className="text-[10px] text-[#7BA3A1]">
                ETA
              </p>

              <p className="font-black mt-1">
                {etaMinutes ? `${etaMinutes} min` : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#1A2E2D] p-3">
              <p className="text-[10px] text-[#7BA3A1]">
                STATUS
              </p>

              <p className="font-black text-[#4ADE80] mt-1">
                Protected
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCheckedIn(true)}
            className="w-full rounded-2xl bg-[#4ADE80] text-[#0F1E1E] py-4 font-black flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />

            {checkedIn ? "You're Checked In ✓" : "I'm OK"}
          </button>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() =>
                alert(
                  "Emergency assistance will be connected to the CitySense SOS system."
                )
              }
              className="rounded-2xl bg-[#7F1D1D] border border-[#EF444460] text-white py-3.5 font-bold flex items-center justify-center gap-2"
            >
              <Siren className="w-5 h-5" />
              Need Help
            </button>

            <button
              type="button"
              onClick={onEndJourney}
              className="rounded-2xl bg-[#1A2E2D] border border-[#2D5A58] text-[#F5F3EF] py-3.5 font-bold"
            >
              End Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}