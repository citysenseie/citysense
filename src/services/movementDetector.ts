export type MovementMode =
  | "stopped"
  | "walking"
  | "running"
  | "cycling"
  | "vehicle"
  | "train";

export interface MovementResult {
  mode: MovementMode;
  speed: number;
  confidence: number;
}

export function detectMovement(speedKmh: number): MovementResult {
  if (speedKmh < 1)
    return { mode: "stopped", speed: speedKmh, confidence: 100 };

  if (speedKmh < 7)
    return { mode: "walking", speed: speedKmh, confidence: 95 };

  if (speedKmh < 15)
    return { mode: "running", speed: speedKmh, confidence: 90 };

  if (speedKmh < 30)
    return { mode: "cycling", speed: speedKmh, confidence: 85 };

  if (speedKmh < 80)
    return { mode: "vehicle", speed: speedKmh, confidence: 80 };

  return { mode: "train", speed: speedKmh, confidence: 90 };
}