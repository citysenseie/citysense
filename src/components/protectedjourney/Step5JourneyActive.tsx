import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle,
  CheckCircle2,
  LocateFixed,
  MapPin,
  Navigation,
  ShieldCheck,
  Siren,
  Volume2,
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

/* =========================================================
   MAP HELPERS
   ========================================================= */

function FitRouteOnce({
  points,
  currentLocation,
  destination,
}: {
  points: RoutePoint[];
  currentLocation: LocationPoint;
  destination: [number, number];
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    hasFitted.current = false;
  }, [destination[0], destination[1]]);

  useEffect(() => {
    if (hasFitted.current) return;
    if (points.length < 2) return;

    const bounds = L.latLngBounds([
      [currentLocation.latitude, currentLocation.longitude],
      ...points,
      destination,
    ]);

    map.fitBounds(bounds, {
      paddingTopLeft: [24, 78],
      paddingBottomRight: [24, 220],
      maxZoom: 16,
      animate: true,
    });

    hasFitted.current = true;
  }, [points, currentLocation, destination, map]);

  return null;
}

function RecenterMap({
  location,
}: {
  location: LocationPoint;
}) {
  const map = useMap();

  useEffect(() => {
    const handleRecenter = () => {
      map.flyTo(
        [location.latitude, location.longitude],
        17,
        {
          animate: true,
          duration: 0.8,
        }
      );
    };

    window.addEventListener(
      "citysense-recenter",
      handleRecenter
    );

    return () => {
      window.removeEventListener(
        "citysense-recenter",
        handleRecenter
      );
    };
  }, [location, map]);

  return null;
}

/* =========================================================
   MAP ICONS
   ========================================================= */

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:24px;
      height:24px;
      border-radius:50%;
      background:#2563EB;
      border:4px solid white;
      box-shadow:
        0 0 0 8px rgba(37,99,235,.20),
        0 3px 10px rgba(0,0,0,.35);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

/* =========================================================
   SAFETY EVENT ICONS
   ========================================================= */

function getSafetyEmoji(type: string) {
  switch (type) {
    case "aggressive_driver":
      return "🚗";

    case "road_block":
      return "🚧";

    case "traffic":
      return "🚦";

    case "accident":
      return "💥";

    case "road_hazard":
      return "⚠️";

    case "unsafe_area":
      return "🚨";

    case "police_activity":
      return "👮";

    case "emergency":
      return "🆘";

    case "flooding":
      return "🌊";

    case "crowd":
      return "👥";

    case "safe_zone":
      return "🛡️";

    default:
      return "⚠️";
  }
}

function getSafetyColor(severity: string) {
  switch (severity) {
    case "critical":
      return "#DC2626";

    case "high":
      return "#F97316";

    case "moderate":
      return "#EAB308";

    case "low":
    default:
      return "#2563EB";
  }
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case "critical":
      return "CRITICAL";

    case "high":
      return "WARNING";

    case "moderate":
      return "CAUTION";

    case "low":
    default:
      return "INFO";
  }
}

function createSafetyEventIcon(
  type: string,
  severity: string
) {
  const color = getSafetyColor(severity);
  const emoji = getSafetyEmoji(type);

  const pulse =
    severity === "critical" ||
    severity === "high";

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position:relative;
        width:46px;
        height:46px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        background:${color};
        border:4px solid white;
        box-shadow:
          0 4px 14px rgba(0,0,0,.45),
          0 0 0 4px ${color}55;
        font-size:20px;
      ">
        ${emoji}

        ${
          pulse
            ? `
              <div style="
                position:absolute;
                inset:-5px;
                border-radius:50%;
                border:2px solid ${color};
                opacity:.55;
                animation:citysenseSafetyPulse 1.8s ease-out infinite;
              "></div>
            `
            : ""
        }
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -25],
  });
}

/* =========================================================
   ROUTING
   ========================================================= */

function getRouteProfile(
  travelMode: TravelMode
) {
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

function getTravelLabel(
  travelMode: TravelMode
) {
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

/* =========================================================
   DISTANCE
   ========================================================= */

function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLng =
    ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function formatDistance(
  distanceMeters: number | null
) {
  if (distanceMeters === null) {
    return "—";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(
      distanceMeters
    )} m`;
  }

  return `${(
    distanceMeters / 1000
  ).toFixed(1)} km`;
}

/* =========================================================
   MAP THEME
   ========================================================= */

function getSunTimes(
  date: Date,
  latitude: number,
  longitude: number
) {
  const dayOfYear = Math.floor(
    (Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    ) -
      Date.UTC(date.getUTCFullYear(), 0, 0)) /
      86400000
  );

  const gamma =
    (2 * Math.PI / 365) * (dayOfYear - 1);

  const equationOfTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));

  const declination =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);

  const latitudeRad =
    (latitude * Math.PI) / 180;

  const zenith =
    (90.833 * Math.PI) / 180;

  const cosHourAngle =
    (Math.cos(zenith) -
      Math.sin(latitudeRad) *
        Math.sin(declination)) /
    (Math.cos(latitudeRad) *
      Math.cos(declination));

  if (cosHourAngle <= -1) {
    return {
      sunrise: null,
      sunset: null,
    };
  }

  if (cosHourAngle >= 1) {
    return {
      sunrise: null,
      sunset: null,
    };
  }

  const hourAngle =
    (Math.acos(cosHourAngle) * 180) /
    Math.PI;

  const sunriseMinutes =
    720 -
    4 * (longitude + hourAngle) -
    equationOfTime;

  const sunsetMinutes =
    720 -
    4 * (longitude - hourAngle) -
    equationOfTime;

  const base = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );

  return {
    sunrise: new Date(
      base.getTime() +
        sunriseMinutes * 60 * 1000
    ),
    sunset: new Date(
      base.getTime() +
        sunsetMinutes * 60 * 1000
    ),
  };
}

function isNighttime(
  location: LocationPoint
) {
  const now = new Date();
  const sun = getSunTimes(
    now,
    location.latitude,
    location.longitude
  );

  if (!sun.sunrise || !sun.sunset) {
    return false;
  }

  return (
    now < sun.sunrise ||
    now > sun.sunset
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Step5JourneyActive({
  destination,
  destinationLatitude,
  destinationLongitude,
  travelMode,
  currentLocation,
  onEndJourney,
}: Props) {
  const [routePoints, setRoutePoints] =
    useState<RoutePoint[]>([]);

  const [routeDistanceKm, setRouteDistanceKm] =
    useState<number | null>(null);

  const [
    routeDurationSeconds,
    setRouteDurationSeconds,
  ] = useState<number | null>(null);

  const [loadingRoute, setLoadingRoute] =
    useState(true);

  const [routeError, setRouteError] =
    useState(false);

  const [checkedIn, setCheckedIn] =
    useState(false);

  const [isNightMap, setIsNightMap] =
    useState(() =>
      currentLocation
        ? isNighttime(currentLocation)
        : false
    );

  const [nextInstruction, setNextInstruction] =
    useState("Follow the route");

  const [
    nextInstructionDistance,
    setNextInstructionDistance,
  ] = useState<number | null>(null);

  const travelLabel = useMemo(
    () => getTravelLabel(travelMode),
    [travelMode]
  );

  useEffect(() => {
    if (!currentLocation) return;

    const updateMapTheme = () => {
      setIsNightMap(
        isNighttime(currentLocation)
      );
    };

    updateMapTheme();

    const interval = window.setInterval(
      updateMapTheme,
      60 * 1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [currentLocation]);

  const remainingDistance =
    currentLocation
      ? getDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          destinationLatitude,
          destinationLongitude
        )
      : null;

  const etaMinutes =
    routeDurationSeconds !== null &&
    routeDistanceKm &&
    routeDistanceKm > 0
      ? Math.max(
          1,
          Math.ceil(
            (routeDurationSeconds *
              (remainingDistance ??
                routeDistanceKm)) /
              routeDistanceKm /
              60
          )
        )
      : null;

  /* =======================================================
     SAFETY INTELLIGENCE
     ======================================================= */

  // Real safety events will be supplied by the Safety Intelligence
  // service. Keep this empty until a verified data source is connected.
  // CitySense must never display invented incidents as real.
  type SafetyAssessment = {
    event: {
      id: string;
      latitude: number;
      longitude: number;
      type: string;
      severity: string;
      title: string;
      description?: string;
      confidence: number;
    };
    distanceFromUserMeters: number | null;
    isAhead: boolean;
    isOnRoute: boolean;
  };

  const safetyAssessments = useMemo<SafetyAssessment[]>(
    () => [],
    []
  );

  const highestPrioritySafetyEvent =
    safetyAssessments[0] ?? null;

  /* =======================================================
     ROUTING
     ======================================================= */

  useEffect(() => {
    if (!currentLocation) return;

    const profile =
      getRouteProfile(travelMode);

    if (!profile) {
      setLoadingRoute(false);
      setRoutePoints([]);
      return;
    }

    let cancelled = false;

    const calculateRoute =
      async () => {
        setLoadingRoute(true);
        setRouteError(false);

        try {
          const url =
            `https://routing.openstreetmap.de/${profile}/route/v1/driving/` +
            `${currentLocation.longitude},${currentLocation.latitude};` +
            `${destinationLongitude},${destinationLatitude}` +
            `?overview=full&geometries=geojson&steps=true`;

          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              `Route request failed: ${response.status}`
            );
          }

          const data =
            await response.json();

          const route =
            data?.routes?.[0];

          if (!route) {
            throw new Error(
              "No route returned"
            );
          }

          const firstStep =
            route?.legs?.[0]?.steps?.[0];

          if (firstStep) {
            const maneuver =
              firstStep.maneuver;

            let instruction =
              "Continue";

            switch (
              maneuver?.type
            ) {
              case "turn":
                instruction =
                  maneuver.modifier ===
                  "left"
                    ? "Turn left"
                    : maneuver.modifier ===
                      "right"
                    ? "Turn right"
                    : maneuver.modifier ===
                      "slight left"
                    ? "Keep left"
                    : maneuver.modifier ===
                      "slight right"
                    ? "Keep right"
                    : "Turn";
                break;

              case "depart":
                instruction =
                  "Start your journey";
                break;

              case "arrive":
                instruction =
                  "You are arriving";
                break;

              case "roundabout":
                instruction =
                  "Enter the roundabout";
                break;

              default:
                instruction =
                  "Continue on the route";
            }

            const roadName =
              firstStep.name
                ? ` onto ${firstStep.name}`
                : "";

            setNextInstruction(
              `${instruction}${roadName}`
            );

            setNextInstructionDistance(
              firstStep.distance ??
                null
            );
          }

          const points: RoutePoint[] =
            route.geometry.coordinates.map(
              (
                [
                  longitude,
                  latitude,
                ]: [number, number]
              ) => [
                latitude,
                longitude,
              ]
            );

          if (cancelled) return;

          setRoutePoints(points);

          setRouteDistanceKm(
            route.distance / 1000
          );

          setRouteDurationSeconds(
            route.duration
          );
        } catch (error) {
          console.error(
            "Protected Journey routing error:",
            error
          );

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

  /* =======================================================
     WAITING FOR GPS
     ======================================================= */

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
            CitySense is waiting for
            your GPS position.
          </p>
        </div>
      </div>
    );
  }

  const destinationPosition: [
    number,
    number
  ] = [
    destinationLatitude,
    destinationLongitude,
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0F1E1E] text-white">

      {/* =================================================
          MAP
          ================================================= */}

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
          key={isNightMap ? "night" : "day"}
          url={
            isNightMap
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />

        <RecenterMap
          location={currentLocation}
        />

        {routePoints.length > 1 && (
          <FitRouteOnce
            points={routePoints}
            currentLocation={
              currentLocation
            }
            destination={
              destinationPosition
            }
          />
        )}

        {/* Current location */}
        <Marker
          position={[
            currentLocation.latitude,
            currentLocation.longitude,
          ]}
          icon={userIcon}
        />

        {/* Destination */}
        <Marker
          position={
            destinationPosition
          }
          icon={destinationIcon}
        />

        {/* Route shadow */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#0F1E1E",
              weight: 12,
              opacity: 0.55,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Main route */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: "#4ADE80",
              weight: 7,
              opacity: 1,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* =================================================
            SAFETY EVENTS
            ================================================= */}

        {safetyAssessments.map(
          (assessment) => {
            const event =
              assessment.event;

            return (
              <Marker
                key={event.id}
                position={[
                  event.latitude,
                  event.longitude,
                ]}
                icon={createSafetyEventIcon(
                  event.type,
                  event.severity
                )}
              >
                <Popup
                  closeButton={true}
                  className="citysense-safety-popup"
                >
                  <div className="w-[240px]">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                        style={{
                          backgroundColor:
                            getSafetyColor(
                              event.severity
                            ),
                        }}
                      >
                        {getSafetyEmoji(
                          event.type
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="text-[9px] font-black tracking-[0.15em]"
                          style={{
                            color:
                              getSafetyColor(
                                event.severity
                              ),
                          }}
                        >
                          {getSeverityLabel(
                            event.severity
                          )}
                        </p>

                        <h3 className="mt-1 text-sm font-black">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    {event.description && (
                      <p className="mt-3 text-xs leading-relaxed text-gray-600">
                        {event.description}
                      </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-gray-100 p-2">
                        <p className="text-[8px] uppercase text-gray-500">
                          Distance
                        </p>

                        <p className="mt-1 text-xs font-bold">
                          {formatDistance(
                            assessment.distanceFromUserMeters
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-100 p-2">
                        <p className="text-[8px] uppercase text-gray-500">
                          Confidence
                        </p>

                        <p className="mt-1 text-xs font-bold">
                          {Math.round(
                            event.confidence *
                              100
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    {assessment.isAhead && (
                      <div className="mt-3 rounded-lg bg-orange-50 px-3 py-2">
                        <p className="text-[10px] font-bold text-orange-700">
                          ⚠️ Ahead on your journey
                        </p>
                      </div>
                    )}

                    {assessment.isOnRoute && (
                      <div className="mt-2 rounded-lg bg-green-50 px-3 py-2">
                        <p className="text-[10px] font-bold text-green-700">
                          ✓ Relevant to your route
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>

      {/* =================================================
          TOP HEADER
          ================================================= */}

      <div className="absolute top-0 left-0 right-0 z-[1000] p-2.5">
        <div className="rounded-2xl bg-[#0F1E1E]/94 backdrop-blur-md border border-[#4ADE8035] px-3.5 py-2.5 shadow-xl">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-2xl bg-[#4ADE8020] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#4ADE80]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#4ADE80]">
                Protected Journey
              </p>

              <p className="text-base font-bold truncate">
                {destination}
              </p>

              <p className="text-[11px] text-[#9DB8B6] mt-0.5">
                {travelLabel}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" />

              <span className="text-[10px] font-bold text-[#4ADE80]">
                LIVE
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* =================================================
          SAFETY ALERT SUMMARY
          ================================================= */}

      {highestPrioritySafetyEvent && (
        <div className="absolute top-[170px] left-3 right-3 z-[1000]">
          <div className="rounded-2xl border border-orange-400/50 bg-[#171F1E]/95 backdrop-blur-xl px-4 py-3 shadow-2xl">

            <div className="flex items-center gap-3">

              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                style={{
                  backgroundColor:
                    getSafetyColor(
                      highestPrioritySafetyEvent
                        .event.severity
                    ),
                }}
              >
                {getSafetyEmoji(
                  highestPrioritySafetyEvent
                    .event.type
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-[0.15em] font-black text-orange-300">
                  CitySense Safety Alert
                </p>

                <p className="mt-0.5 text-sm font-black truncate">
                  {
                    highestPrioritySafetyEvent
                      .event.title
                  }
                </p>

                <p className="mt-0.5 text-[10px] text-[#9DB8B6]">
                  {formatDistance(
                    highestPrioritySafetyEvent.distanceFromUserMeters
                  )}{" "}
                  ahead
                  {highestPrioritySafetyEvent.isOnRoute
                    ? " • On your route"
                    : ""}
                </p>
              </div>

              <AlertTriangle className="h-5 w-5 shrink-0 text-orange-400" />
            </div>

          </div>
        </div>
      )}

      {/* =================================================
          ROUTE STATUS
          ================================================= */}

      <div className="absolute top-[92px] left-3 right-3 z-[1000]">
        <div className="rounded-2xl bg-[#0F1E1E]/82 backdrop-blur-md border border-white/10 px-3.5 py-2 shadow-lg">

          {loadingRoute ? (
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E8A838] animate-pulse" />

              <span className="text-xs text-[#9DB8B6]">
                Calculating best route…
              </span>
            </div>
          ) : routeError ? (
            <div>
              <p className="text-xs font-semibold text-[#FBBF24]">
                Route unavailable
              </p>

              <p className="text-[10px] text-[#7BA3A1] mt-0.5">
                GPS monitoring remains
                active.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#7BA3A1]">
                  Destination
                </p>

                <p className="text-sm font-bold truncate max-w-[190px]">
                  {destination}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-[#7BA3A1]">
                  ETA
                </p>

                <p className="text-base font-black text-[#4ADE80]">
                  {etaMinutes
                    ? `${etaMinutes} min`
                    : "—"}
                </p>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* =================================================
          RECENTER
          ================================================= */}

      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(
            new Event(
              "citysense-recenter"
            )
          );
        }}
        className="absolute right-4 bottom-[214px] z-[1000] w-12 h-12 rounded-2xl bg-[#0F1E1E]/94 backdrop-blur-xl border border-[#2D5A5860] flex items-center justify-center shadow-xl"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-[#4ADE80]" />
      </button>

      {/* =================================================
          BOTTOM NAVIGATION PANEL
          ================================================= */}

      <div className="absolute bottom-0 left-0 right-0 z-[1000]">

        <div className="rounded-t-[24px] bg-[#0F1E1E]/97 backdrop-blur-md border-t border-[#4ADE8030] px-3.5 pt-2.5 pb-3 shadow-2xl">

          <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-[#4A6664]" />

          {/* Destination + ETA */}

          <div className="flex items-center gap-2.5 mb-2">

            <div className="w-9 h-9 rounded-xl bg-[#4ADE8020] flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-[#4ADE80]" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] uppercase tracking-wider text-[#7BA3A1]">
                Going to
              </p>

              <p className="text-sm font-bold truncate">
                {destination}
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[9px] uppercase text-[#7BA3A1]">
                ETA
              </p>

              <p className="text-lg font-black text-[#4ADE80]">
                {etaMinutes
                  ? `${etaMinutes} min`
                  : "—"}
              </p>
            </div>

          </div>

          {/* Safety status */}

          <div className="mb-2 rounded-xl bg-[#1A2E2D] border border-[#2D5A5840] px-3 py-2">

            <div className="flex items-center gap-2">

              <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />

              <div className="flex-1">
                <p className="text-[8px] uppercase tracking-wider text-[#7BA3A1]">
                  Safety Intelligence
                </p>

                <p className="text-xs font-bold">
                  {safetyAssessments.length ===
                  0
                    ? "No active hazards detected"
                    : `${safetyAssessments.length} relevant alert${
                        safetyAssessments.length ===
                        1
                          ? ""
                          : "s"
                      } nearby`}
                </p>
              </div>

              {safetyAssessments.length >
                0 && (
                <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-500 px-2 text-[10px] font-black text-white">
                  {
                    safetyAssessments.length
                  }
                </div>
              )}

            </div>
          </div>

          {/* Metrics */}

          <div className="grid grid-cols-3 gap-1.5 mb-2">

            <div className="rounded-xl bg-[#1A2E2D] px-3 py-2">
              <p className="text-[8px] text-[#7BA3A1]">
                REMAINING
              </p>

              <p className="text-sm font-black text-[#4ADE80] mt-0.5">
                {remainingDistance !==
                null
                  ? `${remainingDistance.toFixed(
                      1
                    )} km`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-[#1A2E2D] px-3 py-2">
              <p className="text-[8px] text-[#7BA3A1]">
                ETA
              </p>

              <p className="text-sm font-black mt-0.5">
                {etaMinutes
                  ? `${etaMinutes} min`
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-[#1A2E2D] px-3 py-2">
              <p className="text-[8px] text-[#7BA3A1]">
                STATUS
              </p>

              <p className="text-sm font-black text-[#4ADE80] mt-0.5">
                Protected
              </p>
            </div>

          </div>

          {/* Next turn */}

          <div className="rounded-xl bg-[#1A2E2D] border border-[#2D5A5840] px-3 py-2 mb-2">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-[#4ADE8020] flex items-center justify-center shrink-0">
                <Navigation className="w-5 h-5 text-[#4ADE80]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">
                  {nextInstruction}
                </p>

                <p className="text-[10px] text-[#7BA3A1] mt-0.5">
                  {formatDistance(
                    nextInstructionDistance
                  )}{" "}
                  ahead
                </p>
              </div>

              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-[#4ADE8015] flex items-center justify-center shrink-0"
                aria-label="Voice navigation"
              >
                <Volume2 className="w-4 h-4 text-[#4ADE80]" />
              </button>

            </div>

          </div>

          {/* I'm OK */}

          <button
            type="button"
            onClick={() =>
              setCheckedIn(true)
            }
            className="w-full rounded-2xl bg-[#4ADE80] text-[#0F1E1E] py-3 font-black flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />

            {checkedIn
              ? "You're Checked In ✓"
              : "I'm OK"}
          </button>

          {/* Help / End */}

          <div className="grid grid-cols-2 gap-2 mt-2">

            <button
              type="button"
              onClick={() =>
                alert(
                  "Emergency assistance will be connected to the CitySense SOS system."
                )
              }
              className="rounded-2xl bg-[#7F1D1D] border border-[#EF444460] text-white py-2.5 font-bold flex items-center justify-center gap-2"
            >
              <Siren className="w-5 h-5" />
              Need Help
            </button>

            <button
              type="button"
              onClick={onEndJourney}
              className="rounded-2xl bg-[#1A2E2D] border border-[#2D5A58] text-[#F5F3EF] py-2.5 font-bold"
            >
              End Journey
            </button>

          </div>

        </div>
      </div>

      {/* =================================================
          SAFETY MARKER ANIMATION
          ================================================= */}

      <style>
        {`
          @keyframes citysenseSafetyPulse {
            0% {
              transform: scale(0.85);
              opacity: 0.7;
            }

            70% {
              transform: scale(1.35);
              opacity: 0;
            }

            100% {
              transform: scale(1.35);
              opacity: 0;
            }
          }

          .citysense-safety-popup
            .leaflet-popup-content-wrapper {
            border-radius: 18px;
          }

          .citysense-safety-popup
            .leaflet-popup-content {
            margin: 14px;
          }
        `}
      </style>

    </div>
  );
}