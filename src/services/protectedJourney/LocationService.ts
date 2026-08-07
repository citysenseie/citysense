import type { JourneyLocation } from "./JourneyTypes";

export type LocationCallback = (
  location: JourneyLocation,
  speed: number
) => void;

export class LocationService {
  private watchId: number | null = null;

  public startTracking(callback: LocationCallback) {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported.");
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback(
  {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  },
  position.coords.speed ?? 0
);
      },
      (error) => {
        console.error("GPS Error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );
  }

  public stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}