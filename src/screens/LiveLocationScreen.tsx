import { useLocation } from "@/hooks/useLocation";

interface LiveLocationScreenProps {
  onBack: () => void;
}

export default function LiveLocationScreen({
  onBack,
}: LiveLocationScreenProps) {
  const { location } = useLocation();

  const lat = location?.latitude ?? 51.1857;
  const lng = location?.longitude ?? 3.5701;

  const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

  const shareLocation = async () => {
    const message = `My current location: ${mapsLink}`;

    if (navigator.share) {
      await navigator.share({
        title: "CitySense Live Location",
        text: message,
        url: mapsLink,
      });
    } else {
      await navigator.clipboard.writeText(message);
      alert("Location link copied.");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#064E3B] border border-[#34D399] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          📍 Live Location Sharing
        </h1>

        <p className="text-sm text-[#A7F3D0]">
          Share your current location with someone you trust.
        </p>
      </div>

      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 mb-5">
        <p className="text-xs text-[#7BA3A1] mb-2">Current location</p>

        <p className="text-sm text-[#F5F3EF] break-words">
          {location?.address || "Using GPS coordinates"}
        </p>

        <p className="text-xs text-[#E8A838] mt-3">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>

      <button
        onClick={shareLocation}
        className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl mb-4"
      >
        📍 Share My Location
      </button>

      <a
        href={mapsLink}
        target="_blank"
        rel="noreferrer"
        className="block text-center w-full bg-[#1A2E2D] border border-[#2D5A5840] text-[#F5F3EF] font-bold py-4 rounded-2xl"
      >
        🗺️ Open in Maps
      </a>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>⏱ Temporary live tracking link</li>
          <li>👨‍👩‍👧 Trusted contacts</li>
          <li>🚨 Auto-share during SOS</li>
          <li>👣 Walk Me Home integration</li>
        </ul>
      </div>
    </div>
  );
}