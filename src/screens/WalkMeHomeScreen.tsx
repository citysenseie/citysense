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
  | "vehicle"
  | "stopped";

interface JourneyPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
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
    (position) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const speed = position.coords.speed;

  setUserLocation({
    latitude,
    longitude,
  });

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

    if (averageSpeedKmh < 1.5 && maxSpeedKmh < 3) {
      setMovementMode("stopped");
    } else if (averageSpeedKmh < 9 && maxSpeedKmh < 14) {
      setMovementMode("walking");
    } else if (averageSpeedKmh < 22 && maxSpeedKmh < 32) {
      setMovementMode("cycling");
    } else {
      setMovementMode("vehicle");
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
    userLocation && destinationLat !== null && destinationLng !== null
      ? getDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          destinationLat,
          destinationLng
        )
      : null;

  const movementLabel =
    movementMode === "walking"
      ? "🚶 Walking"
      : movementMode === "cycling"
      ? "🚲 Cycling"
      : movementMode === "vehicle"
      ? "🚗 In vehicle"
      : "⏸️ Stopped";

  useEffect(() => {
    if (!walkStarted || arrived || remainingDistance === null) return;

    if (remainingDistance <= 0.06) {
      arrivalSamplesRef.current += 1;
    } else {
      arrivalSamplesRef.current = 0;
    }

    if (arrivalSamplesRef.current >= 3) {
      setArrived(true);
      setWalkStarted(false);
      setTimeLeft(0);
      setMovementMode("stopped");
      alert(`🎉 Arrived safely at ${destination}.`);
    }
  }, [walkStarted, arrived, remainingDistance, destination]);

  const calculateWalkTime = () => {
    if (!destination.trim()) return;

    const destinationDatabase: Record<
      string,
      { lat: number; lng: number }
    > = {
      "eeklo station": {
        lat: 51.1875,
        lng: 3.5669,
      },

      "eeklo hospital": {
        lat: 51.1845,
        lng: 3.5802,
      },
    };

    const place =
      destinationDatabase[destination.toLowerCase()];

    if (!place || !userLocation) {
      alert("Destination not found.");
      return;
    }

    const distance = getDistanceKm(
      userLocation.latitude,
      userLocation.longitude,
      place.lat,
      place.lng
    );

    const minutes = Math.ceil((distance / 5) * 60);

    setDestinationLat(place.lat);
    setDestinationLng(place.lng);
    setEstimatedMinutes(minutes);

    setTimeLeft((minutes + 5) * 60);
  };
  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          👣 Walk Me Home
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
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 mb-4"
          />

          <button
            onClick={() => {
              if (!destination.trim()) {
                alert("Please enter your destination first.");
                return;
              }

              if (contacts.length === 0) {
                alert("Add trusted contacts before starting Walk Me Home.");
                return;
              }

              calculateWalkTime();

              setJourneyPoints([]);
              setJourneySeconds(0);
              setDistanceTravelled(0);
              setEmergencyTriggered(false);
              setArrived(false);
              arrivalSamplesRef.current = 0;
              speedSamplesRef.current = [];
              setWalkStarted(true);
            }}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            Start Walk
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
                    <Polyline
                      positions={[
                        [userLocation.latitude, userLocation.longitude],
                        [destinationLat, destinationLng],
                      ]}
                      pathOptions={{
                        color: "#E8A838",
                        weight: 3,
                        opacity: 0.7,
                        dashArray: "8 8",
                      }}
                    />
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
                  <p className="text-[10px] text-[#7BA3A1]">LIVE JOURNEY</p>
                  <p className="text-sm font-bold text-white">{movementLabel}</p>
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
                  <div className="flex justify-between gap-3 mt-2 text-xs">
                    <span className="text-[#E8A838]">
                      {distanceTravelled.toFixed(2)} km travelled
                    </span>
                    <span className="text-[#4ADE80]">
                      {remainingDistance !== null
                        ? `${remainingDistance.toFixed(2)} km remaining`
                        : "Calculating distance"}
                    </span>
                  </div>
                  <p className="text-xs text-[#4ADE80] mt-1">
                    🛡️ Guardian monitoring active
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
            <p className="text-xs text-[#7BA3A1] mb-1">Distance travelled</p>
            <p className="text-sm">{distanceTravelled.toFixed(2)} km</p>
          </div>
          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
            <p className="text-xs text-[#7BA3A1] mb-1">Movement mode</p>
            <p className="text-sm capitalize">{movementMode}</p>
          </div>
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
            Cancel Walk
          </button>
        </div>
      )}
    </div>
  );
}