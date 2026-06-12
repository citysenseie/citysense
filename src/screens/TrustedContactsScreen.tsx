import { useEffect, useState } from "react";
import {
  auth,
  db,
  collection,
  addDoc,
  getDocs,
} from "@/lib/firebase";

interface TrustedContactsScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function TrustedContactsScreen({
  onBack,
}: TrustedContactsScreenProps) {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
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
      console.error("Failed to load trusted contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please sign in to save trusted contacts.");
      return;
    }

    if (!name.trim() || !phone.trim()) {
      alert("Please enter at least a name and phone number.");
      return;
    }

    const newContact = {
      name,
      phone,
      relationship: relationship || "Trusted Contact",
    };

    try {
      const contactsRef = collection(db, "users", user.uid, "trustedContacts");
      const docRef = await addDoc(contactsRef, newContact);

      setContacts([
        ...contacts,
        {
          id: docRef.id,
          ...newContact,
        },
      ]);

      setName("");
      setPhone("");
      setRelationship("");
    } catch (error) {
      console.error("Failed to save trusted contact:", error);
      alert("Could not save contact. Please try again.");
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button onClick={onBack} className="text-sm text-[#E8A838] mb-4">
        ← Back
      </button>

      <div className="bg-[#0F2740] border border-[#3B82F6] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          👥 Trusted Contacts
        </h1>

        <p className="text-sm text-[#BFDBFE]">
          Add people who should be notified during emergencies.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contact name"
          className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 outline-none"
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 outline-none"
        />

        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Relationship"
          className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 outline-none"
        />
      </div>

      <button
        onClick={addContact}
        className="w-full bg-[#3B82F6] text-white font-bold py-3 rounded-2xl mb-5"
      >
        ➕ Save Trusted Contact
      </button>

      {loading && (
        <p className="text-sm text-[#7BA3A1] text-center mb-3">
          Loading contacts...
        </p>
      )}

      <div className="space-y-3">
        {contacts.map((contact) => (
          <div
            key={contact.id || contact.phone}
            className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-2xl p-4"
          >
            <p className="font-bold">👤 {contact.name}</p>
            <p className="text-sm text-[#7BA3A1] mt-1">📞 {contact.phone}</p>
            <p className="text-sm text-[#E8A838] mt-1">
              ❤️ {contact.relationship}
            </p>
          </div>
        ))}

        {!loading && contacts.length === 0 && (
          <p className="text-sm text-[#7BA3A1] text-center">
            No trusted contacts added yet.
          </p>
        )}
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Share live location</li>
          <li>🚨 Emergency notifications</li>
          <li>💬 SMS alerts</li>
          <li>🗑 Remove trusted contacts</li>
        </ul>
      </div>
    </div>
  );
}