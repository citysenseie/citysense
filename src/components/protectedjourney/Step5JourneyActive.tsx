import JourneyHeader from "./JourneyHeader";

interface Step5JourneyActiveProps {
  onEndJourney: () => void;
}

export default function Step5JourneyActive({
  onEndJourney,
}: Step5JourneyActiveProps) {
  return (
    <>
      <JourneyHeader
        currentStep={5}
        totalSteps={5}
        title="Protected Journey Active"
        subtitle="CitySense is now quietly monitoring your journey."
      />

      <div className="rounded-2xl border border-[#2D5A5830] bg-[#1A2E2D] p-6">

        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-[#4ADE80] animate-pulse" />

          <span className="font-bold text-[#4ADE80]">
            Monitoring Active
          </span>
        </div>

        <p className="mt-4 text-[#7BA3A1]">
          Your location is being monitored. If something unexpected
          happens, CitySense will check on you and notify your trusted
          contacts if necessary.
        </p>

      </div>

      <button
        onClick={onEndJourney}
        className="mt-8 w-full rounded-2xl bg-red-600 py-4 font-bold text-white"
      >
        End Protected Journey
      </button>
    </>
  );
}