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
          };
        });

        setReports(data);
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
          timestamp: serverTimestamp(),
        });

        fetchReports();
        return true;
      } catch {
        const newReport: SafetyReport = {
          ...report,
          id: Date.now().toString(),
          timestamp: new Date(),
        };

        setReports((prev) => [newReport, ...prev]);
        return true;
      }
    },
    [fetchReports]
  );

  return { reports, loading, fetchReports, submitReport };
}