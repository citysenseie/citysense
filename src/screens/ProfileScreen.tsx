import { useAuth } from "@/hooks/useAuth";
import { useReports } from "@/hooks/useReports";
import { User, LogOut, Shield, Bell, Moon, HelpCircle, ChevronRight } from "lucide-react";

interface ProfileScreenProps {
  onLogin: () => void;
}

export default function ProfileScreen({ onLogin }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const { reports } = useReports();

const userReports = reports.filter((r) => r.userId === user?.uid);
const safeReports = userReports.filter((r) => r.type === "safe").length;
const unsafeReports = userReports.filter((r) => r.type === "unsafe").length;
const trustLevel =
  userReports.length >= 15
    ? "Trusted Reporter"
    : userReports.length >= 5
    ? "Active Reporter"
    : "New Contributor";

  const menuItems = [
    { icon: <Shield className="w-5 h-5" />, label: "Safety Preferences", sub: "Customize alerts" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", sub: "Push & SMS settings" },
    { icon: <Moon className="w-5 h-5" />, label: "Appearance", sub: "Dark mode always on" },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Help & Support", sub: "FAQ, contact us" },
  ];

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0F1E1E] px-6">
        <div className="w-16 h-16 rounded-full bg-[#1E3A3A] flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-[#7BA3A1]" />
        </div>
        <h3 className="text-lg font-bold text-[#F5F3EF]">Not Signed In</h3>
        <p className="text-sm text-[#7BA3A1] mt-2 text-center mb-6">
          Sign in to save your preferences and sync across devices.
        </p>
        <button
          onClick={onLogin}
          className="px-8 py-3 bg-gradient-to-r from-[#E8A838] to-[#D4962F] text-[#0F1E1E] font-bold rounded-xl text-sm active:scale-95 transition-transform"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1E1E]">
      {/* Profile Header */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xl font-bold text-[#F5F3EF]">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* User Card */}
        <div className="bg-gradient-to-br from-[#2D5A58] to-[#1E3A3A] rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#0F1E1E] flex items-center justify-center">
              <User className="w-7 h-7 text-[#E8A838]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F3EF]">{user.displayName || "CitySense User"}</h3>
              <p className="text-xs text-[#7BA3A1]">{user.email}</p>
              <p className="text-[11px] text-[#E8A838] font-semibold mt-1">
  {trustLevel}
</p>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="bg-[#0F1E1E40] rounded-lg px-3 py-2">
              <p className="text-lg font-bold text-[#E8A838]">12</p>
              <p className="text-[10px] text-[#7BA3A1]">Reports</p>
            </div>
            <div className="bg-[#0F1E1E40] rounded-lg px-3 py-2">
              <p className="text-lg font-bold text-[#E8A838]">{safeReports}</p>
              <p className="text-[10px] text-[#7BA3A1]">safe</p>
            </div>
            <div className="bg-[#0F1E1E40] rounded-lg px-3 py-2">
              <p className="text-lg font-bold text-[#E8A838]">{unsafeReports}</p>
              <p className="text-[10px] text-[#7BA3A1]">unsafe</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-5 space-y-2">
          {menuItems.map((item, i) => (
            <button
  key={i}
  onClick={() => alert(`${item.label} coming soon`)}
  className="w-full flex items-center gap-3 bg-[#1A2E2D] rounded-xl px-4 py-3.5 border border-[#2D5A5820] text-left active:scale-[0.98] transition-transform"
>
              <div className="text-[#E8A838]">{item.icon}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F5F3EF]">{item.label}</p>
                <p className="text-[11px] text-[#7BA3A1]">{item.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#7BA3A1]" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-5 py-3.5 bg-[#EF444415] border border-[#EF444430] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#EF4444] active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
