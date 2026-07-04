import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
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
} from "lucide-react";

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
  const [showSafetyCard, setShowSafetyCard] = useState(true);

  const [selectedFilter, setSelectedFilter] = useState<"all" | "safe" | "unsafe">("all");
  const [showDetails, setShowDetails] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
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
const getReportIcon = (type: string) => {
  let color = "blue";

  switch (type) {
    case "suspicious":
      color = "red";
      break;

    case "safe":
      color = "green";
      break;

    case "police":
      color = "violet";
      break;

    case "hazard":
      color = "orange";
      break;
  }

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
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

  return Date.now() - reportTime <
    expiryHours * 60 * 60 * 1000;
});

const filteredReports = (
  selectedFilter === "all"
    ? nearbyReports
    : nearbyReports.filter((r) => r.type === selectedFilter)
).sort((a, b) => {
  const distA = getDistanceKm(lat, lng, a.latitude, a.longitude);
  const distB = getDistanceKm(lat, lng, b.latitude, b.longitude);
  return distA - distB;
});

  const safeCount = nearbyReports.filter((r) => r.type === "safe").length;
  const unsafeCount = nearbyReports.filter((r) => r.type === "unsafe").length;
const highReports = nearbyReports.filter((r) => r.severity === "high").length;
const mediumReports = nearbyReports.filter((r) => r.severity === "medium").length;
const lowReports = nearbyReports.filter((r) => r.severity === "low").length;
const sosReports = nearbyReports.filter((r) => r.category === "sos").length;
  const unsafeImpact = nearbyReports.reduce((total, r) => {
    if (r.type !== "unsafe") return total;
    if (r.severity === "high") return total + 15;
    if (r.severity === "medium") return total + 8;
    return total + 4;
  }, 0);

  const safetyScore = Math.max(
  0,
  Math.min(
    100,
    100 +
      safeCount * 2 -
      unsafeImpact * 0.5 -
      sosReports * 30
  )
);

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
       <div
  className={`absolute top-0 left-0 right-0 z-40 text-center py-2 text-xs font-bold tracking-wider shadow-lg ${
    threatLevel === "HIGH" ? "animate-pulse" : ""
  } ${
    threatLevel === "HIGH"
      ? "bg-[#EF4444] text-white"
      : threatLevel === "ELEVATED"
      ? "bg-[#F97316] text-white"
      : threatLevel === "GUARDED"
      ? "bg-[#E8A838] text-[#0F1E1E]"
      : "bg-[#4ADE80] text-[#0F1E1E]"
  }`}
>
  {threatLevel === "HIGH"
    ? "🚨 HIGH THREAT"
    : threatLevel === "ELEVATED"
    ? "⚠️ ELEVATED THREAT"
    : threatLevel === "GUARDED"
    ? "🟡 GUARDED"
    : "🟢 LOW THREAT"}
</div>

{sosReports > 0 && (
 <div className="absolute bottom-[95px] left-1/2 -translate-x-1/2 z-50 bg-[#EF4444] text-white px-4 py-2 rounded-full text-xs font-bold animate-pulse shadow-xl">
  🚨 {sosReports} ACTIVE SOS ALERT{sosReports > 1 ? "S" : ""} NEARBY
</div>
)}

        <MapContainer
  center={[lat, lng]}
  zoom={15}
  className="h-full w-full z-0"
>
          <FixMapSize />
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
    color: "#22c55e",
    fillColor: "#22c55e",
    fillOpacity: 0.1,
  }}
/>
  {filteredReports.map((report) => (
    <Marker
      key={report.id}
      position={[report.latitude, report.longitude]}
      icon={getReportIcon(report.type)}
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

       {!showSafetyCard && (
  <button
    onClick={() => setShowSafetyCard(true)}
    className="absolute top-12 left-4 z-50 bg-[#0F1E1E] text-[#E8A838] rounded-full px-4 py-2 text-xs font-bold shadow-lg"
  >
    🛡️ Show Safety
  </button>
)}

  {showSafetyCard && (
    <div className="absolute top-20 left-4 z-30 w-60 bg-[#111827]/95 rounded-2xl p-3 shadow-xl border border-[#2D5A5840]">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400">🛡️</span>
          <h3 className="text-white font-bold">
            AREA SAFETY
          </h3>
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
      

      
      <div className="absolute bottom-72 right-4 flex flex-col gap-2 z-40">
  <button
    onClick={() => setSelectedQuickType("suspicious_activity")}
    className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
      selectedQuickType === "suspicious_activity"
        ? "bg-[#EF4444] text-white"
        : "bg-[#0F1E1EE8] text-[#7BA3A1]"
    }`}
  >
    Suspicious
  </button>

  <button
    onClick={() => setSelectedQuickType("police_presence")}
    className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
      selectedQuickType === "police_presence"
        ? "bg-[#E8A838] text-[#0F1E1E]"
        : "bg-[#0F1E1EE8] text-[#7BA3A1]"
    }`}
  >
    Police
  </button>

  <button
    onClick={() => setSelectedQuickType("safe_area")}
    className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
      selectedQuickType === "safe_area"
        ? "bg-[#4ADE80] text-[#0F1E1E]"
        : "bg-[#0F1E1EE8] text-[#7BA3A1]"
    }`}
  >
    Safe
  </button>
  <button
  onClick={() => setSelectedQuickType("sos")}
  className={`px-3 py-1 rounded-full text-[10px] font-semibold ${
    selectedQuickType === "sos"
      ? "bg-[#EF4444] text-white animate-pulse"
      : "bg-[#0F1E1EE8] text-[#7BA3A1]"
  }`}
>
  🚨 SOS
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

<div className="absolute left-4 right-4 bottom-14 z-40">
  <div className="px-2 py-1 rounded-lg text-[9px] font-bold shadow-xl border bg-[#2A0F0F] text-[#EF4444] border-[#EF444460]">
    ALERT MODE
  </div>
</div>

<button
  onClick={() => {
    console.log("PLUS CLICKED");
    setShowReportModal(true);
  }}
  className="absolute bottom-12 right-20 w-12 h-12 bg-[#EF4444] rounded-full flex items-center justify-center shadow-lg shadow-[#EF444430] text-white text-2xl font-bold active:scale-95 transition-transform z-50"
>
  +
</button>
       <div className="absolute top-12 right-4 flex gap-2 z-40">
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
          onClick={() => window.location.reload()}
          className="absolute bottom-4 right-4 w-11 h-11 bg-[#E8A838] rounded-full flex items-center justify-center shadow-lg shadow-[#E8A83830]"
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

  <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0F1E1E] via-[#0F1E1E80] to-transparent pointer-events-none z-30" />

  <div className="absolute bottom-20 left-0 right-0 max-h-48 overflow-y-auto z-40 px-4 pt-2">
    <div className="bg-[#0F1E1E80] backdrop-blur rounded-xl p-3 border border-[#2D5A5820]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#F5F3EF]">Nearby Reports</h3>
        <span className="text-xs text-[#7BA3A1]">{filteredReports.length} reports</span>
      </div>

      <div className="space-y-2">
        {filteredReports.slice(0, 4).map((report: any) => (
          <div
            key={report.id}
            className="flex items-start gap-3 bg-[#0F1E1E60] rounded-xl px-3 py-2.5 border border-[#2D5A5820]"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                report.type === "safe"
                  ? "bg-[#4ADE8020]"
                  : report.severity === "high"
                  ? "bg-[#7F1D1D]"
                  : report.severity === "medium"
                  ? "bg-[#EF444420]"
                  : "bg-[#F9731620]"
              }`}
            >
              {report.type === "safe" ? (
                <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F5F3EF] truncate">
                {getReportLabel(report.category)}
              </p>

              <p className="text-[11px] text-[#7BA3A1] truncate">
                {report.address}
              </p>

              <p className="text-[10px] text-[#E8A838]">
                {getDistanceKm(
                  lat,
                  lng,
                  report.latitude,
                  report.longitude
                ).toFixed(1)}{" "}
                km away
              </p>
              <p className="text-[10px] text-[#7BA3A1]">
                Fresh • {getTimeAgo(report.timestamp)}
              </p>
              {getTimeRemaining(report) !== "0 min" && (
                <p className="text-[9px] text-[#E8A838]">
                  Expires in {getTimeRemaining(report)}
                </p>
              )}

              <p
                className={`text-[10px] font-bold ${
                  report.severity === "high"
                    ? "text-[#EF4444]"
                    : report.severity === "medium"
                    ? "text-[#F97316]"
                    : "text-[#E8A838]"
                }`}
              >
                Severity: {report.severity?.toUpperCase()}
              </p>
              <p className="text-[9px] text-[#7BA3A1]">
                {report.type === "safe" ? "Community safe signal" : "Community alert signal"}
              </p>
              <div>
                <p className="text-[9px] text-[#E8A838]">
                  Source: CitySense user
                </p>

                <p className="text-[9px] text-[#E8A838] mt-1">
                  📷 Photo available
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 mr-2">
              <button
                onClick={() => handleVote(report.id!, "upvotes")}
                className="text-[10px] text-[#4ADE80] font-semibold"
              >
                👍 {report.upvotes || 0}
              </button>
              <button
                onClick={() => handleVote(report.id!, "downvotes")}
                className="text-[10px] text-[#EF4444] font-semibold"
              >
                👎 {report.downvotes || 0}
              </button>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                report.type === "safe"
                  ? "bg-[#4ADE8020] text-[#4ADE80]"
                  : report.severity === "high"
                  ? "bg-[#7F1D1D] text-[#FCA5A5]"
                  : report.severity === "medium"
                  ? "bg-[#EF444420] text-[#EF4444]"
                  : "bg-[#F9731620] text-[#FDBA74]"
              }`}
            >
              {report.severity ? `${report.type} • ${report.severity}` : report.type}
            </span>
          </div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-[#7BA3A1]">No reports in this area</p>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
</div>
  );
}
