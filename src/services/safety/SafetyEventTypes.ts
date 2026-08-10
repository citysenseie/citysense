export type SafetyEventType =
  | "aggressive_driver"
  | "road_block"
  | "traffic"
  | "accident"
  | "road_hazard"
  | "unsafe_area"
  | "police_activity"
  | "emergency"
  | "flooding"
  | "crowd"
  | "safe_zone";

export type SafetySeverity =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type SafetySource =
  | "community"
  | "official"
  | "sensor"
  | "system";

export interface SafetyEvent {
  id: string;

  type: SafetyEventType;

  severity: SafetySeverity;

  source: SafetySource;

  latitude: number;

  longitude: number;

  title: string;

  description?: string;

  reportedAt: number;

  expiresAt: number;

  confidence: number;

  /*
   * Optional direction of travel in degrees.
   * 0 = north
   * 90 = east
   * 180 = south
   * 270 = west
   */
  heading?: number;

  /*
   * Optional number of independent reports
   * supporting the event.
   */
  reportCount?: number;
}