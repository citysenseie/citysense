import JourneyHeader from "./JourneyHeader";
import DestinationCard from "../DestinationCard";

interface Step3TrustedContactsProps {
  onContinue: () => void;
}

export default function Step3TrustedContacts({
  onContinue,
}: Step3TrustedContactsProps) {
  return (
    <>
      <JourneyHeader
        currentStep={3}
        totalSteps={5}
        title="Trusted Contacts"
        subtitle="Choose who CitySense can notify if you're unable to respond."
      />

      <div className="space-y-3">

        <DestinationCard
          icon={<span className="text-2xl">👤</span>}
          title="Add Trusted Contact"
          subtitle="Choose from your contacts"
          onClick={() => {}}
        />

      </div>

      <button
        onClick={onContinue}
        className="mt-8 w-full rounded-2xl bg-[#4ADE80] py-4 font-bold text-[#0F1E1E]"
      >
        Continue →
      </button>
    </>
  );
}