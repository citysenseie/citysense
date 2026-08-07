import DestinationCard from "../DestinationCard";
import {
  Home,
  Briefcase,
  Heart,
  MapPin,
  Search,
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
  return (
    <>

      <h2 className="text-xl font-bold mb-5">
        Where are you going?
      </h2>
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
          onClick={() => setSelectedDestination("home")}
        />

        <DestinationCard
          icon={<Briefcase className="w-6 h-6" />}
          title="Work"
          subtitle="Office address"
          selected={selectedDestination === "work"}
          onClick={() => setSelectedDestination("work")}
        />

        <DestinationCard
          icon={<Heart className="w-6 h-6" />}
          title="Family"
          subtitle="Home address"
          selected={selectedDestination === "family"}
          onClick={() => setSelectedDestination("family")}
        />

        <DestinationCard
          icon={<MapPin className="w-6 h-6" />}
          title="Choose on Map"
          subtitle="Select a location on the map"
          selected={selectedDestination === "map"}
          onClick={() => setSelectedDestination("map")}
        />

        <DestinationCard
          icon={<Search className="w-6 h-6" />}
          title="Search Address"
          subtitle="Find a specific address"
          selected={selectedDestination === "search"}
          onClick={() => setSelectedDestination("search")}
        />

      </div>

      <button
        onClick={onContinue}
        disabled={!selectedDestination}
        className={`mt-8 w-full rounded-2xl py-4 font-bold transition-all duration-300 ${
          selectedDestination
            ? "bg-[#4ADE80] text-[#0F1E1E]"
            : "bg-[#294240] text-[#7BA3A1] cursor-not-allowed"
        }`}
      >
        Continue →
      </button>

    </>
  );
}