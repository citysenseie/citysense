import {
  addDoc,
  collection,
  serverTimestamp,
} from "@/lib/firebase";
import { db } from "@/lib/firebase";

export interface LiveLocationNotificationInput {
  recipientUserId: string;
  senderUserId: string;
  senderName: string;
  sessionId: string;
  expiresAt: Date | null;
}

export async function createLiveLocationNotification({
  recipientUserId,
  senderUserId,
  senderName,
  sessionId,
  expiresAt,
}: LiveLocationNotificationInput) {
  const notificationRef = await addDoc(
    collection(
      db,
      "users",
      recipientUserId,
      "notifications"
    ),
    {
      type: "live_location",
      recipientUserId,
      senderUserId,
      senderName,
      sessionId,

      title: `${senderName} is sharing live location with you`,
      message: "Tap to follow their live position on CitySense.",

      read: false,
      createdAt: serverTimestamp(),
      expiresAt,
    }
  );

  return notificationRef.id;
}