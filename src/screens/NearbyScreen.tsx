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
  ChevronLeft,
Moon,
ArrowLeft,
  Navigation as NavigateIcon,
  Loader2,
  AlertCircle,
  MapPin as MapPinIcon,
  Users,
  Phone,
  
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
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
 id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address: string;
  placeId?: string;
  phone?: string;
  openingHours?: any;
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
type OpeningStatus = {
  available: boolean;
  isOpen: boolean | null;
  statusText: string;
  hoursText: string | null;
};

function getOpeningStatus(openingHours: any): OpeningStatus {
  if (!openingHours || typeof openingHours !== "string") {
    return {
      available: false,
      isOpen: null,
      statusText: "Hours unavailable",
      hoursText: null,
    };
  }

  return {
    available: true,
    isOpen: null,
    statusText: "Opening hours",
    hoursText: openingHours,
  };
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
 const [nearbyResults, setNearbyResults] = useState<NearbyResult[] | null>(null);
const [nearbyLoading, setNearbyLoading] = useState(false);
const [nearbyError, setNearbyError] = useState<string | null>(null);
const [activeNearbyType, setActiveNearbyType] = useState<string | null>(null);
const [showQiblaCompass, setShowQiblaCompass] = useState(false);
const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
const [deviceHeading, setDeviceHeading] = useState<number>(0);
const qiblaDifference =
  qiblaBearing === null
    ? null
    : Math.abs(
        ((qiblaBearing - deviceHeading + 540) % 360) - 180
      );

const isQiblaAligned =
  qiblaDifference !== null && qiblaDifference <= 3;
const qiblaCompassRef = useRef<HTMLDivElement | null>(null);
useEffect(() => {
  const handleOrientation = (event: DeviceOrientationEvent) => {
    const compassEvent = event as DeviceOrientationEvent & {
      webkitCompassHeading?: number;
    };

    let heading: number | null = null;

    // iPhone / Safari
    if (typeof compassEvent.webkitCompassHeading === "number") {
      heading = compassEvent.webkitCompassHeading;
    }
    // Android / other supported browsers
    else if (typeof event.alpha === "number") {
      heading = 360 - event.alpha;
    }

    if (heading !== null) {
  const normalizedHeading = (heading + 360) % 360;

  setDeviceHeading((previousHeading) => {
    let difference = normalizedHeading - previousHeading;

    // Always take the shortest route around the compass
    if (difference > 180) difference -= 360;
    if (difference < -180) difference += 360;

    // Ignore tiny sensor movements
    if (Math.abs(difference) < 1.5) {
      return previousHeading;
    }

    // Smooth larger movements instead of jumping immediately
    const smoothingFactor = 0.18;
    const smoothed =
      previousHeading + difference * smoothingFactor;

    return (smoothed + 360) % 360;
  });
}
  };

  window.addEventListener("deviceorientation", handleOrientation, true);

  return () => {
    window.removeEventListener("deviceorientation", handleOrientation, true);
  };
}, []);
  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  
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
const loadPlaceDetails = useCallback(
  async (result: NearbyResult): Promise<NearbyResult> => {
    if (!result.placeId) {
      return result;
    }

    try {
      const response = await fetch("/api/place-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: result.placeId,
        }),
      });

      if (!response.ok) {
        return result;
      }

      const details = await response.json();

      return {
        ...result,
        phone: details.phone ?? result.phone,
        openingHours: details.openingHours ?? result.openingHours,
      };
    } catch {
      return result;
    }
  },
  []
);
  const searchNearbyPlaces = useCallback(
  async (
    label: string,
    geoapifyCategory: string,
    fallbackName: string,
    radius = 5000,
    conditions?: string
  ) => {

    setNearbyLoading(true);
    setNearbyError(null);
    setNearbyResults(null);
    setActiveNearbyType(label);

    try {
      const response = await fetch("/api/nearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lat,
          lng,
          categories: geoapifyCategory,
          conditions,
          radius,
          limit: 20,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error ||
            `Nearby search unavailable (${response.status})`
        );
      }

      const data = await response.json();
      

      const features = Array.isArray(data.features) ? data.features : [];

      const results: NearbyResult[] = features
        .map((feature: any) => {
          const props = feature.properties ?? {};

          const itemLat = props.lat;
          const itemLon = props.lon;

          if (
            typeof itemLat !== "number" ||
            typeof itemLon !== "number"
          ) {
            return null;
          }

          const distance =
            typeof props.distance === "number"
              ? props.distance
              : haversineDistance(lat, lng, itemLat, itemLon);

          const name =
            props.name ||
            props.address_line1 ||
            fallbackName;

          const address =
            props.formatted ||
            props.address_line2 ||
            "Address unavailable";

          return {
  id: props.place_id || `${itemLat}-${itemLon}`,
  placeId: props.place_id,
  name,
  lat: itemLat,
  lon: itemLon,
  distance,
  address,
  phone: props.contact?.phone || props.phone,
  openingHours: props.opening_hours,
};
        })
        .filter(
          (result: NearbyResult | null): result is NearbyResult =>
            result !== null
        )
        .sort(
          (a: NearbyResult, b: NearbyResult) =>
            a.distance - b.distance
        );

     setNearbyResults(results);

Promise.all(results.map((result) => loadPlaceDetails(result)))
  .then((detailedResults) => {
    setNearbyResults(detailedResults);
  })
  .catch(() => {
    // Keep the original nearby results if place details fail.
  });
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
    "service.police",
    "Police Station"
  );
const searchHospitals = () =>
  searchNearbyPlaces(
    "Hospitals",
    "healthcare.hospital",
    "Hospital"
  );

const searchPharmacies = () =>
  searchNearbyPlaces(
    "Pharmacies",
    "healthcare.pharmacy",
    "Pharmacy"
  );

const searchEmergencyRooms = () =>
  searchNearbyPlaces(
    "Emergency Rooms",
    "healthcare.hospital",
    "Emergency Room"
  );

const searchFireStations = () =>
  searchNearbyPlaces(
    "Fire Stations",
    "service.fire_station",
    "Fire Station"
  );

const searchAEDs = () =>
  searchNearbyPlaces(
    "AED Defibrillators",
    "healthcare",
    "AED Defibrillator"
  );
 const searchGroceryStores = () =>
  searchNearbyPlaces(
    "Grocery Stores",
    "commercial.supermarket",
    "Grocery Store"
  );

const searchATMs = () =>
  searchNearbyPlaces(
    "ATMs",
    "service.financial.atm",
    "ATM"
  );

const searchPublicToilets = () =>
  searchNearbyPlaces(
    "Public Toilets",
    "amenity.toilet",
    "Public Toilet"
  );

const searchHotels = () =>
  searchNearbyPlaces(
    "Hotels",
    "accommodation.hotel",
    "Hotel"
  );
  const searchPlaygrounds = () =>
  searchNearbyPlaces(
    "Playgrounds",
    "leisure.playground",
    "Playground"
  );

const searchParks = () =>
  searchNearbyPlaces(
    "Parks",
    "leisure.park",
    "Park"
  );

const searchSchools = () =>
  searchNearbyPlaces(
    "Schools",
    "education.school",
    "School"
  );

const searchSwimmingPools = () =>
  searchNearbyPlaces(
    "Swimming Pools",
    "sport.swimming_pool",
    "Swimming Pool"
  );

const searchSportsCenters = () =>
  searchNearbyPlaces(
    "Sports Centers",
    "sport.sports_centre",
    "Sports Center"
  );

const searchFamilyRestaurants = () =>
  searchNearbyPlaces(
    "Family Restaurants",
    "catering.restaurant",
    "Family Restaurant"
  );
  const searchOpenPharmacies = () =>
  searchNearbyPlaces(
    "Open Pharmacies",
    "healthcare.pharmacy",
    "Open Pharmacy"
  );

const searchOpenGasStations = () =>
  searchNearbyPlaces(
    "Open Gas Stations",
    "service.vehicle.fuel",
    "Open Gas Station"
  );

const searchOpenHotels = () =>
  searchNearbyPlaces(
    "Open Hotels",
    "accommodation.hotel",
    "Open Hotel"
  );

const searchOpenRestaurants = () =>
  searchNearbyPlaces(
    "Open Restaurants",
    "catering.restaurant",
    "Open Restaurant"
  );
  const searchFreeWiFis = () =>
  searchNearbyPlaces(
    "Free Wi-Fi",
    "catering",
    "Free Wi-Fi",
    5000,
    "internet_access.free"
  );

const searchPhoneRepairs = () =>
  searchNearbyPlaces(
    "Phone Repair",
    "commercial.elektronics",
    "Phone Repair"
  );
  const searchMosques = () =>
  searchNearbyPlaces(
    "Mosques",
    "religion.place_of_worship.islam",
    "Mosque"
  );

const searchIslamicCenters = () =>
  searchNearbyPlaces(
    "Islamic Centers",
    "religion.place_of_worship.islam",
    "Islamic Center"
  );

const searchQiblaDirections = () => {
  const kaabaLat = 21.4225;
  const kaabaLng = 39.8262;

  const userLatRad = (lat * Math.PI) / 180;
  const kaabaLatRad = (kaabaLat * Math.PI) / 180;
  const deltaLngRad = ((kaabaLng - lng) * Math.PI) / 180;

  const y = Math.sin(deltaLngRad);
  const x =
    Math.cos(userLatRad) * Math.tan(kaabaLatRad) -
    Math.sin(userLatRad) * Math.cos(deltaLngRad);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  const qiblaDirection = (bearing + 360) % 360;

setQiblaBearing(qiblaDirection);
setShowQiblaCompass(true);

setTimeout(() => {
  qiblaCompassRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, 100);
};

const searchPrayerSpaces = () =>
  searchNearbyPlaces(
    "Prayer Spaces",
    "religion.place_of_worship.islam",
    "Prayer Space"
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
  title: "Daily Essentials",
  subtitle: "Useful everyday services around you",
  icon: ShoppingCart,
  accent: "#E8A838",
  iconBg: "bg-[#E8A838]/10",
  items: [
    {
      label: "Grocery Store",
      icon: ShoppingCart,
      onClick: searchGroceryStores,
    },
    { label: "Pharmacy", icon: Pill, onClick: searchPharmacies },
    {
      label: "ATM",
      icon: Landmark,
      onClick: searchATMs,
    },
    {
      label: "Public Toilet",
      icon: MapPin,
      onClick: searchPublicToilets,
    },
    {
      label: "Free Wi-Fi",
      icon: Wifi,
      onClick: searchFreeWiFis,
    },
    {
      label: "Phone Repair",
      icon: Smartphone,
      onClick: searchPhoneRepairs,
    },
    
  ],
},
{
  title: "Travel & Transport",
  subtitle: "Useful services when you're on the move",
  icon: Car,
  accent: "#38BDF8",
  iconBg: "bg-[#38BDF8]/10",
  items: [
    {
      label: "Hotel",
      icon: Hotel,
      onClick: searchHotels,
    },
  ],
},
   {
  title: "Family",
  subtitle: "Places and services for families",
  icon: Users,
  accent: "#A78BFA",
  iconBg: "bg-[#A78BFA]/10",
  items: [
    {
      label: "Playground",
      icon: Baby,
      onClick: searchPlaygrounds,
    },
    {
      label: "Park",
      icon: TreePine,
      onClick: searchParks,
    },
    {
      label: "School",
      icon: School,
      onClick: searchSchools,
    },
    {
      label: "Swimming Pool",
      icon: Waves,
      onClick: searchSwimmingPools,
    },
    {
      label: "Sports Center",
      icon: Dumbbell,
      onClick: searchSportsCenters,
    },
    {
      label: "Family Restaurant",
      icon: UtensilsCrossed,
      onClick: searchFamilyRestaurants,
    },
  ],
},
    {
      title: "Night",
       subtitle: "Essential places available after dark",
    icon: Moon,
    accent: "#818CF8",
    iconBg: "bg-[#818CF8]/10",
      items: [
       { label: "Open Pharmacy", icon: Pill, onClick: searchOpenPharmacies },
        { label: "Open Gas Station", icon: Fuel, onClick: searchOpenGasStations },
        { label: "Open Hotel", icon: Hotel, onClick: searchOpenHotels },
        { label: "Open Restaurant", icon: UtensilsCrossed, onClick: searchOpenRestaurants },
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
        { label: "Mosque", icon: Drum, onClick: searchMosques },
        { label: "Islamic Center", icon: Building2, onClick: searchIslamicCenters },
        { label: "Qibla Direction", icon: Compass, onClick: searchQiblaDirections },
        { label: "Prayer Space", icon: Hand, onClick: searchPrayerSpaces },
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
            {nearbyResults.map((result, index) => {
  const openingStatus = getOpeningStatus(result.openingHours);

  return (
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
                      {/* Opening status */}
<div className="flex items-center gap-2 mt-3">
  <span
    className={`w-2 h-2 rounded-full ${
      openingStatus.isOpen === true
        ? "bg-green-500"
        : openingStatus.isOpen === false
        ? "bg-red-500"
        : "bg-[#7BA3A1]"
    }`}
  />

  <span
    className={`text-xs font-semibold ${
      openingStatus.isOpen === true
        ? "text-green-400"
        : openingStatus.isOpen === false
        ? "text-red-400"
        : "text-[#7BA3A1]"
    }`}
  >
    {openingStatus.statusText}
  </span>
</div>
{openingStatus.hoursText && (
  <p className="text-[11px] text-[#7BA3A1] mt-1 ml-4">
    {openingStatus.hoursText}
  </p>
)}
{/* Phone number */}
{result.phone && (
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs text-[#7BA3A1]">
      📞 {result.phone}
    </span>
  </div>
)}
                    </div>
                    {result.phone && (
  <div className="flex items-center gap-1.5 mt-2">
    <Phone className="w-3.5 h-3.5 text-[#527573] shrink-0" />

    <p className="text-xs text-[#F5F3EF]">
      {result.phone}
    </p>
  </div>
)}
                  </div>
                </div>

               {/* Actions */}
<div className="mt-4 pt-3 border-t border-[#2D5A58]/30">
  <div className={`grid gap-2 ${result.phone ? "grid-cols-2" : "grid-cols-1"}`}>
    {result.phone && (
      <button
        onClick={() => window.location.href = `tel:${result.phone}`}
        className="flex items-center justify-center gap-2 bg-[#1A2E2D] border border-[#355B58] text-[#F5F3EF] rounded-xl px-4 py-2.5 text-sm font-bold active:scale-[0.98] transition-transform"
      >
        <Phone className="w-4 h-4 text-[#E8A838]" />
        Call
      </button>
    )}

    <button
      onClick={() => handleNavigate(result)}
      className="flex items-center justify-center gap-2 bg-[#E8A838] text-[#0F1E1E] rounded-xl px-4 py-2.5 text-sm font-bold active:scale-[0.98] transition-transform"
    >
      <NavigateIcon className="w-4 h-4" />
      Navigate
    </button>
  </div>
</div>
              </div>
                      );
          })}
          </div>
        )}
      </>
    )}
  </div>
)}
{/* Qibla Compass */}
{showQiblaCompass && qiblaBearing !== null && (
  <div
  ref={qiblaCompassRef}
  className="mb-5 bg-[#1A2E2D] border border-[#355B58] rounded-[24px] p-5"
>
    {/* Header */}
    <div className="flex items-center justify-between mb-5">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[#E8A838] font-bold">
          Qibla Compass
        </p>
        <p className="text-xs text-[#7BA3A1] mt-1">
          Direction to the Kaaba in Makkah
        </p>
      </div>

      <button
        onClick={() => setShowQiblaCompass(false)}
        className="w-9 h-9 rounded-full bg-[#0F1E1E] text-[#F5F3EF] flex items-center justify-center text-lg"
      >
        ×
      </button>
    </div>

    {/* Compass */}
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 rounded-full border-2 border-[#527573] bg-[#0F1E1E] shadow-inner">

        {/* Cardinal directions */}
        <span className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-bold text-[#F5F3EF]">
          N
        </span>

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7BA3A1]">
          E
        </span>

        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm font-bold text-[#7BA3A1]">
          S
        </span>

        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#7BA3A1]">
          W
        </span>

        {/* Qibla arrow */}
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transform: `rotate(${qiblaBearing - deviceHeading}deg)`,
          }}
        >
          <div className="absolute left-1/2 top-8 -translate-x-1/2 flex flex-col items-center">
            <div className="text-[#E8A838] text-3xl leading-none">
              ▲
            </div>

            <div className="w-1 h-20 bg-[#E8A838] rounded-full" />
          </div>
        </div>

        {/* Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#E8A838] border-4 border-[#162827] flex items-center justify-center">
          <span className="text-[#0F1E1E] text-xl">🕋</span>
        </div>
      </div>

      {/* Bearing */}
      <div className="text-center mt-5">
        <p className="text-3xl font-bold text-[#F5F3EF]">
          {Math.round(qiblaBearing)}°
        </p>

        <p
  className={`text-sm font-semibold mt-1 ${
    isQiblaAligned
      ? "text-emerald-400"
      : "text-[#E8A838]"
  }`}
>
  {isQiblaAligned
    ? "✓ Aligned with Qibla"
    : "Turn toward Qibla"}
</p>

       <p className="text-xs text-[#7BA3A1] mt-2">
  {qiblaDifference !== null && qiblaDifference <= 3
    ? "You are facing the Qibla"
    : qiblaDifference !== null
      ? `Turn ${Math.round(qiblaDifference)}° toward the arrow`
      : "Finding Qibla direction..."}
</p>
      </div>
    </div>
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
     {/* Clean category navigation */}
{selectedCategory === null ? (
  <div className="mt-7">
    <div className="flex items-end justify-between mb-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#607D79]">
          Explore
        </p>

        <h2 className="mt-1 text-[17px] font-semibold text-[#F5F3EF]">
          What do you need nearby?
        </h2>
      </div>

      <span className="text-[11px] text-[#607D79]">
        {categories.length} categories
      </span>
    </div>

    <div className="border-t border-white/[0.055]">
      {categories.map((category) => {
        const CategoryIcon = category.icon;

        return (
          <button
            key={category.title}
            type="button"
            onClick={() => setSelectedCategory(category.title)}
            className="group flex w-full items-center gap-3.5 border-b border-white/[0.045] py-4 text-left"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${category.iconBg}`}
            >
              <CategoryIcon
                className="h-[18px] w-[18px]"
                style={{ color: category.accent }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#E7ECEA]">
                {category.title}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-[#607D79]">
                {category.subtitle}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-[#4F6966] transition-transform group-active:translate-x-0.5" />
          </button>
        );
      })}
    </div>
  </div>
) : (
  <div className="mt-7">
    {(() => {
      const category = categories.find(
        (item) => item.title === selectedCategory
      );

      if (!category) return null;

      return (
        <>
          {/* Category navigation */}
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="mb-5 flex items-center gap-2 text-left"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04]">
              <ChevronLeft className="h-4 w-4 text-[#8DA6A2]" />
            </div>

            <span className="text-xs font-medium text-[#8DA6A2]">
              Explore
            </span>
          </button>

          {/* Category identity */}
          <div className="mb-5">
            <p
              className="text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: category.accent }}
            >
              Nearby
            </p>

            <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#F5F3EF]">
              {category.title}
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-[#607D79]">
              {category.subtitle}
            </p>
          </div>

          {/* Services */}
          <div className="border-t border-white/[0.055]">
            {category.items.map((item) => {
              const ItemIcon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() =>
                    item.onClick
                      ? item.onClick()
                      : openNearby(item.label)
                  }
                  className="group flex w-full items-center gap-3.5 border-b border-white/[0.045] py-4 text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.035]">
                    <ItemIcon
                      className="h-4 w-4"
                      style={{ color: category.accent }}
                    />
                  </div>

                  <span className="min-w-0 flex-1 text-sm font-medium text-[#E4E9E7]">
                    {item.label}
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 text-[#4F6966] transition-transform group-active:translate-x-0.5" />
                </button>
              );
            })}
          </div>
        </>
      );
    })()}
  </div>
)}
    </div>
  </div>
)}
      {/* Bottom spacer for fixed navigation */}
      <div className="h-20" />
    </div>
  );
}