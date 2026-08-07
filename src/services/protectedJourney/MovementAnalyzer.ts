import type { TravelMode } from "./JourneyTypes";

export class MovementAnalyzer {
  public detectTravelMode(speedKmh: number): TravelMode {
    if (speedKmh < 7) {
      return "walking";
    }

    if (speedKmh < 20) {
      return "cycling";
    }

    if (speedKmh < 180) {
      return "driving";
    }

    return "public_transport";
  }

  public isMoving(speedKmh: number): boolean {
    return speedKmh > 2;
  }

  public hasUnexpectedStop(
    speedKmh: number,
    stoppedSince: number
  ): boolean {
    return (
      speedKmh < 2 &&
      Date.now() - stoppedSince > 5 * 60 * 1000
    );
  }
}