import { MapPin, Shield, Hospital, Car, Utensils, Moon } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

export default function NearbyScreen() {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const sections = [
    {
      title: "Safe Haven",
      icon: Shield,
      items: ["Police station", "Hospital", "Pharmacy", "Hotel", "24 hour store", "Mosque"],
    },
    {
      title: "Emergency",
      icon: Hospital,
      items: ["Emergency room", "Fire station", "AED defibrillator", "Urgent care", "Women shelter"],
    },
    {
      title: "Muslim Friendly",
      icon: MapPin,
      items: ["Mosque", "Halal food", "Islamic center"],
    },
    {
      title: "Driver Help",
      icon: Car,
      items: ["Gas station", "EV charger", "Car repair", "Tire shop", "Parking"],
    },
    {
      title: "Daily Essentials",
      icon: Utensils,
      items: ["Grocery store", "ATM", "Public toilet", "Free wifi", "Phone repair"],
    },
    {
      title: "Night Mode",
      icon: Moon,
      items: ["Open pharmacy", "Open gas station", "Open hotel", "Open restaurant", "Police station"],
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <h1 className="text-2xl font-bold mb-1">Nearby Help</h1>
      <p className="text-sm text-[#7BA3A1] mb-5">
        Find safe places, emergency help, and daily essentials near you.
      </p>

      <button
        onClick={() => openNearby("police station OR hospital OR pharmacy OR hotel")}
        className="w-full mb-5 bg-[#EF4444] text-white py-4 rounded-2xl font-bold shadow-lg"
      >
        🛡️ Find Safe Place Now
      </button>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <div
              key={section.title}
              className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5 text-[#E8A838]" />
                <h2 className="font-bold text-[#F5F3EF]">{section.title}</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => openNearby(item)}
                    className="bg-[#0F1E1E] border border-[#2D5A5840] rounded-xl px-3 py-3 text-xs text-left text-[#F5F3EF] active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}