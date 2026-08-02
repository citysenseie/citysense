import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Geoapify API key is not configured",
    });
  }

  const { lat, lng, categories, radius = 5000, limit = 20 } = req.body ?? {};

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    typeof categories !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid nearby search request",
    });
  }

  try {
    const params = new URLSearchParams({
      categories,
      filter: `circle:${lng},${lat},${radius}`,
      bias: `proximity:${lng},${lat}`,
      limit: String(limit),
      apiKey,
    });

    const response = await fetch(
      `https://api.geoapify.com/v2/places?${params.toString()}`
    );

    if (!response.ok) {
      const details = await response.text();

      console.error("Geoapify error:", response.status, details);

      return res.status(response.status).json({
        error: `Geoapify API error: ${response.status}`,
      });
    }

    const data = await response.json();

    res.setHeader(
      "Cache-Control",
      "s-maxage=60, stale-while-revalidate=300"
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error("Nearby search error:", error);

    return res.status(500).json({
      error: "Nearby search failed",
    });
  }
}