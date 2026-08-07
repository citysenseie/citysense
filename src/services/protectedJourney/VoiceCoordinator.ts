export class VoiceCoordinator {
  public welcomeUser(destination: string): string {
    return `Protected Journey started. I'll quietly keep an eye on your trip to ${destination}.`;
  }

  public arrivalMessage(destination: string): string {
    return `You've safely arrived at ${destination}. Protected Journey has ended.`;
  }

  public delayMessage(): string {
    return "Your journey is taking longer than expected. Is everything okay?";
  }

  public unexpectedStopMessage(): string {
    return "I've noticed you've been stopped for a while. Do you need help?";
  }

  public emergencyMessage(): string {
    return "I'm notifying your trusted contacts now.";
  }

  public speedLimitMessage(limit: number): string {
    return `Speed limit is now ${limit} kilometres per hour.`;
  }

  public schoolZoneMessage(): string {
    return "You're entering a school zone. Please drive carefully.";
  }

  public weatherAlertMessage(): string {
    return "Road conditions may be affected by the weather. Please drive carefully.";
  }
}