import { useLocation } from "@/hooks/useLocation";

interface SafeSpacesScreenProps {
  onBack: () => void;
}

export default function SafeSpacesScreen({
  onBack,
}: SafeSpacesScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const places = [
    "🚓 Police Station",
    "🏥 Hospital",
    "💊 Pharmacy",
    "🏨 Hotel",
    "☕ Café",
    "🛒 Open Store",
    "👩 Women's Shelter",
    "🕌 Mosque",
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🛡️ Safe Spaces
        </h1>

        <p className="text-sm text-[#BBF7D0]">
          Find trusted public places nearby when you need help or safety.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {places.map((place) => (
          <button
            key={place}
            onClick={() => openNearby(place)}
            className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left text-sm font-semibold"
          >
            {place}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>⭐ Community-rated safe places</li>
          <li>🛡 Verified safe zones</li>
          <li>🚨 Emergency-safe destinations</li>
          <li>🤖 AI safety recommendations</li>
        </ul>
      </div>
    </div>
  );
}