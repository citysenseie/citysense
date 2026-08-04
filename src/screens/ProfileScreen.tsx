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
  Users,
Award,
ChevronDown,
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
 const [showIdentity, setShowIdentity] = useState(false);
 const [showCommunity, setShowCommunity] = useState(false);
const [showAchievements, setShowAchievements] = useState(false);
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
  <div className="h-full overflow-y-auto bg-[#0F1E1E] pb-8">
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
       {/* CitySense Identity — revealed only when requested */}
{showIdentity && (
  <section className="mx-5 mb-7 border-y border-white/[0.06] py-5">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D8AD4B]/10">
          <Fingerprint className="h-[17px] w-[17px] text-[#D8AD4B]" />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#F5F3EF]">
            CitySense Identity
          </p>

          <p className="mt-1 max-w-[250px] text-xs leading-relaxed text-[#6F8985]">
            Your private connection identity for people you trust.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowIdentity(false)}
        className="text-[11px] font-semibold text-[#718C88] transition hover:text-[#F5F3EF]"
      >
        Close
      </button>
    </div>

    <div className="mt-5 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#607D79]">
          Connection code
        </p>

        <p className="mt-1.5 font-mono text-[20px] font-bold tracking-[0.14em] text-[#F5F3EF]">
          {connectionCode || "Loading..."}
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopyConnectionCode}
        disabled={!connectionCode}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-[#D8AD4B] transition active:scale-95 disabled:opacity-30"
        aria-label="Copy CitySense connection code"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>

    <button
      type="button"
      onClick={handleShareConnectionCode}
      disabled={!connectionCode}
      className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#D8AD4B] transition active:scale-[0.98] disabled:opacity-30"
    >
      <Share2 className="h-4 w-4" />
      Share identity
    </button>
  </section>
)}
{/* Your Impact */}
<section className="px-5 pb-7">
  <div className="flex items-end justify-between gap-4">
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#607D79]">
        Your impact
      </p>

      <h3 className="mt-2 max-w-[260px] text-[18px] font-semibold leading-snug text-[#F5F3EF]">
        You&apos;re building trust in your community.
      </h3>
    </div>

    <span className="text-[28px] font-bold tracking-[-0.04em] text-[#5EEAD4]">
      {trustScore}
    </span>
  </div>

  {/* Trust progress */}
  <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
    <div
      className="h-full rounded-full bg-[#5EEAD4] transition-all duration-500"
      style={{ width: `${Math.min(trustScore, 100)}%` }}
    />
  </div>

  <div className="mt-5 flex items-center gap-6">
    <div>
      <span className="text-sm font-semibold text-[#F5F3EF]">
        {userReports.length}
      </span>
      <span className="ml-1.5 text-xs text-[#6F8985]">
        reports
      </span>
    </div>

    <div>
      <span className="text-sm font-semibold text-[#5EEAD4]">
        {safeReports}
      </span>
      <span className="ml-1.5 text-xs text-[#6F8985]">
        helpful
      </span>
    </div>
  </div>

  <p className="mt-4 text-xs leading-relaxed text-[#607D79]">
    Keep contributing useful local information to strengthen your
    CitySense standing.
  </p>
</section>
{/* Discover more */}
<section className="border-t border-white/[0.055]">
  {/* Achievements */}
  <button
    type="button"
    onClick={() => setShowAchievements((current) => !current)}
    className="flex w-full items-center gap-3 px-5 py-4 text-left"
  >
    <Award className="h-[18px] w-[18px] text-[#D8AD4B]" />

    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[#F5F3EF]">
        Achievements
      </p>

      <p className="mt-0.5 text-[11px] text-[#607D79]">
        Your progress in CitySense
      </p>
    </div>

    <ChevronDown
      className={`h-4 w-4 text-[#607D79] transition-transform ${
        showAchievements ? "rotate-180" : ""
      }`}
    />
  </button>

  {showAchievements && (
    <div className="px-5 pb-5 pl-[52px]">
      <div className="space-y-4 border-l border-white/[0.06] pl-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#D9E2E0]">
              First Report
            </p>

            <span className="text-[11px] font-semibold text-[#5EEAD4]">
              {userReports.length > 0 ? "Unlocked" : "Locked"}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#607D79]">
            Submit your first safety report
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#D9E2E0]">
              Local Guardian
            </p>

            <span className="text-[11px] font-semibold text-[#D8AD4B]">
              {userReports.length >= 10
                ? "Completed"
                : `${userReports.length}/10`}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#607D79]">
            Contribute 10 community reports
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[#D9E2E0]">
              Trusted Reporter
            </p>

            <span className="text-[11px] font-semibold text-[#D8AD4B]">
              {userReports.length >= 25
                ? "Completed"
                : `${userReports.length}/25`}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-[#607D79]">
            Reach 25 trusted reports
          </p>
        </div>
      </div>
    </div>
  )}

  <div className="mx-5 h-px bg-white/[0.045]" />

  {/* Community */}
  <button
    type="button"
    onClick={() => setShowCommunity((current) => !current)}
    className="flex w-full items-center gap-3 px-5 py-4 text-left"
  >
    <Users className="h-[18px] w-[18px] text-[#D8AD4B]" />

    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-[#F5F3EF]">
        Community
      </p>

      <p className="mt-0.5 text-[11px] text-[#607D79]">
        See who&apos;s making an impact nearby
      </p>
    </div>

    <ChevronDown
      className={`h-4 w-4 text-[#607D79] transition-transform ${
        showCommunity ? "rotate-180" : ""
      }`}
    />
  </button>

  {showCommunity && (
    <div className="px-5 pb-5 pl-[52px]">
      <div className="space-y-4 border-l border-white/[0.06] pl-4">
        {leaderboard.map((leader, index) => (
          <div
            key={leader.userId}
            className="flex items-center justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#D9E2E0]">
                {leader.userName}
              </p>

              <p className="mt-0.5 text-[11px] text-[#607D79]">
                {leader.reports} reports · {leader.upvotes} upvotes
              </p>
            </div>

            <span className="shrink-0 text-xs font-bold text-[#D8AD4B]">
              #{index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )}
</section>

{/* Account */}
<section className="mt-2 border-t border-white/[0.055] px-5 pt-6">
  <div className="mb-2">
    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#607D79]">
      Account
    </p>
  </div>

  <div>
    {menuItems.map((item, i) => (
      <button
        key={i}
        type="button"
        onClick={() => {
          if (item.label === "Help & Support") {
            window.location.href =
              "mailto:citysenseie@proton.me?subject=CitySense Support Request";
            return;
          }

          alert(`${item.label} coming soon`);
        }}
        className="group flex w-full items-center gap-3 py-4 text-left"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.035] text-[#8DA6A2] transition group-active:scale-95">
          {item.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#E4E9E7]">
            {item.label}
          </p>

          <p className="mt-0.5 text-[11px] text-[#607D79]">
            {item.sub}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 text-[#4F6966]" />
      </button>
    ))}
  </div>
</section>
{/* Sign out */}
<div className="px-5 pb-8 pt-6">
  <button
    type="button"
    onClick={logout}
    className="flex items-center gap-2 text-sm font-medium text-[#A86B6B] transition active:scale-[0.98]"
  >
    <LogOut className="h-4 w-4" />
    Sign out
  </button>

  <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-[#405B58]">
    Minimal outside. Powerful inside.
  </p>
</div>

</div>
);
}