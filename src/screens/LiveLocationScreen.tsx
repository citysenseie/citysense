import { useEffect, useState } from "react";
import { MapPin, Users, Clock, Radio } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import { auth, db, collection, getDocs } from "@/lib/firebase";

interface LiveLocationScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function LiveLocationScreen({
  onBack,
}: LiveLocationScreenProps) {
  const { location } = useLocation();
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [sharing, setSharing] = useState(false);

  const loadContacts = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const contactsRef = collection(db, "users", user.uid, "trustedContacts");
    const snapshot = await getDocs(contactsRef);

    const loadedContacts: TrustedContact[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<TrustedContact, "id">),
    }));

    setContacts(loadedContacts);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const lastUpdated = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          📍 Live Location
        </h1>

        <p className="text-sm text-[#BBF7D0]">
          Prepare location sharing with trusted contacts.
        </p>
      </div>

      <div className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-5 h-5 text-[#E8A838]" />
          <h2 className="font-bold">Current Location</h2>
        </div>

        {location ? (
          <>
            <p className="text-sm text-[#F5F3EF]">{location.address}</p>
            <p className="text-xs text-[#7BA3A1] mt-2">
              Lat: {location.latitude.toFixed(5)} • Lng:{" "}
              {location.longitude.toFixed(5)}
            </p>
          </>
        ) : (
          <p className="text-sm text-[#7BA3A1]">
            Location not available yet.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#1A2E2D] rounded-2xl p-4">
          <Users className="mb-2 text-[#3B82F6]" />
          <p className="font-bold">{contacts.length}</p>
          <p className="text-xs text-[#7BA3A1]">Trusted Contacts</p>
        </div>

        <div className="bg-[#1A2E2D] rounded-2xl p-4">
          <Clock className="mb-2 text-[#E8A838]" />
          <p className="font-bold">{lastUpdated}</p>
          <p className="text-xs text-[#7BA3A1]">Last Updated</p>
        </div>
      </div>

      <button
        onClick={() => {
          if (!location) {
            alert("Location is not available yet.");
            return;
          }

          if (contacts.length === 0) {
            alert("Add trusted contacts before sharing your location.");
            return;
          }

          setSharing(true);
        }}
        className="w-full bg-[#22C55E] text-black font-bold py-4 rounded-2xl mb-4"
      >
        📍 Start Sharing Location
      </button>

      {sharing && (
        <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-[#BBF7D0] animate-pulse" />
            <h2 className="font-bold text-white">Live Sharing Active</h2>
          </div>

          <p className="text-sm text-[#BBF7D0]">
            Your location is prepared for {contacts.length} trusted contact
            {contacts.length > 1 ? "s" : ""}.
          </p>

          <button
            onClick={() => setSharing(false)}
            className="w-full mt-4 bg-[#0F1E1E] text-[#7BA3A1] font-bold py-3 rounded-xl"
          >
            Stop Sharing
          </button>
        </div>
      )}

      <div className="bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>🔗 Real shareable tracking link</li>
          <li>📩 Send location to trusted contacts</li>
          <li>⏱ Auto-refresh live position</li>
          <li>🚨 Emergency location broadcast</li>
        </ul>
      </div>
    </div>
  );
}