import { useReports } from "@/hooks/useReports";

interface CrowdSenseScreenProps {
  onBack: () => void;
}

export default function CrowdSenseScreen({ onBack }: CrowdSenseScreenProps) {
  const { reports } = useReports();

  const totalReports = reports.length;
  const safeReports = reports.filter((r) => r.type === "safe").length;
  const unsafeReports = reports.filter((r) => r.type === "unsafe").length;
  const sosReports = reports.filter((r) => r.category === "sos").length;
  const highRiskReports = reports.filter((r) => r.severity === "high").length;

  const riskLevel =
    sosReports > 0 || highRiskReports >= 3
      ? "High"
      : unsafeReports > safeReports
      ? "Elevated"
      : "Stable";

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#312E81] border border-[#818CF8] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🧠 CrowdSense
        </h1>

        <p className="text-sm text-[#C7D2FE]">
          Community-powered intelligence about what is happening nearby.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1A2E2D] rounded-2xl p-4">
          <p className="text-xs text-[#7BA3A1]">Reports</p>
          <h2 className="text-2xl font-bold">{totalReports}</h2>
        </div>

        <div className="bg-[#1A2E2D] rounded-2xl p-4">
          <p className="text-xs text-[#7BA3A1]">Risk Level</p>
          <h2 className="text-2xl font-bold text-[#E8A838]">{riskLevel}</h2>
        </div>

        <div className="bg-[#14532D] rounded-2xl p-4">
          <p className="text-xs text-[#BBF7D0]">Safe Signals</p>
          <h2 className="text-2xl font-bold">{safeReports}</h2>
        </div>

        <div className="bg-[#7F1D1D] rounded-2xl p-4">
          <p className="text-xs text-[#FCA5A5]">Alerts</p>
          <h2 className="text-2xl font-bold">{unsafeReports}</h2>
        </div>
      </div>

      <div className="bg-[#1A2E2D] rounded-2xl p-4 mb-5">
        <h2 className="font-bold mb-2">Area Trend</h2>

        <p className="text-sm text-[#7BA3A1]">
          {riskLevel === "High"
            ? "High risk activity detected. Stay alert and avoid unsafe zones."
            : riskLevel === "Elevated"
            ? "More alerts than safe reports. Move carefully."
            : "Community activity looks stable."}
        </p>
      </div>

      <div className="bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Intelligence</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📈 Risk trend over time</li>
          <li>🔥 Hot zone detection</li>
          <li>🧠 Unusual activity alerts</li>
          <li>🤖 AI area risk prediction</li>
        </ul>
      </div>
    </div>
  );
}