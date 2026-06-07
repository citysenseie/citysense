interface ParkProtectScreenProps {
  onBack: () => void;
}

export default function ParkProtectScreen({
  onBack,
}: ParkProtectScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#0F1E1E] text-[#F5F3EF] px-4 py-5">
      <button
        onClick={onBack}
        className="text-sm text-[#E8A838] mb-4"
      >
        ← Back
      </button>

      <div className="bg-[#1E3A5F] border border-[#60A5FA] rounded-2xl p-4 mb-5">
        <h1 className="text-xl font-bold text-white mb-2">
          🅿️ Park & Protect
        </h1>

        <p className="text-sm text-[#BFDBFE]">
          Check parking safety and report incidents.
        </p>
      </div>

      <div className="space-y-3">
        <div className="bg-[#14532D] rounded-2xl p-4">
          <h2 className="font-bold">🟢 Safe Parking</h2>
          <p className="text-sm opacity-80">
            Well-lit area with no recent incidents.
          </p>
        </div>

        <div className="bg-[#78350F] rounded-2xl p-4">
          <h2 className="font-bold">🟡 Medium Risk</h2>
          <p className="text-sm opacity-80">
            Limited activity or lighting.
          </p>
        </div>

        <div className="bg-[#7F1D1D] rounded-2xl p-4">
          <h2 className="font-bold">🔴 High Risk</h2>
          <p className="text-sm opacity-80">
            Community-reported incidents nearby.
          </p>
        </div>
      </div>

      <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4">
        <h2 className="font-bold mb-2">Future Features</h2>

        <ul className="space-y-2 text-sm text-[#7BA3A1]">
          <li>💡 Lighting score</li>
          <li>📷 Break-in reports</li>
          <li>👥 Community safety rating</li>
          <li>🤖 AI parking safety score</li>
        </ul>
      </div>
    </div>
  );
}