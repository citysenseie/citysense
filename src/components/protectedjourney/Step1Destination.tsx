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
import JourneyHeader from "./JourneyHeader";

interface Step1DestinationProps {
  selectedDestination: string | null;
  setSelectedDestination: (value: string) => void;
  onContinue: () => void;
}

export default function Step1Destination({
  selectedDestination,
  setSelectedDestination,
  onContinue,
}: Step1DestinationProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [selectedMapLocation, setSelectedMapLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const handleSearchSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setSelectedAddress(location.address);
    setSelectedDestination("search");
    setShowSearch(false);
  };

  const handleMapSelect = (position: [number, number]) => {
    setSelectedMapLocation({
      latitude: position[0],
      longitude: position[1],
    });
  };

  const confirmMapLocation = () => {
    if (!selectedMapLocation) return;

    setSelectedDestination("map");
    setShowMap(false);
  };

  return (
    <>
      <JourneyHeader
        currentStep={1}
        totalSteps={5}
        title="Where are you going?"
        subtitle="Choose your destination."
      />

      <div className="space-y-3">
        <DestinationCard
          icon={<Home className="w-6 h-6" />}
          title="Home"
          subtitle="Saved destination"
          selected={selectedDestination === "home"}
          onClick={() => {
            setSelectedDestination("home");
            setSelectedAddress(null);
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
          }}
        />

        <DestinationCard
          icon={<Heart className="w-6 h-6" />}
          title="Family"
          subtitle="Home address"
          selected={selectedDestination === "family"}
          onClick={() => {
            setSelectedDestination("family");
            setSelectedAddress(null);
          }}
        />

        <DestinationCard
          icon={<MapPin className="w-6 h-6" />}
          title="Choose on Map"
          subtitle={
            selectedDestination === "map"
              ? selectedMapLocation
                ? `${selectedMapLocation.latitude.toFixed(
                    5
                  )}, ${selectedMapLocation.longitude.toFixed(5)}`
                : "Location selected"
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

      {/* Search Address Panel */}
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

          <LocationSearch onLocationSelect={handleSearchSelect} />
        </div>
      )}

      {/* Map Picker */}
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
          onClick={onContinue}
          disabled={!selectedDestination}
          className={`w-full rounded-2xl py-4 font-bold transition-all duration-300 ${
            selectedDestination
              ? "bg-[#4ADE80] text-[#0F1E1E] shadow-lg"
              : "cursor-not-allowed bg-[#294240] text-[#7BA3A1]"
          }`}
        >
          Continue →
        </button>
      </div>
    </>
  );
}