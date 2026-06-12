import { useEffect, useState } from "react";
import { MapPin, Phone, Users, ShieldCheck } from "lucide-react";
import { auth, db, collection, getDocs } from "@/lib/firebase";

interface EmergencyNetworkScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function EmergencyNetworkScreen({
  onBack,
}: EmergencyNetworkScreenProps) {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const contactsRef = collection(db, "users", user.uid, "trustedContacts");
      const snapshot = await getDocs(contactsRef);

      const loadedContacts: TrustedContact[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustedContact, "id">),
      }));

      setContacts(loadedContacts);
    } catch (error) {
      console.error("Failed to load emergency contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmergencyAlert = () => {
    if (contacts.length === 0) {
      alert("No trusted contacts found. Add trusted contacts first.");
      return;
    }

    alert(
      `Emergency alert prepared for ${contacts.length} trusted contact${
        contacts.length > 1 ? "s" : ""
      }.`
    );
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#7F1D1D] border border-[#EF4444] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🚨 Emergency Network
        </h1>

        <p className="text-sm text-[#FCA5A5]">
          Quickly reach help and trusted contacts.
        </p>
      </div>

      <button
        onClick={sendEmergencyAlert}
        className="w-full bg-[#EF4444] text-white font-bold py-4 rounded-2xl mb-5 animate-pulse"
      >
        🚨 Send Emergency Alert
      </button>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => alert("Live location sharing will be connected next.")}
          className="bg-[#1A2E2D] rounded-2xl p-4 text-left"
        >
          <MapPin className="mb-2" />
          Share Location
        </button>

        <button
          onClick={() => alert(`${contacts.length} trusted contacts loaded.`)}
          className="bg-[#1A2E2D] rounded-2xl p-4 text-left"
        >
          <Users className="mb-2" />
          Trusted Contacts
        </button>

        <button
          onClick={() => alert("Check-in confirmed. You are marked safe.")}
          className="bg-[#1A2E2D] rounded-2xl p-4 text-left"
        >
          <ShieldCheck className="mb-2" />
          Check In Safe
        </button>

        <button
          onClick={() => window.location.href = "tel:112"}
          className="bg-[#1A2E2D] rounded-2xl p-4 text-left"
        >
          <Phone className="mb-2" />
          Emergency Call
        </button>
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-3">Trusted Contacts</h2>

        {loading && (
          <p className="text-sm text-[#7BA3A1]">Loading contacts...</p>
        )}

        {!loading && contacts.length === 0 && (
          <p className="text-sm text-[#7BA3A1]">
            No trusted contacts added yet.
          </p>
        )}

        <div className="space-y-2">
          {contacts.map((contact) => (
            <div
              key={contact.id || contact.phone}
              className="bg-[#0F1E1E] border border-[#2D5A5840] rounded-xl p-3"
            >
              <p className="font-bold">👤 {contact.name}</p>
              <p className="text-xs text-[#7BA3A1] mt-1">📞 {contact.phone}</p>
              <p className="text-xs text-[#E8A838] mt-1">
                ❤️ {contact.relationship}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Live location sharing</li>
          <li>🚨 Real SOS alerts to contacts</li>
          <li>👥 Community responders</li>
          <li>⏱ Automatic safety check-ins</li>
        </ul>
      </div>
    </div>
  );
}