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
interface Step1DestinationProps {
  selectedDestination: string | null;
  setSelectedDestination: (value: string) => void;

  onDestinationLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;

  onContinue: () => void;
}

export default function Step1Destination({
  selectedDestination,
  setSelectedDestination,
  onDestinationLocationSelect,
  onContinue,
}: Step1DestinationProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const handleSearchSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setSelectedLocation(location);
    setSelectedAddress(location.address);
    setSelectedDestination("search");

    setShowSearch(false);
  };

  const handleMapSelect = (
  position: [number, number]
) => {
  const location = {
    latitude: position[0],
    longitude: position[1],
    address: `${position[0].toFixed(
      5
    )}, ${position[1].toFixed(5)}`,
  };

  setSelectedLocation(location);
  setSelectedAddress(location.address);

  onDestinationLocationSelect(location);
};

  const confirmMapLocation = () => {
    if (!selectedLocation) return;

    setSelectedDestination("map");
    setShowMap(false);
  };

  const canContinue =
    selectedDestination !== null &&
    (selectedDestination === "home" ||
      selectedDestination === "work" ||
      selectedDestination === "family" ||
      !!selectedLocation);

  return (
    <div className="space-y-5 pb-4">
      <div className="space-y-3">
        <DestinationCard
          icon={<Home className="w-6 h-6" />}
          title="Home"
          subtitle="Saved destination"
          selected={selectedDestination === "home"}
          onClick={() => {
            setSelectedDestination("home");
            setSelectedAddress(null);
            setSelectedLocation(null);
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<Briefcase className="w-6 h-6" />}
          title="Work"
          subtitle="Office address"
          selected={selectedDestination === "work"}
          onClick={() => {
            setSelectedDestination("work");
            setSelectedAddress(null);
            setSelectedLocation(null);
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<Heart className="w-6 h-6" />}
          title="Family"
          subtitle={
            selectedDestination === "family" && selectedAddress
              ? selectedAddress
              : "Home address"
          }
          selected={selectedDestination === "family"}
          onClick={() => {
            setSelectedDestination("family");
            setShowSearch(false);
            setShowMap(false);
          }}
        />

        <DestinationCard
          icon={<MapPin className="w-6 h-6" />}
          title="Choose on Map"
          subtitle={
            selectedDestination === "map" && selectedLocation
              ? selectedLocation.address
              : "Select a location on the map"
          }
          selected={selectedDestination === "map"}
          onClick={() => {
            setShowMap(true);
            setShowSearch(false);
          }}
        />

        <DestinationCard
          icon={<Search className="w-6 h-6" />}
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

      {/* SEARCH */}
      {showSearch && (
        <div className="rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#F5F3EF]">
                Search Address
              </h3>

              <p className="mt-1 text-sm text-[#7BA3A1]">
                Search for a street, city or landmark.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="rounded-full p-2 text-[#7BA3A1] hover:bg-[#223635]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <LocationSearch
            onLocationSelect={handleSearchSelect}
          />
        </div>
      )}

      {/* MAP */}
      {showMap && (
        <div className="overflow-hidden rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D]">
          <div className="flex items-center justify-between p-4">
            <div>
              <h3 className="font-bold text-[#F5F3EF]">
                Choose on Map
              </h3>

              <p className="mt-1 text-sm text-[#7BA3A1]">
                Tap anywhere on the map to choose your destination.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="rounded-full p-2 text-[#7BA3A1] hover:bg-[#223635]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[55vh] min-h-[360px] w-full">
            <LocationPickerMap
              selectedLocation={selectedLocation}
              onLocationSelect={handleMapSelect}
            />
          </div>

          {selectedLocation && (
            <div className="border-t border-[#2D5A5830] px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-[#7BA3A1]">
                Selected destination
              </p>

              <p className="mt-1 text-sm font-semibold text-[#F5F3EF]">
                {selectedLocation.address}
              </p>
            </div>
          )}

          <div className="p-4">
            <button
              type="button"
              onClick={confirmMapLocation}
              disabled={!selectedLocation}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition ${
                selectedLocation
                  ? "bg-[#4ADE80] text-[#0F1E1E] shadow-lg"
                  : "cursor-not-allowed bg-[#294240] text-[#7BA3A1]"
              }`}
            >
              <Check className="h-5 w-5" />
              Confirm Destination
            </button>
          </div>
        </div>
      )}

      {/* CONTINUE */}
      <div className="sticky bottom-0 z-20 bg-[#0F1E1E] pb-3 pt-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className={`w-full rounded-2xl py-4 font-bold transition-all ${
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