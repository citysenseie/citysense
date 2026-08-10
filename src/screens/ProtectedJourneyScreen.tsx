import { safeZones } from "@/data/SafeZones";
import { LocationService } from "../services/protectedJourney/LocationService";
import Step4Review from "../components/protectedjourney/Step4Review";
import Step3TrustedContacts from "../components/protectedjourney/Step3TrustedContacts";
import Step1Destination from "../components/protectedjourney/Step1Destination";
import Step2TravelMode from "../components/protectedjourney/Step2TravelMode";
import { useEffect, useRef, useState } from "react";
import Step5JourneyActive from "../components/protectedjourney/Step5JourneyActive";
import { ProtectedJourneyEngine } from "@/services/protectedJourney/ProtectedJourneyEngine";

type TravelMode =
  | "walking"
  | "cycling"
  | "driving"
  | "public_transport";

type DestinationLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

export default function ProtectedJourneyScreen() {
  const [step, setStep] = useState(1);

  const [selectedDestination, setSelectedDestination] =
    useState<string | null>(null);

  const [selectedDestinationLocation, setSelectedDestinationLocation] =
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
   * Keep these objects alive for the entire journey.
   * Do NOT recreate them on every render.
   */
  const locationServiceRef =
    useRef<LocationService | null>(null);

  const journeyEngineRef =
    useRef<ProtectedJourneyEngine | null>(null);

  if (!locationServiceRef.current) {
    locationServiceRef.current =
      new LocationService();
  }

  if (!journeyEngineRef.current) {
    journeyEngineRef.current =
      new ProtectedJourneyEngine();
  }

  /*
   * Start GPS only once when Step 5 begins.
   */
  useEffect(() => {
    if (step !== 5) return;

    const locationService =
      locationServiceRef.current!;

    const journeyEngine =
      journeyEngineRef.current!;

    const destinationZone =
      selectedDestination
        ? safeZones.find(
            (zone) =>
              zone.id === selectedDestination
          )
        : undefined;

    /*
     * Custom destination from Search Address
     * or Choose on Map.
     */
    const destinationLocation =
      selectedDestinationLocation
        ? {
            latitude:
              selectedDestinationLocation.latitude,
            longitude:
              selectedDestinationLocation.longitude,
            accuracy: 50,
            timestamp: Date.now(),
          }
        : destinationZone
        ? {
            latitude: destinationZone.latitude,
            longitude: destinationZone.longitude,
            accuracy: destinationZone.radius,
            timestamp: Date.now(),
          }
        : null;

    if (!destinationLocation) {
      console.warn(
        "Protected Journey: destination coordinates unavailable."
      );

      return;
    }

    const destinationName =
      selectedDestinationLocation?.address ??
      destinationZone?.name ??
      "Selected destination";

    locationService.startTracking(
      (location, speed) => {
        /*
         * Always update the live location for
         * the navigation screen.
         */
        setCurrentLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        /*
         * Create the Protected Journey session
         * only once.
         */
        if (!journeyEngine.getSession()) {
          journeyEngine.startJourney(
            destinationName,
            destinationLocation,
            location,
            (selectedTravelMode ??
              "walking") as TravelMode,
            selectedTrustedContacts,
            Date.now() +
              30 * 60 * 1000
          );

          console.log(
            "Protected Journey session created"
          );
        }

        /*
         * Keep the protection engine updated.
         */
        journeyEngine.updateLocation(
          location,
          speed
        );
      }
    );

    return () => {
      locationService.stopTracking();

      /*
       * Stop browser speech when the journey
       * screen is left.
       */
      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, [
    step,
    selectedDestination,
    selectedDestinationLocation,
    selectedTravelMode,
    selectedTrustedContacts,
  ]);

  /*
   * Resolve the destination name for Step 4.
   */
  const destinationZone =
    selectedDestination
      ? safeZones.find(
          (zone) =>
            zone.id === selectedDestination
        )
      : undefined;

  const destinationName =
    selectedDestinationLocation?.address ??
    destinationZone?.name ??
    "Selected destination";

  return (
    <div className="min-h-screen bg-[#0F1E1E] text-[#F5F3EF]">
      <div className="px-5 pt-8 pb-5">
        <h1 className="text-3xl font-black">
          Protected Journey
        </h1>

        <p className="mt-2 text-[#7BA3A1]">
          CitySense will quietly monitor your
          journey and check on you if something
          unexpected happens.
        </p>
      </div>

      <div className="px-5 pb-8">
        {step === 1 && (
          <Step1Destination
  selectedDestination={selectedDestination}
  setSelectedDestination={setSelectedDestination}
  onDestinationLocationSelect={(location) => {
    setSelectedDestinationLocation(location);
  }}
  onContinue={() => setStep(2)}
/>
        )}

        {step === 2 && (
          <Step2TravelMode
            selectedTravelMode={
              selectedTravelMode
            }
            setSelectedTravelMode={
              setSelectedTravelMode
            }
            onContinue={() =>
              setStep(3)
            }
          />
        )}

        {step === 3 && (
          <Step3TrustedContacts
            selectedContacts={
              selectedTrustedContacts
            }
            setSelectedContacts={
              setSelectedTrustedContacts
            }
            onContinue={() =>
              setStep(4)
            }
          />
        )}

        {step === 4 && (
          <Step4Review
            destination={
              destinationName
            }
            travelMode={
              selectedTravelMode
            }
            onStart={() => {
              console.log(
                "Protected Journey Started"
              );

              setStep(5);
            }}
          />
        )}

        {step === 5 &&
          destinationLocationForNavigation(
            selectedDestinationLocation,
            destinationZone
          ) && (
            <Step5JourneyActive
              destination={
                destinationName
              }
              destinationLatitude={
                destinationLocationForNavigation(
                  selectedDestinationLocation,
                  destinationZone
                )!.latitude
              }
              destinationLongitude={
                destinationLocationForNavigation(
                  selectedDestinationLocation,
                  destinationZone
                )!.longitude
              }
              travelMode={
                (selectedTravelMode ??
                  "walking") as TravelMode
              }
              currentLocation={
                currentLocation
              }
              onEndJourney={() => {
                console.log(
                  "Protected Journey Ended"
                );

                if (
                  "speechSynthesis" in
                  window
                ) {
                  window.speechSynthesis.cancel();
                }

                locationServiceRef.current?.stopTracking();

                setCurrentLocation(
                  null
                );

                setStep(1);
              }}
            />
          )}
      </div>
    </div>
  );
}

/*
 * Resolve either:
 * - Search / Map destination
 * - Saved SafeZone destination
 */
function destinationLocationForNavigation(
  customLocation: DestinationLocation | null,
  safeZone:
    | {
        latitude: number;
        longitude: number;
      }
    | undefined
) {
  if (customLocation) {
    return {
      latitude: customLocation.latitude,
      longitude: customLocation.longitude,
    };
  }

  if (safeZone) {
    return {
      latitude: safeZone.latitude,
      longitude: safeZone.longitude,
    };
  }

  return null;
}