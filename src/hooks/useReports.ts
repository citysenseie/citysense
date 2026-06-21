import { useState, useCallback } from "react";
import {
  db,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from "@/lib/firebase";
import { onSnapshot } from "firebase/firestore";
import type { QuerySnapshot, DocumentData } from "firebase/firestore";
import type { SafetyReport } from "@/types";

export function useReports() {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(() => {
    setLoading(true);

    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const data: SafetyReport[] = snap.docs.map((d) => {
          const r = d.data();

          return {
            id: d.id,
            type: r.type,
            category: r.category,
            description: r.description,
            severity: r.severity || "medium",
            latitude: r.latitude,
            longitude: r.longitude,
            address: r.address,
            timestamp: r.timestamp?.toDate() || new Date(),
            userId: r.userId,
            photoUrl: r.photoUrl || "",
            upvotes: r.upvotes || 0,
            downvotes: r.downvotes || 0,
            votedBy: r.votedBy || [],
          };
        });

        const activeReports = data.filter((report) => {
  const reportTime = report.timestamp.getTime();

  let expiryHours = 2;

  if (report.category === "sos") expiryHours = 1;
  else if (report.category === "police_presence") expiryHours = 2;
  else if (report.type === "safe") expiryHours = 12;
  else if (report.severity === "high") expiryHours = 6;
  else if (report.severity === "medium") expiryHours = 4;

  return (
    Date.now() - reportTime <
    expiryHours * 60 * 60 * 1000
  );
});

setReports(activeReports);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const submitReport = useCallback(
  async (report: Omit<SafetyReport, "id" | "timestamp">) => {
    try {
      await addDoc(collection(db, "reports"), {
  ...report,
  upvotes: 0,
  downvotes: 0,
  timestamp: serverTimestamp(),
});

      return true;
    } catch (error) {
      console.error("Firestore submit failed:", error);
      alert("Report failed to save. Check console.");
      return false;
    }
  },
  []
);
  return { reports, loading, fetchReports, submitReport };
}