export type EmergencyLevel =
  | "none"
  | "check-in"
  | "notify-contacts"
  | "emergency";

export class EmergencyLogic {
  public evaluate(
    hasArrived: boolean,
    isDelayed: boolean,
    hasUnexpectedStop: boolean,
    userResponded: boolean
  ): EmergencyLevel {
    if (hasArrived) {
      return "none";
    }

    if (!isDelayed) {
      return "none";
    }

    if (userResponded) {
      return "none";
    }

    if (hasUnexpectedStop) {
      return "notify-contacts";
    }

    return "check-in";
  }
}