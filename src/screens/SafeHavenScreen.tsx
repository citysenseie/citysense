import { Shield, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface SafeHavenScreenProps {
  onBack: () => void;
}

export default function SafeHavenScreen({ onBack }: SafeHavenScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const safePlaces = [
    {
      title: "Police Station",
      icon: "🚓",
      query: "police station",
      reason: "Best option if you feel directly unsafe.",
    },
    {
      title: "Hospital",
      icon: "🏥",
      query: "hospital",
      reason: "Medical help and staffed public place.",
    },
    {
      title: "Pharmacy",
      icon: "💊",
      query: "pharmacy",
      reason: "Quick help, advice, and public assistance.",
    },
    {
      title: "Hotel",
      icon: "🏨",
      query: "hotel",
      reason: "Reception desk, lights, cameras, and staff.",
    },
    {
      title: "24 Hour Store",
      icon: "🛒",
      query: "24 hour store",
      reason: "Open public place with people nearby.",
    },
    {
      title: "Mosque",
      icon: "🕌",
      query: "mosque",
      reason: "Community place and safe gathering point.",
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-white" />
          <h1 className="text-xl font-bold text-white">
            Safe Haven Mode
          </h1>
        </div>

        <p className="text-sm text-[#FCA5A5]">
          Find nearby safe public places if you feel unsafe or need help quickly.
        </p>
      </div>

      {location && (
        <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-3 py-3 mb-5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#E8A838]" />
            <p className="text-xs text-[#7BA3A1] truncate">
              Current area: {location.address}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() =>
          openNearby("police station OR hospital OR pharmacy OR hotel")
        }
        className="w-full bg-[#EF4444] text-white py-4 rounded-2xl font-bold mb-5 animate-pulse"
      >
        🛡️ Find Closest Safe Place
      </button>

      <div className="space-y-3">
        {safePlaces.map((place) => (
          <button
            key={place.title}
            onClick={() => openNearby(place.query)}
            className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-left active:scale-95"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{place.icon}</div>

              <div>
                <h2 className="font-bold text-[#F5F3EF]">
                  {place.title}
                </h2>
                <p className="text-xs text-[#7BA3A1] mt-1">
                  {place.reason}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}