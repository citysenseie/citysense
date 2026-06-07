import { useLocation } from "@/hooks/useLocation";

interface ParkProtectScreenProps {
  onBack: () => void;
}

export default function ParkProtectScreen({
  onBack,
}: ParkProtectScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#1E3A5F] border border-[#60A5FA] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🅿️ Park & Protect
        </h1>
        <p className="text-sm text-[#BFDBFE]">
          Find safer parking and report parking-related risks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => openNearby("parking")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🅿️ Find Parking
        </button>

        <button
          onClick={() => openNearby("well lit parking")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          💡 Well-Lit Parking
        </button>

        <button
          onClick={() => openNearby("secure parking")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🛡️ Secure Parking
        </button>

        <button
          onClick={() => openNearby("covered parking")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🏢 Covered Parking
        </button>
      </div>

      <div className="space-y-3">
        <div className="bg-[#14532D] rounded-2xl p-4">
          <h2 className="font-bold">🟢 Safe Parking</h2>
          <p className="text-sm opacity-80">
            Well-lit area with no recent incidents.
          </p>
        </div>

        <div className="bg-[#78350F] rounded-2xl p-4">
          <h2 className="font-bold">🟡 Medium Risk</h2>
          <p className="text-sm opacity-80">
            Limited activity or lighting. Stay aware.
          </p>
        </div>

        <div className="bg-[#7F1D1D] rounded-2xl p-4">
          <h2 className="font-bold">🔴 High Risk</h2>
          <p className="text-sm opacity-80">
            Avoid parking here if incidents are reported nearby.
          </p>
        </div>
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Intelligence</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>💡 Lighting score</li>
          <li>📷 Break-in reports</li>
          <li>👥 Community safety rating</li>
          <li>🤖 AI parking safety score</li>
        </ul>
      </div>
    </div>
  );
}