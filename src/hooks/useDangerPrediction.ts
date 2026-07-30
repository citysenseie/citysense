interface Report {
  latitude: number;
  longitude: number;
  type: string;
}

interface Prediction {
  level: "safe" | "caution" | "danger";
  message: string;
}

function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useDangerPrediction(
  reports: Report[],
  userLat: number,
  userLng: number
): Prediction {
  const nearbyUnsafe = reports.filter(
    (report) =>
      report.type === "unsafe" &&
      getDistanceKm(
        userLat,
        userLng,
        report.latitude,
        report.longitude
      ) <= 0.25
  );

  if (nearbyUnsafe.length >= 5) {
    return {
      level: "danger",
      message:
        "High risk nearby. Several unsafe reports have been submitted close to your location.",
    };
  }

  if (nearbyUnsafe.length >= 2) {
    return {
      level: "caution",
      message:
        "Be alert. Multiple unsafe reports have been reported nearby.",
    };
  }

  return {
    level: "safe",
    message: "No significant nearby safety concerns.",
  };
}