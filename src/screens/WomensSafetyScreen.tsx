import { useLocation } from "@/hooks/useLocation";

interface WomensSafetyScreenProps {
  onBack: () => void;
}

export default function WomensSafetyScreen({
  onBack,
}: WomensSafetyScreenProps) {
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

      <div className="bg-[#4C1D95] border border-[#A78BFA] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          👩 Women's Safety
        </h1>

        <p className="text-sm text-[#DDD6FE]">
          Find safer spaces, emergency help, and support nearby.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => openNearby("safe place")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🛡️ Safe Spaces
        </button>

        <button
          onClick={() => openNearby("emergency help")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🚨 Emergency Help
        </button>

        <button
          onClick={() => openNearby("women shelter")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🏠 Women's Shelter
        </button>

        <button
          onClick={() => openNearby("safe route")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          👣 Walk Me Home
        </button>
      </div>

      <div className="bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Trusted contact alerts</li>
          <li>👣 Safe walk timer</li>
          <li>🛡️ Women-rated safe places</li>
          <li>🚨 Instant emergency network alert</li>
        </ul>
      </div>
    </div>
  );
}