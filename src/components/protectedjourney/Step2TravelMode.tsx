import DestinationCard from "../DestinationCard";
import JourneyHeader from "./JourneyHeader";

interface Step2TravelModeProps {
  selectedTravelMode: string | null;
  setSelectedTravelMode: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function Step2TravelMode({
  selectedTravelMode,
  setSelectedTravelMode,
  onBack,
  onContinue,
}: Step2TravelModeProps) {
  return (
    <>
    <button
  type="button"
  onClick={onBack}
  className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#7BA3A1] hover:text-[#F5F3EF]"
>
  ← Back
</button>
      <h2 className="text-xl font-bold mb-5">
        How are you travelling?
      </h2>

      <p className="text-[#7BA3A1] mb-6">
        Choose your primary travel method.
      </p>
      <JourneyHeader
  currentStep={2}
  totalSteps={5}
  title="How are you travelling?"
  subtitle="Choose your primary travel method."
  onBack={onBack}
/>
      <div className="space-y-3">

        <DestinationCard
          icon={<span className="text-2xl">🚶</span>}
          title="Walking"
          subtitle="On foot"
          selected={selectedTravelMode === "walking"}
          onClick={() => setSelectedTravelMode("walking")}
        />

        <DestinationCard
          icon={<span className="text-2xl">🚲</span>}
          title="Cycling"
          subtitle="Bicycle"
          selected={selectedTravelMode === "cycling"}
          onClick={() => setSelectedTravelMode("cycling")}
        />

        <DestinationCard
          icon={<span className="text-2xl">🚗</span>}
          title="Driving"
          subtitle="Car or motorcycle"
          selected={selectedTravelMode === "driving"}
          onClick={() => setSelectedTravelMode("driving")}
        />

        <DestinationCard
          icon={<span className="text-2xl">🚌</span>}
          title="Public Transport"
          subtitle="Bus, tram or train"
          selected={selectedTravelMode === "public_transport"}
          onClick={() => setSelectedTravelMode("public_transport")}
        />

      </div>

      <button
        onClick={onContinue}
        disabled={!selectedTravelMode}
        className={`mt-8 w-full rounded-2xl py-4 font-bold transition-all duration-300 ${
          selectedTravelMode
            ? "bg-[#4ADE80] text-[#0F1E1E]"
            : "bg-[#294240] text-[#7BA3A1] cursor-not-allowed"
        }`}
      >
        Continue →
      </button>
    </>
  );
}