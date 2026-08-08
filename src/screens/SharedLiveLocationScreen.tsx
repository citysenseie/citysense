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

  useEffect(() => {
    const loadSession = async () => {
      try {
        const data = await getLiveLocationSession(sessionId);

        if (data) {
          setSession(data as LiveSession);
        }
      } catch (error) {
        console.error("Unable to load live location:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081514] text-white">
        Loading live location...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081514] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Location unavailable</h1>
          <p className="mt-2 text-[#78908E]">
            This live-location session could not be found.
          </p>
        </div>
      </div>
    );
  }

  if (session.status !== "active") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#081514] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">Sharing has ended</h1>
          <p className="mt-2 text-[#78908E]">
            This live-location session is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#081514] px-5 py-8 text-white">
      <div className="mx-auto max-w-md">
        <div className="rounded-[28px] border border-[#2DD4BF]/20 bg-[#102725] p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-[#2DD4BF]" />

            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#5EEAD4]">
              LIVE LOCATION
            </span>
          </div>

          <h1 className="text-3xl font-bold">
            Someone is sharing their location
          </h1>

          <p className="mt-3 text-sm text-[#9DB3B0]">
            This location is currently being shared with you through
            CitySense.
          </p>

          <div className="mt-6 rounded-2xl bg-[#081514] p-4">
            <p className="text-xs uppercase tracking-wider text-[#78908E]">
              Current location
            </p>

            <p className="mt-2 text-lg font-semibold">
              {session.address || "Location available"}
            </p>

            <p className="mt-2 text-xs text-[#78908E]">
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
      </div>
    </div>
  );
}