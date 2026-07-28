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

export function useHistoricalHeatmap(
  reports: Report[]
): HistoricalHeatPoint[] {
  const clusters = new Map<string, HistoricalHeatPoint>();

  reports
    .filter((report) => report.type === "unsafe")
    .forEach((report) => {
      // Round coordinates to group nearby reports
      const lat = Number(report.latitude.toFixed(3));
      const lng = Number(report.longitude.toFixed(3));

      const key = `${lat},${lng}`;

      if (!clusters.has(key)) {
        clusters.set(key, {
          latitude: lat,
          longitude: lng,
          intensity: 0.2,
        });
      }

      const hotspot = clusters.get(key)!;
      hotspot.intensity = Math.min(hotspot.intensity + 0.2, 1);
    });

  return Array.from(clusters.values());
}