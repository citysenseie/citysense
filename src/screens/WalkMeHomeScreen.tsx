import { useEffect, useRef, useState } from "react";
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

interface WalkMeHomeScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}
type MovementMode =
  | "walking"
  | "cycling"
  | "car"
  | "bus"
  | "train"
  | "stopped";
interface JourneyPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
}

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type RoutePoint = [number, number];

function SafeJourneyMapController({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: true });
  }, [latitude, longitude, map]);

  return null;
}

const journeyUserIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#3B82F6;border:4px solid white;box-shadow:0 0 0 8px rgba(59,130,246,0.25);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const journeyDestinationIcon = L.divIcon({
  className: "",
  html: `<div style="font-size:30px;transform:translate(-4px,-22px);">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function WalkMeHomeScreen({
  onBack,
}: WalkMeHomeScreenProps) {
  const [destination, setDestination] = useState("");
  const [walkStarted, setWalkStarted] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [journeyPoints, setJourneyPoints] = useState<JourneyPoint[]>([]);
  const [journeySeconds, setJourneySeconds] = useState(0);
  const [distanceTravelled, setDistanceTravelled] = useState(0);
  const [movementMode, setMovementMode] = useState<MovementMode>("stopped");
  const [arrived, setArrived] = useState(false);
  const speedSamplesRef = useRef<number[]>([]);
  const arrivalSamplesRef = useRef(0);
 const [, setMovementConfidence] = useState(0);
  const trainEvidenceRef = useRef(0);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationSeconds, setRouteDurationSeconds] = useState<number | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const addressSearchTimerRef = useRef<number | null>(null);
const [journeyId, setJourneyId] = useState<string | null>(null);
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
    destinationLatitude: number,
    destinationLongitude: number
  ) => {
    if (!userLocation) {
      alert("Current GPS location is not available yet.");
      return false;
    }

    setIsRouting(true);

    try {
      const routeUrl =
        `https://routing.openstreetmap.de/routed-foot/route/v1/driving/` +
        `${userLocation.longitude},${userLocation.latitude};` +
        `${destinationLongitude},${destinationLatitude}` +
        `?overview=full&geometries=geojson&steps=false`;

      const response = await fetch(routeUrl);

      if (!response.ok) {
        throw new Error(`Route request failed: ${response.status}`);
      }

      const data = await response.json();
      const route = data?.routes?.[0];

      if (!route) {
        alert("No walking route could be found to this destination.");
        return false;
      }

      const points: RoutePoint[] = route.geometry.coordinates.map(
        ([longitude, latitude]: [number, number]) => [latitude, longitude]
      );

      setRoutePoints(points);
      setRouteDistanceKm(route.distance / 1000);
      setRouteDurationSeconds(route.duration);
      setEstimatedMinutes(Math.max(1, Math.ceil(route.duration / 60)));
      setTimeLeft(300);

      return true;
    } catch (error) {
      console.error("Routing error:", error);
      alert("CitySense could not calculate the route. Please try again.");
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
      alert("Waiting for your current GPS location. Please try again in a moment.");
      return false;
    }

    if (destinationLat !== null && destinationLng !== null) {
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
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) {
        throw new Error(`Address search failed: ${response.status}`);
      }

      const results = (await response.json()) as AddressSuggestion[];
      const place = results[0];

      if (!place) {
        alert("Address not found. Try adding the city or postcode.");
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
      alert("CitySense could not search for that address. Please try again.");
      return false;
    } finally {
      setIsSearchingAddress(false);
    }
  };

  useEffect(() => {
    return () => {
      if (addressSearchTimerRef.current !== null) {
        window.clearTimeout(addressSearchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        alert("Unable to determine your current location.");
      }
    );
  }, []);

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
if (journeyId) {
  await updateDoc(doc(db, "journeys", journeyId), {
    currentLat: latitude,
    currentLng: longitude,

    movementMode,

    distanceTravelledKm: distanceTravelled,

    distanceRemainingKm: remainingDistance,

    lastUpdated: serverTimestamp(),
  });
}
  const newPoint: JourneyPoint = {
    latitude,
    longitude,
    timestamp: Date.now(),
    speed,
  };

  setJourneyPoints((previousPoints) => {
    const lastPoint = previousPoints[previousPoints.length - 1];

    if (lastPoint) {
      const segmentDistance = getDistanceKm(
        lastPoint.latitude,
        lastPoint.longitude,
        latitude,
        longitude
      );

      if (segmentDistance < 0.5) {
        setDistanceTravelled(
          (previousDistance) =>
            previousDistance + segmentDistance
        );
      }
    }

    return [...previousPoints.slice(-199), newPoint];
  });

  const speedKmh = speed !== null && speed >= 0 ? speed * 3.6 : null;

  if (speedKmh !== null) {
    speedSamplesRef.current = [...speedSamplesRef.current.slice(-5), speedKmh];
    const samples = speedSamplesRef.current;
    const averageSpeedKmh =
      samples.reduce((total, value) => total + value, 0) / samples.length;
    const maxSpeedKmh = Math.max(...samples);

    // Train Intelligence v1:
    // Require sustained high-speed evidence across several GPS updates.
    // We intentionally do not call this "train" from a single speed sample.
    const trainSpeedEvidence =
      averageSpeedKmh >= 45 && maxSpeedKmh >= 60;

    if (trainSpeedEvidence) {
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
      setMovementConfidence(
        Math.min(95, 72 + trainEvidenceRef.current * 4)
      );
    } else if (averageSpeedKmh < 1.5 && maxSpeedKmh < 3) {
      setMovementMode("stopped");
      setMovementConfidence(92);
    } else if (averageSpeedKmh < 9 && maxSpeedKmh < 14) {
      setMovementMode("walking");
      setMovementConfidence(86);
    } else if (averageSpeedKmh < 22 && maxSpeedKmh < 32) {
      setMovementMode("cycling");
      setMovementConfidence(72);
    } else if (averageSpeedKmh < 70) {
  setMovementMode("car");
  setMovementConfidence(80);
}
else {
  setMovementMode("bus");
  setMovementConfidence(75);
}
  }
},
    (error) => {
      console.error(error);
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
}, [walkStarted]);

  useEffect(() => {
    if (!walkStarted) return;
    const journeyTimer = window.setInterval(() => {
      setJourneySeconds((previous) => previous + 1);
    }, 1000);
    return () => window.clearInterval(journeyTimer);
  }, [walkStarted]);

useEffect(() => {
  if (!alertId || !userLocation) return;

  const updateLocation = async () => {
    try {
      await updateDoc(
        doc(db, "emergencyAlerts", alertId),
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          lastUpdated: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  updateLocation();
}, [userLocation, alertId]);
  useEffect(() => {
    const loadContacts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const contactsRef = collection(
        db,
        "users",
        user.uid,
        "trustedContacts"
      );

      const snapshot = await getDocs(contactsRef);

      const loadedContacts: TrustedContact[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustedContact, "id">),
      }));

      setContacts(loadedContacts);
    };

    loadContacts();
  }, []);

  useEffect(() => {
    if (!walkStarted || emergencyTriggered) return;

    const handleExpiration = async () => {
      if (timeLeft <= 0) {
        setEmergencyTriggered(true);

        const user = auth.currentUser;

        if (user) {
          const docRef = await addDoc(collection(db, "emergencyAlerts"), {
  userId: user.uid,
  latitude: userLocation?.latitude,
  longitude: userLocation?.longitude,
  destinationLat,
  destinationLng,

  type: "walk_me_home",
  severity: "high",
  status: "active",

  destination,

  contactCount: contacts.length,

  createdAt: serverTimestamp(),
});
        setAlertId(docRef.id);
        
        }

        alert(
          `Safety timer expired. Emergency prepared for ${contacts.length} trusted contact${
            contacts.length > 1 ? "s" : ""
          }.`
        );
      }
    };

    if (timeLeft <= 0) {
      handleExpiration();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [walkStarted, timeLeft, emergencyTriggered, contacts.length]);

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
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const remainingDistance =
    routeDistanceKm !== null
      ? Math.max(0, routeDistanceKm - distanceTravelled)
      : userLocation && destinationLat !== null && destinationLng !== null
      ? getDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          destinationLat,
          destinationLng
        )
      : null;

  const liveEtaSeconds =
    routeDurationSeconds !== null && routeDistanceKm !== null && routeDistanceKm > 0
      ? Math.max(
          60,
          Math.round(
            routeDurationSeconds *
              ((remainingDistance ?? routeDistanceKm) / routeDistanceKm)
          )
        )
      : null;

  const arrivalTime =
    liveEtaSeconds !== null
      ? new Date(Date.now() + liveEtaSeconds * 1000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

 const movementLabel =
  movementMode === "walking"
    ? "🚶 Walking"
    : movementMode === "cycling"
    ? "🚲 Cycling"
    : movementMode === "car"
    ? "🚗 Driving"
    : movementMode === "bus"
    ? "🚌 On a Bus"
    : movementMode === "train"
    ? "🚆 On a Train"
    : "⏸️ Stopped";
  useEffect(() => {
    const handleArrival = async () => {
      if (journeyId) {
        await updateDoc(doc(db, "journeys", journeyId), {
          status: "completed",
          endedAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      }

      setArrived(true);
      setWalkStarted(false);
      setTimeLeft(0);
      setMovementMode("stopped");

      alert(`🎉 Arrived safely at ${destination}.`);
    };

    if (!walkStarted || arrived || remainingDistance === null) return;

    if (remainingDistance <= 0.06) {
      arrivalSamplesRef.current += 1;
    } else {
      arrivalSamplesRef.current = 0;
    }

    if (arrivalSamplesRef.current >= 3) {
      void handleArrival();
    }
  }, [walkStarted, arrived, remainingDistance, destination, journeyId]);

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
  🛡 Safe Journey
</h1>

        <p className="text-sm text-[#BBF7D0]">
          Start a safe journey and check in regularly.
        </p>
      </div>

      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 mb-4">
        <p className="text-sm text-[#7BA3A1]">
          👥 {contacts.length} trusted contact
          {contacts.length !== 1 ? "s" : ""} connected
        </p>
      </div>

      {!walkStarted ? (
        <>
          <div className="relative mb-4">
            <input
              value={destination}
              onChange={(e) => searchAddresses(e.target.value)}
              placeholder="Search any address, station or place..."
              autoComplete="off"
              className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3"
            />

            {isSearchingAddress && (
              <p className="text-xs text-[#7BA3A1] mt-2 px-1">
                Searching places...
              </p>
            )}

            {addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 z-[1000] bg-[#132625] border border-[#2D5A58] rounded-2xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto">
                {addressSuggestions.map((place) => (
                  <button
                    key={place.place_id}
                    type="button"
                    onClick={() => selectDestination(place)}
                    className="w-full text-left px-4 py-3 border-b border-[#2D5A5840] last:border-b-0 hover:bg-[#1A2E2D]"
                  >
                    <p className="text-sm text-white">📍 {place.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              if (contacts.length === 0) {
                alert("Add trusted contacts before starting Safe Journey.");
                return;
              }

              const routeReady = await resolveDestinationAndRoute();
              if (!routeReady) return;

              setJourneyPoints([]);
              setJourneySeconds(0);
              setDistanceTravelled(0);
              setEmergencyTriggered(false);
              setArrived(false);
              arrivalSamplesRef.current = 0;
              speedSamplesRef.current = [];
              trainEvidenceRef.current = 0;
              setMovementConfidence(0);
              setWalkStarted(true);
              const user = auth.currentUser;

if (user && userLocation) {
  const journeyRef = await addDoc(collection(db, "journeys"), {
    userId: user.uid,
    userName: user.displayName || "Unknown",

    destination,

    destinationLat,
    destinationLng,

    currentLat: userLocation.latitude,
    currentLng: userLocation.longitude,

    movementMode: "walking",
    movementConfidence: 100,

    speedKmh: 0,

    distanceTravelledKm: 0,
    distanceRemainingKm: routeDistanceKm,

    etaMinutes: estimatedMinutes,

    guardianIds: contacts.map((c) => c.id),

    status: "active",

    startedAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });

  setJourneyId(journeyRef.id);
}
            }}
            disabled={isRouting || isSearchingAddress}
            className="w-full bg-[#22C55E] disabled:opacity-50 text-black font-bold py-4 rounded-2xl"
          >
            {isRouting ? "Calculating Route..." : "Start Safe Journey"}
          </button>
          {estimatedMinutes && (
            <>
              <div className="bg-[#1A2E2D] rounded-2xl p-4 mt-4">
                <p>🚶 Estimated Walk Time</p>
                <p className="text-xl font-bold">{estimatedMinutes} min</p>
              </div>

              {destinationLat !== null && destinationLng !== null && (
                <div className="bg-[#1A2E2D] rounded-2xl p-4 mt-4">
                  <p className="text-sm text-[#7BA3A1]">Destination coordinates</p>
                  <p className="text-xs text-[#F5F3EF]">
                    {destinationLat.toFixed(4)}, {destinationLng.toFixed(4)}
                  </p>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {emergencyTriggered && (
            <div className="bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4">
              <h2 className="font-bold text-white">
                🚨 Emergency Escalation Triggered
              </h2>

              <p className="text-sm text-[#FCA5A5] mt-2">
                Trusted contacts are ready to receive an emergency alert.
              </p>

              {alertId && (
                <p className="text-xs text-[#FCA5A5] mt-2">
                  Alert ID: {alertId}
                </p>
              )}
            </div>
          )}

          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
            <p className="text-xs text-[#7BA3A1] mb-1">Walking to</p>
            <h2 className="text-lg font-bold">{destination}</h2>
          </div>
{userLocation && (
            <div className="relative h-[360px] overflow-hidden rounded-3xl border border-[#2D5A5840] shadow-xl">
              <MapContainer
                center={[userLocation.latitude, userLocation.longitude]}
                zoom={16}
                className="h-full w-full z-0"
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <SafeJourneyMapController
                  latitude={userLocation.latitude}
                  longitude={userLocation.longitude}
                />
                <Marker
                  position={[userLocation.latitude, userLocation.longitude]}
                  icon={journeyUserIcon}
                >
                  <Popup>Current live location</Popup>
                </Marker>

                {destinationLat !== null && destinationLng !== null && (
                  <>
                    <Marker
                      position={[destinationLat, destinationLng]}
                      icon={journeyDestinationIcon}
                    >
                      <Popup>{destination}</Popup>
                    </Marker>
                    {routePoints.length > 1 && (
                      <Polyline
                        positions={routePoints}
                        pathOptions={{
                          color: "#E8A838",
                          weight: 5,
                          opacity: 0.9,
                        }}
                      />
                    )}
                  </>
                )}

                {journeyPoints.length > 1 && (
                  <Polyline
                    positions={journeyPoints.map((point) => [
                      point.latitude,
                      point.longitude,
                    ])}
                    pathOptions={{
                      color: "#3B82F6",
                      weight: 5,
                      opacity: 0.85,
                    }}
                  />
                )}
              </MapContainer>

              <div className="absolute top-3 left-3 right-3 z-[500] flex justify-between gap-2 pointer-events-none">
                <div className="bg-[#0F1E1E]/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg">
                 <p className="text-[10px] text-[#7BA3A1]">
  🛡 SAFE JOURNEY
</p>

<p className="text-base font-bold text-white">
  {movementLabel}
</p>

<p className="text-[10px] text-[#7BA3A1]">
  Guardian Monitoring Active
</p>
                </div>
                <div className="bg-[#0F1E1E]/95 backdrop-blur-md rounded-2xl px-3 py-2 text-right shadow-lg">
                  <p className="text-[10px] text-[#7BA3A1]">JOURNEY TIME</p>
                  <p className="text-sm font-bold text-[#E8A838]">
                    {formatTime(journeySeconds)}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 z-[500] pointer-events-none">
                <div className="bg-[#0F1E1E]/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg">
                  <p className="text-[10px] text-[#7BA3A1]">SAFE JOURNEY TO</p>
                  <p className="font-bold text-white truncate">📍 {destination}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                    <div>
                      <p className="text-[#7BA3A1]">TRAVELLED</p>
                      <p className="text-[#E8A838] font-bold">
                        {distanceTravelled.toFixed(2)} km
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7BA3A1]">REMAINING</p>
                      <p className="text-[#4ADE80] font-bold">
                        {remainingDistance !== null
                          ? `${remainingDistance.toFixed(2)} km`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7BA3A1]">ARRIVE AT</p>
                      <p className="text-white font-bold">{arrivalTime ?? "—"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[#4ADE80] mt-2">
                    🛡️ Guardian monitoring active
                    {liveEtaSeconds !== null
                      ? ` • ETA ${Math.ceil(liveEtaSeconds / 60)} min`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          
          <div className="bg-[#0F1E1E] border border-[#22C55E60] rounded-2xl p-4 text-center">
            <p className="text-sm text-[#7BA3A1] mb-2">Safety check-in</p>

            <p className="text-3xl font-bold text-[#22C55E]">
              {formatTime(timeLeft)}
            </p>
          </div>

          <button
            onClick={() => {
              alert("Check-in confirmed. You are marked safe.");
              setTimeLeft(300);
              setEmergencyTriggered(false);
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            ✅ I'm Safe
          </button>

          <button
            onClick={() => {
              alert(
                `Emergency alert prepared for ${contacts.length} trusted contact${
                  contacts.length > 1 ? "s" : ""
                }.`
              );
            }}
            className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-2xl"
          >
            🚨 Send Alert
          </button>

          <button
            onClick={() => {
              setTimeLeft(300);
              setEmergencyTriggered(false);
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#1A2E2D] text-[#7BA3A1] font-bold py-3 rounded-2xl"
          >
            End Safe Journey
          </button>
        </div>
      )}
    </div>
  );
}