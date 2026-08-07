import type { JourneyLocation } from "./JourneyTypes";


export class ArrivalDetector {
  private readonly ARRIVAL_DISTANCE = 40; 
  private readonly REQUIRED_STOP_TIME = 30000; 

  public hasArrived(
    current: JourneyLocation,
    destination: JourneyLocation,
    speed: number,
    stoppedSince: number
  ) {
    const distance = this.calculateDistance(current, destination);

    return (
      distance <= this.ARRIVAL_DISTANCE &&
      speed < 3 &&
      Date.now() - stoppedSince >= this.REQUIRED_STOP_TIME
    );
  }

  private calculateDistance(
    from: JourneyLocation,
    to: JourneyLocation
  ) {
    const R = 6371000;

    const lat1 = (from.latitude * Math.PI) / 180;
    const lat2 = (to.latitude * Math.PI) / 180;

    const dLat =
      ((to.latitude - from.latitude) * Math.PI) / 180;

    const dLon =
      ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}