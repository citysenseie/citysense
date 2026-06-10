import { useState } from "react";

interface WalkMeHomeScreenProps {
  onBack: () => void;
}

export default function WalkMeHomeScreen({
  onBack,
}: WalkMeHomeScreenProps) {
  const [destination, setDestination] = useState("");
  const [walkStarted, setWalkStarted] = useState(false);

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

      {!walkStarted ? (
        <>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 mb-4 outline-none"
          />

          <button
            onClick={() => {
              if (!destination.trim()) {
                alert("Please enter your destination first.");
                return;
              }

              setWalkStarted(true);
            }}
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

          <div className="bg-[#0F1E1E] border border-[#22C55E60] rounded-2xl p-4 text-center">
            <p className="text-sm text-[#7BA3A1] mb-2">Safety check-in</p>
            <p className="text-3xl font-bold text-[#22C55E]">5:00</p>
            <p className="text-xs text-[#7BA3A1] mt-2">
              Check in when you arrive or if you feel safe.
            </p>
          </div>

          <button
            onClick={() => {
              alert("Check-in confirmed. You are marked safe.");
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            ✅ I’m Safe
          </button>

          <button
            onClick={() => {
              alert("Emergency alert placeholder. Later this will notify trusted contacts.");
            }}
            className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-2xl"
          >
            🚨 Send Alert
          </button>

          <button
            onClick={() => {
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#1A2E2D] text-[#7BA3A1] font-bold py-3 rounded-2xl"
          >
            Cancel Walk
          </button>
        </div>
      )}

      <div className="mt-5 bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Live location sharing</li>
          <li>⏱ Real countdown timer</li>
          <li>🚨 Missed check-in alerts</li>
          <li>👨‍👩‍👧 Trusted contacts</li>
          <li>🛡 Safe route suggestions</li>
        </ul>
      </div>
    </div>
  );
}