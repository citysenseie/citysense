
import { useState, useEffect, useCallback } from "react";
import { auth, db, collection, getDocs, addDoc, serverTimestamp } from "@/lib/firebase";
import { Phone, Shield, Wifi, Users, MessageCircle, Siren, Volume2, MapPin, X, } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { useReports } from "@/hooks/useReports";
import HoldToActivateButton from "@/components/HoldToActivateButton";
import QuickActionCard from "@/components/QuickActionCard";
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export default function SOSScreen() {
  const { location } = useLocation();
  const { submitReport } = useReports();
  const [activated, setActivated] = useState(false);
  const [holdingSOS, setHoldingSOS] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [timerActive] = useState(false);
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

 
  const startHoldingSOS = () => {
  setHoldingSOS(true);
  setHoldProgress(0);

  const started = Date.now();

  const interval = window.setInterval(() => {
    const elapsed = Date.now() - started;
    const progress = Math.min((elapsed / 2000) * 100, 100);

    setHoldProgress(progress);

    if (progress >= 100) {
      clearInterval(interval);

      setHoldingSOS(false);
      setHoldProgress(0);

      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      void handleSOSActivate();
    }
  }, 20);

  setHoldTimer(interval);
};

const stopHoldingSOS = () => {
  if (holdTimer !== null) {
    clearInterval(holdTimer);
  }

  setHoldTimer(null);
  setHoldingSOS(false);
  setHoldProgress(0);
};
const handleSOSActivate = async () => {
  const user = auth.currentUser;

  if (!user) {
    alert("Please sign in before using CitySense SOS.");
    return;
  }

  if (!location) {
    alert(
      "CitySense needs your location before SOS can be activated. Please enable location access and try again."
    );
    return;
  }

  setActivated(true);
  try {
    await submitReport({
      type: "unsafe",
      category: "sos",
      description: "Emergency SOS activated",
      severity: "high",
     latitude: location.latitude,
longitude: location.longitude,
      address: location.address || "Unknown location",
      userId: user.uid,
    });

    await addDoc(collection(db, "emergencyAlerts"), {
      userId: user.uid,

      type: "sos",
      severity: "high",
      status: "active",

      latitude: location.latitude,
longitude: location.longitude,
      address: location.address || "Unknown location",

      contactCount: contacts.length,

      createdAt: serverTimestamp(),
    });

    console.log("SOS emergency alert created");
  } catch (error) {
    console.error("Failed to create SOS alert:", error);
  }
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
const readinessChecks = [
  { ok: !!location },
  { ok: contacts.length > 0 },
  { ok: navigator.onLine },
];

const readinessScore = Math.round(
  (readinessChecks.filter((c) => c.ok).length /
    readinessChecks.length) *
    100
);
  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
     {/* Emergency Header */}
<div className="px-4 pt-5">

  <h1 className="text-2xl font-black text-[#F5F3EF]">
    Emergency Assistance
  </h1>

  <p className="text-sm text-[#7BA3A1] mt-1">
    Stay calm. CitySense is ready to help.
  </p>

  <div className="mt-5 rounded-2xl border border-[#2D5A5820] bg-[#1A2E2D] p-5">

    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-[#F5F3EF]">
        Emergency Readiness
      </span>

      
      <div className="text-right">
  <p className="text-lg font-black text-[#4ADE80]">
    {readinessScore}%
  </p>

  <p className="text-[10px] text-[#7BA3A1]">
    READY
  </p>
</div>
    </div>

    <div className="mt-5 space-y-5">

      <div className="flex items-center justify-between">
       <div className="flex items-center gap-2">
  <MapPin className="w-4 h-4 text-[#4ADE80]" />

  <span className="text-sm text-[#F5F3EF]">
    GPS Ready
  </span>
</div>
        <span
          className={`text-xs font-bold ${
            location ? "text-[#4ADE80]" : "text-[#EF4444]"
          }`}
        >
          {location ? "READY" : "WAITING"}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className="w-4 h-4 text-[#4ADE80]" />
          <span className="text-sm text-[#F5F3EF]">
            Internet
          </span>
        </div>

        <span className="text-xs font-bold text-[#4ADE80]">
          ONLINE
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
  <Users className="w-4 h-4 text-[#E8A838]" />

          <span className="text-sm text-[#F5F3EF]">
            Trusted Contacts
          </span>
        </div>

        <span className="text-xs font-bold text-[#E8A838]">
          {contacts.length} Connected
        </span>
      </div>

    </div>

  </div>

</div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
       {/* Hero SOS Button */}
<div className="mt-8 flex flex-col items-center">

  <HoldToActivateButton
    holding={holdingSOS}
    progress={holdProgress}
    onMouseDown={startHoldingSOS}
    onMouseUp={stopHoldingSOS}
    onMouseLeave={stopHoldingSOS}
    onTouchStart={startHoldingSOS}
    onTouchEnd={stopHoldingSOS}
  />

  <p className="mt-5 max-w-[280px] text-center text-sm text-[#7BA3A1]">
    Press and hold for{" "}
    <span className="font-semibold text-[#F5F3EF]">
      2 seconds
    </span>{" "}
    to activate Emergency Mode. You can still cancel during the
    5-second countdown.
  </p>

</div>
     
 {/* Quick Actions */}
<div className="mt-8">

  <h3 className="text-lg font-bold text-[#F5F3EF] mb-4">
    Quick Actions
  </h3>

  <div className="space-y-3">

    <QuickActionCard
     color="amber"
  icon={<Shield className="w-6 h-6" />}
  title="Safety Journey"
  description="Start a monitored journey and check in safely."
  onClick={() => {
    alert("Safety Journey coming soon");
  }}
/>

    <QuickActionCard
  color="blue"
  icon={<MapPin className="w-6 h-6" />}
  title="Share Live Location"
  description="Share your real-time location with trusted contacts."
  onClick={() => {
    alert("Live Location coming soon");
  }}
/>
    

   <QuickActionCard
  color="red"
  icon={<Phone className="w-6 h-6" />}
  title="Emergency Call"
  description="Call local emergency services instantly."
  onClick={() => {
    window.location.href = "tel:112";
  }}
/>
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
