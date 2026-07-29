interface Report {
  latitude: number;
  longitude: number;
  type: string;
}

export interface HistoricalHeatPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useHistoricalHeatmap(
  reports: Report[]
): HistoricalHeatPoint[] {
  const hotspots: HistoricalHeatPoint[] = [];

  reports
    .filter((report) => report.type === "unsafe")
    .forEach((report) => {
      const existing = hotspots.find(
        (hotspot) =>
          getDistanceMeters(
            report.latitude,
            report.longitude,
            hotspot.latitude,
            hotspot.longitude
          ) <= 100
      );

      if (existing) {
        existing.latitude = (existing.latitude + report.latitude) / 2;
        existing.longitude = (existing.longitude + report.longitude) / 2;
        existing.intensity = Math.min(existing.intensity + 0.2, 1);
      } else {
        hotspots.push({
          latitude: report.latitude,
          longitude: report.longitude,
          intensity: 0.2,
        });
      }
    });

  return hotspots;
}