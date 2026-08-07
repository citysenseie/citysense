import { LocationService } from "../services/protectedJourney/LocationService";
import Step4Review from "../components/protectedjourney/Step4Review";
import Step3TrustedContacts from "../components/protectedjourney/Step3TrustedContacts";
import Step1Destination from "../components/protectedjourney/Step1Destination";
import Step2TravelMode from "../components/protectedjourney/Step2TravelMode";
import { useEffect, useState } from "react";
import Step5JourneyActive from "../components/protectedjourney/Step5JourneyActive";
import { ProtectedJourneyEngine } from "@/services/protectedJourney/ProtectedJourneyEngine";


export default function ProtectedJourneyScreen() {
  const [step, setStep] = useState(1);
   const [selectedDestination, setSelectedDestination] =
  useState<string | null>(null);

const [selectedTravelMode, setSelectedTravelMode] =
  useState<string | null>(null);

const journeyEngine = new ProtectedJourneyEngine();
const locationService = new LocationService();
useEffect(() => {
  if (step !== 5) return;

  locationService.startTracking((location, speed) => {
    journeyEngine.updateLocation(location, speed);

    console.log("GPS Update:", location);
    console.log("Speed:", speed);
  });

  return () => {
    locationService.stopTracking();
  };
}, [step]);
  return (

    
    <div className="min-h-screen bg-[#0F1E1E] text-[#F5F3EF]">

      <div className="px-5 pt-8 pb-5">

        <h1 className="text-3xl font-black">
          Protected Journey
        </h1>

        <p className="mt-2 text-[#7BA3A1]">
          CitySense will quietly monitor your journey
          and check on you if something unexpected happens.
        </p>

      </div>

      <div className="px-5">

      {step === 1 && (
  <Step1Destination
    selectedDestination={selectedDestination}
    setSelectedDestination={setSelectedDestination}
    onContinue={() => setStep(2)}
  />
)} 
{step === 2 && (
  <Step2TravelMode
    selectedTravelMode={selectedTravelMode}
    setSelectedTravelMode={setSelectedTravelMode}
    onContinue={() => setStep(3)}
  />
)}
{step === 3 && (
  <Step3TrustedContacts
    onContinue={() => setStep(4)}
  />
)}
{step === 4 && (
  <Step4Review
    destination={selectedDestination}
    travelMode={selectedTravelMode}
  onStart={() => {
  console.log("Protected Journey Started");
  setStep(5);
}}
  />
)}
{step === 5 && (
  <Step5JourneyActive
    onEndJourney={() => {
      console.log("Protected Journey Ended");
      setStep(1);
    }}
  />
)}
      </div>

    </div>
  );
}