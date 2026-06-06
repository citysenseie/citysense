import { MapPin, Phone, Users, ShieldCheck } from "lucide-react";

interface EmergencyNetworkScreenProps {
  onBack: () => void;
}

export default function EmergencyNetworkScreen({
  onBack,
}: EmergencyNetworkScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
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

      <div className="grid grid-cols-2 gap-3">
        <button className="bg-[#1A2E2D] rounded-2xl p-4">
          <MapPin className="mb-2" />
          Share Location
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4">
          <Users className="mb-2" />
          Trusted Contacts
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4">
          <ShieldCheck className="mb-2" />
          Check In Safe
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4">
          <Phone className="mb-2" />
          Emergency Call
        </button>
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>📍 Live location sharing</li>
          <li>🚨 SOS alerts to contacts</li>
          <li>👥 Community responders</li>
          <li>⏱ Automatic safety check-ins</li>
        </ul>
      </div>
    </div>
  );
}