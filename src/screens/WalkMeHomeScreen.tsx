import { useEffect, useState } from "react";
import { auth, db, collection, getDocs } from "@/lib/firebase";

interface WalkMeHomeScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function WalkMeHomeScreen({
  onBack,
}: WalkMeHomeScreenProps) {
  const [destination, setDestination] = useState("");
  const [walkStarted, setWalkStarted] = useState(false);
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20); // testing
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  useEffect(() => {
    const loadContacts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const contactsRef = collection(
        db,
        "users",
        user.uid,
        "trustedContacts"
      );

      const snapshot = await getDocs(contactsRef);

      const loadedContacts: TrustedContact[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustedContact, "id">),
      }));

      setContacts(loadedContacts);
    };

    loadContacts();
  }, []);

  useEffect(() => {
    if (!walkStarted || emergencyTriggered) return;

    if (timeLeft <= 0) {
      setEmergencyTriggered(true);

      alert(
        `Safety timer expired. Emergency prepared for ${contacts.length} trusted contact${
          contacts.length > 1 ? "s" : ""
        }.`
      );

      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [walkStarted, timeLeft, emergencyTriggered, contacts.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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

      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 mb-4">
        <p className="text-sm text-[#7BA3A1]">
          👥 {contacts.length} trusted contact
          {contacts.length !== 1 ? "s" : ""} connected
        </p>
      </div>

      {!walkStarted ? (
        <>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Where are you going?"
            className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 mb-4"
          />

          <button
            onClick={() => {
              if (!destination.trim()) {
                alert("Please enter your destination first.");
                return;
              }

              if (contacts.length === 0) {
                alert("Add trusted contacts before starting Walk Me Home.");
                return;
              }

              setTimeLeft(20);
              setEmergencyTriggered(false);
              setWalkStarted(true);
            }}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            Start Walk
          </button>
        </>
      ) : (
        <div className="space-y-4">
          {emergencyTriggered && (
            <div className="bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4">
              <h2 className="font-bold text-white">
                🚨 Emergency Escalation Triggered
              </h2>

              <p className="text-sm text-[#FCA5A5] mt-2">
                Trusted contacts are ready to receive an emergency alert.
              </p>
            </div>
          )}

          <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4">
            <p className="text-xs text-[#7BA3A1] mb-1">Walking to</p>
            <h2 className="text-lg font-bold">{destination}</h2>
          </div>

          <div className="bg-[#0F1E1E] border border-[#22C55E60] rounded-2xl p-4 text-center">
            <p className="text-sm text-[#7BA3A1] mb-2">Safety check-in</p>

            <p className="text-3xl font-bold text-[#22C55E]">
              {formatTime(timeLeft)}
            </p>
          </div>

          <button
            onClick={() => {
              alert("Check-in confirmed. You are marked safe.");
              setTimeLeft(20);
              setEmergencyTriggered(false);
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl"
          >
            ✅ I'm Safe
          </button>

          <button
            onClick={() => {
              alert(
                `Emergency alert prepared for ${contacts.length} trusted contact${
                  contacts.length > 1 ? "s" : ""
                }.`
              );
            }}
            className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-2xl"
          >
            🚨 Send Alert
          </button>

          <button
            onClick={() => {
              setTimeLeft(20);
              setEmergencyTriggered(false);
              setWalkStarted(false);
              setDestination("");
            }}
            className="w-full bg-[#1A2E2D] text-[#7BA3A1] font-bold py-3 rounded-2xl"
          >
            Cancel Walk
          </button>
        </div>
      )}
    </div>
  );
}