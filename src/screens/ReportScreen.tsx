import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
import { AlertTriangle, ShieldCheck, Camera, MapPin, Send, CheckCircle } from "lucide-react";
import LocationPickerMap from "@/components/LocationPickerMap";
import LocationSearch from "@/components/LocationSearch";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
const CATEGORIES = [
  { id: "crime", label: "🚔 Crime" },
  { id: "traffic", label: "🚗 Traffic" },
  { id: "environment", label: "🌧 Environment" },
  { id: "medical", label: "🏥 Medical" },
  { id: "community", label: "👥 Community" },
];
  
const INCIDENT_TYPES: Record<string, string[]> = {
  crime: [
    "Robbery",
    "Assault",
    "Burglary",
    "Gunshots",
    "Vandalism",
  ],
  traffic: [
    "Accident",
    "Aggressive Driver",
    "Drunk Driver",
    "Road Rage",
    "Street Racing",
  ],
  environment: [
    "Flood",
    "Fire",
    "Gas Leak",
    "Power Outage",
  ],
  medical: [
    "Medical Emergency",
    "Injured Person",
    "Heart Attack",
  ],
  community: [
    "Missing Person",
    "Lost Child",
    "Animal Hazard",
  ],
};
const DESCRIPTION_PLACEHOLDERS: Record<string, string> = {
  Robbery: "Describe what happened, suspect description, direction of travel...",
  Assault: "Describe the incident, injuries, and whether emergency services are needed...",
  Burglary: "Describe the location, entry point, and any suspects seen...",
  Gunshots: "How many shots were heard? Which direction did they come from?",
  Vandalism: "Describe the damage and any suspects seen...",

  Accident: "Describe the vehicles involved and whether there are injuries...",
  "Aggressive Driver": "Vehicle make, model, color, license plate (if known)...",
  "Drunk Driver": "Describe the vehicle, driving behavior, and direction of travel...",
  "Road Rage": "Describe what happened and the vehicles involved...",
  "Street Racing": "Number of vehicles, location, direction of travel...",

  Flood: "How deep is the water? Is the road still passable?",
  Fire: "Describe the fire and whether emergency services are on scene...",
  "Gas Leak": "Describe any smell, location, and immediate danger...",
  "Power Outage": "Which area is affected?",

  "Medical Emergency": "Describe the person's condition and whether an ambulance is needed...",
  "Injured Person": "Describe the injuries and exact location...",
  "Heart Attack": "Describe the situation and confirm emergency services have been called...",

  "Missing Person": "Description, clothing, last known location...",
  "Lost Child": "Description, age, clothing, last seen...",
  "Animal Hazard": "Describe the animal and exact location...",
};
export default function ReportScreen() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { submitReport } = useReports();
  const [reportType, setReportType] = useState<"safe" | "unsafe">("unsafe");
  const [category, setCategory] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
const [severity, setSeverity] = useState<"low" | "medium" | "high">("medium");
const [timeOfIncident, setTimeOfIncident] = useState("Just now");
const [useCurrentLocation, setUseCurrentLocation] = useState(true);
const [showLocationPicker, setShowLocationPicker] = useState(false);
const [selectedIncidentLocation, setSelectedIncidentLocation] = useState<{
  latitude: number;
  longitude: number;
  address: string;
} | null>(null);
const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
const [reportPhoto, setReportPhoto] = useState<File | null>(null);
const [photoPreview, setPhotoPreview] = useState<string | null>(null);

useEffect(() => {
  if (!reportPhoto) {
    setPhotoPreview(null);
    return;
  }

  const previewUrl = URL.createObjectURL(reportPhoto);
  setPhotoPreview(previewUrl);

  return () => {
    URL.revokeObjectURL(previewUrl);
  };
}, [reportPhoto]);
  const handleSubmit = async () => {
  if (!category || !incidentType || !user?.uid) return;

  setSubmitting(true);

  let photoUrl = "";

  if (reportPhoto) {
    try {
      const photoRef = ref(
        storage,
        `reports/${user.uid}/${Date.now()}-${reportPhoto.name}`
      );

      await uploadBytes(photoRef, reportPhoto);
      photoUrl = await getDownloadURL(photoRef);
    } catch (error) {
      console.error("Photo upload failed:", error);
    }
  }

  const ok = await submitReport({
      type: reportType,
      category,
      description,
      severity,
      userId: user?.uid ?? "",
      photoUrl,
      latitude: useCurrentLocation
        ? (location?.latitude ?? 40.7128)
        : (selectedIncidentLocation?.latitude ?? location?.latitude ?? 40.7128),
      longitude: useCurrentLocation
        ? (location?.longitude ?? -74.006)
        : (selectedIncidentLocation?.longitude ?? location?.longitude ?? -74.006),
      address: useCurrentLocation
        ? (location?.address ?? "Unknown location")
        : (selectedIncidentLocation?.address ?? "Unknown location"),
      
    });
    if (ok) {
  setSubmitted(true);

  setTimeout(() => {
    setSubmitted(false);
    setCategory("");
    setDescription("");
    setReportType("unsafe");
    setReportPhoto(null);
  }, 3000);
}
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0F1E1E] px-6">
        <div className="w-16 h-16 rounded-full bg-[#4ADE8020] flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-[#4ADE80]" />
        </div>
        <h3 className="text-lg font-bold text-[#F5F3EF]">Report Submitted!</h3>
        <p className="text-sm text-[#7BA3A1] mt-2 text-center">Thank you for helping keep the community safe.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-[#F5F3EF]">Report</h2>
        <p className="text-xs text-[#7BA3A1] mt-0.5">Mark an area as safe or unsafe</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Report Type Toggle */}
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => setReportType("unsafe")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              reportType === "unsafe"
                ? "bg-[#EF444420] border-2 border-[#EF4444] text-[#EF4444]"
                : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Unsafe
          </button>
          <button
            onClick={() => setReportType("safe")}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
              reportType === "safe"
                ? "bg-[#4ADE8020] border-2 border-[#4ADE80] text-[#4ADE80]"
                : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Safe
          </button>
        </div>

        {/* Location */}
        <div className="mt-4 bg-[#1A2E2D] rounded-xl px-4 py-3 border border-[#2D5A5820] flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#E8A838] shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-[#7BA3A1]">Current Location</p>
            <p className="text-sm text-[#F5F3EF] truncate">{location?.address ?? "Detecting location..."}</p>
          </div>
        </div>

        {/* Category Selection */}
        <p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">Category</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
  setCategory(c.id);
  setIncidentType("");
}}
              className={`py-3 px-3 rounded-xl text-xs font-semibold text-left transition-all ${
                category === c.id
                  ? reportType === "safe"
                    ? "bg-[#4ADE8020] border-2 border-[#4ADE80] text-[#4ADE80]"
                    : "bg-[#EF444420] border-2 border-[#EF4444] text-[#EF4444]"
                  : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
{category && (
  <>
    <p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">
      Incident Type
    </p>

    <div className="grid grid-cols-2 gap-2">
      {INCIDENT_TYPES[category]?.map((type) => (
        <button
          key={type}
          onClick={() => setIncidentType(type)}
          className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all ${
            incidentType === type
              ? "bg-[#E8A838] text-[#0F1E1E]"
              : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  </>
)}
{/* Severity */}
<p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">
  Severity
</p>
<p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">
  Time of Incident
</p>

<div className="grid grid-cols-2 gap-2">
  {[
    "Just now",
    "Within 15 min",
    "Within 1 hour",
    "Today",
    "Yesterday",
  ].map((time) => (
    <button
      key={time}
      onClick={() => setTimeOfIncident(time)}
      className={`py-3 rounded-xl text-xs font-semibold transition-all ${
        timeOfIncident === time
          ? "bg-[#E8A838] text-[#0F1E1E]"
          : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
      }`}
    >
      {time}
    </button>
  ))}
</div>
<div className="grid grid-cols-3 gap-2">
  {[
    { id: "low", label: "🟢 Low" },
    { id: "medium", label: "🟡 Medium" },
    { id: "high", label: "🔴 High" },
  ].map((level) => (
    <button
      key={level.id}
      onClick={() =>
        setSeverity(level.id as "low" | "medium" | "high")
      }
      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
        severity === level.id
          ? "bg-[#E8A838] text-[#0F1E1E]"
          : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#7BA3A1]"
      }`}
    >
      {level.label}
    </button>
  ))}
</div>
<p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">
  Incident Location
</p>

<button
  onClick={() => setUseCurrentLocation(!useCurrentLocation)}
  className="w-full py-3 rounded-xl bg-[#1A2E2D] border border-[#2D5A5840] text-[#F5F3EF]"
>
  {useCurrentLocation
    ? "📍 Using Current Location"
    : "📌 Choose Location on Map"}
</button>
{useCurrentLocation && (
  <div className="mt-2 rounded-xl bg-[#1A2E2D] border border-[#2D5A5840] p-3">
    <p className="text-xs text-[#7BA3A1]">Current Address</p>
    <p className="text-sm text-[#F5F3EF]">
      {location?.address ?? "Detecting location..."}
    </p>
  </div>
)}
{!useCurrentLocation && (
  <div className="mt-3">
    <LocationSearch
      onLocationSelect={setSelectedIncidentLocation}
    />
  </div>
)}
{showLocationPicker && (
  <div className="fixed inset-0 z-50 bg-[#0F1E1E] flex flex-col">
    <div className="flex items-center justify-between p-4 border-b border-[#2D5A5840]">
      <h3 className="text-lg font-bold text-[#F5F3EF]">
        Choose Incident Location
      </h3>

      <button
        onClick={() => setShowLocationPicker(false)}
        className="text-[#E8A838] font-semibold"
      >
        Close
      </button>
    </div>

    <div className="flex-1">
      <LocationPickerMap
        onLocationSelect={(position) =>
          setSelectedIncidentLocation({
            latitude: position[0],
            longitude: position[1],
            address: "",
          })
        }
      />
      {selectedIncidentLocation && (
        <div className="p-3 space-y-3">
          <div className="text-center text-sm text-white">
            Selected location:
            <br />
            {selectedIncidentLocation.latitude.toFixed(6)},{" "}
            {selectedIncidentLocation.longitude.toFixed(6)}
          </div>

          <button
            onClick={() => setShowLocationPicker(false)}
            className="w-full rounded-lg bg-[#38B2AC] py-3 font-medium text-white"
          >
            Use this location
          </button>
        </div>
      )}
    </div>
  </div>
)}
        {/* Description */}
        <p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">Description</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={DESCRIPTION_PLACEHOLDERS[incidentType] || `Describe why this area is ${reportType}...`}
          className="w-full h-24 bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 text-sm text-[#F5F3EF] placeholder:text-[#7BA3A160] focus:outline-none focus:border-[#E8A838] resize-none"
        />
{/* Selected photo preview */}
{photoPreview && (
  <div className="relative mt-3 overflow-hidden rounded-xl border border-[#2D5A5860] bg-[#1A2E2D]">
    <img
      src={photoPreview}
      alt="Report preview"
      className="h-44 w-full object-cover"
    />

    <button
      type="button"
      onClick={() => setReportPhoto(null)}
      className="absolute right-2 top-2 rounded-full bg-[#0F1E1E]/90 px-3 py-1.5 text-[10px] font-semibold text-[#F5F3EF] shadow-lg backdrop-blur-md"
    >
      Remove
    </button>

    <div className="px-3 py-2">
      <p className="truncate text-[10px] text-[#7BA3A1]">
        {reportPhoto?.name}
      </p>
    </div>
  </div>
)}
        {/* Photo */}
<label className="w-full mt-3 py-3 bg-[#1A2E2D] border border-dashed border-[#2D5A5860] rounded-xl flex items-center justify-center gap-2 text-xs text-[#7BA3A1] cursor-pointer active:scale-[0.98] transition-transform">
  <Camera className="w-4 h-4" />

  <span>
    {reportPhoto ? "Change Photo" : "Add Photo (Optional)"}
  </span>

  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        setReportPhoto(file);
      }
    }}
  />
</label>

       {/* Submit */}
<button
  onClick={handleSubmit}
  disabled={!category || !incidentType || submitting}
  className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
    category && incidentType && !submitting
      ? reportType === "safe"
        ? "bg-[#4ADE80] text-[#0F1E1E] active:scale-[0.98]"
        : "bg-[#EF4444] text-white active:scale-[0.98]"
      : "bg-[#1E3A3A40] text-[#7BA3A160] cursor-not-allowed"
  }`}
>
  <Send className="w-4 h-4" />
  {submitting ? "Submitting..." : "Submit Report"}
</button>
      </div>
    </div>
  );
}
