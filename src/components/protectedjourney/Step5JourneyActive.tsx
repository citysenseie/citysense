import {
  Activity,
  Car,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

interface Step5JourneyActiveProps {
  destination: string | null;
  travelMode: string | null;
  trustedContacts: string[];
  onEndJourney: () => void;
}

const destinationNames: Record<string, string> = {
  home: "Home",
  work: "Work",
  family: "Family",
  map: "Selected location",
  search: "Selected address",
};

const travelModeNames: Record<string, string> = {
  walking: "Walking",
  cycling: "Cycling",
  driving: "Driving",
  public_transport: "Public Transport",
};

export default function Step5JourneyActive({
  destination,
  travelMode,
  trustedContacts,
  onEndJourney,
}: Step5JourneyActiveProps) {
  const destinationLabel =
    destinationNames[destination ?? ""] ?? "Your destination";

  const travelModeLabel =
    travelModeNames[travelMode ?? ""] ?? "Journey";

  return (
    <div className="space-y-4 pb-8">
      {/* Active protection status */}
      <div className="relative overflow-hidden rounded-[28px] border border-[#4ADE8035] bg-gradient-to-br from-[#173A32] via-[#142E2C] to-[#102220] p-6">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#4ADE80]/10 blur-2xl" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#4ADE80]/15">
                <div className="absolute h-3 w-3 rounded-full bg-[#4ADE80] animate-pulse" />
                <div className="absolute h-8 w-8 rounded-full border border-[#4ADE80]/30 animate-ping" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#4ADE80]">
                  Protected
                </p>
                <h2 className="text-xl font-black text-[#F5F3EF]">
                  Journey Active
                </h2>
              </div>
            </div>

            <ShieldCheck className="h-7 w-7 text-[#4ADE80]" />
          </div>

          <p className="mt-5 max-w-md text-sm leading-6 text-[#A8C2BF]">
            CitySense is quietly monitoring your journey and will check on you
            if something unexpected happens.
          </p>
        </div>
      </div>

      {/* Journey overview */}
      <div className="rounded-[24px] border border-[#2D5A5830] bg-[#1A2E2D] p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-[#4ADE80]" />
          <span className="text-sm font-bold text-[#7BA3A1]">
            JOURNEY DESTINATION
          </span>
        </div>

        <h3 className="text-2xl font-black text-[#F5F3EF]">
          {destinationLabel}
        </h3>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#102220] px-4 py-3">
          {travelMode === "driving" ? (
            <Car className="h-5 w-5 text-[#4ADE80]" />
          ) : (
            <Activity className="h-5 w-5 text-[#4ADE80]" />
          )}

          <div>
            <p className="text-xs text-[#7BA3A1]">Travel mode</p>
            <p className="font-semibold text-[#F5F3EF]">
              {travelModeLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Monitoring status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-[22px] border border-[#2D5A5830] bg-[#1A2E2D] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4ADE80]/10">
            <Activity className="h-5 w-5 text-[#4ADE80]" />
          </div>

          <p className="mt-3 text-xs text-[#7BA3A1]">
            Location monitoring
          </p>

          <p className="mt-1 font-bold text-[#4ADE80]">
            Active
          </p>
        </div>

        <div className="rounded-[22px] border border-[#2D5A5830] bg-[#1A2E2D] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4ADE80]/10">
            <Clock3 className="h-5 w-5 text-[#4ADE80]" />
          </div>

          <p className="mt-3 text-xs text-[#7BA3A1]">
            Journey status
          </p>

          <p className="mt-1 font-bold text-[#F5F3EF]">
            Monitoring
          </p>
        </div>
      </div>

      {/* Trusted contacts */}
      <div className="rounded-[24px] border border-[#2D5A5830] bg-[#1A2E2D] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4ADE80]/10">
              <Users className="h-5 w-5 text-[#4ADE80]" />
            </div>

            <div>
              <p className="font-bold text-[#F5F3EF]">
                Trusted contacts
              </p>

              <p className="text-xs text-[#7BA3A1]">
                Available if something goes wrong
              </p>
            </div>
          </div>

          <span className="rounded-full bg-[#4ADE80]/10 px-3 py-1 text-xs font-bold text-[#4ADE80]">
            {trustedContacts.length} active
          </span>
        </div>
      </div>

      {/* Check-in */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-[#4ADE80] py-5 font-black text-[#0F1E1E] shadow-lg shadow-[#4ADE80]/10 transition-transform active:scale-[0.98]"
      >
        <CheckCircle2 className="h-6 w-6" />
        I'm OK
      </button>

      {/* Emergency */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-[22px] border border-red-500/30 bg-red-500/10 py-4 font-bold text-red-300 transition-colors hover:bg-red-500/15"
      >
        <Siren className="h-5 w-5" />
        Need Help
      </button>

      {/* End journey */}
      <button
        type="button"
        onClick={onEndJourney}
        className="w-full rounded-2xl border border-[#6B3A3A] bg-transparent py-4 font-semibold text-[#D99A9A] transition-colors hover:bg-red-500/10"
      >
        End Protected Journey
      </button>
    </div>
  );
}