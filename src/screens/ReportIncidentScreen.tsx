import { useState } from "react";

const categories = [
  { id: "crime", icon: "🚔", name: "Crime" },
  { id: "traffic", icon: "🚗", name: "Traffic" },
  { id: "environment", icon: "🌧", name: "Environment" },
  { id: "medical", icon: "🏥", name: "Medical" },
  { id: "community", icon: "👥", name: "Community" },
];

export default function ReportIncidentScreen() {
  const [selectedCategory, setSelectedCategory] = useState("");

  return (
    <div className="min-h-screen bg-[#0F1E1E] text-white p-6">
      <h1 className="text-3xl font-bold mb-2">🚨 Report Incident</h1>

      <p className="text-gray-400 mb-8">
        Help keep your community safe by reporting what you see.
      </p>

      <div className="space-y-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`w-full rounded-2xl border p-5 text-left transition ${
              selectedCategory === category.id
                ? "border-green-500 bg-green-900"
                : "border-gray-700 bg-[#1A2E2D]"
            }`}
          >
            <span className="text-2xl mr-3">{category.icon}</span>
            <span className="text-lg font-semibold">{category.name}</span>
          </button>
        ))}
      </div>

      <button
        disabled={!selectedCategory}
        className={`mt-8 w-full rounded-2xl py-4 font-bold ${
          selectedCategory
            ? "bg-green-500 text-black"
            : "bg-gray-700 text-gray-400"
        }`}
      >
        Continue
      </button>
    </div>
  );
}