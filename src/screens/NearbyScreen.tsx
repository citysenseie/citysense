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
  ChevronRight,
Moon,
ArrowLeft,
  Navigation as NavigateIcon,
  Loader2,
  AlertCircle,
  MapPin as MapPinIcon,
  Users,
  
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

interface NearbyResult {
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

 const [nearbyResults, setNearbyResults] = useState<NearbyResult[] | null>(null);
const [nearbyLoading, setNearbyLoading] = useState(false);
const [nearbyError, setNearbyError] = useState<string | null>(null);
const [activeNearbyType, setActiveNearbyType] = useState<string | null>(null);
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

  const handleNavigate = useCallback((result: NearbyResult) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${result.lat},${result.lon}&travelmode=driving`;
    window.open(url, "_blank");
  }, []);

  const searchNearbyPlaces = useCallback(
  async (
    label: string,
    osmFilter: string,
    fallbackName: string,
    radius = 5000
  ) => {
    setNearbyLoading(true);
    setNearbyError(null);
    setNearbyResults(null);
    setActiveNearbyType(label);

    try {
      const query = `[out:json][timeout:10];
(
  node[${osmFilter}](around:${radius},${lat},${lng});
  way[${osmFilter}](around:${radius},${lat},${lng});
  relation[${osmFilter}](around:${radius},${lat},${lng});
);
out center;`;
const controller = new AbortController();
const timeoutId = window.setTimeout(() => controller.abort(), 12000);
      const response = await fetch(
  "https://overpass.kumi.systems/api/interpreter",
        {
          method: "POST",
          body: query,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          signal: controller.signal,
        }
      );
window.clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();

      const elements = data.elements as Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: {
          lat: number;
          lon: number;
        };
        tags?: Record<string, string>;
      }>;

      const results: NearbyResult[] = elements
        .map((el) => {
          const itemLat = el.lat ?? el.center?.lat;
          const itemLon = el.lon ?? el.center?.lon;

          if (itemLat == null || itemLon == null) {
            return null;
          }

          const distance = haversineDistance(
            lat,
            lng,
            itemLat,
            itemLon
          );

          const name =
            el.tags?.name ||
            el.tags?.["name:en"] ||
            fallbackName;

          const address =
            buildAddress(el.tags || {}) ||
            el.tags?.["addr:full"] ||
            "Address unavailable";

          return {
            id: el.id,
            name,
            lat: itemLat,
            lon: itemLon,
            distance,
            address,
          };
        })
        .filter(
          (result): result is NearbyResult =>
            result !== null
        )
        .sort((a, b) => a.distance - b.distance);

      setNearbyResults(results);
   } catch (err) {
  setNearbyError(
    err instanceof Error
      ? err.message
      : `Failed to find nearby ${label.toLowerCase()}`
  );
} finally {
  setNearbyLoading(false);
}
  },
  [lat, lng]
);
const searchPoliceStations = () =>
  searchNearbyPlaces(
    "Police Stations",
    '"amenity"="police"',
    "Police Station"
  );

const searchHospitals = () =>
  searchNearbyPlaces(
    "Hospitals",
    '"amenity"="hospital"',
    "Hospital"
  );

const searchPharmacies = () =>
  searchNearbyPlaces(
    "Pharmacies",
    '"amenity"="pharmacy"',
    "Pharmacy"
  );

const searchEmergencyRooms = () =>
  searchNearbyPlaces(
    "Emergency Rooms",
    '"emergency"="yes"',
    "Emergency Room"
  );

const searchFireStations = () =>
  searchNearbyPlaces(
    "Fire Stations",
    '"amenity"="fire_station"',
    "Fire Station"
  );

const searchAEDs = () =>
  searchNearbyPlaces(
    "AED Defibrillators",
    '"emergency"="defibrillator"',
    "AED Defibrillator"
  );
 
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
      label: "Safe Journey",
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
       subtitle: "Police, medical care & urgent help",
    icon: Shield,
    accent: "#EF6464",
    iconBg: "bg-[#EF6464]/10",
      items: [
  {
    label: "Police Station",
    icon: Siren,
    onClick: searchPoliceStations,
  },
  {
    label: "Hospital",
    icon: HeartPulse,
    onClick: searchHospitals,
  },
  {
    label: "Pharmacy",
    icon: Pill,
    onClick: searchPharmacies,
  },
  {
    label: "Emergency Room",
    icon: Cross,
    onClick: searchEmergencyRooms,
  },
  {
    label: "Fire Station",
    icon: Flame,
    onClick: searchFireStations,
  },
  {
    label: "AED Defibrillator",
    icon: Zap,
    onClick: searchAEDs,
  },
],
    },
    {
      title: "Driver",
       subtitle: "Fuel, charging, parking & repairs",
    icon: Car,
    accent: "#60A5FA",
    iconBg: "bg-[#60A5FA]/10",
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
       subtitle: "Useful everyday services around you",
    icon: ShoppingCart,
    accent: "#E8A838",
    iconBg: "bg-[#E8A838]/10",
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
       subtitle: "Places and services for families",
    icon: Users,
    accent: "#A78BFA",
    iconBg: "bg-[#A78BFA]/10",
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
       subtitle: "Essential places available after dark",
    icon: Moon,
    accent: "#818CF8",
    iconBg: "bg-[#818CF8]/10",
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
       subtitle: "Prayer spaces & faith services nearby",
    icon: Hand,
    accent: "#34D399",
    iconBg: "bg-[#34D399]/10",
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

      {/* Nearby Results */}
{(nearbyLoading || nearbyError || nearbyResults) && (
  <div className="mb-5">
    {/* Results Header */}
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#7BA3A1] font-bold">
          Nearby
        </p>

        <h2 className="text-lg font-bold text-[#F5F3EF] mt-1">
          {activeNearbyType || "Nearby Places"}
        </h2>
      </div>

      <button
        onClick={() => {
          setNearbyResults(null);
          setNearbyError(null);
          setNearbyLoading(false);
          setActiveNearbyType(null);
        }}
        className="flex items-center gap-1.5 bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-3 py-2 text-xs font-medium text-[#F5F3EF] active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-3.5 h-3.5 text-[#E8A838]" />
        Back
      </button>
    </div>

    {/* Loading */}
    {nearbyLoading && (
      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-[22px] p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#E8A838]/10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#E8A838] animate-spin" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#F5F3EF]">
            Finding {activeNearbyType?.toLowerCase()}...
          </p>

          <p className="text-xs text-[#7BA3A1] mt-1">
            Searching around your current location
          </p>
        </div>
      </div>
    )}

    {/* Error */}
    {nearbyError && !nearbyLoading && (
      <div className="bg-[#1A2E2D] border border-[#EF4444]/20 rounded-[22px] p-6 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-[#EF4444]" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-[#F5F3EF]">
            Search unavailable
          </p>

          <p className="text-xs text-[#7BA3A1] mt-1">
            {nearbyError}
          </p>
        </div>
      </div>
    )}

    {/* Results */}
    {nearbyResults && !nearbyLoading && !nearbyError && (
      <>
        {/* Result summary */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#7BA3A1]">
            {nearbyResults.length === 1
              ? "1 place found"
              : `${nearbyResults.length} places found`}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#7BA3A1]">
            <LocateFixed className="w-3.5 h-3.5 text-[#E8A838]" />
            Within 10 km
          </div>
        </div>

        {nearbyResults.length === 0 ? (
          /* Empty state */
          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-[22px] p-8 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#7BA3A1]/10 flex items-center justify-center">
              <MapPinIcon className="w-6 h-6 text-[#7BA3A1]" />
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-[#F5F3EF]">
                Nothing nearby
              </p>

              <p className="text-xs text-[#7BA3A1] mt-1">
                No {activeNearbyType?.toLowerCase()} found within 10 km.
              </p>
            </div>
          </div>
        ) : (
          /* Place cards */
          <div className="flex flex-col gap-3">
            {nearbyResults.map((result, index) => (
              <div
                key={`${result.id}-${index}`}
                className="relative overflow-hidden bg-[#1A2E2D] border border-[#2D5A5840] rounded-[22px] p-4"
              >
                {/* subtle top highlight */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#E8A838]/30 to-transparent" />

                <div className="flex items-start gap-3">
                  {/* Place icon */}
                  <div className="w-11 h-11 rounded-2xl bg-[#E8A838]/10 flex items-center justify-center shrink-0">
                    <MapPinIcon className="w-5 h-5 text-[#E8A838]" />
                  </div>

                  {/* Information */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#F5F3EF] leading-tight">
                      {result.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-semibold text-[#E8A838]">
                        {formatDistance(result.distance)}
                      </span>

                      <span className="w-1 h-1 rounded-full bg-[#527573]" />

                      <span className="text-[11px] text-[#7BA3A1]">
                        Nearby
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 mt-2">
                      <MapPinIcon className="w-3.5 h-3.5 text-[#527573] shrink-0 mt-0.5" />

                      <p className="text-xs text-[#7BA3A1] leading-relaxed">
                        {result.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#2D5A58]/30">
                  <button
                    onClick={() => handleNavigate(result)}
                    className="w-full flex items-center justify-center gap-2 bg-[#E8A838] text-[#0F1E1E] rounded-xl px-4 py-2.5 text-sm font-bold active:scale-[0.98] transition-transform"
                  >
                    <NavigateIcon className="w-4 h-4" />
                    Navigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    )}
  </div>
)}

    {/* Nearby Categories */}
{!nearbyLoading && !nearbyResults && !nearbyError && (
  <div className="mb-3">
    <div className="flex items-end justify-between mb-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#7BA3A1] font-bold">
          Nearby Categories
        </p>
        <p className="text-xs text-[#5F8583] mt-1">
          Find what you need around you
        </p>
      </div>

      <MapPin className="w-4 h-4 text-[#E8A838]" />
    </div>

    <div className="flex flex-col gap-3">
      {categories.map((category) => {
        const isOpen = openSections[category.title] ?? false;
        const CategoryIcon = category.icon;

        return (
          <div
            key={category.title}
            className={`
              relative overflow-hidden rounded-[22px]
              border transition-all duration-300
              ${
                isOpen
                  ? "bg-[#1A2E2D] border-[#355B58]"
                  : "bg-[#162827] border-[#294745]/70"
              }
            `}
          >
            {/* subtle accent glow */}
            <div
              className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-3xl opacity-10 pointer-events-none"
              style={{ backgroundColor: category.accent }}
            />

            {/* Category header */}
            <button
              onClick={() => toggleSection(category.title)}
              className="relative w-full flex items-center gap-3.5 px-4 py-4 text-left active:scale-[0.99] transition-transform"
            >
              {/* Icon */}
              <div
                className={`w-11 h-11 rounded-2xl ${category.iconBg} flex items-center justify-center shrink-0`}
              >
                <CategoryIcon
                  className="w-5 h-5"
                  style={{ color: category.accent }}
                />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[#F5F3EF] text-[15px]">
                    {category.title}
                  </h2>
                </div>

                <p className="text-xs text-[#7BA3A1] mt-0.5 truncate">
                  {category.subtitle}
                </p>

                <p
                  className="text-[11px] font-medium mt-1"
                  style={{ color: category.accent }}
                >
                  {category.items.length} services nearby
                </p>
              </div>

              {/* Arrow */}
              <div className="w-8 h-8 rounded-full bg-[#0F1E1E]/70 flex items-center justify-center shrink-0">
                <ChevronRight
                  className={`w-4 h-4 text-[#7BA3A1] transition-transform duration-300 ${
                    isOpen ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            {/* Services */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${
                  isOpen
                    ? "max-h-[1000px] opacity-100"
                    : "max-h-0 opacity-0"
                }
              `}
            >
              <div className="px-3 pb-3">
                <div className="h-px bg-[#2D5A58]/40 mb-3" />

                <div className="grid grid-cols-2 gap-2">
                  {category.items.map((item) => {
                    const ItemIcon = item.icon;

                    return (
                      <button
                        key={item.label}
                        onClick={() =>
                          item.onClick
                            ? item.onClick()
                            : openNearby(item.label)
                        }
                        className="
                          group flex flex-col items-start
                          min-h-[88px] p-3
                          bg-[#0F1E1E]/80
                          border border-[#2D5A58]/40
                          rounded-2xl
                          text-left
                          active:scale-[0.97]
                          transition-all duration-200
                          hover:border-[#47706D]
                        "
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className={`w-8 h-8 rounded-xl ${category.iconBg} flex items-center justify-center`}
                          >
                            <ItemIcon
                              className="w-4 h-4"
                              style={{ color: category.accent }}
                            />
                          </div>

                          <ChevronRight className="w-3.5 h-3.5 text-[#527573]" />
                        </div>

                        <span className="text-[13px] font-medium text-[#F5F3EF] mt-2.5 leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
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