import type { SafetyEvent } from "@/services/safety/SafetyEventTypes";

const now = Date.now();

export const safetyEvents: SafetyEvent[] = [
  {
    id: "demo-aggressive-driver",
    type: "aggressive_driver",
    severity: "high",
    source: "community",
    latitude: 51.0412,
    longitude: 3.7398,
    title: "Aggressive driver reported",
    description:
      "A driver was reported behaving aggressively near this area.",
    reportedAt: now - 2 * 60 * 1000,
    expiresAt: now + 13 * 60 * 1000,
    confidence: 0.82,
    reportCount: 3,
  },

  {
    id: "demo-road-block",
    type: "road_block",
    severity: "high",
    source: "community",
    latitude: 51.0394,
    longitude: 3.7431,
    title: "Road blockage",
    description:
      "A road obstruction has been reported.",
    reportedAt: now - 8 * 60 * 1000,
    expiresAt: now + 52 * 60 * 1000,
    confidence: 0.88,
    reportCount: 4,
  },

  {
    id: "demo-traffic",
    type: "traffic",
    severity: "moderate",
    source: "system",
    latitude: 51.0432,
    longitude: 3.7465,
    title: "Heavy traffic",
    description:
      "Traffic is moving slowly in this area.",
    reportedAt: now - 5 * 60 * 1000,
    expiresAt: now + 25 * 60 * 1000,
    confidence: 0.76,
    reportCount: 1,
  },

  {
    id: "demo-accident",
    type: "accident",
    severity: "critical",
    source: "community",
    latitude: 51.0379,
    longitude: 3.7357,
    title: "Accident reported",
    description:
      "An accident has been reported near this location.",
    reportedAt: now - 4 * 60 * 1000,
    expiresAt: now + 56 * 60 * 1000,
    confidence: 0.91,
    reportCount: 5,
  },

  {
    id: "demo-road-hazard",
    type: "road_hazard",
    severity: "moderate",
    source: "community",
    latitude: 51.0461,
    longitude: 3.7419,
    title: "Road hazard",
    description:
      "A road hazard has been reported.",
    reportedAt: now - 12 * 60 * 1000,
    expiresAt: now + 48 * 60 * 1000,
    confidence: 0.71,
    reportCount: 2,
  },

  {
    id: "demo-police",
    type: "police_activity",
    severity: "low",
    source: "official",
    latitude: 51.0348,
    longitude: 3.7319,
    title: "Police activity",
    description:
      "Police activity has been reported nearby.",
    reportedAt: now - 10 * 60 * 1000,
    expiresAt: now + 50 * 60 * 1000,
    confidence: 0.94,
    reportCount: 1,
  },

  {
    id: "demo-flooding",
    type: "flooding",
    severity: "high",
    source: "community",
    latitude: 51.0483,
    longitude: 3.7352,
    title: "Flooding reported",
    description:
      "Water accumulation may affect the road.",
    reportedAt: now - 6 * 60 * 1000,
    expiresAt: now + 54 * 60 * 1000,
    confidence: 0.79,
    reportCount: 2,
  },

  {
    id: "demo-crowd",
    type: "crowd",
    severity: "low",
    source: "system",
    latitude: 51.0425,
    longitude: 3.7328,
    title: "Crowded area",
    description:
      "A large crowd has been detected in this area.",
    reportedAt: now - 15 * 60 * 1000,
    expiresAt: now + 45 * 60 * 1000,
    confidence: 0.68,
    reportCount: 1,
  },

  {
    id: "demo-safe-zone",
    type: "safe_zone",
    severity: "low",
    source: "official",
    latitude: 51.0451,
    longitude: 3.7298,
    title: "Safe area",
    description:
      "A CitySense safe area is nearby.",
    reportedAt: now - 30 * 60 * 1000,
    expiresAt: now + 6 * 60 * 60 * 1000,
    confidence: 0.95,
    reportCount: 1,
  },
];