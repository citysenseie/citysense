import { Car, MapPin } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";


interface DriverModeScreenProps {
  onBack: () => void;
}

export default function DriverModeScreen({
  onBack,
}: DriverModeScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const driverItems = [
    "⛽ Gas Station",
    "🔌 EV Charger",
    "🛞 Tire Repair",
    "🔧 Car Repair",
    "🅿️ Parking",
    "🚔 Police Activity",
    "🚨 Road Hazard",
    "🌊 Flooding",
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#0F2740] border border-[#3B82F6] rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <Car className="w-5 h-5 text-white" />
          <h1 className="text-xl font-bold text-white">
            Driver Mode
          </h1>
        </div>

        <p className="text-sm text-[#BFDBFE]">
          Tools and nearby services for drivers.
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

      <div className="grid grid-cols-2 gap-3">
        {driverItems.map((item) => (
          <button
            key={item}
            onClick={() => openNearby(item)}
            className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 text-sm font-semibold"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}