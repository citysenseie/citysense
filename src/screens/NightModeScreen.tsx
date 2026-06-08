import { useLocation } from "@/hooks/useLocation";

interface NightModeScreenProps {
  onBack: () => void;
}

export default function NightModeScreen({
  onBack,
}: NightModeScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const items = [
    "🏥 Open Hospital",
    "💊 Open Pharmacy",
    "⛽ Open Gas Station",
    "🍔 Open Food",
    "🚓 Police Station",
    "🏨 Hotel",
    "🛡️ Safe Place",
    "🚕 Taxi",
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0B1120] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#111827] border border-[#374151] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🌙 Smart Night Mode
        </h1>

        <p className="text-sm text-gray-300">
          Find essential services and safer places during the night.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => openNearby(item)}
            className="bg-[#1F2937] border border-[#374151] rounded-2xl p-4 text-left text-sm font-semibold"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-[#111827] rounded-2xl p-4">
        <h2 className="font-bold mb-2">
          Future Features
        </h2>

        <ul className="space-y-2 text-sm text-gray-400">
          <li>🌙 Night safety score</li>
          <li>🚨 High-risk area alerts</li>
          <li>🛡️ Safe route suggestions</li>
          <li>🤖 AI night risk prediction</li>
        </ul>
      </div>
    </div>
  );
}