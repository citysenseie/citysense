import type { VercelRequest, VercelResponse } from "@vercel/node";

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { lat, lng, osmFilter, radius = 5000 } = req.body ?? {};

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof osmFilter !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid nearby search request",
    });
  }

  const query = `[out:json][timeout:10];
(
  node[${osmFilter}](around:${radius},${lat},${lng});
  way[${osmFilter}](around:${radius},${lat},${lng});
  relation[${osmFilter}](around:${radius},${lat},${lng});
);
out center;`;

  const failures: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const body = new URLSearchParams();
      body.set("data", query);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "Accept": "application/json",
          "User-Agent": "CitySense/1.0",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        failures.push(
          `${endpoint}: HTTP ${response.status}`
        );
        continue;
      }

      const data = await response.json();

      res.setHeader(
        "Cache-Control",
        "s-maxage=60, stale-while-revalidate=300"
      );

      return res.status(200).json(data);
    } catch (error) {
      failures.push(
        `${endpoint}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  console.error("Nearby search failed:", failures);

  return res.status(503).json({
    error: "Nearby search is temporarily unavailable",
    details: failures,
  });
}