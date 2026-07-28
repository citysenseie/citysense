interface Report {
  type: string;
  category: string;
  severity?: "low" | "medium" | "high";
}

export function useSafetyAnalysis(reports: Report[]) {
  const safeCount = reports.filter(r => r.type === "safe").length;
  const unsafeCount = reports.filter(r => r.type === "unsafe").length;

  const highReports = reports.filter(r => r.severity === "high").length;
  const mediumReports = reports.filter(r => r.severity === "medium").length;
  const lowReports = reports.filter(r => r.severity === "low").length;

  const sosReports = reports.filter(r => r.category === "sos").length;

  const unsafeImpact = reports.reduce((total, r) => {
    if (r.type !== "unsafe") return total;

    if (r.severity === "high") return total + 15;
    if (r.severity === "medium") return total + 8;

    return total + 4;
  }, 0);

  const safetyScore = Math.max(
    0,
    Math.min(
      100,
      100 +
        safeCount * 2 -
        unsafeImpact * 0.5 -
        sosReports * 30
    )
  );

  return {
    safeCount,
    unsafeCount,
    highReports,
    mediumReports,
    lowReports,
    sosReports,
    safetyScore,
  };
}