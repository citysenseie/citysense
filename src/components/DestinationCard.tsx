import type { ReactNode } from "react";
import { CheckCircle } from "lucide-react";

interface DestinationCardProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
}

export default function DestinationCard({
  icon,
  title,
  subtitle,
  selected = false,
  onClick,
}: DestinationCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl p-5 text-left transition-all duration-300 active:scale-[0.98]
      ${
        selected
          ? "border border-[#4ADE80] bg-[#173533] shadow-[0_0_25px_rgba(74,222,128,0.25)]"
          : "border border-[#2D5A5830] bg-[#1A2E2D]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2D5A58] text-[#4ADE80]">
            {icon}
          </div>

          <div>
            <h3 className="font-bold text-[#F5F3EF]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-[#7BA3A1]">
              {subtitle}
            </p>
          </div>
        </div>

        {selected ? (
          <CheckCircle className="w-6 h-6 text-[#4ADE80]" />
        ) : (
          <span className="text-xl text-[#7BA3A1]">
            →
          </span>
        )}
      </div>
    </button>
  );
}