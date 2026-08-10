import type {
  SafetyEvent,
  SafetySeverity,
} from "./SafetyEventTypes";

export interface JourneyPosition {
  latitude: number;
  longitude: number;
  heading?: number;
}

export interface SafetyEventAssessment {
  event: SafetyEvent;

  distanceFromUserMeters: number;

  distanceFromRouteMeters: number | null;

  isAhead: boolean;

  isOnRoute: boolean;

  isExpired: boolean;

  relevanceScore: number;

  shouldShow: boolean;

  shouldSpeak: boolean;
}

const EARTH_RADIUS_METERS = 6371000;

/*
 * Maximum distance from the route for an event
 * to be considered route-relevant.
 */
const ROUTE_RELEVANCE_RADIUS_METERS = 500;

/*
 * Events farther than this from the user normally
 * shouldn't be announced immediately.
 */
const VOICE_DISTANCE_METERS = 1500;

/*
 * Events this close to the user can be important
 * even when they are slightly off the route.
 */
const IMMEDIATE_SAFETY_RADIUS_METERS = 250;

/*
 * Calculate distance between two coordinates.
 */
function distanceBetween(
  a: JourneyPosition,
  b: JourneyPosition
): number {
  const lat1 =
    (a.latitude * Math.PI) / 180;

  const lat2 =
    (b.latitude * Math.PI) / 180;

  const deltaLat =
    ((b.latitude - a.latitude) *
      Math.PI) /
    180;

  const deltaLon =
    ((b.longitude - a.longitude) *
      Math.PI) /
    180;

  const sinLat =
    Math.sin(deltaLat / 2);

  const sinLon =
    Math.sin(deltaLon / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) *
      Math.cos(lat2) *
      sinLon *
      sinLon;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(h),
      Math.sqrt(1 - h)
    )
  );
}

/*
 * Calculate the bearing from one point to another.
 *
 * 0   = north
 * 90  = east
 * 180 = south
 * 270 = west
 */
function calculateBearing(
  from: JourneyPosition,
  to: JourneyPosition
): number {
  const lat1 =
    (from.latitude * Math.PI) / 180;

  const lat2 =
    (to.latitude * Math.PI) / 180;

  const deltaLon =
    ((to.longitude - from.longitude) *
      Math.PI) /
    180;

  const y =
    Math.sin(deltaLon) *
    Math.cos(lat2);

  const x =
    Math.cos(lat1) *
      Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLon);

  const bearing =
    (Math.atan2(y, x) * 180) /
    Math.PI;

  return (bearing + 360) % 360;
}

/*
 * Smallest difference between two compass headings.
 */
function headingDifference(
  a: number,
  b: number
): number {
  const difference =
    Math.abs(a - b) % 360;

  return difference > 180
    ? 360 - difference
    : difference;
}

/*
 * Determine whether an event is generally
 * ahead of the user.
 *
 * If the user's heading isn't available,
 * we conservatively assume the event is ahead
 * when it is close enough to the route.
 */
function isEventAhead(
  user: JourneyPosition,
  event: SafetyEvent
): boolean {
  if (
    user.heading === undefined
  ) {
    return true;
  }

  const eventPosition: JourneyPosition = {
    latitude: event.latitude,
    longitude: event.longitude,
  };

  const bearingToEvent =
    calculateBearing(
      user,
      eventPosition
    );

  return (
    headingDifference(
      user.heading,
      bearingToEvent
    ) <= 90
  );
}

/*
 * Find the shortest distance from an event
 * to the user's route.
 *
 * The route is supplied as an array of
 * latitude/longitude points.
 */
function distanceToRoute(
  event: SafetyEvent,
  route: JourneyPosition[]
): number | null {
  if (!route.length) {
    return null;
  }

  const eventPosition: JourneyPosition = {
    latitude: event.latitude,
    longitude: event.longitude,
  };

  let shortestDistance =
    Number.POSITIVE_INFINITY;

  for (const point of route) {
    const distance =
      distanceBetween(
        eventPosition,
        point
      );

    if (
      distance < shortestDistance
    ) {
      shortestDistance = distance;
    }
  }

  return Number.isFinite(
    shortestDistance
  )
    ? shortestDistance
    : null;
}

/*
 * Severity contributes to the final relevance score.
 */
function severityWeight(
  severity: SafetySeverity
): number {
  switch (severity) {
    case "critical":
      return 1;

    case "high":
      return 0.85;

    case "moderate":
      return 0.6;

    case "low":
      return 0.35;
  }
}

/*
 * Fresh reports are more useful than old reports.
 *
 * We don't remove events here.
 * We simply reduce their relevance.
 */
function freshnessWeight(
  event: SafetyEvent,
  now: number
): number {
  if (
    event.expiresAt <= now
  ) {
    return 0;
  }

  const lifetime =
    event.expiresAt -
    event.reportedAt;

  if (lifetime <= 0) {
    return 0;
  }

  const remaining =
    event.expiresAt - now;

  return Math.max(
    0,
    Math.min(
      1,
      remaining / lifetime
    )
  );
}

/*
 * Main Safety Intelligence assessment.
 */
export function assessSafetyEvent(
  event: SafetyEvent,
  user: JourneyPosition,
  route: JourneyPosition[] = [],
  now = Date.now()
): SafetyEventAssessment {
  const eventPosition: JourneyPosition = {
    latitude: event.latitude,
    longitude: event.longitude,
  };

  const distanceFromUserMeters =
    distanceBetween(
      user,
      eventPosition
    );

  const distanceFromRouteMeters =
    distanceToRoute(
      event,
      route
    );

  const isOnRoute =
    distanceFromRouteMeters !== null &&
    distanceFromRouteMeters <=
      ROUTE_RELEVANCE_RADIUS_METERS;

  const isAhead =
    isEventAhead(
      user,
      event
    );

  const isExpired =
    event.expiresAt <= now;

  const severity =
    severityWeight(
      event.severity
    );

  const freshness =
    freshnessWeight(
      event,
      now
    );

  const confidence =
    Math.max(
      0,
      Math.min(
        1,
        event.confidence
      )
    );

  /*
   * Distance score:
   *
   * 0m    = 1
   * 1500m = 0
   */
  const distanceScore =
    Math.max(
      0,
      1 -
        distanceFromUserMeters /
          VOICE_DISTANCE_METERS
    );

  /*
   * Route score:
   *
   * On route = strong
   * Far away = weak
   */
  const routeScore =
    distanceFromRouteMeters ===
    null
      ? 0.35
      : Math.max(
          0,
          1 -
            distanceFromRouteMeters /
              ROUTE_RELEVANCE_RADIUS_METERS
        );

  /*
   * Events ahead receive a significant boost.
   */
  const directionScore =
    isAhead ? 1 : 0.15;

  /*
   * Combine the factors.
   */
  const relevanceScore =
    severity * 0.30 +
    confidence * 0.20 +
    freshness * 0.15 +
    distanceScore * 0.15 +
    routeScore * 0.15 +
    directionScore * 0.05;

  /*
   * Something extremely close can be shown even
   * if it isn't perfectly aligned with the route.
   */
  const immediateSafetyEvent =
    distanceFromUserMeters <=
      IMMEDIATE_SAFETY_RADIUS_METERS &&
    severity >= 0.6 &&
    confidence >= 0.4;

  const shouldShow =
    !isExpired &&
    (
      immediateSafetyEvent ||
      (
        isOnRoute &&
        relevanceScore >= 0.45
      )
    );

  /*
   * Voice is deliberately harder to trigger
   * than visual display.
   */
  const shouldSpeak =
    !isExpired &&
    isAhead &&
    distanceFromUserMeters <=
      VOICE_DISTANCE_METERS &&
    (
      (
        isOnRoute &&
        relevanceScore >= 0.65
      ) ||
      (
        immediateSafetyEvent &&
        relevanceScore >= 0.55
      )
    );

  return {
    event,
    distanceFromUserMeters,
    distanceFromRouteMeters,
    isAhead,
    isOnRoute,
    isExpired,
    relevanceScore,
    shouldShow,
    shouldSpeak,
  };
}

/*
 * Assess many events and return only events
 * that CitySense considers relevant.
 */
export function assessSafetyEvents(
  events: SafetyEvent[],
  user: JourneyPosition,
  route: JourneyPosition[] = [],
  now = Date.now()
): SafetyEventAssessment[] {
  return events
    .map((event) =>
      assessSafetyEvent(
        event,
        user,
        route,
        now
      )
    )
    .filter(
      (assessment) =>
        assessment.shouldShow
    )
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    );
}

/*
 * Return the single most important warning
 * for voice/navigation purposes.
 */
export function getHighestPrioritySafetyEvent(
  assessments: SafetyEventAssessment[]
): SafetyEventAssessment | null {
  const speakable =
    assessments.filter(
      (assessment) =>
        assessment.shouldSpeak
    );

  if (!speakable.length) {
    return null;
  }

  return speakable[0];
}