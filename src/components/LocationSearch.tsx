import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Search } from "lucide-react";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

type Props = {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
};

export default function LocationSearch({ onLocationSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`
        );

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

        <Input
          value={query}
          placeholder="Search street, city or landmark..."
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-[#1A2E2D] border-[#2D5A5840] text-white"
        />
      </div>

      {loading && (
        <div className="text-xs text-[#7BA3A1]">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border border-[#2D5A5840] overflow-hidden">
          {results.map((place) => (
            <button
              key={`${place.lat}-${place.lon}`}
              onClick={() => {
                onLocationSelect({
                  latitude: Number(place.lat),
                  longitude: Number(place.lon),
                  address: place.display_name,
                });

                setQuery(place.display_name);
                setResults([]);
              }}
              className="w-full text-left p-3 hover:bg-[#223635] border-b border-[#2D5A5840] last:border-b-0"
            >
              <div className="flex gap-3">
                <MapPin className="w-4 h-4 text-[#E8A838] mt-1 shrink-0" />

                <span className="text-sm text-white">
                  {place.display_name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}