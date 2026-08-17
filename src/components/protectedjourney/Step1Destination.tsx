import { useState } from "react";
import DestinationCard from "../DestinationCard";
import LocationSearch from "../LocationSearch";
import LocationPickerMap from "../LocationPickerMap";
import {
  Home,
  Briefcase,
  Heart,
  MapPin,
  Search,
  X,
  Check,
} from "lucide-react";

interface DestinationLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface Step1DestinationProps {
  selectedDestination: string | null;
  setSelectedDestination: (value: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onDestinationLocationSelect?: (
    location: DestinationLocation
  ) => void;
}

export default function Step1Destination({
  selectedDestination,
  setSelectedDestination,
  onContinue,
  onBack,
  onDestinationLocationSelect,
}: Step1DestinationProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    null
  );

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSearchSelect = (location: DestinationLocation) => {
    setSelectedAddress(location.address);

    setSelectedDestination("search");

    onDestinationLocationSelect?.(location);

    setShowSearch(false);
    setShowMap(false);
  };

  const handleMapSelect = (position: [number, number]) => {
    const location = {
      latitude: position[0],
      longitude: position[1],
    };

    setSelectedMapLocation(location);
  };

  const confirmMapLocation = () => {
    if (!selectedMapLocation) return;

    setSelectedDestination("map");

    onDestinationLocationSelect?.({
      latitude: selectedMapLocation.latitude,
      longitude: selectedMapLocation.longitude,
      address: `${selectedMapLocation.latitude.toFixed(
        5
      )}, ${selectedMapLocation.longitude.toFixed(5)}`,
    });

    setShowMap(false);
  };

  const canContinue = Boolean(selectedDestination);

  return (
    <div className="space-y-4">
      <button
  type="button"
  onClick={onBack}
  className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#7BA3A1] hover:text-[#F5F3EF]"
>
  ← Back
</button>
      {/* Destination options */}
      <div className="space-y-3">
        <DestinationCard
          icon={<Home className="h-6 w-6" />}
          title="Home"
          subtitle="Saved destination"
          selected={selectedDestination === "home"}
          onClick={() => {
            setSelectedDestination("home");
            setSelectedAddress(null);
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<Briefcase className="h-6 w-6" />}
          title="Work"
          subtitle="Office address"
          selected={selectedDestination === "work"}
          onClick={() => {
            setSelectedDestination("work");
            setSelectedAddress(null);
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<Heart className="h-6 w-6" />}
          title="Family"
          subtitle="Home address"
          selected={selectedDestination === "family"}
          onClick={() => {
            setSelectedDestination("family");
            setSelectedAddress(null);
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<MapPin className="h-6 w-6" />}
          title="Choose on Map"
          subtitle={
            selectedDestination === "map" && selectedMapLocation
              ? `${selectedMapLocation.latitude.toFixed(
                  5
                )}, ${selectedMapLocation.longitude.toFixed(5)}`
              : "Select a location on the map"
          }
          selected={selectedDestination === "map"}
          onClick={() => {
            setShowMap(true);
            setShowSearch(false);
          }}
        />

        <DestinationCard
          icon={<Search className="h-6 w-6" />}
          title="Search Address"
          subtitle={
            selectedDestination === "search" && selectedAddress
              ? selectedAddress
              : "Find a specific address"
          }
          selected={selectedDestination === "search"}
          onClick={() => {
            setShowSearch(true);
            setShowMap(false);
          }}
        />
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="mt-5 rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#F5F3EF]">
                Search Address
              </h3>

              <p className="mt-1 text-sm text-[#7BA3A1]">
                Find the place you want to travel to.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="rounded-full p-2 text-[#7BA3A1] hover:bg-[#223635]"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <LocationSearch
            onLocationSelect={handleSearchSelect}
          />
        </div>
      )}

      {/* Map picker */}
      {showMap && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D]">
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-bold text-[#F5F3EF]">
                Choose on Map
              </h3>

              <p className="mt-1 text-sm text-[#7BA3A1]">
                Tap the map to choose your destination.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="rounded-full p-2 text-[#7BA3A1] hover:bg-[#223635]"
              aria-label="Close map"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[55vh] min-h-[320px] w-full">
            <LocationPickerMap
              selectedLocation={selectedMapLocation}
              onLocationSelect={handleMapSelect}
            />
          </div>

          <div className="p-4">
            <button
              type="button"
              onClick={confirmMapLocation}
              disabled={!selectedMapLocation}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition ${
                selectedMapLocation
                  ? "bg-[#4ADE80] text-[#0F1E1E]"
                  : "cursor-not-allowed bg-[#294240] text-[#7BA3A1]"
              }`}
            >
              <Check className="h-5 w-5" />
              Confirm Destination
            </button>
          </div>
        </div>
      )}

      {/* Continue */}
      <div className="sticky bottom-0 z-20 mt-6 bg-[#0F1E1E] pb-4 pt-3">
        <button
          type="button"
          onClick={() => {
            if (!canContinue) return;

            console.log(
              "Protected Journey: Step 1 → Step 2",
              selectedDestination
            );

            onContinue();
          }}
          disabled={!canContinue}
          className={`w-full rounded-2xl py-4 font-bold transition-all duration-300 ${
            canContinue
              ? "bg-[#4ADE80] text-[#0F1E1E] shadow-lg"
              : "cursor-not-allowed bg-[#294240] text-[#7BA3A1]"
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}