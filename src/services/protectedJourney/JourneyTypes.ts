export type TravelMode =
  | "walking"
  | "cycling"
  | "driving"
  | "public_transport";

export type JourneyState =
  | "idle"
  | "preparing"
  | "monitoring"
  | "paused"
  | "arrived"
  | "emergency"
  | "completed";

export interface JourneyLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface JourneySession {
  id: string;

  state: JourneyState;

  travelMode: TravelMode;

  destinationName: string;

  destination: JourneyLocation;

  currentLocation: JourneyLocation;

  startedAt: number;

  estimatedArrival: number;

  distanceRemaining: number;

  lastKnownSpeed: number;

  lastMovementAt: number;

  liveLocationEnabled: boolean;

  trustedContacts: string[];
}