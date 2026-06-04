import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
import { AlertTriangle, ShieldCheck, Camera, MapPin, Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { id: "poor_lighting", label: "Poor Lighting", icon: "flashlight" },
  { id: "suspicious", label: "Suspicious Activity", icon: "alert" },
  { id: "police_presence", label: "Police Presence", icon: "shield" },
  { id: "construction", label: "Construction", icon: "hardhat" },
  { id: "crowded_area", label: "Crowded Area", icon: "users" },
  { id: "other", label: "Other", icon: "more" },
];

export default function ReportScreen() {
  const { user } = useAuth();
  const { location } = useLocation();
  const { submitReport } = useReports();
  const [reportType, setReportType] = useState<"safe" | "unsafe">("unsafe");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
 const [severity] = useState<"low" | "medium" | "high">("medium");
const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category) return;
    setSubmitting(true);
    const ok = await submitReport({
      type: reportType,
      category,
      description,
      severity,
      latitude: location?.latitude ?? 40.7128,
      longitude: location?.longitude ?? -74.006,
      address: location?.address ?? "Unknown location",
      userId: user?.uid ?? "anonymous",
      
    });
    if (ok) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setCategory("");
        setDescription("");
        setReportType("unsafe");
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
              onClick={() => setCategory(c.id)}
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

        {/* Description */}
        <p className="text-sm font-semibold text-[#F5F3EF] mt-5 mb-2">Description</p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Describe why this area is ${reportType}...`}
          className="w-full h-24 bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 text-sm text-[#F5F3EF] placeholder:text-[#7BA3A160] focus:outline-none focus:border-[#E8A838] resize-none"
        />

        {/* Photo Placeholder */}
        <button className="w-full mt-3 py-3 bg-[#1A2E2D] border border-dashed border-[#2D5A5860] rounded-xl flex items-center justify-center gap-2 text-xs text-[#7BA3A1]">
          <Camera className="w-4 h-4" />
          Add Photo (Optional)
        </button>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!category || submitting}
          className={`w-full mt-5 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            category && !submitting
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
