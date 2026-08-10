import { useEffect, useMemo, useRef, useState } from "react";
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
  Volume2,
  VolumeX,
  X,
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
  distance: number;
  duration: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number];
  };
};

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
      {
        animate: true,
      }
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
      padding: [40, 40],
    });
  }, [points, map]);

  return null;
}

function RecenterController({
  location,
}: {
  location: LocationPoint | null;
}) {
  const map = useMap();

  useEffect(() => {
    const handleRecenter = () => {
      if (!location) return;

      map.flyTo(
        [location.latitude, location.longitude],
        17,
        {
          animate: true,
          duration: 0.7,
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

    default:
      return "Travel";
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

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  return (
    getDistanceKm(
      lat1,
      lng1,
      lat2,
      lng2
    ) * 1000
  );
}

function formatDistance(
  meters: number | null
) {
  if (meters === null) return "—";

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.max(
    1,
    Math.round(meters)
  )} m`;
}

function getManeuverText(
  step: NavigationStep | undefined
) {
  if (!step?.maneuver) {
    return "Continue on the route";
  }

  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier;

  if (type === "arrive") {
    return "You are arriving";
  }

  if (type === "depart") {
    return "Start your journey";
  }

  if (type === "roundabout") {
    return "Enter the roundabout";
  }

  if (type === "merge") {
    return "Merge";
  }

  if (type === "fork") {
    if (modifier?.includes("left")) {
      return "Keep left at the fork";
    }

    if (modifier?.includes("right")) {
      return "Keep right at the fork";
    }

    return "Follow the fork";
  }

  if (type === "continue") {
    if (modifier?.includes("left")) {
      return "Keep left";
    }

    if (modifier?.includes("right")) {
      return "Keep right";
    }

    return "Continue straight";
  }

  if (type === "turn") {
    switch (modifier) {
      case "left":
        return "Turn left";

      case "right":
        return "Turn right";

      case "slight left":
        return "Turn slightly left";

      case "slight right":
        return "Turn slightly right";

      case "sharp left":
        return "Turn sharply left";

      case "sharp right":
        return "Turn sharply right";

      default:
        return "Turn";
    }
  }

  return "Continue on the route";
}

function getManeuverIcon(
  step: NavigationStep | undefined
) {
  if (!step?.maneuver) {
    return "↑";
  }

  const type = step.maneuver.type;
  const modifier =
    step.maneuver.modifier;

  if (type === "arrive") return "🏁";
  if (type === "depart") return "🚀";
  if (type === "roundabout") return "⟳";

  if (modifier?.includes("left")) {
    return "↰";
  }

  if (modifier?.includes("right")) {
    return "↱";
  }

  return "↑";
}

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

  const [routeDurationSeconds, setRouteDurationSeconds] =
    useState<number | null>(null);

  const [loadingRoute, setLoadingRoute] =
    useState(true);

  const [routeError, setRouteError] =
    useState(false);

  const [checkedIn, setCheckedIn] =
    useState(false);

  const [voiceEnabled, setVoiceEnabled] =
    useState(true);

  const [navigationSteps, setNavigationSteps] =
    useState<NavigationStep[]>([]);

  const [currentStepIndex, setCurrentStepIndex] =
    useState(0);

  const [nextInstruction, setNextInstruction] =
    useState("Follow the route");

  const [nextInstructionDistance, setNextInstructionDistance] =
    useState<number | null>(null);

  const lastSpokenStep =
    useRef<number>(-1);

  const travelLabel = useMemo(
    () => getTravelLabel(travelMode),
    [travelMode]
  );

  /*
   * Straight-line distance to destination.
   */
  const remainingDistance = currentLocation
    ? getDistanceKm(
        currentLocation.latitude,
        currentLocation.longitude,
        destinationLatitude,
        destinationLongitude
      )
    : null;

  /*
   * Approximate live ETA based on remaining
   * distance and original route duration.
   */
  const etaMinutes =
    routeDurationSeconds !== null &&
    routeDistanceKm !== null &&
    routeDistanceKm > 0 &&
    remainingDistance !== null
      ? Math.max(
          1,
          Math.ceil(
            (routeDurationSeconds *
              (remainingDistance /
                routeDistanceKm)) /
              60
          )
        )
      : null;

  const currentStep =
    navigationSteps[currentStepIndex];

  /*
   * Distance from the user to the next maneuver.
   */
  const currentStepDistance =
    currentLocation &&
    currentStep?.maneuver?.location
      ? getDistanceMeters(
          currentLocation.latitude,
          currentLocation.longitude,
          currentStep.maneuver.location[1],
          currentStep.maneuver.location[0]
        )
      : null;

  /*
   * Voice helper.
   */
  const speakNavigation = (
    message: string
  ) => {
    if (!voiceEnabled) return;

    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        message
      );

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(
      utterance
    );
  };

  /*
   * Route calculation.
   */
  useEffect(() => {
    if (!currentLocation) return;

    const profile =
      getRouteProfile(travelMode);

    /*
     * We don't fake public transport
     * routing.
     */
    if (!profile) {
      setLoadingRoute(false);
      setRoutePoints([]);
      setNavigationSteps([]);
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

          const steps =
            (route?.legs?.[0]
              ?.steps ??
              []) as NavigationStep[];

          if (cancelled) return;

          setRoutePoints(points);
          setNavigationSteps(steps);
          setCurrentStepIndex(0);

          setRouteDistanceKm(
            route.distance / 1000
          );

          setRouteDurationSeconds(
            route.duration
          );

          /*
           * First navigation instruction.
           */
          const firstStep = steps[0];

          if (firstStep) {
            const instruction =
              getManeuverText(
                firstStep
              );

            const roadName =
              firstStep.name
                ? ` onto ${firstStep.name}`
                : "";

            setNextInstruction(
              `${instruction}${roadName}`
            );

            setNextInstructionDistance(
              firstStep.distance
            );
          } else {
            setNextInstruction(
              "Follow the route"
            );

            setNextInstructionDistance(
              null
            );
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
    currentLocation,
    destinationLatitude,
    destinationLongitude,
    travelMode,
  ]);

  /*
   * Update next instruction as the user
   * approaches each maneuver.
   */
  useEffect(() => {
    if (
      !currentStep ||
      currentStepDistance === null
    ) {
      return;
    }

    /*
     * Once within 35m of the maneuver,
     * advance to the next navigation step.
     */
    if (
      currentStepDistance <= 35 &&
      currentStepIndex <
        navigationSteps.length - 1
    ) {
      const nextIndex =
        currentStepIndex + 1;

      const nextStep =
        navigationSteps[nextIndex];

      setCurrentStepIndex(
        nextIndex
      );

      if (nextStep) {
        const instruction =
          getManeuverText(
            nextStep
          );

        const roadName =
          nextStep.name
            ? ` onto ${nextStep.name}`
            : "";

        setNextInstruction(
          `${instruction}${roadName}`
        );

        setNextInstructionDistance(
          nextStep.distance
        );
      }
    }
  }, [
    currentStep,
    currentStepDistance,
    currentStepIndex,
    navigationSteps,
  ]);

  /*
   * Voice announcement.
   */
  useEffect(() => {
    if (
      !voiceEnabled ||
      !currentStep ||
      currentStepDistance === null
    ) {
      return;
    }

    /*
     * Don't repeat the same step.
     */
    if (
      lastSpokenStep.current ===
      currentStepIndex
    ) {
      return;
    }

    /*
     * Announce important maneuvers
     * within 500m.
     */
    if (
      currentStepDistance <= 500
    ) {
      const instruction =
        getManeuverText(
          currentStep
        );

      const roadName =
        currentStep.name
          ? ` onto ${currentStep.name}`
          : "";

      speakNavigation(
        `${instruction}${roadName} in ${formatDistance(
          currentStepDistance
        )}.`
      );

      lastSpokenStep.current =
        currentStepIndex;
    }
  }, [
    voiceEnabled,
    currentStep,
    currentStepDistance,
    currentStepIndex,
  ]);

  /*
   * Stop speech when this component unmounts.
   */
  useEffect(() => {
    return () => {
      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /*
   * Wait for GPS.
   */
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
            CitySense is waiting for your
            GPS position.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0F1E1E] text-white">
      {/* =========================
          MAP
      ========================== */}

      <MapContainer
        center={[
          currentLocation.latitude,
          currentLocation.longitude,
        ]}
        zoom={16}
        zoomControl={false}
        className="absolute inset-0 z-0 h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FollowUser
          location={currentLocation}
        />

        <RecenterController
          location={currentLocation}
        />

        {routePoints.length > 1 && (
          <FitRoute
            points={routePoints}
          />
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

      {/* =========================
          TOP BAR
      ========================== */}

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

            <button
              type="button"
              onClick={() => {
                setVoiceEnabled(
                  (value) => !value
                );

                if (
                  voiceEnabled &&
                  "speechSynthesis" in
                    window
                ) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                voiceEnabled
                  ? "bg-[#4ADE8020] border-[#4ADE8040] text-[#4ADE80]"
                  : "bg-white/5 border-white/10 text-[#7BA3A1]"
              }`}
              aria-label={
                voiceEnabled
                  ? "Turn voice off"
                  : "Turn voice on"
              }
            >
              {voiceEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" />

              <span className="text-xs font-bold text-[#4ADE80]">
                LIVE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          NEXT TURN
      ========================== */}

      <div className="absolute top-[132px] left-4 right-4 z-[1000]">
        <div className="rounded-3xl bg-[#0F1E1E]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          {loadingRoute ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-3 h-3 rounded-full bg-[#E8A838] animate-pulse" />

              <div>
                <p className="text-sm font-bold">
                  Calculating navigation…
                </p>

                <p className="text-xs text-[#7BA3A1] mt-1">
                  Finding the best route to your destination.
                </p>
              </div>
            </div>
          ) : routeError ? (
            <div className="px-4 py-4">
              <p className="text-sm font-bold text-[#FBBF24]">
                Route unavailable
              </p>

              <p className="text-xs text-[#7BA3A1] mt-1">
                Your live location is still being monitored.
              </p>
            </div>
          ) : travelMode ===
            "public_transport" ? (
            <div className="px-4 py-4">
              <p className="text-sm font-bold">
                Public transport selected
              </p>

              <p className="text-xs text-[#7BA3A1] mt-1">
                Live map active. Transit routing will be connected separately.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-4 py-4">
              <div className="w-14 h-14 rounded-2xl bg-[#4ADE8015] border border-[#4ADE8030] flex items-center justify-center shrink-0">
                <span className="text-3xl text-[#4ADE80]">
                  {getManeuverIcon(
                    currentStep
                  )}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#7BA3A1]">
                  NEXT TURN
                </p>

                <p className="text-lg font-black truncate mt-1">
                  {nextInstruction}
                </p>

                {currentStep?.name && (
                  <p className="text-xs text-[#7BA3A1] truncate mt-1">
                    {currentStep.name}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-black text-[#4ADE80]">
                  {formatDistance(
                    currentStepDistance ??
                      nextInstructionDistance
                  )}
                </p>

                <p className="text-[9px] uppercase text-[#7BA3A1]">
                  ahead
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          RECENTER
      ========================== */}

      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new Event(
              "citysense-recenter"
            )
          )
        }
        className="absolute right-4 bottom-[300px] z-[1000] w-12 h-12 rounded-2xl bg-[#0F1E1E]/95 backdrop-blur-xl border border-[#2D5A5860] flex items-center justify-center shadow-xl"
        aria-label="Recenter map"
      >
        <LocateFixed className="w-5 h-5 text-[#4ADE80]" />
      </button>

      {/* =========================
          BOTTOM NAVIGATION PANEL
      ========================== */}

      <div className="absolute bottom-0 left-0 right-0 z-[1000] max-h-[44vh] overflow-y-auto">
        <div className="rounded-t-[32px] bg-[#0F1E1E]/98 backdrop-blur-xl border-t border-[#4ADE8030] px-5 pt-4 pb-6 shadow-2xl">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />

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

            <div className="text-right">
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-2xl bg-[#1A2E2D] p-3">
              <p className="text-[10px] text-[#7BA3A1]">
                REMAINING
              </p>

              <p className="font-black text-[#4ADE80] mt-1">
                {remainingDistance !==
                null
                  ? `${remainingDistance.toFixed(
                      1
                    )} km`
                  : "—"}
              </p>
            </div>

            <div className="rounded-2xl bg-[#1A2E2D] p-3">
              <p className="text-[10px] text-[#7BA3A1]">
                ETA
              </p>

              <p className="font-black mt-1">
                {etaMinutes
                  ? `${etaMinutes} min`
                  : "—"}
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

          {/* Navigation status */}
          {!loadingRoute &&
            !routeError &&
            travelMode !==
              "public_transport" &&
            currentStep && (
              <div className="mb-4 rounded-2xl bg-[#162928] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl text-[#4ADE80]">
                    {getManeuverIcon(
                      currentStep
                    )}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">
                      {nextInstruction}
                    </p>

                    <p className="text-[10px] text-[#7BA3A1] mt-1">
                      {formatDistance(
                        currentStepDistance ??
                          nextInstructionDistance
                      )}{" "}
                      ahead
                    </p>
                  </div>

                  {voiceEnabled && (
                    <Volume2 className="w-4 h-4 text-[#4ADE80]" />
                  )}
                </div>
              </div>
            )}

          {/* Check in */}
          <button
            type="button"
            onClick={() => {
              setCheckedIn(true);

              speakNavigation(
                "Check-in confirmed. You are safe."
              );
            }}
            className="w-full rounded-2xl bg-[#4ADE80] text-[#0F1E1E] py-4 font-black flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />

            {checkedIn
              ? "You're Checked In ✓"
              : "I'm OK"}
          </button>

          {/* Emergency + end */}
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
              className="rounded-2xl bg-[#1A2E2D] border border-[#2D5A58] text-[#F5F3EF] py-3.5 font-bold flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />

              End Journey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}