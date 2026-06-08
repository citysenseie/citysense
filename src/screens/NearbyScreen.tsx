import { MapPin, Shield, Hospital, Car, Utensils, Moon } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";

interface NearbyScreenProps {
  onSafeHaven: () => void;
  onDriverMode: () => void;
  onWalkMeHome: () => void;
  onParkProtect: () => void;
  onEmergencyNetwork: () => void;
  onRoadHazard: () => void;
  onWomensSafety: () => void;
  onChildSafety: () => void;
  onLiveLocation: () => void;
  onNightMode: () => void;
}


export default function NearbyScreen({
  onSafeHaven,
  onDriverMode,
  onWalkMeHome,
  onParkProtect,
  onEmergencyNetwork,
  onRoadHazard,
  onWomensSafety,
  onChildSafety,
  onLiveLocation,
  onNightMode,
}: NearbyScreenProps) {
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
  title: "🛡️ Safe Haven",
  icon: Shield,
  items: [
    "🚓 Police Station",
    "🏥 Hospital",
    "💊 Pharmacy",
    "🏨 Hotel",
    "🛒 24 Hour Store",
    "🕌 Mosque",
  ],
},
    {
    title: "🚨 Emergency",
    icon: Hospital,
    items: [
      "🚑 Emergency Room",
      "🔥 Fire Station",
      "⚡ AED Defibrillator",
      "🏥 Urgent Care",
      "👩 Women's Shelter",
    ],
  },
     {
    title: "🕌 Muslim Friendly",
    icon: MapPin,
    items: [
      "🕌 Mosque",
      "🍽️ Halal Food",
      "📖 Islamic Center",
    ],
  },
    {
    title: "🚗 Driver Help",
    icon: Car,
    items: [
      "⛽ Gas Station",
      "🔌 EV Charger",
      "🔧 Car Repair",
      "🛞 Tire Shop",
      "🅿️ Parking",
    ],
  },
     {
    title: "🍽️ Daily Essentials",
    icon: Utensils,
    items: [
      "🛒 Grocery Store",
      "🏧 ATM",
      "🚻 Public Toilet",
      "📶 Free Wi-Fi",
      "📱 Phone Repair",
    ],
  },
    {
  title: "🌙 Night Mode",
  icon: Moon,
  items: [
    "💊 Open Pharmacy",
    "⛽ Open Gas Station",
    "🏨 Open Hotel",
    "🍔 Open Restaurant",
    "🚓 Police Station",
  ],
},

{
  title: "👨‍👩‍👧 Family Safety",
  icon: Shield,
  items: [
    "🛝 Playground",
    "🌳 Park",
    "🏫 School",
    "🏊 Swimming Pool",
    "⚽ Sports Center",
    "🍽️ Family Restaurant",
  ],
},


{
  title: "🚨 Disaster & Emergency",
  icon: Hospital,
  items: [
    "🚑 Ambulance",
    "🔥 Fire Station",
    "⚡ AED Defibrillator",
    "🆘 Emergency Shelter",
    "🌊 Flood Zone",
  ],
},

{
  title: "🕌 Prayer & Faith",
  icon: MapPin,
  items: [
    "🕌 Mosque",
    "📖 Islamic Center",
    "🧭 Qibla Direction",
    "🤲 Prayer Space",
  ],
},
 ];

  return (
  <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
    <h1 className="text-2xl font-bold mb-1">Nearby Help</h1>

    <p className="text-sm text-[#7BA3A1] mb-5">
      Find safe places, emergency help, and daily essentials near you.
    </p>
<div className="mb-3">
  <p className="text-xs uppercase tracking-wider text-[#7BA3A1] font-bold">
    Featured Safety Tools
  </p>
</div>
    <button
      onClick={onSafeHaven}
      className="w-full mb-4 bg-[#EF4444] text-white py-4 rounded-2xl font-bold shadow-lg"
    >
      🛡️ Find Safe Place Now
    </button>

    <button
      onClick={onDriverMode}
      className="w-full mb-5 bg-[#3B82F6] text-white py-4 rounded-2xl font-bold shadow-lg"
    >
      🚗 Driver Mode
    </button>

    <button
      onClick={onWalkMeHome}
      className="w-full mb-5 bg-[#10B981] text-white py-4 rounded-2xl font-bold shadow-lg"
    >
      🚶 Walk Me Home
    </button>

    <button
      onClick={onLiveLocation}
      className="w-full mb-5 bg-[#F59E0B] text-white py-4 rounded-2xl font-bold shadow-lg"
    >
      📍 Live Location
    </button>
    
    <button
  onClick={onEmergencyNetwork}
  className="w-full mb-5 bg-[#DC2626] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  🚨 Emergency Network
</button>
<button
  onClick={onParkProtect}
  className="w-full mb-5 bg-[#2563EB] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  🅿️ Park & Protect
</button>
<button
  onClick={onRoadHazard}
  className="w-full mb-5 bg-[#F59E0B] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  🚧 Road Hazard
</button>
<button
  onClick={onWomensSafety}
  className="w-full mb-5 bg-[#8B5CF6] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  👩 Women’s Safety
</button>
<button
  onClick={onChildSafety}
  className="w-full mb-5 bg-[#06B6D4] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  👶 Child Safety
</button>
<button
  onClick={onNightMode}
  className="w-full mb-5 bg-[#1E293B] text-white py-4 rounded-2xl font-bold shadow-lg"
>
  🌙 Night Mode
</button>
<div className="mt-2 mb-3">
  <p className="text-xs uppercase tracking-wider text-[#7BA3A1] font-bold">
    Nearby Categories
  </p>
</div>
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