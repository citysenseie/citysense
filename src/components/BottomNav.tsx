import { Map, UtensilsCrossed, AlertTriangle, Siren, User } from "lucide-react";

export type Tab = "map" | "nearby" | "report" | "sos" | "profile";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }[] = [
  {
    key: "map",
    label: "Map",
    icon: <Map className="w-5 h-5" />,
    activeIcon: <Map className="w-5 h-5" strokeWidth={2.5} />,
  },
  {
    key: "nearby",
    label: "Nearby",
    icon: <UtensilsCrossed className="w-5 h-5" />,
    activeIcon: <UtensilsCrossed className="w-5 h-5" strokeWidth={2.5} />,
  },
  {
    key: "report",
    label: "Report",
    icon: <AlertTriangle className="w-5 h-5" />,
    activeIcon: <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />,
  },
  {
    key: "sos",
    label: "SOS",
    icon: <Siren className="w-5 h-5" />,
    activeIcon: <Siren className="w-5 h-5" strokeWidth={2.5} />,
  },
  {
    key: "profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    activeIcon: <User className="w-5 h-5" strokeWidth={2.5} />,
  },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="shrink-0 h-16 bg-[#1A2E2DE0] backdrop-blur-xl border-t border-[#2D5A5840] z-50 flex items-center justify-around select-none">
      {tabs.map((t) => {
        const isActive = active === t.key;
        const isSOS = t.key === "sos";
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-all ${
              isSOS
                ? isActive
                  ? "text-[#EF4444]"
                  : "text-[#EF444480]"
                : isActive
                ? "text-[#E8A838]"
                : "text-[#7BA3A1]"
            }`}
          >
            {isActive ? t.activeIcon : t.icon}
            <span className={`text-[10px] font-semibold ${isActive ? "opacity-100" : "opacity-70"}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
