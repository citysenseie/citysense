import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import SafetyScore from "../components/SafetyScore";
import { calculateSafetyScore } from "../services/safetyScore";
import L from "leaflet";
import { useHeatmap } from "@/hooks/useHeatmap";
import { useHistoricalHeatmap } from "@/hooks/useHistoricalHeatmap";
import { useSafetyAnalysis } from "@/hooks/useSafetyAnalysis";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/lib/firebase";
import { db, doc, updateDoc, increment } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
const safetyScore = calculateSafetyScore({
  suspiciousReports: 0,
  sosReports: 0,
  policeNearby: 2,
  safePlacesNearby: 3,
});
<SafetyScore score={safetyScore} />
function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], 15);
  }, [latitude, longitude, map]);

  return null;
}
function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
}
function MapController({
  latitude,
  longitude,
  recenterTrigger,
}: {
  latitude: number;
  longitude: number;
  recenterTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (recenterTrigger === 0) return;

    map.flyTo([latitude, longitude], 18, {
      animate: true,
      duration: 0.8,
    });
  }, [recenterTrigger, latitude, longitude, map]);

  return null;
}
function ReportFocusController({
  report,
}: {
  report: {
    latitude: number;
    longitude: number;
  } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!report) return;

    map.flyTo(
      [report.latitude, report.longitude],
      18,
      {
        animate: true,
        duration: 0.8,
      }
    );
  }, [report, map]);

  return null;
}
function MapMovementDetector({
  onMove,
}: {
  onMove: (latitude: number, longitude: number) => void;
}) {
  const [userInteracting, setUserInteracting] = useState(false);

  useMapEvents({
    dragstart: () => {
      setUserInteracting(true);
    },

    zoomstart: () => {
      setUserInteracting(true);
    },

    moveend: (event) => {
      if (!userInteracting) return;

      const center = event.target.getCenter();

      onMove(center.lat, center.lng);
      setUserInteracting(false);
    },
  });

  return null;
}
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
export default function MapScreen() {
  const { location } = useLocation();
 const { reports, fetchReports, submitReport } = useReports();
  const { user } = useAuth();
  const [recenterTrigger, setRecenterTrigger] = useState(0);
 const [showSafetyCard, setShowSafetyCard] = useState(false);
const [showNearbyReports, setShowNearbyReports] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "safe" | "unsafe">("all");
  const [showDetails, setShowDetails] = useState(false);
const [showReportActions, setShowReportActions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [focusedReport, setFocusedReport] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);
const [analysisCenter, setAnalysisCenter] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);

const [movedMapCenter, setMovedMapCenter] = useState<{
  latitude: number;
  longitude: number;
} | null>(null);
const [quickDescription, setQuickDescription] = useState("");
const [reportPhoto, setReportPhoto] = useState<File | null>(null);
    const [quickReportSent, setQuickReportSent] = useState(false);
const [selectedSeverity, setSelectedSeverity] = useState<
  "low" | "medium" | "high"
>("medium");
  const [selectedQuickType, setSelectedQuickType] = useState<
  "suspicious_activity" | "police_presence" | "safe_area" | "sos"
>("suspicious_activity");

  

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;
const analysisLat = analysisCenter?.latitude ?? lat;
const analysisLng = analysisCenter?.longitude ?? lng;
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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

  const getReportLabel = (category: string) => {
    if (category === "sos") return "🚨 Emergency SOS";
    if (category === "construction") return "🚧 Construction";
    if (category === "poor_lighting") return "💡 Poor Lighting";
    if (category === "suspicious_activity") return "🚨 Suspicious Activity";
    if (category === "police_presence") return "👮 Police Presence";
    if (category === "crowded_area") return "👥 Crowded Area";
    if (category === "other") return "📍 Other";
    return category.replace(/_/g, " ");
  };
const getReportIcon = (category: string, type: string) => {
  let color = "blue";

  if (category === "sos") {
    color = "red";
  } else if (category === "suspicious_activity") {
    color = "red";
  } else if (category === "police_presence") {
    color = "violet";
  } else if (
    category === "construction" ||
    category === "poor_lighting"
  ) {
    color = "orange";
  } else if (
    category === "safe_area" ||
    type === "safe"
  ) {
    color = "green";
  }

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};
  const getTimeAgo = (timestamp: any) => {
  // NOTE: imports above were moved to top to avoid syntax errors

  const reportTime =
    timestamp instanceof Date
      ? timestamp.getTime()
      : new Date(timestamp).getTime();

  const diffMinutes = Math.floor((Date.now() - reportTime) / (1000 * 60));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getReportExpiryHours = (report: any) => {
  if (report.category === "sos") return 1;
  if (report.category === "police_presence") return 2;
  if (report.type === "safe") return 12;
  if (report.severity === "high") return 6;
  if (report.severity === "medium") return 4;
  return 2;
};

const getTimeRemaining = (report: any) => {
  const reportTime =
    report.timestamp instanceof Date
      ? report.timestamp.getTime()
      : new Date(report.timestamp).getTime();

  const expiryHours = getReportExpiryHours(report);
  const expiresAt = reportTime + expiryHours * 60 * 60 * 1000;

  const remainingMinutes = Math.max(
    0,
    Math.ceil((expiresAt - Date.now()) / (1000 * 60))
  );

  if (remainingMinutes < 60) {
  return `${remainingMinutes} min`;
}

return `${Math.ceil(remainingMinutes / 60)}h`;
};

const nearbyReports = reports.filter((report) => {
  const reportTime =
    report.timestamp instanceof Date
      ? report.timestamp.getTime()
      : new Date(report.timestamp).getTime();

  const expiryHours = getReportExpiryHours(report);

  const isActive =
    Date.now() - reportTime <
    expiryHours * 60 * 60 * 1000;

  const distanceFromAnalysisCenter = getDistanceKm(
    analysisLat,
    analysisLng,
    report.latitude,
    report.longitude
  );

  const isNearby = distanceFromAnalysisCenter <= 5;

  return isActive && isNearby;
});
const historicalHeatmap = useHistoricalHeatmap(reports);
const heatmap = useHeatmap(nearbyReports);
const getHeatPointColor = (point: any) =>
  typeof point?.color === "string" && point.color
    ? point.color
    : "#F97316";

const filteredReports = (
  
  selectedFilter === "all"
    ? nearbyReports
    : nearbyReports.filter((r) => r.type === selectedFilter)
).sort((a, b) => {
  const distA = getDistanceKm(analysisLat, analysisLng, a.latitude, a.longitude);
  const distB = getDistanceKm(analysisLat, analysisLng, b.latitude, b.longitude);
  return distA - distB;
});

  const {
  safeCount,
  unsafeCount,
  highReports,
  mediumReports,
  lowReports,
  sosReports,
  safetyScore,
} = useSafetyAnalysis(nearbyReports);

  const scoreColor =
    safetyScore >= 85 ? "#4ADE80" : safetyScore >= 70 ? "#E8A838" : "#EF4444";

  const scoreLabel =
    safetyScore >= 85? "Safe" : safetyScore >= 70 ? "Caution" : "Unsafe";

  const riskMessage =
    safetyScore >= 85
      ? "Area looks stable"
      : safetyScore >= 70
      ? "Stay aware nearby"
      : "Avoid if possible";

  const trendMessage =
    unsafeCount > safeCount
      ? "Risk increasing"
      : safeCount > unsafeCount
      ? "Conditions improving"
      : "Stable activity";

  const recommendedAction =
    safetyScore >= 85
      ? "Move normally"
      : safetyScore >= 70
      ? "Stay alert"
      : "Avoid this area";

  const hotZone =
  unsafeCount >= 15
      ? "High Risk Zone"
      : unsafeCount >= 8
      ? "Elevated Risk"
      : "Normal Activity";
const threatLevel =
  sosReports >= 2
    ? "HIGH"
    : highReports >= 3
    ? "ELEVATED"
    : unsafeCount >= 8
    ? "GUARDED"
    : "LOW";
  const recentActivityLevel =
    nearbyReports.length >= 8
      ? "Heavy recent activity"
      : nearbyReports.length >= 4
      ? "Moderate recent activity"
      : "Low recent activity";

  const currentHour = new Date().getHours();

  const timeRisk =
    currentHour >= 22 || currentHour <= 5
      ? "Late-night caution active"
      : currentHour >= 18
      ? "Evening awareness advised"
      : "Daytime conditions";

  const lastUpdated = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const handleVote = async (
  reportId: string,
  type: "upvotes" | "downvotes"
) => {
  if (!user?.uid) {
    alert("Please sign in to vote.");
    return;
  }

  const report = reports.find((r) => r.id === reportId);

  if (report?.votedBy?.includes(user.uid)) {
    alert("You already voted on this report.");
    return;
  }

  try {
    await updateDoc(doc(db, "reports", reportId), {
      [type]: increment(1),
      votedBy: [...(report?.votedBy || []), user.uid],
    });

    console.log("Vote saved:", reportId, type);
  } catch (error) {
    console.error("Vote failed:", error);
  }
};

async function handleQuickUnsafeReport() {
  if (!location) return;

  let photoUrl = "";

  if (reportPhoto) {
    const photoRef = ref(
      storage,
      `reports/${Date.now()}-${reportPhoto.name}`
    );

    try {
      await uploadBytes(photoRef, reportPhoto);
      photoUrl = await getDownloadURL(photoRef);
    } catch (error) {
      console.error("Photo upload failed:", error);
      photoUrl = "";
    }
  }

  await submitReport({
    type: selectedQuickType === "safe_area" ? "safe" : "unsafe",
    category: selectedQuickType,
    description:
      quickDescription ||
      (selectedQuickType === "sos"
        ? "Emergency SOS reported"
        : "Quick unsafe report"),
    severity:
      selectedQuickType === "sos"
        ? "high"
        : selectedSeverity,
    latitude: lat,
    longitude: lng,
    address: location.address || "Unknown location",
    userId: user?.uid || "anonymous",
    userName: user?.displayName || "Anonymous User",
    photoUrl: photoUrl || "",
  });

  fetchReports();
  setQuickReportSent(true);

  setTimeout(() => {
    setQuickReportSent(false);
  }, 2000);
}

  
const aiSummary =
  safetyScore >= 85
    ? "Area calm with positive community activity"
    : safetyScore >= 70
    ? "Mostly stable with minor alerts nearby"
    : safetyScore >= 50
    ? "Mixed activity detected nearby"
    : "Elevated risk detected in this zone";
   const reportDensity =
  nearbyReports.length >= 8
    ? "High report density"
    : nearbyReports.length >= 4
    ? "Moderate report density"
    : "Low report density";
  

  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
      <div className="relative overflow-hidden h-full">
       {/* CitySense status */}
<button
  type="button"
  onClick={() => setShowSafetyCard((current) => !current)}
  className="absolute left-4 right-4 top-4 z-40 flex items-center justify-between rounded-[20px] border border-white/[0.07] bg-[#0B1515]/90 px-4 py-3 text-left shadow-xl backdrop-blur-xl"
>
  <div className="flex min-w-0 items-center gap-3">
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${scoreColor}16` }}
    >
      <ShieldCheck
        className="h-[18px] w-[18px]"
        style={{ color: scoreColor }}
      />
    </div>

    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-semibold text-[#F5F3EF]">
          {scoreLabel}
        </p>

        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: scoreColor }}
        />
      </div>

      <p className="mt-0.5 truncate text-[11px] text-[#607D79]">
        {riskMessage}
      </p>
    </div>
  </div>

  <div className="ml-3 flex shrink-0 items-center gap-3">
    <span
      className="text-lg font-bold tracking-[-0.04em]"
      style={{ color: scoreColor }}
    >
      {safetyScore}
    </span>

    <ChevronDown
      className={`h-4 w-4 text-[#607D79] transition-transform ${
        showSafetyCard ? "rotate-180" : ""
      }`}
    />
  </div>
</button>
  

{sosReports > 0 && (
 <div className="absolute bottom-[95px] left-1/2 -translate-x-1/2 z-50 bg-[#EF4444] text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-xl">
  🚨 {sosReports} ACTIVE SOS ALERT{sosReports > 1 ? "S" : ""} NEARBY
</div>
)}

        <MapContainer
  center={[lat, lng]}
  zoom={18}
  className="h-full w-full z-0"
>
         <FixMapSize />

<MapController
  latitude={lat}
  longitude={lng}
  recenterTrigger={recenterTrigger}
/>
<ReportFocusController report={focusedReport} />
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution="&copy; OpenStreetMap contributors"
/>
<RecenterMap latitude={lat} longitude={lng} />
<Marker position={[lat, lng]} icon={userIcon}>
  <Popup>
    📍 You are here
    <br />
    {location?.address}
  </Popup>
</Marker>
<Circle
  center={[lat, lng]}
  radius={1000}
  pathOptions={{
    color: "#5EEAD4",
    weight: 1,
    opacity: 0.22,
    fillColor: "#5EEAD4",
    fillOpacity: 0.025,
    dashArray: "6 8",
  }}
/>
<MapMovementDetector
  onMove={(latitude, longitude) => {
    setMovedMapCenter({
      latitude,
      longitude,
    });
  }}
/>
{/* Permanent hotspots */}
{historicalHeatmap.map((point, index) => {
  let color = "#FACC15"; // Yellow
  let radius = 80;

  if (point.intensity >= 0.5) {
    color = "#F97316"; // Orange
    radius = 120;
  }

  if (point.intensity >= 0.8) {
    color = "#EF4444"; // Red
    radius = 180;
  }

  return (
    <Circle
      key={`static-${index}`}
      center={[point.latitude, point.longitude]}
      radius={radius}
      pathOptions={{
        color,
        fillColor: color,
        fillOpacity: 0.25,
      }}
    />
  );
})}
{/* Live hotspots */}
{heatmap.map((point, index) => {
  const pointColor = getHeatPointColor(point);
  return (
    <Circle
      key={`live-${index}`}
      center={[point.latitude, point.longitude]}
      radius={point.radius}
      pathOptions={{
        color: pointColor,
        fillColor: pointColor,
        fillOpacity: 0.35,
      }}
    />
  );
})}

  {filteredReports.map((report) => (

    <Marker
      key={report.id}
      position={[report.latitude, report.longitude]}
      icon={getReportIcon(report.category, report.type)}
    >
      <Popup>
        <div className="text-sm">
          <strong>{getReportLabel(report.category)}</strong>
          <p>{report.description}</p>
          <p>
            Distance:{" "}
            {getDistanceKm(
              lat,
              lng,
              report.latitude,
              report.longitude
            ).toFixed(1)}
            km
          </p>
          <p>{getTimeAgo(report.timestamp)}</p>
        </div>
      </Popup>
    </Marker>
  ))}
</MapContainer>

      

  {showSafetyCard && (
   <div className="absolute left-4 right-4 top-[82px] z-30 rounded-[24px] border border-white/[0.07] bg-[#0B1515]/95 p-5 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          
          <div>
  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#607D79]">
    CitySense Intelligence
  </p>

  <h3 className="mt-1 text-[17px] font-semibold text-[#F5F3EF]">
    What&apos;s happening around you
  </h3>
</div>
        </div>

        <button
          onClick={() => setShowSafetyCard(false)}
          className="text-gray-400 hover:text-white text-lg"
        >
          ▼
        </button>
      </div>

      <p className="text-[9px] text-[#7BA3A1]">
        Updated {lastUpdated}
      </p>

      <p className="text-[10px] text-[#E8A838] mt-1 font-bold">
        {hotZone}
      </p>

      <p
        className={`text-[10px] font-bold mt-1 ${
          threatLevel === "HIGH"
            ? "text-[#EF4444]"
            : threatLevel === "ELEVATED"
            ? "text-[#F97316]"
            : threatLevel === "GUARDED"
            ? "text-[#E8A838]"
            : "text-[#4ADE80]"
        }`}
      >
        Threat Level: {threatLevel}
      </p>

      <div className="flex gap-3 mt-2 text-[9px] font-semibold">
        <span className="text-[#EF4444]">🔴 {highReports}</span>
        <span className="text-[#F97316]">🟠 {mediumReports}</span>
        <span className="text-[#E8A838]">🟡 {lowReports}</span>
      </div>

      <div className="flex gap-3 mt-2 text-[10px]">
        <span className="text-[#4ADE80]">
          {safeCount} safe
        </span>

        <span className="text-[#EF4444]">
          {unsafeCount} alerts
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3">

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            backgroundColor: `${scoreColor}20`,
            color: scoreColor,
          }}
        >
          {safetyScore}
        </div>

        <div className="flex-1">

          <div className="w-full h-1.5 bg-[#1A2E2D] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${safetyScore}%`,
                backgroundColor: scoreColor,
              }}
            />
          </div>

          <p className="text-[8px] text-[#7BA3A1] mt-1">
            Safety confidence level
          </p>

          <p
            className="text-sm font-semibold mt-1"
            style={{ color: scoreColor }}
          >
            {scoreLabel}
          </p>

          <p className="text-[10px] text-[#7BA3A1]">
            {riskMessage}
          </p>
        </div>

      </div>

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-[10px] text-[#E8A838] mt-3 underline"
      >
        {showDetails
          ? "Hide details"
          : "Show details"}
      </button>

      {showDetails && (
        <>
          <p className="text-[9px] text-[#E8A838] mt-2 italic">
            {aiSummary}
          </p>

          <p className="text-[9px] text-[#7BA3A1] mt-1">
            {reportDensity}
          </p>

          <p className="text-[9px] text-[#F5F3EF] mt-1 font-semibold">
            Recommended: {recommendedAction}
          </p>

          <div className="flex items-center gap-1 mt-1">
            <span>
              {unsafeCount > safeCount
                ? "🔺"
                : safeCount > unsafeCount
                ? "🟢"
                : "➖"}
            </span>

            <p className="text-[9px] text-[#E8A838]">
              {trendMessage}
            </p>
          </div>

          <p className="text-[9px] text-[#7BA3A1] mt-1">
            {recentActivityLevel}
          </p>

          <p className="text-[9px] text-[#E8A838] mt-1">
            {timeRisk}
          </p>
        </>
      )}

    </div>
  )}
      

   {/* Search moved map area */}
{movedMapCenter && (
  <button
    type="button"
    onClick={() => {
      setAnalysisCenter({
        latitude: movedMapCenter.latitude,
        longitude: movedMapCenter.longitude,
      });

      setMovedMapCenter(null);
      setShowNearbyReports(true);
    }}
    className="absolute left-4 top-[92px] z-50 rounded-full border border-white/[0.08] bg-[#0B1515]/95 px-4 py-2 text-[11px] font-semibold text-[#F5F3EF] shadow-xl backdrop-blur-xl transition active:scale-95"
  >
    Search this area
  </button>
)}

<div className="absolute bottom-12 left-1/2 z-[70] flex -translate-x-1/2 flex-col items-center gap-2">
  {showReportActions && (
    <div className="mb-1 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => {
          setSelectedQuickType("suspicious_activity");
          setShowReportModal(true);
          setShowReportActions(false);
        }}
        className="rounded-full border border-white/[0.07] bg-[#0B1515]/95 px-4 py-2 text-xs font-medium text-[#F5F3EF] shadow-xl backdrop-blur-xl"
      >
        Suspicious activity
      </button>

      <button
        type="button"
        onClick={() => {
          setSelectedQuickType("police_presence");
          setShowReportModal(true);
          setShowReportActions(false);
        }}
        className="rounded-full border border-white/[0.07] bg-[#0B1515]/95 px-4 py-2 text-xs font-medium text-[#F5F3EF] shadow-xl backdrop-blur-xl"
      >
        Police presence
      </button>

      <button
        type="button"
        onClick={() => {
          setSelectedQuickType("safe_area");
          setShowReportModal(true);
          setShowReportActions(false);
        }}
        className="rounded-full border border-white/[0.07] bg-[#0B1515]/95 px-4 py-2 text-xs font-medium text-[#5EEAD4] shadow-xl backdrop-blur-xl"
      >
        Mark area safe
      </button>

      <button
        type="button"
        onClick={() => {
          setSelectedQuickType("sos");
          setShowReportModal(true);
          setShowReportActions(false);
        }}
        className="rounded-full border border-[#E86A6A]/20 bg-[#241515]/95 px-4 py-2 text-xs font-semibold text-[#E86A6A] shadow-xl backdrop-blur-xl"
      >
        Emergency SOS
      </button>
    </div>
  )}

  <button
    type="button"
    onClick={() => setShowReportActions((current) => !current)}
    className={`flex h-12 items-center gap-2 rounded-full border px-4 shadow-xl backdrop-blur-xl transition active:scale-95 ${
      showReportActions
        ? "border-white/[0.09] bg-[#F5F3EF] text-[#0B1515]"
        : "border-white/[0.07] bg-[#0B1515]/95 text-[#F5F3EF]"
    }`}
  >
    <span
      className={`text-xl leading-none transition-transform ${
        showReportActions ? "rotate-45" : ""
      }`}
    >
      +
    </span>

    <span className="text-xs font-semibold">
      Report
    </span>
  </button>
</div>
{location && (
  <div className="absolute bottom-52 left-4 bg-[#0F1E1E] rounded-xl px-3 py-2 border border-[#2D5A5840] max-w-[45%] z-50">
    <div className="flex items-center gap-1.5">
      <MapPin className="w-3 h-3 text-[#E8A838]" />
      <p className="text-xs text-[#F5F3EF] truncate">{location.address}</p>
    </div>
  </div>
)}

{/* Alert mode */}
<div className="absolute left-4 bottom-12 z-40">
  <div className="h-12 px-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xl border bg-[#2A0F0F]/95 text-[#EF4444] border-[#EF444460] backdrop-blur-md">
    ALERT MODE
  </div>
</div>

{/* Report button */}

       <div className="absolute top-24 right-4 flex gap-2 z-40">
          {(["all", "safe", "unsafe"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                selectedFilter === filter
                  ? "bg-[#E8A838] text-[#0F1E1E]"
                  : "bg-[#0F1E1EE8] text-[#7BA3A1] border border-[#2D5A5840]"
              }`}
            >
              {filter === "all" ? "All" : filter === "safe" ? "Safe" : "Alerts"}
            </button>
          ))}
        </div>

       <button
  type="button"
 onClick={() => {
  setAnalysisCenter(null);
  setMovedMapCenter(null);
  setRecenterTrigger((current) => current + 1);
}}
  aria-label="Recenter map on my location"
  className="absolute bottom-10 right-4 z-50 w-11 h-11 bg-[#E8A838] rounded-full flex items-center justify-center shadow-lg shadow-[#E8A83830] active:scale-95 transition-transform"
>
  <Navigation className="w-5 h-5 text-[#0F1E1E]" />
</button>
{showReportModal && (
  <>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-[#F5F3EF] mb-3">
          New Report
        </h2>

        <p className="text-xs text-[#7BA3A1] mb-4">
          Reporting as: {getReportLabel(selectedQuickType)}
        </p>

        <div className="mb-4">
          <p className="text-xs text-[#7BA3A1] mb-2">Severity</p>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedSeverity("low")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                selectedSeverity === "low"
                  ? "bg-[#E8A838] text-[#0F1E1E]"
                  : "bg-[#0F1E1E] text-[#7BA3A1]"
              }`}
            >
              Low
            </button>

            <button
              onClick={() => setSelectedSeverity("medium")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                selectedSeverity === "medium"
                  ? "bg-[#F97316] text-white"
                  : "bg-[#0F1E1E] text-[#7BA3A1]"
              }`}
            >
              Medium
            </button>

            <button
              onClick={() => setSelectedSeverity("high")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold ${
                selectedSeverity === "high"
                  ? "bg-[#EF4444] text-white"
                  : "bg-[#0F1E1E] text-[#7BA3A1]"
              }`}
            >
              High
            </button>
          </div>
        </div>

        <textarea
          value={quickDescription}
          onChange={(e) => setQuickDescription(e.target.value)}
          placeholder="Describe what is happening..."
          className="w-full h-24 rounded-xl bg-[#0F1E1E] border border-[#2D5A5840] text-[#F5F3EF] text-sm p-3 resize-none outline-none"
        />

        <div className="mt-3">
          <label className="block text-xs text-[#7BA3A1] mb-2">
            Add photo
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
            className="w-full text-xs text-[#7BA3A1]"
          />

          {reportPhoto && (
            <div className="text-[10px] text-[#E8A838] mt-1">
              Photo selected: {reportPhoto.name}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              setShowReportModal(false);
              setReportPhoto(null);
            }}
            className="flex-1 py-2 rounded-xl bg-[#0F1E1E] text-[#7BA3A1]"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              await handleQuickUnsafeReport();
              setShowReportModal(false);
              setQuickDescription("");
              setReportPhoto(null);
            }}
            className="flex-1 py-2 rounded-xl bg-[#E8A838] text-[#0F1E1E] font-bold"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
    </>
  )}

  {quickReportSent && (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[#4ADE80] px-4 py-2 text-xs font-bold text-[#0F1E1E] shadow-lg">
      Report submitted successfully!
    </div>
  )}

 {/* Nearby activity */}
<div className="absolute bottom-32 left-4 right-4 z-40">
  <div className="overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0B1515]/92 shadow-2xl backdrop-blur-xl">
    <button
      type="button"
      onClick={() => setShowNearbyReports((current) => !current)}
      className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-semibold text-[#F5F3EF]">
            Nearby activity
          </p>

          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-[#A8B8B5]">
            {filteredReports.length}
          </span>
        </div>

        <p className="mt-1 truncate text-[11px] text-[#607D79]">
          {filteredReports.length === 0
            ? "No recent community signals nearby"
            : unsafeCount > 0
            ? `${unsafeCount} alert${unsafeCount === 1 ? "" : "s"} nearby · tap for details`
            : "Community signals look calm nearby"}
        </p>
      </div>

      <ChevronDown
        className={`h-4 w-4 shrink-0 text-[#607D79] transition-transform ${
          showNearbyReports ? "rotate-180" : ""
        }`}
      />
    </button>

    {showNearbyReports && (
      <div className="max-h-64 overflow-y-auto border-t border-white/[0.055] px-4 pb-4">
        {filteredReports.length === 0 ? (
          <div className="py-5 text-center">
            <ShieldCheck className="mx-auto h-5 w-5 text-[#5EEAD4]" />

            <p className="mt-2 text-xs font-medium text-[#D9E2E0]">
              Nothing recent nearby
            </p>

            <p className="mt-1 text-[10px] text-[#607D79]">
              CitySense will surface new community activity here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.045]">
            {filteredReports.slice(0, 6).map((report: any) => (
              <div
  key={report.id}
  onClick={() => {
    setFocusedReport({
      latitude: report.latitude,
      longitude: report.longitude,
    });

    setShowNearbyReports(false);
  }}
  className="flex cursor-pointer items-start gap-3 py-3 transition-opacity active:opacity-70"
>
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    report.type === "safe"
                      ? "bg-[#5EEAD4]/10"
                      : "bg-[#E86A6A]/10"
                  }`}
                >
                  {report.type === "safe" ? (
                    <ShieldCheck className="h-4 w-4 text-[#5EEAD4]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[#E86A6A]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-xs font-medium text-[#E4E9E7]">
                      {getReportLabel(report.category)}
                    </p>

                    <span className="shrink-0 text-[9px] text-[#607D79]">
                      {getTimeAgo(report.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-[10px] text-[#607D79]">
                    {report.address}
                  </p>

                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="text-[10px] text-[#A8B8B5]">
                      {getDistanceKm(
                        lat,
                        lng,
                        report.latitude,
                        report.longitude
                      ).toFixed(1)}{" "}
                      km
                    </span>

                    {getTimeRemaining(report) !== "0 min" && (
                      <span className="text-[10px] text-[#607D79]">
                        {getTimeRemaining(report)} remaining
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={(e) => {
  e.stopPropagation();
  handleVote(report.id!, "upvotes");
}}
                      className="text-[10px] font-medium text-[#5EEAD4]"
                    >
                      Helpful {report.upvotes || 0}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
  e.stopPropagation();
  handleVote(report.id!, "downvotes");
}}
                      className="text-[10px] font-medium text-[#8A706F]"
                    >
                      Not useful {report.downvotes || 0}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>
</div>
</div>
</div>
  );
}
