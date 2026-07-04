import {
  Shield,
  MapPin,
  Car,
  Navigation,
  LocateFixed,
  Siren,
  Flame,
  Zap,
  Fuel,
  PlugZap,
  Wrench,
  CircleParking,
  ShoppingCart,
  Landmark,
  Wifi,
  Smartphone,
  Hotel,
  Baby,
  TreePine,
  School,
  Waves,
  Dumbbell,
  UtensilsCrossed,
  Pill,
  Drum,
  Building2,
  Compass,
  Hand,
  HeartPulse,
  Cross,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "@/hooks/useLocation";

interface NearbyScreenProps {
  onSafeHaven: () => void;
  onDriverMode: () => void;
  onWalkMeHome: () => void;
  onEmergencyNetwork: () => void;
  onParkProtect: () => void;
  onRoadHazard: () => void;
  onWomensSafety: () => void;
  onChildSafety: () => void;
  onLiveLocation: () => void;
  onNightMode: () => void;
  onCrowdSense: () => void;
  onTrustedContacts: () => void;
}

export default function NearbyScreen({
  onSafeHaven,
  onDriverMode,
  onWalkMeHome,
  onParkProtect,
  onLiveLocation,
  onEmergencyNetwork,
  onNightMode,
  onCrowdSense,
  onTrustedContacts,
  onWomensSafety,
  onChildSafety
}: NearbyScreenProps) {
  const { location } = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Safety & Emergency": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const quickActions = [
    {
      label: "Find Safe Place",
      icon: Shield,
      onClick: onSafeHaven,
      accent: "border-[#EF4444]",
      iconColor: "text-[#EF4444]",
    },
    {
      label: "Walk Me Home",
      icon: Navigation,
      onClick: onWalkMeHome,
      accent: "border-[#10B981]",
      iconColor: "text-[#10B981]",
    },
    {
      label: "Driver Mode",
      icon: Car,
      onClick: onDriverMode,
      accent: "border-[#3B82F6]",
      iconColor: "text-[#3B82F6]",
    },
    {
      label: "Park Protect",
      icon: CircleParking,
      onClick: onParkProtect,
      accent: "border-[#8B5CF6]",
      iconColor: "text-[#8B5CF6]",
    },
    {
      label: "Live Location",
      icon: LocateFixed,
      onClick: onLiveLocation,
      accent: "border-[#F59E0B]",
      iconColor: "text-[#F59E0B]",
    },
    {
      label: "Emergency Network",
      icon: Wifi,
      onClick: onEmergencyNetwork,
      accent: "border-[#6366F1]",
      iconColor: "text-[#6366F1]",
    },
    {
      label: "Night Mode",
      icon: Compass,
      onClick: onNightMode,
      accent: "border-[#9333EA]",
      iconColor: "text-[#9333EA]",
    },
    {
      label: "Crowd Sense",
      icon: HeartPulse,
      onClick: onCrowdSense,
      accent: "border-[#14B8A6]",
      iconColor: "text-[#14B8A6]",
    },
    {
      label: "Trusted Contacts",
      icon: Smartphone,
      onClick: onTrustedContacts,
      accent: "border-[#F97316]",
      iconColor: "text-[#F97316]",
    },
    {
      label: "Women's Safety",
      icon: Hand,
      onClick: onWomensSafety,
      accent: "border-[#EC4899]",
      iconColor: "text-[#EC4899]",
    },
    {
      label: "Child Safety",
      icon: Baby,
      onClick: onChildSafety,
      accent: "border-[#22C55E]",
      iconColor: "text-[#22C55E]",
    },
  ];

  const categories = [
    {
      title: "Safety & Emergency",
      items: [
        { label: "Police Station", icon: Siren },
        { label: "Hospital", icon: HeartPulse },
        { label: "Pharmacy", icon: Pill },
        { label: "Emergency Room", icon: Cross },
        { label: "Fire Station", icon: Flame },
        { label: "AED Defibrillator", icon: Zap },
      ],
    },
    {
      title: "Driver",
      items: [
        { label: "Gas Station", icon: Fuel },
        { label: "EV Charger", icon: PlugZap },
        { label: "Car Repair", icon: Wrench },
        { label: "Parking", icon: CircleParking },
        { label: "Tire Shop", icon: Wrench },
      ],
    },
    {
      title: "Daily Essentials",
      items: [
        { label: "Grocery Store", icon: ShoppingCart },
        { label: "ATM", icon: Landmark },
        { label: "Public Toilet", icon: MapPin },
        { label: "Free Wi-Fi", icon: Wifi },
        { label: "Phone Repair", icon: Smartphone },
        { label: "Hotel", icon: Hotel },
      ],
    },
    {
      title: "Family",
      items: [
        { label: "Playground", icon: Baby },
        { label: "Park", icon: TreePine },
        { label: "School", icon: School },
        { label: "Swimming Pool", icon: Waves },
        { label: "Sports Center", icon: Dumbbell },
        { label: "Family Restaurant", icon: UtensilsCrossed },
      ],
    },
    {
      title: "Night",
      items: [
        { label: "Open Pharmacy", icon: Pill },
        { label: "Open Gas Station", icon: Fuel },
        { label: "Open Hotel", icon: Hotel },
        { label: "Open Restaurant", icon: UtensilsCrossed },
        { label: "Police Station", icon: Siren },
      ],
    },
    {
      title: "Faith & Prayer",
      items: [
        { label: "Mosque", icon: Drum },
        { label: "Islamic Center", icon: Building2 },
        { label: "Qibla Direction", icon: Compass },
        { label: "Prayer Space", icon: Hand },
      ],
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-4 pb-28">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#F5F3EF]">Nearby Help</h1>
        <p className="text-sm text-[#7BA3A1]">
          Find useful places and safety support near you.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-wider text-[#7BA3A1] font-bold mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className={`flex items-center gap-2 bg-[#1A2E2D] border ${action.accent} rounded-xl px-3 py-3 text-left active:scale-95 transition-transform`}
              >
                <Icon className={`w-5 h-5 ${action.iconColor} shrink-0`} />
                <span className="text-sm font-medium text-[#F5F3EF]">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nearby Categories */}
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wider text-[#7BA3A1] font-bold mb-3">
          Nearby Categories
        </p>
        <div className="flex flex-col gap-3">
          {categories.map((category) => {
            const isOpen = openSections[category.title] ?? false;
            return (
              <div
                key={category.title}
                className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4"
              >
                <button
                  onClick={() => toggleSection(category.title)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h2 className="font-bold text-[#F5F3EF] text-sm">
                    {category.title}
                  </h2>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#7BA3A1] shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#7BA3A1] shrink-0 transition-transform duration-200" />
                  )}
                </button>
                <div
                  className={`grid grid-cols-2 gap-2 overflow-hidden transition-all duration-200 ease-in-out ${
                    isOpen ? "max-h-[1000px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
                  }`}
                >
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => openNearby(item.label)}
                        className="flex items-center gap-2 bg-[#0F1E1E] border border-[#2D5A5840] rounded-xl px-3 min-h-[48px] text-left text-sm text-[#F5F3EF] active:scale-95 transition-transform"
                      >
                        <Icon className="w-4 h-4 text-[#7BA3A1] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom spacer for fixed navigation */}
      <div className="h-20" />
    </div>
  );
}