
import { useState, useEffect, useCallback } from "react";
import { auth, db, collection, getDocs } from "@/lib/firebase";
import { Phone, MessageCircle, Siren, Volume2, MapPin, X, Clock } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function SOSScreen() {
  const { location } = useLocation();
  const { submitReport } = useReports();
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [sirenOn, setSirenOn] = useState(false);
const [contacts, setContacts] = useState<EmergencyContact[]>([]);

const loadTrustedContacts = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const contactsRef = collection(db, "users", user.uid, "trustedContacts");
    const snapshot = await getDocs(contactsRef);

    const loadedContacts: EmergencyContact[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: (doc.data() as any).name,
      phone: (doc.data() as any).phone,
    }));

    setContacts(loadedContacts);
  } catch (error) {
    console.error(error);
  }
};
  useEffect(() => {
    loadTrustedContacts();
  }, []);

  useEffect(() => {
    if (!activated) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [activated, countdown]);

  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const t = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timerSeconds]);

  const cancelSOS = useCallback(() => {
    setActivated(false);
    setCountdown(5);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };
const handleSOSActivate = async () => {
  setActivated(true);

  if (!location) return;

  await submitReport({
    type: "unsafe",
    category: "sos",
    description: "Emergency SOS activated",
    severity: "high",
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.address || "Unknown location",
    userId: "sos-user",
  });
};
  // Active SOS countdown screen
  if (activated && countdown > 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#EF4444] px-6 animate-pulse">
        <Siren className="w-16 h-16 text-white mb-4" />
        <h2 className="text-3xl font-bold text-white">SOS ACTIVATING</h2>
        <p className="text-white/80 text-sm mt-2 text-center">
          Alerting emergency contacts in
        </p>
        <div className="text-6xl font-bold text-white mt-4">{countdown}</div>
        <button
          onClick={cancelSOS}
          className="mt-8 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    );
  }

  // Active SOS confirmed
  if (activated && countdown === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#EF4444] px-6">
        <Siren className="w-20 h-20 text-white animate-bounce" />
        <h2 className="text-2xl font-bold text-white mt-4">EMERGENCY ACTIVE</h2>
        <p className="text-white/80 text-sm mt-2 text-center">
          Your location has been shared with emergency contacts.
        </p>
        <div className="mt-4 bg-white/20 backdrop-blur-md rounded-xl px-4 py-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-white" />
          <p className="text-xs text-white">{location?.address ?? "Location sharing active"}</p>
        </div>
        <button
          onClick={() => { setActivated(false); setCountdown(5); }}
          className="mt-8 px-8 py-3 bg-white rounded-full text-[#EF4444] font-bold text-sm active:scale-95 transition-transform"
        >
          Deactivate
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-[#F5F3EF]">Emergency</h2>
        <p className="text-xs text-[#7BA3A1] mt-0.5">Quick access to emergency services</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Big SOS Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSOSActivate}
            className="w-40 h-40 rounded-full bg-gradient-to-br from-[#EF4444] to-[#DC2626] flex flex-col items-center justify-center shadow-2xl shadow-[#EF444440] active:scale-95 transition-transform"
          >
            <Siren className="w-10 h-10 text-white mb-1" />
            <span className="text-2xl font-black text-white tracking-wider">SOS</span>
            <span className="text-[10px] text-white/70 mt-0.5">HOLD TO ACTIVATE</span>
          </button>
        </div>

        <p className="text-center text-xs text-[#7BA3A1] mt-4">
          Press and hold the SOS button to alert emergency contacts
        </p>

        {/* Safety Timer */}
        <div className="mt-6 bg-[#1A2E2D] rounded-2xl p-4 border border-[#2D5A5820]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#E8A838]" />
              <span className="text-sm font-bold text-[#F5F3EF]">Safety Timer</span>
            </div>
            <span className="text-2xl font-bold text-[#E8A838] font-mono">{formatTime(timerSeconds)}</span>
          </div>
          <p className="text-xs text-[#7BA3A1] mt-2">
            {timerActive
              ? "Timer running. We'll alert your contacts if you don't check in."
              : "Set a timer for your journey. We'll check in when it expires."}
          </p>
          <div className="flex gap-2 mt-3">
            {!timerActive ? (
              <>
                <button
                  onClick={() => { setTimerSeconds(300); setTimerActive(true); }}
                  className="flex-1 py-2 bg-[#E8A838] text-[#0F1E1E] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  5 Min
                </button>
                <button
                  onClick={() => { setTimerSeconds(600); setTimerActive(true); }}
                  className="flex-1 py-2 bg-[#2D5A58] text-[#F5F3EF] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  10 Min
                </button>
                <button
                  onClick={() => { setTimerSeconds(900); setTimerActive(true); }}
                  className="flex-1 py-2 bg-[#2D5A58] text-[#F5F3EF] rounded-lg text-xs font-bold active:scale-95 transition-transform"
                >
                  15 Min
                </button>
              </>
            ) : (
              <button
                onClick={() => { setTimerActive(false); setTimerSeconds(300); }}
                className="flex-1 py-2 bg-[#4ADE80] text-[#0F1E1E] rounded-lg text-xs font-bold active:scale-95 transition-transform"
              >
                I'm Safe — Check In
              </button>
            )}
          </div>
        </div>

        {/* Siren Toggle */}
        <button
          onClick={() => setSirenOn(!sirenOn)}
          className={`w-full mt-4 py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold transition-all ${
            sirenOn
              ? "bg-[#EF444420] border-2 border-[#EF4444] text-[#EF4444]"
              : "bg-[#1A2E2D] border border-[#2D5A5840] text-[#F5F3EF]"
          }`}
        >
          <Volume2 className="w-5 h-5" />
          {sirenOn ? "Sound Alarm Active" : "Sound Alarm"}
        </button>

        {/* Emergency Contacts */}
        <p className="text-sm font-bold text-[#F5F3EF] mt-6 mb-3">Emergency Contacts</p>
        <div className="space-y-2">
         {contacts.map((contact) => (
            <a
              key={contact.id}
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 bg-[#1A2E2D] rounded-xl px-4 py-3 border border-[#2D5A5820] active:scale-[0.98] transition-transform"
            >
              <div className="w-10 h-10 rounded-full bg-[#EF444420] flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F5F3EF]">{contact.name}</p>
                <p className="text-xs text-[#7BA3A1]">{contact.phone}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#4ADE8020] flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#4ADE80]" />
              </div>
            </a>
          ))}
        </div>

        {/* Share Location */}
        <button
          onClick={() => {
            if (location) {
              const text = `I'm at ${location.address}. My location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
              window.open(`sms:?&body=${encodeURIComponent(text)}`, "_blank");
            }
          }}
          className="w-full mt-3 py-3 bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-[#F5F3EF] active:scale-[0.98] transition-transform"
        >
          <MessageCircle className="w-4 h-4 text-[#E8A838]" />
          Share Location via SMS
        </button>
      </div>
    </div>
  );
}
