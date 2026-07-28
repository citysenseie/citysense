interface Report {
  latitude: number;
  longitude: number;
  severity?: "low" | "medium" | "high";
  type: string;
}

export interface HeatPoint {
  latitude: number;
  longitude: number;
  radius: number;
  color: string;
}

export function useHeatmap(reports: Report[]): HeatPoint[] {
  return reports
    .filter((report) => report.type === "unsafe")
    .map((report) => {
      let radius = 80;
      let color = "#FACC15"; // Yellow

      if (report.severity === "medium") {
        radius = 120;
        color = "#F97316"; // Orange
      }

      if (report.severity === "high") {
        radius = 180;
        color = "#EF4444"; // Red
      }

      return {
        latitude: report.latitude,
        longitude: report.longitude,
        radius,
        color,
      };
    });
}