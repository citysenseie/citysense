import { useEffect, useState } from "react";
import { safeZones } from "@/data/SafeZones";
import { LocationService } from "../services/protectedJourney/LocationService";
import { ProtectedJourneyEngine } from "@/services/protectedJourney/ProtectedJourneyEngine";

import Step1Destination from "../components/protectedjourney/Step1Destination";
import Step2TravelMode from "../components/protectedjourney/Step2TravelMode";
import Step3TrustedContacts from "../components/protectedjourney/Step3TrustedContacts";
import Step4Review from "../components/protectedjourney/Step4Review";
import Step5JourneyActive from "../components/protectedjourney/Step5JourneyActive";

type DestinationLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

export default function ProtectedJourneyScreen() {
  const [step, setStep] = useState(1);

  const [selectedDestination, setSelectedDestination] =
    useState<string | null>(null);

  const [destinationLocation, setDestinationLocation] =
    useState<DestinationLocation | null>(null);

  const [selectedTravelMode, setSelectedTravelMode] =
    useState<string | null>(null);

  const [selectedTrustedContacts, setSelectedTrustedContacts] =
    useState<string[]>([]);

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  /*
   * Keep one engine and one location service for this journey.
   */
  const [journeyEngine] = useState(() => new ProtectedJourneyEngine());
  const [locationService] = useState(() => new LocationService());

  /*
   * Resolve saved destinations such as Home / Work / Family.
   */
  useEffect(() => {
    if (!selectedDestination) return;

    const savedDestination = safeZones.find(
      (zone) => zone.id === selectedDestination
    );

    if (savedDestination) {
      setDestinationLocation({
        latitude: savedDestination.latitude,
        longitude: savedDestination.longitude,
        address: savedDestination.name,
      });
    }
  }, [selectedDestination]);

  /*
   * Start GPS tracking only while the protected journey is active.
   */
  useEffect(() => {
    if (step !== 5) return;

   const handleLocationUpdate = (
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  },
  speed: number
) => {
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      /*
       * We need a real destination before starting the engine.
       */
      if (!destinationLocation) {
        console.warn("Protected Journey: destination location missing.");
        return;
      }

      const destination = {
        latitude: destinationLocation.latitude,
        longitude: destinationLocation.longitude,
        accuracy: 10,
        timestamp: Date.now(),
      };

      /*
       * Create the protected journey session once.
       */
      if (!journeyEngine.getSession()) {
        journeyEngine.startJourney(
          destinationLocation.address ??
            selectedDestination ??
            "Destination",
          destination,
          location,
          (selectedTravelMode ?? "walking") as
            | "walking"
            | "cycling"
            | "driving"
            | "public_transport",
          selectedTrustedContacts,
          Date.now() + 30 * 60 * 1000
        );

        console.log("Protected Journey session created.");
      }

      /*
       * Continue updating the journey.
       */
      journeyEngine.updateLocation(location, speed);

      console.log("GPS Update:", location);
    };

    locationService.startTracking(handleLocationUpdate);

    return () => {
      locationService.stopTracking();
    };
  }, [
    step,
    destinationLocation,
    selectedDestination,
    selectedTravelMode,
    selectedTrustedContacts,
    journeyEngine,
    locationService,
  ]);

  /*
   * Called by Search Address / Choose on Map.
   */
  const handleDestinationLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
    });
  };

  const resetJourney = () => {
  locationService.stopTracking();

  journeyEngine.endJourney();
  journeyEngine.resetJourney();

  setCurrentLocation(null);
  setDestinationLocation(null);
  setSelectedDestination(null);
  setSelectedTravelMode(null);
  setSelectedTrustedContacts([]);
  setStep(1);
};
const exitProtectedJourney = () => {
  locationService.stopTracking();

  journeyEngine.resetJourney();

  setCurrentLocation(null);
  setDestinationLocation(null);
  setSelectedDestination(null);
  setSelectedTravelMode(null);
  setSelectedTrustedContacts([]);

  window.history.back();
};
  return (
    <div className="min-h-screen bg-[#0F1E1E] text-[#F5F3EF]">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-3xl font-black">
          Protected Journey
        </h1>

        <p className="mt-2 text-[#7BA3A1]">
          CitySense will quietly monitor your journey and check
          on you if something unexpected happens.
        </p>
      </div>

      <div className="px-5 pb-8">
        {step === 1 && (
          <Step1Destination
            selectedDestination={selectedDestination}
            setSelectedDestination={setSelectedDestination}
            onDestinationLocationSelect={
              handleDestinationLocationSelect
            }
            onContinue={() => {
              if (!destinationLocation) {
                console.warn(
                  "Please select a valid destination first."
                );
                return;
              }

              setStep(2);
            }}
          />
        )}

        {step === 2 && (
  <Step2TravelMode
    selectedTravelMode={selectedTravelMode}
    setSelectedTravelMode={setSelectedTravelMode}
    onBack={() => setStep(1)}
    onContinue={() => setStep(3)}
  />
)}

       {step === 3 && (
  <Step3TrustedContacts
    selectedContacts={selectedTrustedContacts}
    setSelectedContacts={setSelectedTrustedContacts}
    onBack={() => setStep(2)}
    onContinue={() => setStep(4)}
  />
)}

       {step === 4 && (
  <Step4Review
    destination={selectedDestination}
    travelMode={selectedTravelMode}
    onBack={() => setStep(3)}
    onStart={() => {
              if (!destinationLocation) {
                console.warn(
                  "Cannot start Protected Journey without a destination."
                );
                return;
              }

              console.log("Protected Journey Started");
              setStep(5);
            }}
          />
        )}

        {step === 5 && destinationLocation && (
          <Step5JourneyActive
            destination={
              destinationLocation.address ??
              selectedDestination ??
            
              "Destination"
            
            }
            destinationLatitude={destinationLocation.latitude}
            destinationLongitude={destinationLocation.longitude}
            travelMode={
              (selectedTravelMode ?? "walking") as
                | "walking"
                | "cycling"
                | "driving"
                | "public_transport"
            }
            currentLocation={currentLocation}
            onEndJourney={resetJourney}
            {...({
              onExitJourney: exitProtectedJourney,
            } as any)}
          />
        )}
      </div>
    </div>
  );
}