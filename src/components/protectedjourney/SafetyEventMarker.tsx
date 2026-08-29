import {
  AlertTriangle,
  Car,
  Construction,
  
  MapPin,
  ShieldCheck,
  Siren,
  TrafficCone,
  Users,
  Waves,
  X,
} from "lucide-react";
import { useState } from "react";
import type { SafetyEvent } from "@/services/safety/SafetyEventTypes";

interface SafetyEventMarkerProps {
  event: SafetyEvent;
}

function getEventIcon(type: SafetyEvent["type"]) {
  switch (type) {
    case "aggressive_driver":
      return Car;

    case "road_block":
      return Construction;

    case "traffic":
      return TrafficCone;

    case "accident":
      return AlertTriangle;

    case "road_hazard":
      return AlertTriangle;

    case "unsafe_area":
      return AlertTriangle;

    case "police_activity":
      return ShieldCheck;

    case "emergency":
      return Siren;

    case "flooding":
      return Waves;

    case "crowd":
      return Users;

    case "safe_zone":
      return MapPin;

    default:
      return AlertTriangle;
  }
}

function getSeverityClasses(
  severity: SafetyEvent["severity"]
) {
  switch (severity) {
    case "critical":
      return {
        marker: "bg-red-600 border-red-200",
        card: "border-red-500/50",
        label: "CRITICAL",
      };

    case "high":
      return {
        marker: "bg-orange-500 border-orange-100",
        card: "border-orange-500/50",
        label: "WARNING",
      };

    case "moderate":
      return {
        marker: "bg-yellow-500 border-yellow-100",
        card: "border-yellow-500/50",
        label: "CAUTION",
      };

    case "low":
    default:
      return {
        marker: "bg-blue-500 border-blue-100",
        card: "border-blue-500/50",
        label: "INFO",
      };
  }
}

export default function SafetyEventMarker({
  event,
}: SafetyEventMarkerProps) {
  const [open, setOpen] = useState(false);

  const Icon = getEventIcon(event.type);
  const severity = getSeverityClasses(
    event.severity
  );

  const ageMinutes = Math.max(
    0,
    Math.round(
      (Date.now() - event.reportedAt) /
        60000
    )
  );

  return (
    <div className="relative">
      {/* Map marker */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`
          relative flex h-11 w-11 items-center
          justify-center rounded-full border-4
          shadow-xl transition-transform
          hover:scale-110 active:scale-95
          ${severity.marker}
        `}
        aria-label={event.title}
      >
        <Icon className="h-5 w-5 text-white" />

        {event.severity === "critical" ||
        event.severity === "high" ? (
          <span className="absolute -inset-1 rounded-full border border-white/30 animate-ping" />
        ) : null}
      </button>

      {/* Event information card */}
      {open && (
        <div
          className={`
            absolute bottom-14 left-1/2
            z-[2000] w-[270px]
            -translate-x-1/2
            rounded-2xl border
            bg-[#0F1E1E]/97
            p-4 text-white shadow-2xl
            backdrop-blur-xl
            ${severity.card}
          `}
        >
          <div className="flex items-start gap-3">
            <div
              className={`
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-xl
                ${severity.marker}
              `}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-black tracking-[0.16em] text-[#7BA3A1]">
                  {severity.label}
                </span>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-[#7BA3A1] hover:bg-[#F8F1E1]/95/10"
                  aria-label="Close warning"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <h3 className="mt-1 text-sm font-black">
                {event.title}
              </h3>
            </div>
          </div>

          {event.description ? (
            <p className="mt-3 text-xs leading-relaxed text-[#B5C7C5]">
              {event.description}
            </p>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#F8F1E1]/95/5 p-2">
              <p className="text-[8px] uppercase tracking-wider text-[#7BA3A1]">
                Reported
              </p>

              <p className="mt-1 text-xs font-bold">
                {ageMinutes < 1
                  ? "Just now"
                  : `${ageMinutes} min ago`}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8F1E1]/95/5 p-2">
              <p className="text-[8px] uppercase tracking-wider text-[#7BA3A1]">
                Confidence
              </p>

              <p className="mt-1 text-xs font-bold text-[#4ADE80]">
                {Math.round(
                  event.confidence * 100
                )}
                %
              </p>
            </div>
          </div>

          {event.reportCount &&
          event.reportCount > 1 ? (
            <p className="mt-3 text-[10px] text-[#7BA3A1]">
              {event.reportCount} reports support
              this alert.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}