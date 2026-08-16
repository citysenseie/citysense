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
  LocateFixed,
  Navigation,
  ShieldCheck,
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

type NavigationStep = {
  routeIndex: number;
  location: RoutePoint;
  name: string;
  type: string;
  modifier?: string;
  distance: number;
  duration: number;
};

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  return (
    getDistanceKm(lat1, lng1, lat2, lng2) * 1000
  );
}

function getNearestRoutePoint(
  location: LocationPoint,
  points: RoutePoint[]
) {
  if (points.length === 0) {
    return {
      index: 0,
      distanceMeters: null as number | null,
    };
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach(([latitude, longitude], index) => {
    const distance = getDistanceMeters(
      location.latitude,
      location.longitude,
      latitude,
      longitude
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return {
    index: nearestIndex,
    distanceMeters: nearestDistance,
  };
}

function getRouteDistanceFromIndex(
  points: RoutePoint[],
  startIndex: number
) {
  if (points.length < 2 || startIndex >= points.length - 1) {
    return 0;
  }

  let totalMeters = 0;

  for (let index = startIndex; index < points.length - 1; index += 1) {
    const [lat1, lng1] = points[index];
    const [lat2, lng2] = points[index + 1];

    totalMeters += getDistanceMeters(
      lat1,
      lng1,
      lat2,
      lng2
    );
  }

  return totalMeters;
}

function getManeuverInstruction(
  step: NavigationStep
) {
  let instruction = "Continue";

  switch (step.type) {
    case "depart":
      instruction = "Start your journey";
      break;

    case "arrive":
      instruction = "You have arrived";
      break;

    case "turn":
      instruction =
        step.modifier === "left"
          ? "Turn left"
          : step.modifier === "right"
            ? "Turn right"
            : step.modifier === "slight left"
              ? "Keep left"
              : step.modifier === "slight right"
                ? "Keep right"
                : "Turn";
      break;

    case "roundabout":
    case "rotary":
      instruction = "Enter the roundabout";
      break;

    case "merge":
      instruction = "Merge";
      break;

    case "fork":
      instruction =
        step.modifier === "left"
          ? "Keep left at the fork"
          : step.modifier === "right"
            ? "Keep right at the fork"
            : "Continue at the fork";
      break;

    case "on ramp":
      instruction = "Take the ramp";
      break;

    case "off ramp":
      instruction = "Take the exit";
      break;

    default:
      instruction = "Continue on the route";
  }

  return step.name
    ? `${instruction} onto ${step.name}`
    : instruction;
}

function getManeuverHeadline(step: NavigationStep) {
  switch (step.type) {
    case "depart":
      return "Start your journey";
    case "arrive":
      return "You have arrived";
    case "turn":
      return step.modifier === "left"
        ? "Turn left"
        : step.modifier === "right"
          ? "Turn right"
          : step.modifier === "slight left"
            ? "Keep left"
            : step.modifier === "slight right"
              ? "Keep right"
              : "Turn";
    case "roundabout":
    case "rotary":
      return "Enter the roundabout";
    case "merge":
      return "Merge";
    case "fork":
      return step.modifier === "left"
        ? "Keep left"
        : step.modifier === "right"
          ? "Keep right"
          : "Continue at the fork";
    case "on ramp":
      return "Take the ramp";
    case "off ramp":
      return "Take the exit";
    case "new name":
    case "continue":
      return step.name
        ? `Stay on ${step.name}`
        : "Continue straight";
    default:
      return step.name
        ? `Continue on ${step.name}`
        : "Continue straight";
  }
}

function getManeuverSymbol(step: NavigationStep | null) {
  if (!step) return "↑";

  if (step.type === "roundabout" || step.type === "rotary") {
    return "↻";
  }

  if (step.type === "off ramp") return "↗";
  if (step.type === "on ramp") return "↖";

  if (step.modifier === "left" || step.modifier === "slight left") {
    return step.modifier === "slight left" ? "↖" : "←";
  }

  if (step.modifier === "right" || step.modifier === "slight right") {
    return step.modifier === "slight right" ? "↗" : "→";
  }

  return "↑";
}

function getRoadShieldClass(name: string) {
  if (/^E\d+/i.test(name)) {
    return "bg-[#4ADE80] text-[#0F1E1E] border-[#D9FFE6]";
  }

  if (/^N\d+/i.test(name)) {
    return "bg-[#2563EB] text-white border-[#D7E5FF]";
  }

  if (/^R\d+/i.test(name)) {
    return "bg-white text-[#0F1E1E] border-[#D1D5DB]";
  }

  return "bg-white text-[#0F1E1E] border-[#D1D5DB]";
}

function FollowUserMap({
  location,
  enabled,
}: {
  location: LocationPoint;
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled) return;

    map.setView(
      [location.latitude, location.longitude],
      Math.max(map.getZoom(), 17),
      {
        animate: false,
      }
    );
  }, [
    enabled,
    location.latitude,
    location.longitude,
    map,
  ]);

  return null;
}

function MapInteractionController({
  onUserInteraction,
}: {
  onUserInteraction: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handleInteraction = () => {
      onUserInteraction();
    };

    map.on("dragstart", handleInteraction);
    map.on("zoomstart", handleInteraction);

    return () => {
      map.off("dragstart", handleInteraction);
      map.off("zoomstart", handleInteraction);
    };
  }, [map, onUserInteraction]);

  return null;
}
  
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

  const [navigationSteps, setNavigationSteps] =
    useState<NavigationStep[]>([]);

  const [activeNavigationStep, setActiveNavigationStep] =
    useState<NavigationStep | null>(null);

  const [followingNavigationStep, setFollowingNavigationStep] =
    useState<NavigationStep | null>(null);

  const [routeDistanceKm, setRouteDistanceKm] =
    useState<number | null>(null);

  const [remainingRouteDistanceKm, setRemainingRouteDistanceKm] =
    useState<number | null>(null);

  const [distanceFromRouteMeters, setDistanceFromRouteMeters] =
    useState<number | null>(null);

  const [routeProgressIndex, setRouteProgressIndex] =
    useState(0);

  const routeProgressIndexRef = useRef(0);
  const routeRequestStartedRef = useRef(false);
const [routeStartLocation, setRouteStartLocation] =
  useState<LocationPoint | null>(null);
  useEffect(() => {
  if (!currentLocation) return;
  if (routeStartLocation) return;

  setRouteStartLocation(currentLocation);
}, [currentLocation, routeStartLocation]);
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
const [isFollowing, setIsFollowing] =
  useState(true);

const [showNavigationOptions, setShowNavigationOptions] =
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
    remainingRouteDistanceKm ??
    (currentLocation
      ? getDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          destinationLatitude,
          destinationLongitude
        )
      : null);

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
     ROUTING + TURN-BY-TURN NAVIGATION
     ======================================================= */

  useEffect(() => {
    routeRequestStartedRef.current = false;
    setRoutePoints([]);
    setNavigationSteps([]);
    setActiveNavigationStep(null);
    setFollowingNavigationStep(null);
    setRemainingRouteDistanceKm(null);
    setDistanceFromRouteMeters(null);
    routeProgressIndexRef.current = 0;
    setRouteProgressIndex(0);
  }, [
    destinationLatitude,
    destinationLongitude,
    travelMode,
  ]);

  useEffect(() => {
    if (!routeStartLocation) return;
if (routeRequestStartedRef.current) return;
    const profile =
      getRouteProfile(travelMode);

    if (!profile) {
      setLoadingRoute(false);
      setRoutePoints([]);
      return;
    }

    routeRequestStartedRef.current = true;

    let cancelled = false;

    const calculateRoute =
      async () => {
        setLoadingRoute(true);
        setRouteError(false);

        try {
          const url =
            `https://routing.openstreetmap.de/${profile}/route/v1/driving/` +
            `${routeStartLocation.longitude},${routeStartLocation.latitude};` +
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

          const rawSteps =
            route?.legs?.[0]?.steps ?? [];

          const steps: NavigationStep[] =
            rawSteps.map(
              (step: any) => {
                const [
                  longitude,
                  latitude,
                ] = step?.maneuver?.location ?? [
                  0,
                  0,
                ];

                const stepLocation: RoutePoint = [
                  latitude,
                  longitude,
                ];

                const nearest =
                  getNearestRoutePoint(
                    {
                      latitude,
                      longitude,
                    },
                    points
                  );

                return {
                  routeIndex: nearest.index,
                  location: stepLocation,
                  name: step.name ?? "",
                  type:
                    step.maneuver?.type ??
                    "continue",
                  modifier:
                    step.maneuver?.modifier,
                  distance:
                    step.distance ?? 0,
                  duration:
                    step.duration ?? 0,
                };
              }
            );

          if (cancelled) return;

          setRoutePoints(points);
          setNavigationSteps(steps);

          setRouteDistanceKm(
            route.distance / 1000
          );

          setRouteDurationSeconds(
            route.duration
          );

          const initialNearest =
            getNearestRoutePoint(
             routeStartLocation,
              points
            );

          setDistanceFromRouteMeters(
            initialNearest.distanceMeters
          );

          setRemainingRouteDistanceKm(
            getRouteDistanceFromIndex(
              points,
              initialNearest.index
            ) / 1000
          );

          const firstUpcomingStep =
            steps.find(
              (step) =>
                step.type !== "depart" &&
                step.routeIndex >
                  initialNearest.index + 2
            ) ??
            steps.find(
              (step) =>
                step.type !== "depart" &&
                step.routeIndex >=
                  initialNearest.index
            );

          if (firstUpcomingStep) {
            const firstStepIndex =
              steps.indexOf(firstUpcomingStep);

            setActiveNavigationStep(firstUpcomingStep);
            setFollowingNavigationStep(
              firstStepIndex >= 0
                ? steps[firstStepIndex + 1] ?? null
                : null
            );

            setNextInstruction(
              getManeuverInstruction(
                firstUpcomingStep
              )
            );

            setNextInstructionDistance(
              getRouteDistanceFromIndex(
                points,
                initialNearest.index
              ) -
                getRouteDistanceFromIndex(
                  points,
                  firstUpcomingStep.routeIndex
                )
            );
          } else {
            setActiveNavigationStep(null);
            setFollowingNavigationStep(null);
            setNextInstruction(
              "Follow the route"
            );
            setNextInstructionDistance(null);
          }
        } catch (error) {
          console.error(
            "Protected Journey routing error:",
            error
          );

          if (!cancelled) {
            setRouteError(true);
            setRoutePoints([]);
            setNavigationSteps([]);
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
  routeStartLocation,
  destinationLatitude,
  destinationLongitude,
  travelMode,
]);

  /*
   * Update navigation from the live GPS position without
   * requesting a new route on every GPS tick.
   */
  useEffect(() => {
    if (
      !currentLocation ||
      routePoints.length < 2
    ) {
      return;
    }

    const nearest =
      getNearestRoutePoint(
        currentLocation,
        routePoints
      );

    const effectiveIndex = Math.max(
      routeProgressIndexRef.current,
      nearest.index
    );

    if (effectiveIndex !== routeProgressIndexRef.current) {
      routeProgressIndexRef.current = effectiveIndex;
      setRouteProgressIndex(effectiveIndex);
    }

    const remainingMeters =
      getRouteDistanceFromIndex(
        routePoints,
        effectiveIndex
      );

    setDistanceFromRouteMeters(
      nearest.distanceMeters
    );

    setRemainingRouteDistanceKm(
      remainingMeters / 1000
    );

    const upcomingStep =
      navigationSteps.find(
        (step) =>
          step.type !== "depart" &&
          step.routeIndex >
            nearest.index + 2
      ) ??
      navigationSteps.find(
        (step) =>
          step.type !== "depart" &&
          step.routeIndex >=
            nearest.index
      );

    if (!upcomingStep) {
      setActiveNavigationStep(null);
      setFollowingNavigationStep(null);
      setNextInstruction(
        remainingMeters < 40
          ? "You have arrived"
          : "Follow the route"
      );
      setNextInstructionDistance(
        remainingMeters < 40
          ? 0
          : null
      );
      return;
    }

    const maneuverDistance =
      Math.max(
        0,
        remainingMeters -
          getRouteDistanceFromIndex(
            routePoints,
            upcomingStep.routeIndex
          )
      );

    const upcomingStepIndex =
      navigationSteps.indexOf(upcomingStep);

    setActiveNavigationStep(upcomingStep);
    setFollowingNavigationStep(
      upcomingStepIndex >= 0
        ? navigationSteps[upcomingStepIndex + 1] ?? null
        : null
    );

    setNextInstruction(
      getManeuverInstruction(
        upcomingStep
      )
    );

    setNextInstructionDistance(
      maneuverDistance
    );
  }, [
    currentLocation,
    routePoints,
    navigationSteps,
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

        <FollowUserMap
  location={currentLocation}
  enabled={isFollowing && routePoints.length > 1}
/>

<MapInteractionController
  onUserInteraction={() => setIsFollowing(false)}
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

        {/* Navigation route: completed section + remaining section */}
        {routePoints.length > 1 && (
          <>
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#0F1E1E",
                weight: 12,
                opacity: 0.45,
                lineCap: "round",
                lineJoin: "round",
              }}
            />

            {routeProgressIndex > 0 && (
              <Polyline
                positions={routePoints.slice(0, routeProgressIndex + 1)}
                pathOptions={{
                  color: "#64748B",
                  weight: 7,
                  opacity: 0.65,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
            )}

            <Polyline
              positions={routePoints.slice(
                Math.max(0, routeProgressIndex),
                routePoints.length
              )}
              pathOptions={{
                color: "#2563EB",
                weight: 7,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
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
          WAZE / GOOGLE-STYLE NAVIGATION BANNER
          ================================================= */}

      <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
        {loadingRoute ? (
          <div className="rounded-[24px] bg-[#0F6666]/96 backdrop-blur-xl border border-white/10 px-4 py-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Navigation className="h-7 w-7 text-white animate-pulse" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Calculating route…</p>
                <p className="mt-0.5 text-xs text-white/70">CitySense Protected Journey</p>
              </div>
            </div>
          </div>
        ) : routeError ? (
          <div className="rounded-[24px] bg-[#5F1F1F]/96 backdrop-blur-xl border border-red-300/20 px-4 py-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-lg font-black text-white">Route unavailable</p>
                <p className="mt-0.5 text-xs text-white/70">GPS monitoring remains active</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] bg-[#0F6666]/97 backdrop-blur-xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <span className="text-[38px] leading-none font-black text-white">
                  {getManeuverSymbol(activeNavigationStep)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[25px] leading-7 font-black tracking-tight text-white truncate">
                    {activeNavigationStep
                      ? getManeuverHeadline(activeNavigationStep)
                      : nextInstruction}
                  </p>
                </div>

                {activeNavigationStep?.name && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border-2 px-2 py-0.5 text-[15px] font-black leading-none shadow-sm ${getRoadShieldClass(activeNavigationStep.name)}`}
                    >
                      {activeNavigationStep.name}
                    </span>
                  </div>
                )}

                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-white">
                  <span className="text-[19px] font-black">
                    {formatDistance(nextInstructionDistance)}
                  </span>
                  {followingNavigationStep?.name && (
                    <>
                      <span className="text-sm text-white/70">to</span>
                      <span
                        className={`inline-flex items-center rounded-md border-2 px-1.5 py-0.5 text-[12px] font-black leading-none ${getRoadShieldClass(followingNavigationStep.name)}`}
                      >
                        {followingNavigationStep.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white">
                <span className="text-2xl text-[#2563EB]">✦</span>
              </div>
            </div>

            <div className="h-1 bg-black/15">
              <div
                className="h-full bg-white/55 transition-all duration-500"
                style={{
                  width: `${
                    routeDistanceKm && remainingDistance !== null
                      ? Math.min(100, Math.max(0, (remainingDistance / routeDistanceKm) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        )}
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
  setIsFollowing(true);

  window.dispatchEvent(
    new Event("citysense-recenter")
  );
}}
        className="absolute right-4 bottom-[214px] z-[1000] w-12 h-12 rounded-2xl bg-[#0F1E1E]/94 backdrop-blur-xl border border-[#2D5A5860] flex items-center justify-center shadow-xl"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-[#4ADE80]" />
      </button>

      {/* =================================================
          WAZE / GOOGLE-STYLE BOTTOM NAVIGATION PANEL
          ================================================= */}

{showNavigationOptions && (
  <div className="absolute bottom-[205px] right-4 z-[1100] w-[250px] rounded-2xl border border-slate-200 bg-white p-3 text-[#0F1E1E] shadow-2xl">
    <p className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
      Navigation
    </p>

    <button
      type="button"
      onClick={() => {
        setIsFollowing(true);
        setShowNavigationOptions(false);

        window.dispatchEvent(
          new Event("citysense-recenter")
        );
      }}
      className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-slate-100"
    >
      📍 Recenter on me
    </button>

    <button
      type="button"
      onClick={() => {
        setShowNavigationOptions(false);

        if (routePoints.length > 1) {
          window.dispatchEvent(
            new Event("citysense-route-overview")
          );
        }
      }}
      className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-slate-100"
    >
      🗺️ Route overview
    </button>

    <button
      type="button"
      onClick={() =>
        setShowNavigationOptions(false)
      }
      className="w-full rounded-xl px-3 py-3 text-left text-sm font-bold hover:bg-slate-100"
    >
      Close
    </button>
  </div>
)}
      <div className="absolute bottom-0 left-0 right-0 z-[1000]">
        <div className="rounded-t-[28px] bg-white/96 text-[#0F1E1E] backdrop-blur-xl border-t border-black/10 px-4 pt-3 pb-3 shadow-[0_-8px_30px_rgba(0,0,0,.22)]">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-300" />

          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className={`text-[46px] leading-none font-black tracking-tight ${distanceFromRouteMeters !== null && distanceFromRouteMeters > 40 ? "text-red-600" : "text-[#16A34A]"}`}>
                  {etaMinutes ? `${etaMinutes} min` : "—"}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2 text-slate-500">
                <span className="text-[18px] font-semibold">
                  {remainingDistance !== null
                    ? `${remainingDistance.toFixed(1)} km`
                    : "—"}
                </span>
                <span>•</span>
                <span className="text-[18px] font-semibold">
                  {etaMinutes
                    ? new Date(Date.now() + etaMinutes * 60 * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event("citysense-recenter"));
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 shadow-sm"
                aria-label="Recenter navigation"
              >
                <LocateFixed className="h-5 w-5 text-[#0F6666]" />
              </button>

              <button
  type="button"
  onClick={() =>
    setShowNavigationOptions((value) => !value)
  }
  className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 border border-slate-200 shadow-sm"
  aria-label="Navigation options"
>
  <Navigation className="h-5 w-5 text-[#0F6666]" />
</button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#16A34A]" />
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-500">
                CitySense Protected Journey
              </p>
              <p className="truncate text-xs font-bold text-slate-800">
                {distanceFromRouteMeters !== null && distanceFromRouteMeters > 40
                  ? `Off route • ${distanceFromRouteMeters.toFixed(0)} m away`
                  : `Navigating to ${destination}`}
              </p>
            </div>

            {safetyAssessments.length > 0 && (
              <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-500 px-2 text-[10px] font-black text-white">
                {safetyAssessments.length}
              </div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCheckedIn(true)}
              className="rounded-2xl bg-[#4ADE80] py-2.5 text-sm font-black text-[#0F1E1E]"
            >
              {checkedIn ? "You're Checked In ✓" : "I'm OK"}
            </button>

            <button
              type="button"
              onClick={onEndJourney}
              className="rounded-2xl bg-slate-100 border border-slate-200 py-2.5 text-sm font-black text-slate-800"
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