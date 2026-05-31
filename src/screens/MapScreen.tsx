import { useEffect, useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export default function MapScreen() {
  const { location } = useLocation();
 const { reports, fetchReports, submitReport } = useReports();
  const { user } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState<"all" | "safe" | "unsafe">("all");
  const [showDetails, setShowDetails] = useState(false);
  const [quickReportSent, setQuickReportSent] = useState(false);
 
  const [showReportModal, setShowReportModal] = useState(false);
const [quickDescription, setQuickDescription] = useState("");
const [reportPhoto, setReportPhoto] = useState<File | null>(null);
const [selectedSeverity, setSelectedSeverity] = useState<
  "low" | "medium" | "high"
>("medium");
  const [selectedQuickType, setSelectedQuickType] = useState<
  "suspicious_activity" | "police_presence" | "safe_area"
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

  const getTimeAgo = (timestamp: any) => {
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

const nearbyReports = reports.filter(
  (r) => getDistanceKm(lat, lng, r.latitude, r.longitude) <= 2
);

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
  Math.min(100, 70 + safeCount * 5 - unsafeImpact - sosReports * 25)
);

  const scoreColor =
    safetyScore >= 80 ? "#4ADE80" : safetyScore >= 60 ? "#E8A838" : "#EF4444";

  const scoreLabel =
    safetyScore >= 80 ? "Safe" : safetyScore >= 60 ? "Caution" : "Unsafe";

  const riskMessage =
    safetyScore >= 80
      ? "Area looks stable"
      : safetyScore >= 60
      ? "Stay aware nearby"
      : "Avoid if possible";

  const trendMessage =
    unsafeCount > safeCount
      ? "Risk increasing"
      : safeCount > unsafeCount
      ? "Conditions improving"
      : "Stable activity";

  const recommendedAction =
    safetyScore >= 80
      ? "Move normally"
      : safetyScore >= 60
      ? "Stay alert"
      : "Avoid this area";

  const hotZone =
    unsafeCount >= 5
      ? "High Risk Zone"
      : unsafeCount >= 3
      ? "Elevated Risk"
      : "Normal Activity";
const threatLevel =
  safetyScore < 50 || highReports >= 3 || sosReports > 0
    ? "HIGH"
    : safetyScore < 65 || unsafeCount >= 5
    ? "ELEVATED"
    : safetyScore < 80 || unsafeCount >= 2
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
 const handleQuickUnsafeReport = async () => {
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
    description: quickDescription || "Quick unsafe report",
    severity: selectedSeverity,
    latitude: lat,
    longitude: lng,
    address: location.address || "Unknown location",
   userId: user?.uid || "anonymous",
    photoUrl: photoUrl || "",
  });

  fetchReports();
  setQuickReportSent(true);

  setTimeout(() => {
    setQuickReportSent(false);
  }, 2000);
};
  
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
      <div
        className="relative overflow-hidden"
        style={{ height: "calc(100vh - 180px)" }}
      >
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
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
            lng - 0.01
          }%2C${lat - 0.01}%2C${lng + 0.01}%2C${
            lat + 0.01
          }&layer=mapnik&marker=${lat}%2C${lng}`}
          className="w-full h-full border-0"
          title="CitySense Map"
        />

        {filteredReports.slice(0, 8).map((report, index) => (
          <div
            key={report.id}
           className="absolute z-10"
            style={{
              top: `${35 + (index % 4) * 12}%`,
              left: `${40 + (index % 5) * 10}%`,
            }}
          >
            <div className="relative">
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0F1E1EE8] text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
  {getReportLabel(report.category)}
</div>
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                  report.category === "sos"
  ? "bg-[#EF4444]"
  : report.category === "police_presence"
  ? "bg-[#3B82F6]"
  : report.type === "safe"
  ? "bg-[#4ADE80]"
  : report.severity === "high"
  ? "bg-[#EF4444]"
  : report.severity === "medium"
  ? "bg-[#F97316]"
  : "bg-[#E8A838]"
                }`}
              />

              {report.type === "unsafe" && (
                <div className="absolute inset-0 rounded-full bg-[#EF444480] animate-ping" />
              )}
              {report.type === "unsafe" && (
  <div
    className={`absolute rounded-full blur-xl opacity-30 -z-10 ${
      report.severity === "high"
        ? "bg-[#EF4444] w-16 h-16 -top-6 -left-6"
        : "bg-[#F97316] w-12 h-12 -top-4 -left-4"
    }`}
  />
)}
            </div>
          </div>
        ))}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-[#E8A838] border-4 border-white shadow-lg" />
            <div className="absolute inset-0 rounded-full bg-[#E8A83880] animate-ping" />
          </div>
        </div>

        <div className="absolute top-4 left-4 z-30 bg-[#0F1E1E] rounded-2xl px-4 py-3 border border-[#2D5A5840] shadow-xl max-w-[230px]">
          <div className="flex items-center gap-2">
  <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />

  <p className="text-[10px] uppercase tracking-wider text-[#7BA3A1] font-semibold">
    Area Safety
  </p>
</div>

          <p className="text-[9px] text-[#7BA3A1] mt-1">Updated {lastUpdated}</p>

          <p className="text-[10px] text-[#E8A838] mt-1 font-bold">{hotZone}</p>
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
        <div className="flex gap-3 mt-1 text-[9px] font-semibold">
  <span className="text-[#EF4444]">🔴 {highReports}</span>
  <span className="text-[#F97316]">🟠 {mediumReports}</span>
  <span className="text-[#E8A838]">🟡 {lowReports}</span>
</div>

          <div className="flex gap-3 mt-1 text-[10px]">
            <span className="text-[#4ADE80]">{safeCount} safe</span>
            <span className="text-[#EF4444]">{unsafeCount} alerts</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor,
              }}
            >
              {safetyScore}
            </div>
            <div className="mt-2">
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
</div>

            <div>
              <p className="text-sm font-semibold" style={{ color: scoreColor }}>
                {scoreLabel}
              </p>
              <p className="text-[10px] text-[#7BA3A1]">{riskMessage}</p>
            </div>
          </div>
          


    
{quickReportSent && (
  <div className="absolute bottom-44 left-1/2 -translate-x-1/2 z-30 bg-[#4ADE8020] border border-[#4ADE8060] text-[#4ADE80] px-4 py-2 rounded-full text-xs font-bold shadow-lg">
    Report sent
  </div>
)}



          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[9px] text-[#E8A838] mt-1 underline"
          >
            {showDetails ? "Hide details" : "Show details"}
          </button>

          {showDetails && (
            <>
            <p className="text-[9px] text-[#E8A838] mt-1 italic">
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
              <p className="text-[9px] text-[#7BA3A1] mt-1">{recentActivityLevel}</p>
              <p className="text-[9px] text-[#E8A838] mt-1">{timeRisk}</p>
            </>
          )}
        </div>
      
      <div className="absolute bottom-28 right-4 flex flex-col gap-2 z-40">
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
</div>
{location && (
  <div className="absolute bottom-4 left-4 bg-[#0F1E1E] rounded-xl px-3 py-2 border border-[#2D5A5840] max-w-[45%] z-50">
    <div className="flex items-center gap-1.5">
      <MapPin className="w-3 h-3 text-[#E8A838]" />
      <p className="text-xs text-[#F5F3EF] truncate">{location.address}</p>
    </div>
  </div>
)}

<div className="absolute bottom-4 left-[220px] z-50">
  <div className="px-2 py-1 rounded-lg text-[9px] font-bold shadow-xl border bg-[#2A0F0F] text-[#EF4444] border-[#EF444460]">
    ALERT MODE
  </div>
</div>

<button
  onClick={() => {
    console.log("PLUS CLICKED");
    setShowReportModal(true);
  }}
  className="absolute bottom-4 right-20 w-12 h-12 bg-[#EF4444] rounded-full flex items-center justify-center shadow-lg shadow-[#EF444430] text-white text-2xl font-bold active:scale-95 transition-transform z-50"
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
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
    <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-5 w-full max-w-sm shadow-2xl">
      
      <h2 className="text-lg font-bold text-[#F5F3EF] mb-3">
        New Report
      </h2>

      <p className="text-xs text-[#7BA3A1] mb-4">
        Reporting as: {getReportLabel(selectedQuickType)}
      </p>
<div className="mb-4">
  <p className="text-xs text-[#7BA3A1] mb-2">
    Severity
  </p>

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
)}
        
      </div>

      <div className="bg-[#1A2E2D] border-t border-[#2D5A5840] px-4 py-3 max-h-[35%] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#F5F3EF]">Nearby Reports</h3>
          <span className="text-xs text-[#7BA3A1]">{filteredReports.length} reports</span>
        </div>

        <div className="space-y-2">
          {filteredReports.slice(0, 4).map((report) => (
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
<p className="text-[9px] text-[#E8A838]">
  Expires in {getTimeRemaining(report)}
</p>

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
              </div>
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
<div className="flex flex-col gap-1 mr-2">
  <button
    onClick={() => console.log("confirm", report.id)}
    className="text-[10px] text-[#4ADE80] font-semibold"
  >
    👍 {report.upvotes || 0}
  </button>
  <button
    onClick={() => console.log("dispute", report.id)}
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
  );
}