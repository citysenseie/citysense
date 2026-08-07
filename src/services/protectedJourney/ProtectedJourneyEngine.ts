import type {
  JourneyLocation,
  JourneySession,
  TravelMode,
} from "./JourneyTypes";

export class ProtectedJourneyEngine {
  private session: JourneySession | null = null;

  public startJourney(
    destinationName: string,
    destination: JourneyLocation,
    currentLocation: JourneyLocation,
    travelMode: TravelMode,
    trustedContacts: string[],
    estimatedArrival: number
  ) {
    this.session = {
      id: this.generateJourneyId(),

      state: "monitoring",

      destinationName,

      destination,

      currentLocation,

      travelMode,

      startedAt: Date.now(),

      estimatedArrival,

      distanceRemaining: 0,

      lastKnownSpeed: 0,

      lastMovementAt: Date.now(),

      liveLocationEnabled: true,

      trustedContacts,
    };
  }

  public getSession() {
    return this.session;
  }

  public endJourney() {
    if (!this.session) return;

    this.session.state = "completed";
  }

 public updateLocation(
  location: JourneyLocation,
  speed: number
) {
  if (!this.session) return;

  this.session.currentLocation = location;
  this.session.lastKnownSpeed = speed;

  if (speed > 2) {
    this.session.lastMovementAt = Date.now();
  }
}

  private generateJourneyId() {
    return `PJ-${Date.now()}`;
  }
}