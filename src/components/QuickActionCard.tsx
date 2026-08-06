import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: "amber" | "blue" | "red" | "green";
  onClick?: () => void;
}

export default function QuickActionCard({
  icon,
  title,
  description,
  color = "amber",
  onClick,
}: QuickActionCardProps) {
  let bgColor = "bg-[#1A2E2D]";
  let borderColor = "border-[#2D5A5820]";
  let hoverBorderColor = "hover:border-[#E8A83840]";

  if (color === "amber") {
    bgColor = "bg-[#F59E0B20]";
    borderColor = "border-[#F59E0B40]";
    hoverBorderColor = "hover:border-[#F59E0B40]";
  } else if (color === "blue") {
    bgColor = "bg-[#3B82F620]";
    borderColor = "border-[#3B82F640]";
    hoverBorderColor = "hover:border-[#3B82F640]";
  } else if (color === "red") {
    bgColor = "bg-[#EF444420]";
    borderColor = "border-[#EF444440]";
    hoverBorderColor = "hover:border-[#EF444440]";
  } else if (color === "green") {
    bgColor = "bg-[#10B98120]";
    borderColor = "border-[#10B98140]";
    hoverBorderColor = "hover:border-[#10B98140]";
  }
const iconColors = {
  amber: "bg-[#E8A83820] text-[#E8A838]",
  blue: "bg-[#3B82F620] text-[#3B82F6]",
  red: "bg-[#EF444420] text-[#EF4444]",
  green: "bg-[#4ADE8020] text-[#4ADE80]",
};
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border ${borderColor} ${bgColor} p-4 transition-all duration-200 ${hoverBorderColor} active:scale-[0.98]`}
    >
      <div className="flex items-center">

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColors[color]}`}>
          {icon}
        </div>

        <div className="ml-4 flex-1 text-left">
          <h3 className="text-sm font-semibold text-[#F5F3EF]">
            {title}
          </h3>

          <p className="text-xs text-[#7BA3A1] mt-1">
            {description}
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-[#7BA3A1]" />

      </div>
    </button>
  );
}