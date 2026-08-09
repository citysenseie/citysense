import { useEffect, useRef, useState } from "react";
import {
  auth,
  db,
  collection,
  onSnapshot,
  doc,
  updateDoc,
} from "@/lib/firebase";

interface LiveLocationNotificationListenerProps {
  onOpenLiveLocation: (sessionId: string) => void;
}

interface LiveNotification {
  id: string;
  senderName?: string;
  title?: string;
  message?: string;
  sessionId?: string;
  read?: boolean;
}

export default function LiveLocationNotificationListener({
  onOpenLiveLocation,
}: LiveLocationNotificationListenerProps) {
  const [notification, setNotification] =
    useState<LiveNotification | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const notificationsRef = collection(
      db,
      "users",
      user.uid,
      "notifications"
    );

    const unsubscribe = onSnapshot(
      notificationsRef,
      (snapshot) => {
       const notifications = snapshot.docs
  .map((item) => {
    const data = item.data();

    return {
      id: item.id,
      type: data.type,
      senderName: data.senderName,
      title: data.title,
      message: data.message,
      sessionId: data.sessionId,
      read: data.read,
    };
  })
          .filter(
            (item) =>
              item.type === "live_location" &&
              item.read === false &&
              typeof item.sessionId === "string"
          ) as LiveNotification[];

        if (!initializedRef.current) {
          initializedRef.current = true;
          return;
        }

        const newest = notifications[notifications.length - 1];

        if (newest) {
          setNotification(newest);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(
              newest.title || "Live location shared",
              {
                body:
                  newest.message ||
                  "Someone is sharing their live location with you.",
              }
            );
          }
        }
      },
      (error) => {
        console.error(
          "Unable to listen for CitySense notifications:",
          error
        );
      }
    );

    return unsubscribe;
  }, []);

  const handleOpen = async () => {
    if (!notification?.sessionId) {
      return;
    }

    try {
      const user = auth.currentUser;

      if (user) {
        const notificationRef = doc(
          db,
          "users",
          user.uid,
          "notifications",
          notification.id
        );

        await updateDoc(notificationRef, {
          read: true,
        });
      }
    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }

    const sessionId = notification.sessionId;

    setNotification(null);
    onOpenLiveLocation(sessionId);
  };

  if (!notification) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9999]">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full rounded-3xl border border-[#2DD4BF]/30 bg-[#0B201D] p-5 text-left shadow-2xl"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/15 text-2xl">
            📍
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold uppercase tracking-wider text-[#5EEAD4]">
              Live Location
            </p>

            <p className="mt-1 text-base font-bold text-white">
              {notification.title ||
                `${notification.senderName || "A CitySense contact"} is sharing their location`}
            </p>

            <p className="mt-1 text-sm text-[#9DB3B0]">
              Tap to view their live position.
            </p>
          </div>

          <span className="text-[#5EEAD4]">›</span>
        </div>
      </button>
    </div>
  );
}