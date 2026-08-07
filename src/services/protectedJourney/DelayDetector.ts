export class DelayDetector {
  private readonly CHECK_DELAY = 15 * 60 * 1000; // 15 minutes

  public isJourneyDelayed(
    estimatedArrival: number,
    currentTime: number = Date.now()
  ): boolean {
    return currentTime > estimatedArrival + this.CHECK_DELAY;
  }

  public shouldCheckOnUser(
    estimatedArrival: number,
    currentTime: number = Date.now()
  ): boolean {
    return this.isJourneyDelayed(estimatedArrival, currentTime);
  }
}