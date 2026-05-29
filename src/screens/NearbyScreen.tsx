import { useState } from "react";
import { useRestaurants } from "@/hooks/useRestaurants";
import { Star, MapPin, Shield, Clock, DollarSign, UtensilsCrossed, Coffee, Pizza, Beer, Salad, Soup, Croissant, Beef } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  Cafe: <Coffee className="w-4 h-4" />,
  Pizza: <Pizza className="w-4 h-4" />,
  Bar: <Beer className="w-4 h-4" />,
  Salad: <Salad className="w-4 h-4" />,
  Ramen: <Soup className="w-4 h-4" />,
  Bakery: <Croissant className="w-4 h-4" />,
  Burger: <Beef className="w-4 h-4" />,
};

export default function NearbyScreen() {
  const { restaurants, loading } = useRestaurants();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const categories = ["All", ...Array.from(new Set(restaurants.map((r) => r.category)))];
  const filtered = activeCategory === "All" ? restaurants : restaurants.filter((r) => r.category === activeCategory);

  const getSafetyColor = (score: number) => {
    if (score >= 85) return "text-[#4ADE80]";
    if (score >= 70) return "text-[#E8A838]";
    return "text-[#EF4444]";
  };

  const getSafetyBg = (score: number) => {
    if (score >= 85) return "bg-[#4ADE8020]";
    if (score >= 70) return "bg-[#E8A83820]";
    return "bg-[#EF444420]";
  };

  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-[#F5F3EF]">Nearby</h2>
        <p className="text-xs text-[#7BA3A1] mt-0.5">Restaurants & Cafes near you</p>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-[#E8A838] text-[#0F1E1E]"
                : "bg-[#1E3A3A40] text-[#7BA3A1] border border-[#2D5A5840]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Restaurant List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <div key={r.id}>
                <button
                  onClick={() => setShowDetail(showDetail === r.id ? null : r.id)}
                  className="w-full flex gap-3 bg-[#1A2E2D] rounded-2xl p-3 border border-[#2D5A5820] text-left active:scale-[0.98] transition-transform"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2D5A58] to-[#1E3A3A] flex items-center justify-center text-[#E8A838] shrink-0">
                    {categoryIcons[r.category] || <UtensilsCrossed className="w-5 h-5" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#F5F3EF] truncate">{r.name}</h3>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getSafetyBg(r.safetyScore)}`}>
                        <Shield className={`w-3 h-3 ${getSafetyColor(r.safetyScore)}`} />
                        <span className={`text-[10px] font-bold ${getSafetyColor(r.safetyScore)}`}>{r.safetyScore}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#7BA3A1] mt-0.5">{r.category} · {r.address}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-[#E8A838] fill-[#E8A838]" />
                        <span className="text-[11px] text-[#F5F3EF] font-semibold">{r.rating}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-[#7BA3A1]" />
                        <span className="text-[11px] text-[#7BA3A1]">{r.distance}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {r.openNow ? (
                          <>
                            <Clock className="w-3 h-3 text-[#4ADE80]" />
                            <span className="text-[11px] text-[#4ADE80]">Open</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-[#EF4444]" />
                            <span className="text-[11px] text-[#EF4444]">Closed</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center">
                        {Array.from({ length: r.priceLevel }).map((_, i) => (
                          <DollarSign key={i} className="w-3 h-3 text-[#7BA3A1]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {showDetail === r.id && (
                  <div className="mx-3 -mt-1 bg-[#1E3A3A30] rounded-b-2xl px-4 py-3 border-x border-b border-[#2D5A5820]">
                    <p className="text-xs text-[#7BA3A1]">
                      Safety score based on recent incident reports, lighting conditions, and foot traffic in this area.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${getSafetyBg(r.safetyScore)} ${getSafetyColor(r.safetyScore)} font-semibold`}>
                        {r.safetyScore >= 85 ? "Very Safe" : r.safetyScore >= 70 ? "Moderate" : "Exercise Caution"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
