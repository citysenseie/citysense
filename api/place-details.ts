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

  const { placeId } = req.body ?? {};

  if (typeof placeId !== "string" || !placeId.trim()) {
    return res.status(400).json({
      error: "Invalid place ID",
    });
  }

  try {
    const params = new URLSearchParams({
      id: placeId,
      features: "details",
      apiKey,
    });

    const response = await fetch(
      `https://api.geoapify.com/v2/place-details?${params.toString()}`
    );

    if (!response.ok) {
      const details = await response.text();

      console.error(
        "Geoapify Place Details error:",
        response.status,
        details
      );

      return res.status(response.status).json({
        error: `Geoapify Place Details error: ${response.status}`,
      });
    }

    const data = await response.json();

    const detailsFeature = Array.isArray(data.features)
      ? data.features.find(
          (feature: any) =>
            feature?.properties?.feature_type === "details"
        )
      : null;

    const props = detailsFeature?.properties ?? {};

    return res.status(200).json({
      placeId,
      phone: props.contact?.phone ?? null,
      openingHours: props.opening_hours ?? null,
      timezone: props.timezone?.name ?? null,
      website: props.website ?? null,
    });
  } catch (error) {
    console.error("Place details error:", error);

    return res.status(500).json({
      error: "Failed to load place details",
    });
  }
}