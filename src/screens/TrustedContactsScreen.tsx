import { useState } from "react";

interface TrustedContactsScreenProps {
  onBack: () => void;
}

export default function TrustedContactsScreen({
  onBack,
}: TrustedContactsScreenProps) {
  const [contacts, setContacts] = useState<string[]>([]);
  const [name, setName] = useState("");

  const addContact = () => {
    if (!name.trim()) return;

    setContacts([...contacts, name]);
    setName("");
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
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

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contact name"
        className="w-full bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl px-4 py-3 mb-3"
      />

      <button
        onClick={addContact}
        className="w-full bg-[#3B82F6] text-white font-bold py-3 rounded-2xl mb-5"
      >
        ➕ Add Contact
      </button>

      <div className="space-y-2">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="bg-[#1A2E2D] border border-[#2D5A5840] rounded-xl p-3"
          >
            👤 {contact}
          </div>
        ))}
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📞 Phone numbers</li>
          <li>📍 Live location sharing</li>
          <li>🚨 Emergency notifications</li>
          <li>💬 SMS alerts</li>
        </ul>
      </div>
    </div>
  );
}