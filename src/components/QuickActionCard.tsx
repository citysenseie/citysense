import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface QuickActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

export default function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#2D5A5820] bg-[#1A2E2D] p-4 transition-all duration-200 hover:border-[#E8A83840] active:scale-[0.98]"
    >
      <div className="flex items-center">

        <div className="w-12 h-12 rounded-xl bg-[#E8A83820] flex items-center justify-center text-[#E8A838]">
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