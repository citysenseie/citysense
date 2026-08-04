
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);

  return null;
}
const locationMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      background: #22C55E;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.25);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

 
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  Radio,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useLocation } from "@/hooks/useLocation";
import { auth, db, collection, getDocs } from "@/lib/firebase";
import {
  citySenseAvatars,
  getCitySenseAvatar,
} from "@/assets/avatars";


interface LiveLocationScreenProps {
  onBack: () => void;
}

interface TrustedContact {
  id?: string;
  name: string;
  phone: string;
  relationship: string;
}

const AVATAR_STORAGE_KEY = "citysense-avatar";

export default function LiveLocationScreen({
  onBack,
}: LiveLocationScreenProps) {
  const { location } = useLocation();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [sharing, setSharing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    () => localStorage.getItem(AVATAR_STORAGE_KEY)
  );

  const selectedAvatar = useMemo(
    () => getCitySenseAvatar(selectedAvatarId),
    [selectedAvatarId]
  );

  const loadContacts = async () => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    try {
      const contactsRef = collection(
        db,
        "users",
        user.uid,
        "trustedContacts"
      );

      const snapshot = await getDocs(contactsRef);

      const loadedContacts: TrustedContact[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustedContact, "id">),
      }));

      setContacts(loadedContacts);
    } catch (error) {
      console.error("Unable to load trusted contacts:", error);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const selectAvatar = (avatarId: string) => {
    setSelectedAvatarId(avatarId);
    localStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    setShowAvatarPicker(false);
  };

  const removeAvatar = () => {
    setSelectedAvatarId(null);
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    setShowAvatarPicker(false);
  };

  const startSharing = () => {
    if (!location) {
      alert("Your location is not available yet.");
      return;
    }

    if (contacts.length === 0) {
      alert("Add at least one trusted contact before sharing.");
      return;
    }

    setSharing(true);
  };

  const lastUpdated = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative h-full overflow-y-auto bg-[#081514] text-[#F5F3EF]">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#081514]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-white">
              Live Location
            </h1>

            <p className="text-xs text-[#78908E]">
              Stay connected with your trusted circle
            </p>
          </div>

          {sharing && (
            <div className="ml-auto flex items-center gap-2 rounded-full border border-[#2DD4BF]/25 bg-[#2DD4BF]/10 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#2DD4BF]" />

              <span className="text-[10px] font-bold tracking-[0.15em] text-[#5EEAD4]">
                LIVE
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 px-4 pb-10 pt-4">
        {/* Main Live Card */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#2DD4BF]/15 bg-gradient-to-br from-[#12302D] via-[#102725] to-[#0B1D1B] p-5 shadow-xl">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#2DD4BF]/[0.07] blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Radio
                    className={`h-4 w-4 ${
                      sharing ? "text-[#5EEAD4]" : "text-[#D8AD4B]"
                    }`}
                  />

                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.16em] ${
                      sharing ? "text-[#5EEAD4]" : "text-[#D8AD4B]"
                    }`}
                  >
                    {sharing ? "Live sharing active" : "Ready to share"}
                  </span>
                </div>

                <h2 className="text-[24px] font-bold leading-[1.15] text-white">
                  Your people.
                  <br />
                  Your location.
                  <br />
                  Your control.
                </h2>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D8AD4B]/10">
                <ShieldCheck className="h-6 w-6 text-[#D8AD4B]" />
              </div>
            </div>

            {/* Map Identity */}
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="flex w-full items-center gap-3 rounded-[20px] border border-white/[0.07] bg-black/20 p-3 text-left"
            >
              <div className="relative shrink-0">
                {selectedAvatar ? (
                  <div
                    className={`h-[68px] w-[68px] overflow-hidden rounded-full border-[2.5px] ${
                      sharing
                        ? "border-[#2DD4BF] shadow-[0_0_22px_rgba(45,212,191,0.25)]"
                        : "border-[#D8AD4B]"
                    }`}
                  >
                    <img
                      src={selectedAvatar.image}
                      alt="Your CitySense avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-[#385451] bg-[#0B1918]">
                    <UserRound className="h-7 w-7 text-[#78908E]" />
                  </div>
                )}

                <span
                  className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-[#102725] ${
                    sharing ? "bg-[#22C55E]" : "bg-[#D8AD4B]"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-white">
                  Your Map Identity
                </p>

                <p className="mt-1 text-xs leading-relaxed text-[#839A97]">
                  {selectedAvatar
                    ? "CitySense avatar selected"
                    : "Choose an avatar for your live map"}
                </p>

                <p className="mt-2 text-xs font-bold text-[#D8AD4B]">
                  {selectedAvatar ? "Change avatar" : "Choose avatar"}
                </p>
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-[#536C69]" />
            </button>
          </div>
        </section>
{/* Live Location Map */}
{location && (
  <section className="relative h-[420px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#0B1716] shadow-2xl">
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={16}
      scrollWheelZoom={true}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker
        position={[location.latitude, location.longitude]}
        icon={locationMarkerIcon}
      />

      <RecenterMap
        latitude={location.latitude}
        longitude={location.longitude}
      />
    </MapContainer>

    {/* Map status */}
    <div className="pointer-events-none absolute left-4 top-4 z-[1000]">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0B1716]/90 px-3 py-2 shadow-lg backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#22C55E]" />

        <span className="text-xs font-bold text-white">
          Live location
        </span>
      </div>
    </div>
  </section>
)}

{/* Map loading state */}
{!location && (
  <section className="flex h-[420px] items-center justify-center rounded-[28px] border border-white/[0.08] bg-[#0B1716]">
    <div className="text-center">
      <MapPin className="mx-auto mb-3 h-7 w-7 text-[#E7BA52]" />

      <p className="text-sm font-semibold text-white">
        Finding your location
      </p>

      <p className="mt-1 text-xs text-[#7F9996]">
        Preparing your live map...
      </p>
    </div>
  </section>
)}
        {/* Current Location */}
        <section className="rounded-[24px] border border-white/[0.06] bg-[#102220] p-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#D8AD4B]/10">
              <MapPin className="h-5 w-5 text-[#E7BA52]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#708986]">
                Current location
              </p>

              <p className="mt-1.5 font-semibold leading-snug text-white">
                {location?.address || "Finding your location..."}
              </p>

              {location ? (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />

                  <span className="text-xs text-[#7F9996]">
                    Location available
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#7F9996]">
                  Waiting for location permission
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Information Cards */}
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-[22px] border border-white/[0.05] bg-[#102220] p-4">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#60A5FA]/10">
              <Users className="h-4 w-4 text-[#60A5FA]" />
            </div>

            <p className="text-2xl font-bold text-white">
              {contacts.length}
            </p>

            <p className="mt-1 text-xs text-[#718A87]">
              Trusted contacts
            </p>
          </section>

          <section className="rounded-[22px] border border-white/[0.05] bg-[#102220] p-4">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[#D8AD4B]/10">
              <Clock3 className="h-4 w-4 text-[#E7BA52]" />
            </div>

            <p className="text-lg font-bold text-white">
              {lastUpdated}
            </p>

            <p className="mt-1 text-xs text-[#718A87]">
              Last updated
            </p>
          </section>
        </div>

        {/* Trusted Circle */}
        <section className="rounded-[24px] border border-white/[0.06] bg-[#102220] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white">
                Your Trusted Circle
              </h3>

              <p className="mt-1 text-xs text-[#718A87]">
                People allowed to receive your live location
              </p>
            </div>

            <div className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#17302D] px-3">
              <span className="text-sm font-bold text-[#5EEAD4]">
                {contacts.length}
              </span>
            </div>
          </div>

          {contacts.length > 0 ? (
            <div className="mt-4 space-y-2">
              {contacts.slice(0, 3).map((contact, index) => (
                <div
                  key={contact.id || `${contact.phone}-${index}`}
                  className="flex items-center gap-3 rounded-2xl bg-[#0B1918] p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#31514E] bg-[#17302D] text-sm font-bold text-white">
                    {contact.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {contact.name}
                    </p>

                    <p className="truncate text-xs text-[#718A87]">
                      {contact.relationship || "Trusted contact"}
                    </p>
                  </div>

                  <ShieldCheck className="h-4 w-4 text-[#5EEAD4]" />
                </div>
              ))}

              {contacts.length > 3 && (
                <p className="pt-1 text-center text-xs text-[#78908E]">
                  +{contacts.length - 3} more trusted contacts
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#31514E] bg-[#0B1918]/70 p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-[#78908E]" />

              <p className="mt-2 text-sm font-semibold text-[#B9C8C6]">
                No trusted contacts yet
              </p>

              <p className="mt-1 text-xs text-[#718A87]">
                Add trusted contacts before starting live sharing.
              </p>
            </div>
          )}
        </section>

        {/* Main Sharing Button */}
        {!sharing ? (
          <button
            onClick={startSharing}
            className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-[#D8AD4B] px-4 py-4 font-bold text-[#081514] shadow-[0_12px_35px_rgba(216,173,75,0.16)] transition active:scale-[0.98]"
          >
            <Radio className="h-5 w-5" />
            Start Live Sharing
          </button>
        ) : (
          <section className="overflow-hidden rounded-[24px] border border-[#2DD4BF]/25 bg-[#0D2926]">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#2DD4BF]/10">
                  <span className="absolute h-4 w-4 animate-ping rounded-full bg-[#2DD4BF]/30" />

                  <Radio className="relative h-5 w-5 text-[#5EEAD4]" />
                </div>

                <div>
                  <h3 className="font-bold text-white">
                    Live sharing is active
                  </h3>

                  <p className="mt-0.5 text-xs text-[#83AAA5]">
                    Sharing with {contacts.length} trusted{" "}
                    {contacts.length === 1 ? "contact" : "contacts"}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSharing(false)}
              className="w-full border-t border-white/[0.06] bg-black/10 py-3.5 text-sm font-bold text-[#F28B82]"
            >
              Stop sharing
            </button>
          </section>
        )}

        <div className="flex items-center justify-center gap-2 px-4 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#59736F]" />

          <p className="text-center text-[11px] text-[#59736F]">
            Your location is only shared when you choose to share it.
          </p>
        </div>
      </div>

      {/* Avatar Picker */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full overflow-hidden rounded-t-[32px] border-t border-white/[0.08] bg-[#0D1D1B] shadow-2xl">
            {/* Picker Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Choose Your Avatar
                </h2>

                <p className="mt-1 max-w-[270px] text-xs leading-relaxed text-[#78908E]">
                  Choose how friends and family recognize you on the
                  CitySense live map.
                </p>
              </div>

              <button
                onClick={() => setShowAvatarPicker(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.05]"
                aria-label="Close avatar picker"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Avatar Grid */}
            <div className="max-h-[62vh] overflow-y-auto px-4 pb-8 pt-5">
              <div className="grid grid-cols-3 gap-x-3 gap-y-5">
                {citySenseAvatars.map((avatar) => {
                  const isSelected = avatar.id === selectedAvatarId;

                  return (
                    <button
                      key={avatar.id}
                      onClick={() => selectAvatar(avatar.id)}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`relative h-[86px] w-[86px] overflow-hidden rounded-full border-[2.5px] transition ${
                          isSelected
                            ? "border-[#D8AD4B] shadow-[0_0_0_4px_rgba(216,173,75,0.10)]"
                            : "border-[#294744]"
                        }`}
                      >
                        <img
                          src={avatar.image}
                          alt="CitySense avatar"
                          className="h-full w-full object-cover"
                        />

                        {isSelected && (
                          <div className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#0D1D1B] bg-[#D8AD4B]">
                            <Check className="h-3.5 w-3.5 text-[#081514]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedAvatar && (
                <button
                  onClick={removeAvatar}
                  className="mt-7 w-full rounded-2xl border border-white/[0.07] bg-white/[0.03] py-3 text-sm font-semibold text-[#91A6A3]"
                >
                  Remove avatar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}