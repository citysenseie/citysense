import JourneyHeader from "./JourneyHeader";

interface Step4ReviewProps {
  destination: string | null;
  travelMode: string | null;
  onStart: () => void;
}

const destinationNames: Record<string, string> = {
  home: "🏠 Home",
  work: "💼 Work",
  family: "❤️ Family",
  map: "📍 Custom Location",
  search: "🔍 Search Result",
};

const travelModeNames: Record<string, string> = {
  walking: "🚶 Walking",
  cycling: "🚲 Cycling",
  driving: "🚗 Driving",
  public_transport: "🚌 Public Transport",
};

export default function Step4Review({
  destination,
  travelMode,
  onStart,
}: Step4ReviewProps) {
  return (
    <>
      <JourneyHeader
        currentStep={4}
        totalSteps={5}
        title="Review Your Journey"
        subtitle="Everything looks ready before protection begins."
      />

      <div className="space-y-4">

        <div className="rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D] p-5">
          <p className="text-sm text-[#7BA3A1]">
            Destination
          </p>

          <h3 className="mt-2 text-lg font-bold text-[#F5F3EF]">
            {destination
              ? destinationNames[destination]
              : "Not selected"}
          </h3>
        </div>

        <div className="rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D] p-5">
          <p className="text-sm text-[#7BA3A1]">
            Travel Mode
          </p>

          <h3 className="mt-2 text-lg font-bold text-[#F5F3EF]">
            {travelMode
              ? travelModeNames[travelMode]
              : "Not selected"}
          </h3>
        </div>

      </div>

      <button
        onClick={onStart}
        className="mt-8 w-full rounded-2xl bg-[#4ADE80] py-4 font-bold text-[#0F1E1E]"
      >
        Start Protected Journey
      </button>
    </>
  );
}