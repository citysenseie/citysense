import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "CitySense/1.0" } }
          );
          const data = await res.json();
          if (data.display_name) {
            const parts = data.display_name.split(",");
            address = parts.slice(0, 3).join(",");
          }
        } catch {
          // fallback to coords
        }
        setLocation({ latitude, longitude, address });
        setLoading(false);
      },
      () => {
        setError("Location access denied");
        setLocation((prev) =>
          prev ?? {
            latitude: 51.1857,
            longitude: 3.5701,
            address: "Melkerij, Eeklo, East Flanders",
          }
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

 useEffect(() => {
  getLocation(); // get location immediately

  const interval = setInterval(getLocation, 300000);

  return () => clearInterval(interval);
}, [getLocation]);
  return { location, loading, error, refresh: getLocation };
}
