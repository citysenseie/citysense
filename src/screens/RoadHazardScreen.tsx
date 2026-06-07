import { useLocation } from "@/hooks/useLocation";

interface RoadHazardScreenProps {
  onBack: () => void;
}

export default function RoadHazardScreen({
  onBack,
}: RoadHazardScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const hazards = [
    "🚧 Road Closure",
    "🌊 Flooding",
    "🕳️ Pothole",
    "🚨 Accident",
    "⚠️ Debris on Road",
    "🐾 Animal on Road",
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#78350F] border border-[#F97316] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          ⚠️ Road Hazard Intelligence
        </h1>

        <p className="text-sm text-[#FDBA74]">
          Check and report road dangers that affect drivers and pedestrians.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {hazards.map((hazard) => (
          <button
            key={hazard}
            onClick={() => openNearby(hazard)}
            className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left text-sm font-semibold"
          >
            {hazard}
          </button>
        ))}
      </div>

      <div className="bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Intelligence</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>🚨 Community accident reports</li>
          <li>🌊 Flood-risk alerts</li>
          <li>🚧 Road closure warnings</li>
          <li>🤖 AI road risk prediction</li>
        </ul>
      </div>
    </div>
  );
}