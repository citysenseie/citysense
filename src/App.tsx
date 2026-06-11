import NightModeScreen from "@/screens/NightModeScreen";
import LiveLocationScreen from "@/screens/LiveLocationScreen";
import ChildSafetyScreen from "@/screens/ChildSafetyScreen";
import WomensSafetyScreen from "@/screens/WomensSafetyScreen";
import RoadHazardScreen from "@/screens/RoadHazardScreen";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import BottomNav, { type Tab } from "@/components/BottomNav";
import LoginScreen from "@/screens/LoginScreen";
import SignupScreen from "@/screens/SignupScreen";
import MapScreen from "@/screens/MapScreen";
import NearbyScreen from "@/screens/NearbyScreen";
import ReportScreen from "@/screens/ReportScreen";
import SOSScreen from "@/screens/SOSScreen";
import EmergencyNetworkScreen from "@/screens/EmergencyNetworkScreen";
import ParkProtectScreen from "@/screens/ParkProtectScreen";
import SafeHavenScreen from "@/screens/SafeHavenScreen";
import WalkMeHomeScreen from "@/screens/WalkMeHomeScreen";
import DriverModeScreen from "@/screens/DriverModeScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import "./App.css";
import CrowdSenseScreen from "./screens/CrowdSenseScreen";
import SafeSpacesScreen from "@/screens/SafeSpacesScreen";

type Screen =
  | "login"
  | "signup"
  | "main"
  | "livelocation"
  | "safehaven"
  | "drivermode"
  | "walkmehome"
  | "emergencynetwork"
  | "parkprotect"
  | "roadhazard"
  | "womenssafety"
  | "childsafety"
  | "nightmode"
  | "crowdsense"
  | "safespaces";

export default function App() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("login");
  const [activeTab, setActiveTab] = useState<Tab>("map");

  useEffect(() => {
    if (!loading && user) {
      setScreen("main");
    } else if (!loading && !user) {
      setScreen("login");
    }
  }, [user, loading]);

  const renderScreen = () => {
    switch (screen) {
      case "login":
        return <LoginScreen onSwitch={() => setScreen("signup")} />;

      case "signup":
        return <SignupScreen onSwitch={() => setScreen("login")} />;

      case "main":
        return renderMain();

      case "livelocation":
        return <LiveLocationScreen onBack={() => setScreen("main")} />;

      case "safehaven":
        return <SafeHavenScreen onBack={() => setScreen("main")} />;

      case "drivermode":
        return <DriverModeScreen onBack={() => setScreen("main")} />;

      case "walkmehome":
        return <WalkMeHomeScreen onBack={() => setScreen("main")} />;

      case "emergencynetwork":
        return <EmergencyNetworkScreen onBack={() => setScreen("main")} />;

      case "parkprotect":
        return <ParkProtectScreen onBack={() => setScreen("main")} />;

      case "roadhazard":
        return <RoadHazardScreen onBack={() => setScreen("main")} />;
      case "womenssafety":
        return (
         <WomensSafetyScreen
  onBack={() => setScreen("main")}
  onWalkMeHome={() => setScreen("walkmehome")}
  onSafeSpaces={() => setScreen("safespaces")}
/>
        );
      case "safespaces":
        return <SafeSpacesScreen onBack={() => setScreen("main")} />;
      case "childsafety":
        return <ChildSafetyScreen onBack={() => setScreen("main")} />;
      case "nightmode":
        return <NightModeScreen onBack={() => setScreen("main")} />;
      case "crowdsense":
        return <CrowdSenseScreen onBack={() => setScreen("main")} />;
  
      default:
        return <LoginScreen onSwitch={() => setScreen("signup")} />;
    }
  };

  const renderMain = () => {
    switch (activeTab) {
      case "map":
        return <MapScreen />;

      case "nearby":
        return (
          <NearbyScreen
            onSafeHaven={() => setScreen("safehaven")}
            onDriverMode={() => setScreen("drivermode")}
            onWalkMeHome={() => setScreen("walkmehome")}
            onEmergencyNetwork={() => setScreen("emergencynetwork")}
            onParkProtect={() => setScreen("parkprotect")}
            onRoadHazard={() => setScreen("roadhazard")}
            onWomensSafety={() => setScreen("womenssafety")}
            onChildSafety={() => setScreen("childsafety")}
            onLiveLocation={() => setScreen("livelocation")}
            onNightMode={() => setScreen("nightmode")}
            onCrowdSense={() => setScreen("crowdsense")}
          />
        );

      case "report":
        return <ReportScreen />;

      case "sos":
        return <SOSScreen />;

      case "profile":
        return <ProfileScreen onLogin={() => setScreen("login")} />;

      default:
        return <MapScreen />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0F1E1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#E8A838] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#7BA3A1]">Loading CitySense...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-neutral-900 flex justify-center items-center p-0 md:p-4">
      <div className="w-full max-w-[430px] h-[100dvh] md:h-[850px] bg-[#0F1E1E] rounded-none overflow-hidden shadow-2xl relative isolate flex flex-col">
        <main className="flex-1 overflow-hidden">{renderScreen()}</main>

        {screen === "main" && (
          <BottomNav active={activeTab} onChange={setActiveTab} />
        )}
      </div>
    </div>
  );
}