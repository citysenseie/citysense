import { useEffect, useState } from "react";
import { useReports } from "@/hooks/useReports";
import {
  db,
  doc,
  getDoc,
} from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

import {
  User,
  LogOut,
  Shield,
  Bell,
  Moon,
  HelpCircle,
  ChevronRight,
  Copy,
  Share2,
  Fingerprint,
} from "lucide-react";
interface ProfileScreenProps {
  onLogin: () => void;
}

export default function ProfileScreen({ onLogin }: ProfileScreenProps) {
  const { user, logout } = useAuth();
  const { reports, fetchReports } = useReports();
const [connectionCode, setConnectionCode] =
  useState<string | null>(null);

const [, setShowIdentity] = useState(false);

const [showSafetyPreferences, setShowSafetyPreferences] = useState(false);

const [alertRadius, setAlertRadius] = useState(5);

const [alertSensitivity, setAlertSensitivity] = useState<
  "low" | "balanced" | "high"
>("balanced");

const [sosAlertsEnabled, setSosAlertsEnabled] = useState(true);
const [unsafeAlertsEnabled, setUnsafeAlertsEnabled] = useState(true);
const [policeAlertsEnabled, setPoliceAlertsEnabled] = useState(true);
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);
  useEffect(() => {
  const loadConnectionCode = async () => {
    if (!user) {
      setConnectionCode(null);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setConnectionCode(null);
        return;
      }

      const data = userSnapshot.data();

      setConnectionCode(
        typeof data.connectionCode === "string"
          ? data.connectionCode
          : null
      );
    } catch (error) {
      console.error(
        "Unable to load CitySense connection code:",
        error
      );

      setConnectionCode(null);
    }
  };

  void loadConnectionCode();
}, [user]);
const handleCopyConnectionCode = async () => {
  if (!connectionCode) return;

  try {
    await navigator.clipboard.writeText(connectionCode);
    alert("CitySense code copied.");
  } catch (error) {
    console.error("Unable to copy CitySense code:", error);
    alert("Could not copy the code.");
  }
};

const handleShareConnectionCode = async () => {
  if (!connectionCode) return;

  const shareText = `Connect with me on CitySense using my code: ${connectionCode}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Connect with me on CitySense",
        text: shareText,
      });

      return;
    }

    await navigator.clipboard.writeText(shareText);
    alert("Connection code copied. You can now share it.");
  } catch (error) {
    console.error("Unable to share CitySense code:", error);
  }
};
  const userReports = reports;
  const safeReports = userReports.filter((r) => r.type === "safe").length;
  
const totalUpvotes = userReports.reduce(
  (total, report) => total + (report.upvotes || 0),
  0
);
const totalDownvotes = userReports.reduce(
  (total, report) => total + (report.downvotes || 0),
  0
);

const trustScore = Math.max(
  0,
  Math.min(100, 50 + totalUpvotes * 5 - totalDownvotes * 8)
);
  const trustLevel =
  userReports.length >= 15
    ? "Trusted Reporter"
    : userReports.length >= 5
    ? "Active Reporter"
    : "New Contributor";

const rankBadge =
  userReports.length >= 50
    ? "👑 Community Hero"
    : userReports.length >= 25
    ? "🥇 Trusted Reporter"
    : userReports.length >= 10
    ? "🥈 Guardian"
    : "🥉 Contributor";
const leaderboard = Object.values(
  reports.reduce((acc, report) => {
    const key = report.userId || "anonymous";

    if (!acc[key]) {
      acc[key] = {
        userId: key,
        userName:
  report.userName ||
  (report.userId === user?.uid
    ? user?.displayName || "You"
    : "Anonymous User"),
        reports: 0,
        upvotes: 0,
      };
    }

    acc[key].reports += 1;
    acc[key].upvotes += report.upvotes || 0;

    return acc;
  }, {} as Record<string, { userId: string; userName: string; reports: number; upvotes: number }>)
)
  .sort((a, b) => b.reports - a.reports)
  .slice(0, 3);
  const menuItems = [
    {
      icon: <Shield className="w-5 h-5" />,
      label: "Safety Preferences",
      sub: "Customize alerts",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      sub: "Push & SMS settings",
    },
    {
      icon: <Moon className="w-5 h-5" />,
      label: "Appearance",
      sub: "Dark mode always on",
    },
    {
      icon: <HelpCircle className="w-5 h-5" />,
      label: "Help & Support",
      sub: "FAQ, contact us",
    },
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
     {/* Identity */}
<header className="px-5 pb-7 pt-6">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#607D79]">
        Profile
      </p>

      <h1 className="mt-1 text-[26px] font-bold tracking-[-0.035em] text-[#F5F3EF]">
        Your CitySense
      </h1>
    </div>

    <button
      type="button"
      onClick={() => setShowIdentity((current) => !current)}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-[#8AA39F] transition active:scale-95"
      aria-label="CitySense identity"
    >
      <Fingerprint className="h-[18px] w-[18px]" />
    </button>
  </div>

  <div className="mt-8 flex items-center gap-4">
    <div className="relative shrink-0">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#17302D] ring-1 ring-white/[0.06]">
        <User className="h-7 w-7 text-[#D8AD4B]" />
      </div>

      <span className="absolute bottom-0 right-0 h-[17px] w-[17px] rounded-full border-[4px] border-[#0F1E1E] bg-[#2DD4BF]" />
    </div>

    <div className="min-w-0 flex-1">
      <h2 className="truncate text-[22px] font-bold tracking-[-0.025em] text-[#F5F3EF]">
        {user.displayName || "CitySense User"}
      </h2>

      <p className="mt-1 truncate text-[13px] text-[#718C88]">
        {user.email}
      </p>

      <div className="mt-2 flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-[#D8AD4B]" />

        <span className="text-xs font-semibold text-[#C7A654]">
          {rankBadge.replace(/^[^\s]+\s/, "")}
        </span>
      </div>
    </div>
  </div>

  {/* Reputation */}
  <div className="mt-7 flex items-center border-y border-white/[0.055] py-4">
    <div className="flex-1">
      <p className="text-[19px] font-bold text-[#F5F3EF]">
        {trustScore}
      </p>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#607D79]">
        Trust
      </p>
    </div>

    <div className="h-8 w-px bg-white/[0.06]" />

    <div className="flex-1 pl-5">
      <p className="text-[19px] font-bold text-[#F5F3EF]">
        {userReports.length}
      </p>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#607D79]">
        Reports
      </p>
    </div>

    <div className="h-8 w-px bg-white/[0.06]" />

    <div className="flex-1 pl-5">
      <p className="text-[19px] font-bold text-[#5EEAD4]">
        {safeReports}
      </p>

      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#607D79]">
        Helpful
      </p>
    </div>
  </div>
</header>
        {/* CitySense Connection Code */}
<div className="mx-4 mb-4 rounded-2xl border border-[#E8A838]/20 bg-[#1A2E2D] p-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8A838]">
        Your CitySense Code
      </p>

      <p className="mt-1 text-xs leading-relaxed text-[#7BA3A1]">
        Share this code with people you trust so they can securely
        connect your CitySense account.
      </p>
    </div>

    <Shield className="h-5 w-5 shrink-0 text-[#E8A838]" />
  </div>

  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0F1E1E] px-4 py-3">
    <span className="font-mono text-lg font-bold tracking-[0.12em] text-[#F5F3EF]">
      {connectionCode || "Loading..."}
    </span>

    <button
      type="button"
      onClick={handleCopyConnectionCode}
      disabled={!connectionCode}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-[#E8A838] transition active:scale-95 disabled:opacity-40"
      aria-label="Copy CitySense connection code"
    >
      <Copy className="h-4 w-4" />
    </button>
  </div>

  <button
    type="button"
    onClick={handleShareConnectionCode}
    disabled={!connectionCode}
    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E8A838] px-4 py-3 text-sm font-bold text-[#0F1E1E] transition active:scale-[0.98] disabled:opacity-40"
  >
    <Share2 className="h-4 w-4" />
    Share My Code
  </button>
</div>
<div className="bg-[#1A2A2A] rounded-2xl p-4 mx-4 mb-4 border border-[#2A3A3A]">
  <div className="flex justify-between items-center mb-2">
    <h3 className="text-[#F5E3E1] font-bold">Trust Score</h3>
    <span className="text-[#4ADE80] font-bold">
      {trustScore}/100
    </span>
  </div>

  <div className="w-full bg-[#0F1E1E] rounded-full h-3 overflow-hidden">
    <div
      className="bg-[#4ADE80] h-3 rounded-full transition-all"
      style={{ width: `${trustScore}%` }}
    />
  </div>

  <p className="text-[#7BA3A1] text-xs mt-2">
    {trustLevel}
  </p>
</div>
{/* Leaderboard */}
<div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4 border border-[#2D5A5820]">
  <h3 className="text-sm font-bold text-[#F5F3EF] mb-3">
    🏆 Community Leaders
  </h3>

  <div className="space-y-3">
    {leaderboard.map((leader, index) => (
      <div
        key={leader.userId}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-[#F5F3EF]">
            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}{" "}
            {leader.userName}
          </p>

          <p className="text-[11px] text-[#7BA3A1]">
            {leader.reports} reports • {leader.upvotes} upvotes
          </p>
        </div>

        <span className="text-xs font-bold text-[#E8A838]">
          #{index + 1}
        </span>
      </div>
    ))}
  </div>
</div>
        {/* Achievements */}
        <div className="mt-5 bg-[#1A2E2D] rounded-2xl p-4 border border-[#2D5A5820]">
          <h3 className="text-sm font-bold text-[#F5F3EF] mb-3">
            Achievements
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F5F3EF]">
                  🎯 First Report
                </p>
                <p className="text-[11px] text-[#7BA3A1]">
                  Submit your first safety report
                </p>
              </div>

              <span
                className={`text-xs font-bold ${
                  userReports.length > 0 ? "text-[#4ADE80]" : "text-[#7BA3A1]"
                }`}
              >
                {userReports.length > 0 ? "Unlocked" : "Locked"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F5F3EF]">
                  🛡️ Local Guardian
                </p>
                <p className="text-[11px] text-[#7BA3A1]">
                  Submit 10 community reports
                </p>
              </div>

              <span className="text-xs font-bold text-[#E8A838]">
                {userReports.length >= 10 ? "Completed" : `${userReports.length}/10`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F5F3EF]">
                  🏆 Trusted Reporter
                </p>
                <p className="text-[11px] text-[#7BA3A1]">
                  Reach 25 trusted reports
                </p>
              </div>

              <span className="text-xs font-bold text-[#E8A838]">
                {userReports.length >= 25 ? "Completed" : `${userReports.length}/25`}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-5 space-y-2">
          {menuItems.map((item, i) => (
            <button
              key={i}
             onClick={() => {
  if (item.label === "Safety Preferences") {
    setShowSafetyPreferences((current) => !current);
    return;
  }

  if (item.label === "Help & Support") {
    window.location.href =
      "mailto:citysenseie@proton.me?subject=CitySense Support Request";
    return;
  }

  alert(`${item.label} coming soon`);
}}
              className="w-full flex items-center gap-3 bg-[#1A2E2D] rounded-xl px-4 py-3.5 border border-[#2D5A5820] text-left active:scale-[0.98] transition-transform"
            >
              <div className="text-[#E8A838]">{item.icon}</div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F5F3EF]">
                  {item.label}
                </p>
                <p className="text-[11px] text-[#7BA3A1]">{item.sub}</p>
              </div>

              <ChevronRight className="w-4 h-4 text-[#7BA3A1]" />
            </button>
          ))}
        </div>
{/* Safety Preferences */}
{showSafetyPreferences && (
  <div className="mx-1 mt-4 rounded-2xl border border-[#2D5A5820] bg-[#1A2E2D] p-4">
    <div className="mb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8A838]">
        Safety Preferences
      </p>

      <h3 className="mt-1 text-sm font-bold text-[#F5F3EF]">
        Personalize your safety signals
      </h3>

      <p className="mt-1 text-[11px] text-[#7BA3A1]">
        Choose what CitySense should prioritize around you.
      </p>
    </div>

    {/* Alert radius */}
    <div className="border-t border-white/[0.05] py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#F5F3EF]">
            Alert radius
          </p>

          <p className="mt-1 text-[10px] text-[#7BA3A1]">
            How far around you to monitor
          </p>
        </div>

        <span className="text-xs font-bold text-[#E8A838]">
          {alertRadius} km
        </span>
      </div>

      <input
        type="range"
        min="1"
        max="10"
        step="1"
        value={alertRadius}
        onChange={(e) => setAlertRadius(Number(e.target.value))}
        className="mt-4 w-full accent-[#E8A838]"
      />
    </div>

    {/* Sensitivity */}
    <div className="border-t border-white/[0.05] py-4">
      <p className="text-xs font-semibold text-[#F5F3EF]">
        Alert sensitivity
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["low", "balanced", "high"] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setAlertSensitivity(level)}
            className={`rounded-xl py-2.5 text-[11px] font-semibold capitalize ${
              alertSensitivity === level
                ? "bg-[#E8A838] text-[#0F1E1E]"
                : "bg-[#0F1E1E] text-[#7BA3A1]"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>

    {/* Safety signals */}
    <div className="border-t border-white/[0.05] pt-4">
      <p className="mb-2 text-xs font-semibold text-[#F5F3EF]">
        Safety signals
      </p>

      {[
        {
          label: "Emergency SOS",
          value: sosAlertsEnabled,
          toggle: () => setSosAlertsEnabled((current) => !current),
        },
        {
          label: "Unsafe area reports",
          value: unsafeAlertsEnabled,
          toggle: () => setUnsafeAlertsEnabled((current) => !current),
        },
        {
          label: "Police presence",
          value: policeAlertsEnabled,
          toggle: () => setPoliceAlertsEnabled((current) => !current),
        },
      ].map((setting) => (
        <div
          key={setting.label}
          className="flex items-center justify-between border-t border-white/[0.04] py-3 first:border-t-0"
        >
          <span className="text-xs text-[#A8B8B5]">
            {setting.label}
          </span>

          <button
            type="button"
            onClick={setting.toggle}
            className={`relative h-6 w-11 rounded-full transition ${
              setting.value ? "bg-[#5EEAD4]" : "bg-[#0F1E1E]"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-[#F5F3EF] transition-all ${
                setting.value ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      ))}
    </div>
  </div>
)}
        {/* Logout */}
        <button
          onClick={logout}
          className="w-full mt-5 py-3.5 bg-[#EF444415] border border-[#EF444430] rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-[#EF4444] active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    
  );
}