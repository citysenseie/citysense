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
  ArrowLeft,
  Navigation as NavigateIcon,
  Loader2,
  AlertCircle,
  MapPin as MapPinIcon,
} from "lucide-react";
import { useState, useCallback } from "react";
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
  onCrowdSense: () => void;
  onTrustedContacts: () => void;
}

interface PoliceResult {
  id: number;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address: string;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }
  return `${km.toFixed(1)} km`;
}

function buildAddress(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];
  if (tags["addr:street"]) {
    const houseNumber = tags["addr:housenumber"];
    parts.push(houseNumber ? `${tags["addr:street"]} ${houseNumber}` : tags["addr:street"]);
  }
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

export default function NearbyScreen({
  onSafeHaven: _onSafeHaven,
  onDriverMode: _onDriverMode,
  onWalkMeHome: _onWalkMeHome,
  onParkProtect: _onParkProtect,
  onEmergencyNetwork: _onEmergencyNetwork,
  onRoadHazard: _onRoadHazard,
  onWomensSafety: _onWomensSafety,
  onChildSafety: _onChildSafety,
  onLiveLocation,
  onNightMode: _onNightMode,
  onCrowdSense: _onCrowdSense,
  onTrustedContacts: _onTrustedContacts,
}: NearbyScreenProps) {
  const { location } = useLocation();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Safety & Emergency": true,
  });

  const [policeResults, setPoliceResults] = useState<PoliceResult[] | null>(null);
  const [policeLoading, setPoliceLoading] = useState(false);
  const [policeError, setPoliceError] = useState<string | null>(null);

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const openNearby = (query: string) => {
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},15z`,
      "_blank"
    );
  };

  const handleNavigate = useCallback((result: PoliceResult) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lon}&travelmode=driving`;
    window.open(url, "_blank");
  }, []);

  const searchPoliceStations = useCallback(async () => {
    setPoliceLoading(true);
    setPoliceError(null);
    setPoliceResults(null);

    try {
      const query = `[out:json][timeout:25];
(
  node["amenity"="police"](around:10000,${lat},${lng});
  way["amenity"="police"](around:10000,${lat},${lng});
  relation["amenity"="police"](around:10000,${lat},${lng});
);
out center;`;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const elements = data.elements as Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;

      const results: PoliceResult[] = elements
        .map((el) => {
          const itemLat = el.lat ?? el.center?.lat;
          const itemLon = el.lon ?? el.center?.lon;
          if (itemLat == null || itemLon == null) return null;

          const distance = haversineDistance(lat, lng, itemLat, itemLon);
          const name = el.tags?.name || el.tags?.["name:en"] || "Police Station";
          const address = buildAddress(el.tags || {});

          return {
            id: el.id,
            name,
            lat: itemLat,
            lon: itemLon,
            distance,
            address,
          };
        })
        .filter((r): r is PoliceResult => r !== null && r.address !== undefined)
        .sort((a, b) => a.distance - b.distance);

      setPoliceResults(results);
    } catch (err) {
      setPoliceError(err instanceof Error ? err.message : "Failed to fetch police stations");
    } finally {
      setPoliceLoading(false);
    }
  }, [lat, lng]);

  const closePoliceResults = () => {
    setPoliceResults(null);
    setPoliceError(null);
    setPoliceLoading(false);
  };
const onSafeHaven = () => {
  _onSafeHaven();
};

const onWalkMeHome = () => {
  _onWalkMeHome();
};

const onDriverMode = () => {
  _onDriverMode();
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
      label: "Live Location",
      icon: LocateFixed,
      onClick: onLiveLocation,
      accent: "border-[#F59E0B]",
      iconColor: "text-[#F59E0B]",
    },
  ];

  const categories = [
    {
      title: "Safety & Emergency",
      items: [
        { label: "Police Station", icon: Siren, onClick: searchPoliceStations },
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
        { label: "Police Station", icon: Siren, onClick: searchPoliceStations },
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

      {/* Police Station Results */}
      {(policeLoading || policeError || policeResults) && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-[#7BA3A1] font-bold">
              Police Stations
            </p>
            <button
              onClick={closePoliceResults}
              className="flex items-center gap-1 text-xs text-[#7BA3A1] hover:text-[#F5F3EF] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          </div>

          {policeLoading && (
            <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-[#E8A838] animate-spin" />
              <p className="text-sm text-[#7BA3A1]">Searching nearby police stations...</p>
            </div>
          )}

          {policeError && !policeLoading && (
            <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-6 h-6 text-[#EF4444]" />
              <p className="text-sm text-[#F5F3EF] text-center">{policeError}</p>
              <button
                onClick={searchPoliceStations}
                className="text-sm text-[#E8A838] font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {policeResults && !policeLoading && !policeError && (
            <div className="flex flex-col gap-2">
              {policeResults.length === 0 ? (
                <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                  <MapPinIcon className="w-6 h-6 text-[#7BA3A1]" />
                  <p className="text-sm text-[#7BA3A1] text-center">
                    No police stations found within 10 km.
                  </p>
                </div>
              ) : (
                policeResults.map((result) => (
                  <div
                    key={result.id}
                    className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#F5F3EF] truncate">
                          {result.name}
                        </h3>
                        <p className="text-xs text-[#E8A838] mt-0.5">
                          {formatDistance(result.distance)}
                        </p>
                        {result.address && (
                          <p className="text-xs text-[#7BA3A1] mt-1 truncate">
                            {result.address}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleNavigate(result)}
                        className="shrink-0 flex items-center gap-1.5 bg-[#0F1E1E] border border-[#2D5A5840] rounded-xl px-3 py-2 text-xs font-medium text-[#F5F3EF] active:scale-95 transition-transform"
                      >
                        <NavigateIcon className="w-3.5 h-3.5 text-[#E8A838]" />
                        Navigate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Nearby Categories */}
      {!policeLoading && !policeResults && !policeError && (
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
                          onClick={() =>
                            item.onClick ? item.onClick() : openNearby(item.label)
                          }
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
      )}

      {/* Bottom spacer for fixed navigation */}
      <div className="h-20" />
    </div>
  );
}