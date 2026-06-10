import { useEffect, useState } from "react";
import { useLocation } from "../hooks/useLocation";

interface WalkMeHomeScreenProps {
  onBack: () => void;
}

export default function WalkMeHomeScreen({
  onBack,
}: WalkMeHomeScreenProps) {
  const { location } = useLocation();

  const [destination, setDestination] = useState("");
  const [walkStarted, setWalkStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300);

  useEffect(() => {
    if (!walkStarted || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [walkStarted, secondsLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startWalk = () => {
    if (!destination.trim()) {
      alert("Please enter your destination first.");
      return;
    }

    setSecondsLeft(300);
    setWalkStarted(true);
  };

  const checkInSafe = () => {
    alert("Check-in confirmed. You are marked safe.");
    setSecondsLeft(300);
  };

  const endWalk = () => {
    setWalkStarted(false);
    setDestination("");
    setSecondsLeft(300);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          👣 Walk Me Home
        </h1>

        <p className="text-sm text-[#BBF7D0]">
          Start a safe journey and check in regularly.
        </p>
      </div>

      {location && (
        <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 mb-4">
          <p className="text-xs text-[#7BA3A1] mb-1">Current location</p>
          <p className="text-sm font-semibold truncate">
            📍 {location.address}
          </p>
        </div>
      )}

      {!walkStarted ? (
        <>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 mb-4 outline-none"
          />

          <button
            onClick={startWalk}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            Start Walk
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
            <p className="text-xs text-[#7BA3A1] mb-1">Walking to</p>
            <h2 className="text-lg font-bold">{destination}</h2>
          </div>

          <div
            className={`border rounded-2xl p-4 text-center ${
              secondsLeft <= 60
                ? "bg-[#7F1D1D] border-[#EF4444]"
                : "bg-[#0F1E1E] border-[#22C55E60]"
            }`}
          >
            <p className="text-sm text-[#7BA3A1] mb-2">Next safety check-in</p>

            <p
              className={`text-4xl font-bold ${
                secondsLeft <= 60 ? "text-[#FCA5A5]" : "text-[#22C55E]"
              }`}
            >
              {formatTime(secondsLeft)}
            </p>

            <p className="text-xs text-[#7BA3A1] mt-2">
              Check in before the timer reaches zero.
            </p>
          </div>

          {secondsLeft === 0 && (
            <div className="bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4">
              <p className="font-bold text-white">🚨 Check-in missed</p>
              <p className="text-sm text-[#FCA5A5] mt-1">
                Future version will notify trusted contacts automatically.
              </p>
            </div>
          )}

          <button
            onClick={checkInSafe}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            ✅ I’m Safe
          </button>

          <button
            onClick={() => {
              alert(
                "Emergency alert placeholder. Later this will notify trusted contacts."
              );
            }}
            className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-2xl"
          >
            🚨 Send Alert
          </button>

          <button
            onClick={endWalk}
            className="w-full bg-[#1A2E2D] text-[#7BA3A1] font-bold py-3 rounded-2xl"
          >
            End Walk
          </button>
        </div>
      )}

      <div className="mt-5 bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Trusted Contact</h2>

        <p className="text-sm text-[#7BA3A1]">
          👨‍👩‍👧 Add trusted contacts later so CitySense can notify them if you miss a check-in.
        </p>
      </div>
    </div>
  );
}