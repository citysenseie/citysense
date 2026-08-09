import { useEffect, useState } from "react";
import { getLiveLocationSession } from "@/services/liveLocationServices";

interface SharedLiveLocationScreenProps {
  sessionId: string;
}

interface LiveSession {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  status?: string;
  expiresAt?: {
    toDate?: () => Date;
  } | null;
}

export default function SharedLiveLocationScreen({
  sessionId,
}: SharedLiveLocationScreenProps) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      console.log("[CitySense] Loading live session:", sessionId);

      if (!sessionId) {
        setError("No live-location session ID was provided.");
        setLoading(false);
        return;
      }

      try {
        const data = await getLiveLocationSession(sessionId);

        console.log("[CitySense] Live session response:", data);

        if (cancelled) return;

        if (!data) {
          setError("This live-location session could not be found.");
          setSession(null);
          return;
        }

        setSession(data as LiveSession);
      } catch (err) {
        console.error("[CitySense] Unable to load live location:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the live location."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#081514] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-[#2DD4BF]/20 border-t-[#2DD4BF] animate-spin" />

          <h1 className="text-xl font-bold">
            Loading live location
          </h1>

          <p className="mt-2 text-sm text-[#78908E]">
            Connecting to CitySense...
          </p>

          <p className="mt-4 break-all text-xs text-[#4F6865]">
            Session: {sessionId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#081514] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-400/10 bg-[#10201E] p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold">
            Location unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#9DB3B0]">
            We couldn't load this live-location session.
          </p>

          <div className="mt-5 rounded-2xl bg-[#081514] p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-[#78908E]">
              Error
            </p>

            <p className="mt-2 break-words text-sm text-red-300">
              {error}
            </p>
          </div>

          <p className="mt-4 break-all text-xs text-[#4F6865]">
            Session: {sessionId}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#081514] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Location unavailable
          </h1>

          <p className="mt-3 text-sm text-[#9DB3B0]">
            This live-location session could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (session.status !== "active") {
    return (
      <div className="min-h-screen bg-[#081514] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Sharing has ended
          </h1>

          <p className="mt-3 text-sm text-[#9DB3B0]">
            This live-location session is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081514] text-[#F5F3EF]">
      <div className="mx-auto w-full max-w-lg px-5 py-8">

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2DD4BF]/10">
            <span className="text-xl">📍</span>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5EEAD4]">
              LIVE LOCATION
            </span>

            <p className="mt-1 text-xs text-[#78908E]">
              CitySense
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-bold">
          Someone is sharing their location
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#9DB3B0]">
          This location is currently being shared with you through
          CitySense.
        </p>

        <div className="mt-6 rounded-3xl border border-white/[0.06] bg-[#10201E] p-5">

          <p className="text-xs font-bold uppercase tracking-wider text-[#78908E]">
            Current location
          </p>

          <p className="mt-3 text-lg font-semibold">
            {session.address || "Location available"}
          </p>

          <div className="mt-4 rounded-2xl bg-[#081514] p-4">
            <p className="text-xs text-[#78908E]">
              Coordinates
            </p>

            <p className="mt-2 font-mono text-sm text-[#5EEAD4]">
              {session.latitude.toFixed(6)},{" "}
              {session.longitude.toFixed(6)}
            </p>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${session.latitude},${session.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 block rounded-2xl bg-[#2DD4BF] px-5 py-4 text-center font-bold text-[#06201D]"
          >
            Open Location in Maps
          </a>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#78908E]">
          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
          Live sharing is active
        </div>

      </div>
    </div>
  );
}