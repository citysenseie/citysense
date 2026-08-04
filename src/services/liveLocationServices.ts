import {
  auth,
  db,
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "@/lib/firebase";

export type LiveLocationDuration =
  | "15m"
  | "1h"
  | "8h"
  | "untilStopped";

export interface CreateLiveLocationSessionInput {
  latitude: number;
  longitude: number;
  address?: string;
  avatarId?: string | null;
  recipientIds: string[];
  duration: LiveLocationDuration;
}

const getExpiryDate = (
  duration: LiveLocationDuration
): Date | null => {
  const now = new Date();

  switch (duration) {
    case "15m":
      return new Date(now.getTime() + 15 * 60 * 1000);

    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000);

    case "8h":
      return new Date(now.getTime() + 8 * 60 * 60 * 1000);

    case "untilStopped":
      return null;

    default:
      return null;
  }
};

export const createLiveLocationSession = async (
  input: CreateLiveLocationSessionInput
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be signed in to share your live location."
    );
  }

  if (input.recipientIds.length === 0) {
    throw new Error(
      "Choose at least one trusted contact."
    );
  }

  const expiresAt = getExpiryDate(input.duration);

  const sessionsRef = collection(
    db,
    "liveLocationSessions"
  );

  const sessionRef = await addDoc(sessionsRef, {
    ownerId: user.uid,

    status: "active",

    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address || "",

    avatarId: input.avatarId || null,

    recipientIds: input.recipientIds,

    duration: input.duration,

    startedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    expiresAt: expiresAt
      ? Timestamp.fromDate(expiresAt)
      : null,
  });

  return {
    id: sessionRef.id,
    expiresAt,
  };
};

export const updateLiveLocationSession = async (
  sessionId: string,
  latitude: number,
  longitude: number,
  address?: string
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be signed in to update live location."
    );
  }

  const sessionRef = doc(
    db,
    "liveLocationSessions",
    sessionId
  );

  await updateDoc(sessionRef, {
    latitude,
    longitude,
    address: address || "",
    updatedAt: serverTimestamp(),
  });
};

export const stopLiveLocationSession = async (
  sessionId: string
) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be signed in to stop live location."
    );
  }

  const sessionRef = doc(
    db,
    "liveLocationSessions",
    sessionId
  );

  await updateDoc(sessionRef, {
    status: "stopped",
    stoppedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};