import { useLocation } from "@/hooks/useLocation";

interface ChildSafetyScreenProps {
  onBack: () => void;
}

export default function ChildSafetyScreen({
  onBack,
}: ChildSafetyScreenProps) {
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

      <div className="bg-[#0F766E] border border-[#5EEAD4] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          👶 Child Safety
        </h1>

        <p className="text-sm text-[#CCFBF1]">
          Tools and locations to help keep children safe.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => openNearby("school")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🏫 Schools
        </button>

        <button
          onClick={() => openNearby("playground")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🛝 Playgrounds
        </button>

        <button
          onClick={() => openNearby("police station")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🚓 Police Station
        </button>

        <button
          onClick={() => openNearby("hospital")}
          className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left"
        >
          🏥 Hospital
        </button>
      </div>

      <div className="bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Child location sharing</li>
          <li>🆘 Lost child emergency mode</li>
          <li>👨‍👩‍👧 Family safety network</li>
          <li>🛡 Child-safe area ratings</li>
        </ul>
      </div>
    </div>
  );
}