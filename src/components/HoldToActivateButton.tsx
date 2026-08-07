import { Siren } from "lucide-react";

interface HoldToActivateButtonProps {
  holding: boolean;
  progress: number;
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
}

export default function HoldToActivateButton({
  holding,
  progress,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
}: HoldToActivateButtonProps) {
  const radius = 104;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center">

      <div className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-60 lg:h-60">

        {/* Progress Ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width="100%"
height="100%"
viewBox="0 0 240 240"
        >
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
            fill="none"
          />

          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke="#EF4444"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference -
              (progress / 100) * circumference
            }
            className="transition-all duration-75"
          />
        </svg>

        {/* SOS Button */}
        <button
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={`absolute inset-4 rounded-full flex flex-col items-center justify-center transition-all duration-300
          ${
            holding
              ? "scale-105 shadow-[0_0_80px_rgba(239,68,68,0.65)]"
              : "scale-100 shadow-[0_0_40px_rgba(239,68,68,0.35)]"
          }
          bg-gradient-to-br
          from-[#EF4444]
          via-[#DC2626]
          to-[#991B1B]`}
        >
          <Siren
  className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white mb-2 transition-transform duration-300 ${
    holding ? "scale-110" : ""
  }`}
/>

          <h2 className="text-3xl sm:text-4xl font-black tracking-widest text-white">
            SOS
          </h2>

          <p className="text-xs tracking-[0.35em] text-white/80 mt-2">
            {holding ? "KEEP HOLDING" : "PRESS & HOLD"}
          </p>
        </button>

      </div>

    </div>
  );
}