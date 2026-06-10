interface SafeSpacesScreenProps {
  onBack: () => void;
}

export default function SafeSpacesScreen({
  onBack,
}: SafeSpacesScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#14532D] border border-[#22C55E] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🛡️ Safe Spaces
        </h1>

        <p className="text-sm text-[#BBF7D0]">
          Find trusted places nearby when you need help.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          🚓 Police Station
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          🏥 Hospital
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          💊 Pharmacy
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          🏨 Hotel
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          👩 Women's Shelter
        </button>

        <button className="bg-[#1A2E2D] rounded-2xl p-4 text-left">
          ☕ Safe Café
        </button>
      </div>
    </div>
  );
}