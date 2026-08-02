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

  const query = `[out:json][timeout:8];
(
  node[${osmFilter}](around:${radius},${lat},${lng});
  way[${osmFilter}](around:${radius},${lat},${lng});
  relation[${osmFilter}](around:${radius},${lat},${lng});
);
out center;`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: query,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // Cache successful searches briefly at Vercel's edge.
      res.setHeader(
        "Cache-Control",
        "s-maxage=60, stale-while-revalidate=300"
      );

      return res.status(200).json(data);
    } catch {
      // Try the next Overpass endpoint.
    }
  }

  return res.status(503).json({
    error: "Nearby search is temporarily unavailable",
  });
}