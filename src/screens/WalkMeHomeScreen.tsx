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
  auth,
  db,
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "@/lib/firebase";

import "leaflet/dist/leaflet.css";

interface WalkMeHomeScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface JourneyPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
}

type RoutePoint = [number, number];

type MovementMode =
  | "walking"
  | "cycling"
  | "car"
  | "bus"
  | "train"
  | "stopped";

interface NavigationStep {
  distance: number;
  duration: number;
  name?: string;
  maneuver?: {
    type?: string;
    modifier?: string;
    location?: [number, number];
  };
}

function SafeJourneyMapController({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], Math.max(map.getZoom(), 16), {
      animate: true,
    });
  }, [latitude, longitude, map]);

  return null;
}

function MapRecenterButton({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  return (
    <button
      type="button"
      onClick={() => {
        map.flyTo([latitude, longitude], 17, {
          animate: true,
          duration: 0.8,
        });
      }}
      className="absolute bottom-4 right-4 z-[1000] h-12 w-12 rounded-full border border-white/10 bg-[#0F1E1E]/95 text-white shadow-xl backdrop-blur-md"
      aria-label="Recenter map"
    >
      ◎
    </button>
  );
}

const journeyUserIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:22px;
      height:22px;
      border-radius:50%;
      background:#3B82F6;
      border:4px solid white;
      box-shadow:0 0 0 8px rgba(59,130,246,0.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const journeyDestinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      font-size:30px;
      transform:translate(-4px,-22px);
    ">📍</div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => getDistanceKm(lat1, lon1, lat2, lon2) * 1000;

const formatDistance = (meters: number | null) => {
  if (meters === null) return "—";

  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.max(1, Math.round(meters))} m`;
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null) return "—";

  const minutes = Math.max(1, Math.ceil(seconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
};

const getManeuverText = (step: NavigationStep | undefined) => {
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
    if (modifier?.includes("left")) return "Keep left at the fork";
    if (modifier?.includes("right")) return "Keep right at the fork";
    return "Follow the fork";
  }

  if (type === "continue") {
    if (modifier?.includes("left")) return "Keep left";
    if (modifier?.includes("right")) return "Keep right";
    return "Continue straight";
  }

  if (type === "turn") {
    if (modifier === "left") return "Turn left";
    if (modifier === "right") return "Turn right";
    if (modifier === "slight left") return "Turn slightly left";
    if (modifier === "slight right") return "Turn slightly right";
    if (modifier === "sharp left") return "Turn sharply left";
    if (modifier === "sharp right") return "Turn sharply right";

    return "Turn";
  }

  return "Continue on the route";
};

const getManeuverIcon = (step: NavigationStep | undefined) => {
  if (!step?.maneuver) return "↑";

  const type = step.maneuver.type;
  const modifier = step.maneuver.modifier;

  if (type === "arrive") return "🏁";
  if (type === "depart") return "🚀";
  if (type === "roundabout") return "⟳";

  if (modifier?.includes("left")) return "↰";
  if (modifier?.includes("right")) return "↱";

  return "↑";
};

export default function WalkMeHomeScreen({
  onBack,
}: WalkMeHomeScreenProps) {
  const [destination, setDestination] = useState("");
  const [walkStarted, setWalkStarted] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);

  const [timeLeft, setTimeLeft] = useState(300);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);

  const [addressSuggestions, setAddressSuggestions] = useState<
    AddressSuggestion[]
  >([]);

  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isRouting, setIsRouting] = useState(false);

  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>(
    []
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationSeconds, setRouteDurationSeconds] = useState<
    number | null
  >(null);

  const [journeyPoints, setJourneyPoints] = useState<JourneyPoint[]>([]);
  const [journeySeconds, setJourneySeconds] = useState(0);
  const [distanceTravelled, setDistanceTravelled] = useState(0);

  const [movementMode, setMovementMode] =
    useState<MovementMode>("stopped");

  const [, setMovementConfidence] = useState(0);

  const [journeyStatus, setJourneyStatus] = useState("Waiting");
 const [, setJourneyEvents] = useState<
  { time: string; event: string }[]
>([]);
  const [lastGpsTimestamp, setLastGpsTimestamp] = useState<number | null>(
    null
  );

  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);

  const [arrived, setArrived] = useState(false);

  const [riskLevel, setRiskLevel] =
    useState<"Low" | "Medium" | "High">("Low");

  const [guardianMessage, setGuardianMessage] = useState(
    "Journey looks normal."
  );

 const [routeDeviation] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const addressSearchTimerRef = useRef<number | null>(null);
  const speedSamplesRef = useRef<number[]>([]);
  const arrivalSamplesRef = useRef(0);
  const trainEvidenceRef = useRef(0);

  const lastSpokenStepRef = useRef<number>(-1);

  const addJourneyEvent = (event: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setJourneyEvents((previous) => [
      ...previous,
      { time, event },
    ]);
  };

  const speakNavigation = (message: string) => {
    if (!voiceEnabled) return;

    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);

    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  };

  const searchAddresses = (query: string) => {
    setDestination(query);
    setDestinationLat(null);
    setDestinationLng(null);
    setAddressSuggestions([]);

    if (addressSearchTimerRef.current !== null) {
      window.clearTimeout(addressSearchTimerRef.current);
    }

    if (query.trim().length < 3) return;

    addressSearchTimerRef.current = window.setTimeout(async () => {
      setIsSearchingAddress(true);

      try {
        const params = new URLSearchParams({
          q: query.trim(),
          format: "jsonv2",
          addressdetails: "1",
          limit: "6",
          countrycodes: "be,nl,fr,de,lu",
        });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Address search failed: ${response.status}`);
        }

        const results = (await response.json()) as AddressSuggestion[];

        setAddressSuggestions(results);
      } catch (error) {
        console.error("Address search error:", error);
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 450);
  };

  const calculateRoute = async (
    latitude: number,
    longitude: number
  ) => {
    if (!userLocation) {
      alert("Current GPS location is not available yet.");
      return false;
    }

    setIsRouting(true);

    try {
      /*
       * OSRM driving profile.
       *
       * This replaces the previous routed-foot endpoint that was
       * being used with a driving route profile.
       */
      const routeUrl =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userLocation.longitude},${userLocation.latitude};` +
        `${longitude},${latitude}` +
        `?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(routeUrl);

      if (!response.ok) {
        throw new Error(`Route request failed: ${response.status}`);
      }

      const data = await response.json();

      const route = data?.routes?.[0];

      if (!route) {
        alert("No route could be found to this destination.");
        return false;
      }

      const points: RoutePoint[] =
        route.geometry.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

      const steps =
        (route.legs?.[0]?.steps ?? []) as NavigationStep[];

      setRoutePoints(points);
      setNavigationSteps(steps);
      setCurrentStepIndex(0);

      setRouteDistanceKm(route.distance / 1000);
      setRouteDurationSeconds(route.duration);

      setJourneyStatus("Route Ready");

      if (steps.length > 0) {
        const firstStep = steps[0];

        setGuardianMessage(
          `${getManeuverText(firstStep)}${
            firstStep.name ? ` onto ${firstStep.name}` : ""
          }`
        );
      }

      return true;
    } catch (error) {
      console.error("Routing error:", error);

      alert(
        "CitySense could not calculate the route. Please try again."
      );

      return false;
    } finally {
      setIsRouting(false);
    }
  };

  const selectDestination = async (place: AddressSuggestion) => {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    setDestination(place.display_name);
    setDestinationLat(latitude);
    setDestinationLng(longitude);
    setAddressSuggestions([]);

    await calculateRoute(latitude, longitude);
  };

  const resolveDestinationAndRoute = async () => {
    if (!destination.trim()) {
      alert("Please enter your destination first.");
      return false;
    }

    if (!userLocation) {
      alert(
        "Waiting for your current GPS location. Please try again in a moment."
      );
      return false;
    }

    if (
      destinationLat !== null &&
      destinationLng !== null
    ) {
      return calculateRoute(destinationLat, destinationLng);
    }

    setIsSearchingAddress(true);

    try {
      const params = new URLSearchParams({
        q: destination.trim(),
        format: "jsonv2",
        addressdetails: "1",
        limit: "1",
        countrycodes: "be,nl,fr,de,lu",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Address search failed: ${response.status}`);
      }

      const results = (await response.json()) as AddressSuggestion[];

      const place = results[0];

      if (!place) {
        alert(
          "Address not found. Try adding the city or postcode."
        );
        return false;
      }

      const latitude = Number(place.lat);
      const longitude = Number(place.lon);

      setDestination(place.display_name);
      setDestinationLat(latitude);
      setDestinationLng(longitude);

      setAddressSuggestions([]);

      return calculateRoute(latitude, longitude);
    } catch (error) {
      console.error("Destination lookup error:", error);

      alert(
        "CitySense could not search for that address. Please try again."
      );

      return false;
    } finally {
      setIsSearchingAddress(false);
    }
  };

  /*
   * Initial GPS position.
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setLastGpsTimestamp(Date.now());
      },
      (error) => {
        console.error("Initial GPS error:", error);
        alert(
          "Unable to determine your current location. Please enable location access."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );
  }, []);

  /*
   * Live GPS tracking.
   */
  useEffect(() => {
    if (!walkStarted) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const speed = position.coords.speed;

        setUserLocation({
          latitude,
          longitude,
        });

        setLastGpsTimestamp(Date.now());

        const newPoint: JourneyPoint = {
          latitude,
          longitude,
          timestamp: Date.now(),
          speed,
        };

        setJourneyPoints((previousPoints) => {
          const lastPoint =
            previousPoints[previousPoints.length - 1];

          if (lastPoint) {
            const segmentDistance = getDistanceKm(
              lastPoint.latitude,
              lastPoint.longitude,
              latitude,
              longitude
            );

            /*
             * Ignore GPS jumps larger than 500m.
             */
            if (segmentDistance < 0.5) {
              setDistanceTravelled(
                (previousDistance) =>
                  previousDistance + segmentDistance
              );
            }
          }

          return [
            ...previousPoints.slice(-199),
            newPoint,
          ];
        });

        const speedKmh =
          speed !== null && speed >= 0
            ? speed * 3.6
            : null;

        if (speedKmh !== null) {
          speedSamplesRef.current = [
            ...speedSamplesRef.current.slice(-5),
            speedKmh,
          ];

          const samples = speedSamplesRef.current;

          const averageSpeed =
            samples.reduce(
              (total, value) => total + value,
              0
            ) / samples.length;

          const maxSpeed = Math.max(...samples);

          const trainEvidence =
            averageSpeed >= 45 && maxSpeed >= 60;

          if (trainEvidence) {
            trainEvidenceRef.current = Math.min(
              5,
              trainEvidenceRef.current + 1
            );
          } else {
            trainEvidenceRef.current = Math.max(
              0,
              trainEvidenceRef.current - 1
            );
          }

          if (trainEvidenceRef.current >= 3) {
            setMovementMode("train");
            setMovementConfidence(90);
          } else if (
            averageSpeed < 1.5 &&
            maxSpeed < 3
          ) {
            setMovementMode("stopped");
            setMovementConfidence(92);
          } else if (
            averageSpeed < 9 &&
            maxSpeed < 14
          ) {
            setMovementMode("walking");
            setMovementConfidence(86);
          } else if (
            averageSpeed < 22 &&
            maxSpeed < 32
          ) {
            setMovementMode("cycling");
            setMovementConfidence(72);
          } else if (averageSpeed < 70) {
            setMovementMode("car");
            setMovementConfidence(80);
          } else {
            setMovementMode("bus");
            setMovementConfidence(75);
          }
        }

        /*
         * Update Firestore journey.
         */
        if (journeyId) {
          try {
            await updateDoc(
              doc(db, "journeys", journeyId),
              {
                currentLat: latitude,
                currentLng: longitude,
                movementMode,
                distanceTravelledKm:
                  distanceTravelled,
                distanceRemainingKm:
                  routeDistanceKm !== null
                    ? Math.max(
                        0,
                        routeDistanceKm -
                          distanceTravelled
                      )
                    : null,
                lastUpdated: serverTimestamp(),
              }
            );
          } catch (error) {
            console.error(
              "Journey location update failed:",
              error
            );
          }
        }
      },
      (error) => {
        console.error("Live GPS error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    walkStarted,
    journeyId,
    movementMode,
    distanceTravelled,
    routeDistanceKm,
  ]);

  /*
   * Journey timer.
   */
  useEffect(() => {
    if (!walkStarted) return;

    const timer = window.setInterval(() => {
      setJourneySeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [walkStarted]);

  /*
   * Load trusted contacts.
   */
  useEffect(() => {
    const loadContacts = async () => {
      const user = auth.currentUser;

      if (!user) return;

      try {
        const contactsRef = collection(
          db,
          "users",
          user.uid,
          "trustedContacts"
        );

        const snapshot = await getDocs(contactsRef);

        const loadedContacts: TrustedContact[] =
          snapshot.docs.map((contactDoc) => ({
            id: contactDoc.id,
            ...(contactDoc.data() as Omit<
              TrustedContact,
              "id"
            >),
          }));

        setContacts(loadedContacts);
      } catch (error) {
        console.error(
          "Failed to load trusted contacts:",
          error
        );
      }
    };

    void loadContacts();
  }, []);

  /*
   * Safety timer.
   */
  useEffect(() => {
    if (!walkStarted || emergencyTriggered) return;

    if (timeLeft <= 0) {
      const triggerEmergency = async () => {
        setEmergencyTriggered(true);
        setRiskLevel("High");
        setGuardianMessage(
          "Safety check-in expired. Emergency escalation started."
        );

        const user = auth.currentUser;

        if (!user) return;

        try {
          const alertRef = await addDoc(
            collection(db, "emergencyAlerts"),
            {
              userId: user.uid,
              latitude: userLocation?.latitude ?? null,
              longitude: userLocation?.longitude ?? null,
              destinationLat,
              destinationLng,
              destination,
              type: "walk_me_home",
              severity: "high",
              status: "active",
              contactCount: contacts.length,
              createdAt: serverTimestamp(),
            }
          );

          setAlertId(alertRef.id);

          addJourneyEvent(
            "🚨 Safety timer expired — emergency escalation"
          );

          speakNavigation(
            "Your safety check-in has expired. Emergency escalation has started."
          );
        } catch (error) {
          console.error(
            "Emergency alert creation failed:",
            error
          );
        }
      };

      void triggerEmergency();
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeLeft((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [
    walkStarted,
    timeLeft,
    emergencyTriggered,
    userLocation,
    destinationLat,
    destinationLng,
    destination,
    contacts.length,
  ]);

  /*
   * Current navigation step.
   */
  const currentStep = navigationSteps[currentStepIndex];

  const currentStepDistance = useMemo(() => {
    if (
      !currentStep ||
      !userLocation ||
      !currentStep.maneuver?.location
    ) {
      return null;
    }

    const [stepLng, stepLat] =
      currentStep.maneuver.location;

    return getDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      stepLat,
      stepLng
    );
  }, [currentStep, userLocation]);

  /*
   * Advance navigation instructions as GPS approaches
   * each maneuver.
   */
  useEffect(() => {
    if (
      !walkStarted ||
      !currentStep ||
      currentStepDistance === null
    ) {
      return;
    }

    const nextStepThreshold = 35;

    if (
      currentStepDistance <= nextStepThreshold &&
      currentStepIndex < navigationSteps.length - 1
    ) {
      setCurrentStepIndex((previous) => previous + 1);
    }
  }, [
    walkStarted,
    currentStep,
    currentStepDistance,
    currentStepIndex,
    navigationSteps.length,
  ]);

  /*
   * Voice navigation.
   */
  useEffect(() => {
    if (!walkStarted) return;

    if (!currentStep) return;

    if (lastSpokenStepRef.current === currentStepIndex) {
      return;
    }

    if (currentStepDistance === null) {
      return;
    }

    /*
     * Speak when:
     * - a new step becomes active
     * - the maneuver is within roughly 500m
     */
    if (currentStepDistance <= 500) {
      const instruction =
        getManeuverText(currentStep);

      const road =
        currentStep.name
          ? ` onto ${currentStep.name}`
          : "";

      speakNavigation(
        `${instruction}${road} in ${formatDistance(
          currentStepDistance
        )}.`
      );

      lastSpokenStepRef.current =
        currentStepIndex;
    }
  }, [
    walkStarted,
    currentStep,
    currentStepDistance,
    currentStepIndex,
  ]);

  /*
   * Arrival detection.
   */
  useEffect(() => {
    if (
      !walkStarted ||
      arrived ||
      !userLocation ||
      destinationLat === null ||
      destinationLng === null
    ) {
      return;
    }

    const destinationDistance = getDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      destinationLat,
      destinationLng
    );

    if (destinationDistance <= 60) {
      arrivalSamplesRef.current += 1;
    } else {
      arrivalSamplesRef.current = 0;
    }

    if (arrivalSamplesRef.current >= 3) {
      const completeJourney = async () => {
        setArrived(true);
        setWalkStarted(false);
        setTimeLeft(0);
        setMovementMode("stopped");
        setJourneyStatus("Arrived Safely");

        addJourneyEvent(
          `🏁 Arrived safely at ${destination}`
        );

        speakNavigation(
          `You have arrived safely at ${destination}.`
        );

        if (journeyId) {
          try {
            await updateDoc(
              doc(db, "journeys", journeyId),
              {
                status: "completed",
                endedAt: serverTimestamp(),
                lastUpdated: serverTimestamp(),
              }
            );
          } catch (error) {
            console.error(
              "Journey completion failed:",
              error
            );
          }
        }
      };

      void completeJourney();
    }
  }, [
    walkStarted,
    arrived,
    userLocation,
    destinationLat,
    destinationLng,
    destination,
    journeyId,
  ]);

  /*
   * Guardian monitoring.
   */
  useEffect(() => {
    if (!walkStarted || !userLocation) return;

    const speed =
      journeyPoints.length > 0
        ? journeyPoints[journeyPoints.length - 1].speed
        : null;

    const speedKmh =
      speed !== null && speed >= 0
        ? speed * 3.6
        : 0;

    if (movementMode === "stopped") {
      setGuardianMessage(
        "You are currently stopped. Guardian is monitoring."
      );
      setRiskLevel("Low");
    } else if (routeDeviation > 150) {
      setGuardianMessage(
        "You appear to be away from your planned route."
      );
      setRiskLevel("Medium");
    } else {
      setGuardianMessage(
        `Journey looks normal at ${speedKmh.toFixed(
          0
        )} km/h.`
      );
      setRiskLevel("Low");
    }
  }, [
    walkStarted,
    userLocation,
    movementMode,
    routeDeviation,
    journeyPoints,
  ]);

  /*
   * GPS freshness.
   */
  const lastGpsUpdate = useMemo(() => {
    if (!lastGpsTimestamp) return "Waiting";

    const seconds = Math.floor(
      (Date.now() - lastGpsTimestamp) / 1000
    );

    if (seconds < 10) return "Just now";

    if (seconds < 60) {
      return `${seconds}s ago`;
    }

    return `${Math.floor(seconds / 60)}m ago`;
  }, [lastGpsTimestamp, journeySeconds]);

  /*
   * Remaining distance.
   */
  const remainingDistance =
    routeDistanceKm !== null
      ? Math.max(
          0,
          routeDistanceKm - distanceTravelled
        )
      : destinationLat !== null &&
        destinationLng !== null &&
        userLocation
      ? getDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          destinationLat,
          destinationLng
        )
      : null;

  /*
   * Live ETA.
   */
  const liveEtaSeconds =
    routeDurationSeconds !== null &&
    routeDistanceKm !== null &&
    routeDistanceKm > 0
      ? Math.max(
          60,
          Math.round(
            routeDurationSeconds *
              ((remainingDistance ?? routeDistanceKm) /
                routeDistanceKm)
          )
        )
      : null;

  const arrivalTime =
    liveEtaSeconds !== null
      ? new Date(
          Date.now() + liveEtaSeconds * 1000
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  const journeyProgress =
    routeDistanceKm && routeDistanceKm > 0
      ? Math.min(
          100,
          (distanceTravelled / routeDistanceKm) *
            100
        )
      : 0;

  const currentSpeed =
    journeyPoints.length > 0
      ? journeyPoints[journeyPoints.length - 1].speed
      : null;

  const currentSpeedKmh =
    currentSpeed !== null && currentSpeed >= 0
      ? currentSpeed * 3.6
      : 0;

  const movementLabel =
    movementMode === "walking"
      ? "🚶 Walking"
      : movementMode === "cycling"
      ? "🚲 Cycling"
      : movementMode === "car"
      ? "🚗 Driving"
      : movementMode === "bus"
      ? "🚌 Bus"
      : movementMode === "train"
      ? "🚆 Train"
      : "⏸️ Stopped";

  const formatJourneyTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes
      .toString()
      .padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startJourney = async () => {
    if (contacts.length === 0) {
      alert(
        "Add at least one trusted contact before starting Safe Journey."
      );
      return;
    }

    const routeReady =
      await resolveDestinationAndRoute();

    if (!routeReady) return;

    setJourneyPoints([]);
    setJourneySeconds(0);
    setDistanceTravelled(0);
    setEmergencyTriggered(false);
    setArrived(false);
    setAlertId(null);
    setTimeLeft(300);
    setJourneyStatus("Protected");
    setRiskLevel("Low");
    setGuardianMessage(
      "Protected Journey is active."
    );

    arrivalSamplesRef.current = 0;
    speedSamplesRef.current = [];
    trainEvidenceRef.current = 0;
    lastSpokenStepRef.current = -1;

    setCurrentStepIndex(0);
    setWalkStarted(true);

    addJourneyEvent(
      "🟢 Protected Journey started"
    );

    if (routeDistanceKm !== null) {
      addJourneyEvent(
        `🗺️ Route ready • ${routeDistanceKm.toFixed(
          1
        )} km`
      );
    }

    const user = auth.currentUser;

    if (user && userLocation) {
      try {
        const journeyRef = await addDoc(
          collection(db, "journeys"),
          {
            userId: user.uid,
            userName:
              user.displayName || "Unknown",

            destination,
            destinationLat,
            destinationLng,

            currentLat: userLocation.latitude,
            currentLng: userLocation.longitude,

            movementMode: "car",
            movementConfidence: 100,
            speedKmh: 0,

            distanceTravelledKm: 0,
            distanceRemainingKm:
              routeDistanceKm,

            etaMinutes:
              liveEtaSeconds !== null
                ? Math.ceil(
                    liveEtaSeconds / 60
                  )
                : null,

            guardianIds: contacts
              .map((contact) => contact.id)
              .filter(Boolean),

            status: "active",

            startedAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }
        );

        setJourneyId(journeyRef.id);
      } catch (error) {
        console.error(
          "Failed to create journey:",
          error
        );
      }
    }

    speakNavigation(
      `Protected Journey started. Navigating to ${destination}.`
    );
  };

  const confirmSafe = () => {
    setTimeLeft(300);
    setEmergencyTriggered(false);
    setRiskLevel("Low");
    setGuardianMessage(
      "Check-in confirmed. You are safe."
    );

    addJourneyEvent("✅ User checked in safely");

    speakNavigation(
      "Check-in confirmed. You are marked safe."
    );
  };

  const sendEmergencyAlert = async () => {
    setEmergencyTriggered(true);
    setRiskLevel("High");
    setGuardianMessage(
      "Emergency alert activated."
    );

    const user = auth.currentUser;

    if (user) {
      try {
        const alertRef = await addDoc(
          collection(db, "emergencyAlerts"),
          {
            userId: user.uid,
            latitude:
              userLocation?.latitude ?? null,
            longitude:
              userLocation?.longitude ?? null,
            destinationLat,
            destinationLng,
            destination,
            type: "walk_me_home",
            severity: "high",
            status: "active",
            contactCount: contacts.length,
            createdAt: serverTimestamp(),
          }
        );

        setAlertId(alertRef.id);
      } catch (error) {
        console.error(
          "Emergency alert failed:",
          error
        );
      }
    }

    addJourneyEvent(
      `🚨 Emergency alert sent to ${contacts.length} trusted contact${
        contacts.length === 1 ? "" : "s"
      }`
    );

    speakNavigation(
      "Emergency alert activated. Your trusted contacts have been notified."
    );
  };

  const endJourney = async () => {
    setWalkStarted(false);
    setJourneyStatus("Journey Ended");
    setMovementMode("stopped");
    setTimeLeft(300);
    setEmergencyTriggered(false);

    addJourneyEvent("🛑 Protected Journey ended");

    if (journeyId) {
      try {
        await updateDoc(
          doc(db, "journeys", journeyId),
          {
            status: "completed",
            endedAt: serverTimestamp(),
            lastUpdated: serverTimestamp(),
          }
        );
      } catch (error) {
        console.error(
          "Journey end update failed:",
          error
        );
      }
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setJourneyId(null);
  };

  useEffect(() => {
    return () => {
      if (addressSearchTimerRef.current !== null) {
        window.clearTimeout(
          addressSearchTimerRef.current
        );
      }

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF]">
      {!walkStarted ? (
        /*
         * ============================
         * JOURNEY SETUP
         * ============================
         */
        <div className="mx-auto w-full max-w-xl px-5 py-6 pb-10">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#E8A838]"
          >
            ← Back
          </button>

          <div className="mb-6">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22C55E]/15 text-3xl">
              🛡️
            </div>

            <h1 className="text-3xl font-black">
              Protected Journey
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#7BA3A1]">
              CitySense quietly monitors your journey,
              provides navigation guidance and checks
              on you if something unexpected happens.
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-[#22C55E40] bg-[#14532D]/40 p-4">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 animate-pulse rounded-full bg-[#4ADE80]" />

              <div>
                <p className="font-bold text-white">
                  Guardian Protection
                </p>

                <p className="text-xs text-[#BBF7D0]">
                  {contacts.length} trusted contact
                  {contacts.length === 1
                    ? ""
                    : "s"} connected
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <label className="mb-2 block text-sm font-semibold text-white">
              Where are you going?
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                📍
              </span>

              <input
                value={destination}
                onChange={(event) =>
                  searchAddresses(
                    event.target.value
                  )
                }
                placeholder="Search address, station or place..."
                autoComplete="off"
                className="w-full rounded-2xl border border-[#2D5A5840] bg-[#1A2E2D] px-12 py-4 text-white outline-none transition focus:border-[#4ADE80]"
              />
            </div>

            {isSearchingAddress && (
              <p className="mt-2 px-1 text-xs text-[#7BA3A1]">
                Searching places...
              </p>
            )}

            {addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[88px] z-[1000] max-h-80 overflow-y-auto rounded-2xl border border-[#2D5A58] bg-[#132625] shadow-2xl">
                {addressSuggestions.map(
                  (place) => (
                    <button
                      key={place.place_id}
                      type="button"
                      onClick={() =>
                        selectDestination(place)
                      }
                      className="w-full border-b border-[#2D5A5840] px-4 py-4 text-left last:border-b-0 hover:bg-[#1A2E2D]"
                    >
                      <p className="text-sm font-medium text-white">
                        📍 {place.display_name}
                      </p>
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {routeDistanceKm !== null && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-[#1A2E2D] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1]">
                  Route
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  {routeDistanceKm.toFixed(1)} km
                </p>
              </div>

              <div className="rounded-2xl border border-white/5 bg-[#1A2E2D] p-4">
                <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1]">
                  ETA
                </p>

                <p className="mt-1 text-xl font-black text-[#4ADE80]">
                  {formatDuration(
                    routeDurationSeconds
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/5 bg-[#1A2E2D] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-white">
                  🔊 Voice Navigation
                </p>

                <p className="mt-1 text-xs text-[#7BA3A1]">
                  CitySense will announce important
                  turns and safety events.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVoiceEnabled(
                    (previous) => !previous
                  )
                }
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  voiceEnabled
                    ? "bg-[#22C55E] text-black"
                    : "bg-[#2D3F3E] text-[#7BA3A1]"
                }`}
              >
                {voiceEnabled
                  ? "ON"
                  : "OFF"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={startJourney}
            disabled={
              isRouting ||
              isSearchingAddress ||
              !destination.trim()
            }
            className="mt-6 w-full rounded-2xl bg-[#22C55E] py-4 font-black text-[#07110E] shadow-lg shadow-green-950/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isRouting
              ? "Calculating Route..."
              : "Start Protected Journey"}
          </button>

          {contacts.length === 0 && (
            <p className="mt-3 text-center text-xs text-[#FCA5A5]">
              Add a trusted contact before starting.
            </p>
          )}
        </div>
      ) : (
        /*
         * ============================
         * ACTIVE NAVIGATION
         * ============================
         */
        <div className="relative h-screen w-full overflow-hidden">
          {userLocation && (
            <MapContainer
              center={[
                userLocation.latitude,
                userLocation.longitude,
              ]}
              zoom={17}
              className="absolute inset-0 z-0 h-full w-full"
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              <SafeJourneyMapController
                latitude={
                  userLocation.latitude
                }
                longitude={
                  userLocation.longitude
                }
              />

              <MapRecenterButton
                latitude={
                  userLocation.latitude
                }
                longitude={
                  userLocation.longitude
                }
              />

              <Marker
                position={[
                  userLocation.latitude,
                  userLocation.longitude,
                ]}
                icon={journeyUserIcon}
              >
                <Popup>
                  Your live location
                </Popup>
              </Marker>

              {destinationLat !== null &&
                destinationLng !== null && (
                  <>
                    <Marker
                      position={[
                        destinationLat,
                        destinationLng,
                      ]}
                      icon={
                        journeyDestinationIcon
                      }
                    >
                      <Popup>
                        {destination}
                      </Popup>
                    </Marker>

                    {routePoints.length > 1 && (
                     <Polyline
  positions={routePoints}
  pathOptions={{
    color: "#E8A838",
    weight: 5,
    opacity: 0.8,
    lineCap: "round",
    lineJoin: "round",
  }}
/>
                    )}
                  </>
                )}

              {journeyPoints.length > 1 && (
                <Polyline
                  positions={journeyPoints.map(
                    (point) => [
                      point.latitude,
                      point.longitude,
                    ]
                  )}
                  pathOptions={{
                    color: "#3B82F6",
                    weight: 4,
                    opacity: 0.75,
                  }}
                />
              )}
            </MapContainer>
          )}

          {/* Dark gradient over map */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-56 bg-gradient-to-b from-[#0F1E1E]/80 via-[#0F1E1E]/30 to-transparent" />

          {/* Back + voice controls */}
          <div className="absolute left-4 right-4 top-4 z-[600] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "End this Protected Journey?"
                  )
                ) {
                  void endJourney();
                }
              }}
              className="h-11 w-11 rounded-full border border-white/10 bg-[#0F1E1E]/90 text-xl text-white shadow-xl backdrop-blur-md"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() =>
                setVoiceEnabled(
                  (previous) => !previous
                )
              }
              className={`flex h-11 items-center gap-2 rounded-full border px-4 text-xs font-bold shadow-xl backdrop-blur-md ${
                voiceEnabled
                  ? "border-[#4ADE80]/40 bg-[#0F1E1E]/90 text-[#4ADE80]"
                  : "border-white/10 bg-[#0F1E1E]/90 text-[#7BA3A1]"
              }`}
            >
              {voiceEnabled
                ? "🔊 Voice"
                : "🔇 Muted"}
            </button>
          </div>

          {/* Next navigation instruction */}
          <div className="absolute left-4 right-4 top-[76px] z-[600]">
            <div className="rounded-3xl border border-white/10 bg-[#0F1E1E]/95 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22C55E]/15 text-3xl text-[#4ADE80]">
                  {getManeuverIcon(
                    currentStep
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7BA3A1]">
                    Next
                  </p>

                  <p className="mt-1 truncate text-lg font-black text-white">
                    {getManeuverText(
                      currentStep
                    )}
                  </p>

                  {currentStep?.name && (
                    <p className="mt-1 truncate text-sm text-[#B8D0CD]">
                      {currentStep.name}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xl font-black text-[#4ADE80]">
                    {formatDistance(
                      currentStepDistance
                    )}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1]">
                    ahead
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Protected badge */}
          <div className="absolute left-4 right-4 top-[185px] z-[500] flex justify-between">
            <div className="rounded-full border border-[#4ADE80]/20 bg-[#0F1E1E]/90 px-3 py-2 text-xs font-bold text-[#4ADE80] shadow-lg backdrop-blur-md">
              🛡 Protected
            </div>

            <div className="rounded-full border border-white/10 bg-[#0F1E1E]/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md">
              {movementLabel}
            </div>
          </div>

          {/* Bottom navigation panel */}
          <div className="absolute inset-x-0 bottom-0 z-[600] max-h-[48vh] overflow-y-auto rounded-t-[32px] border-t border-white/10 bg-[#0F1E1E]/98 px-5 pb-6 pt-4 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />

            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#7BA3A1]">
                  Protected Journey
                </p>

                <p className="mt-1 truncate text-lg font-black text-white">
                  {destination}
                </p>
              </div>

              <div className="ml-4 shrink-0 rounded-xl bg-[#22C55E]/10 px-3 py-2 text-right">
                <p className="text-[9px] uppercase text-[#7BA3A1]">
                  ETA
                </p>

                <p className="font-black text-[#4ADE80]">
                  {arrivalTime ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#162928] p-3">
                <p className="text-[9px] uppercase text-[#7BA3A1]">
                  Remaining
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {remainingDistance !==
                  null
                    ? remainingDistance.toFixed(
                        1
                      )
                    : "—"}
                  <span className="ml-1 text-xs font-normal text-[#7BA3A1]">
                    km
                  </span>
                </p>
              </div>

              <div className="rounded-2xl bg-[#162928] p-3">
                <p className="text-[9px] uppercase text-[#7BA3A1]">
                  Time
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {formatDuration(
                    liveEtaSeconds
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#162928] p-3">
                <p className="text-[9px] uppercase text-[#7BA3A1]">
                  Speed
                </p>

                <p className="mt-1 text-lg font-black text-white">
                  {currentSpeedKmh.toFixed(0)}
                  <span className="ml-1 text-xs font-normal text-[#7BA3A1]">
                    km/h
                  </span>
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-[#7BA3A1]">
                <span>Journey progress</span>
                <span>
                  {journeyProgress.toFixed(0)}%
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-[#2D5A58]">
                <div
                  className="h-full rounded-full bg-[#22C55E] transition-all duration-700"
                  style={{
                    width: `${journeyProgress}%`,
                  }}
                />
              </div>
            </div>

            {/* Guardian */}
            <div className="mt-4 rounded-2xl border border-[#22C55E30] bg-[#14532D]/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#4ADE80]">
                    🛡 Guardian AI
                  </p>

                  <p className="mt-1 text-sm text-white">
                    {guardianMessage}
                  </p>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                    riskLevel === "Low"
                      ? "bg-[#22C55E]/15 text-[#4ADE80]"
                      : riskLevel === "Medium"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {riskLevel} risk
                </div>
              </div>

              <div className="mt-3 flex justify-between text-[10px] text-[#7BA3A1]">
                <span>
                  GPS: {lastGpsUpdate}
                </span>

                <span>
                  {contacts.length} trusted contact
                  {contacts.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>

            {/* Emergency */}
            {emergencyTriggered && (
              <div className="mt-4 rounded-2xl border border-red-500/50 bg-red-950/70 p-4">
                <p className="font-black text-red-300">
                  🚨 Emergency escalation active
                </p>

                <p className="mt-1 text-xs text-red-200">
                  Your trusted contacts have been
                  notified.
                </p>

                {alertId && (
                  <p className="mt-2 text-[10px] text-red-300">
                    Alert: {alertId}
                  </p>
                )}
              </div>
            )}

            {/* Safety timer */}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#162928] p-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1]">
                  Safety check-in
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  Check in before the timer expires
                </p>
              </div>

              <p className="text-2xl font-black text-[#4ADE80]">
                {formatJourneyTime(timeLeft)}
              </p>
            </div>

            {/* Main actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirmSafe}
                className="rounded-2xl bg-[#22C55E] py-4 font-black text-black shadow-lg"
              >
                ✓ I'm Safe
              </button>

              <button
                type="button"
                onClick={() =>
                  void sendEmergencyAlert()
                }
                className="rounded-2xl bg-[#DC2626] py-4 font-black text-white shadow-lg"
              >
                🚨 Need Help
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to end this Protected Journey?"
                  )
                ) {
                  void endJourney();
                }
              }}
              className="mt-3 w-full rounded-2xl border border-white/10 bg-[#1A2E2D] py-3 text-sm font-bold text-[#B8C7C5]"
            >
              End Protected Journey
            </button>

            {/* Journey status */}
            <div className="mt-4 flex items-center justify-between text-xs text-[#7BA3A1]">
              <span>
                {journeyStatus}
              </span>

              <span>
                {formatJourneyTime(
                  journeySeconds
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}