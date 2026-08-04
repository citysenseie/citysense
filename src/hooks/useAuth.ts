import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, type User } from "firebase/auth";
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "@/lib/firebase";


const createConnectionCode = () => {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "CS-";

  for (let i = 0; i < 6; i += 1) {
    code += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return code;
};
 
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [journeyStatus, setJourneyStatus] = useState("🟢 Safe and On Route");
 
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    setUser(u);

    if (u) {
  try {
    const userRef = doc(db, "users", u.uid);
    const userSnapshot = await getDoc(userRef);

    const existingData = userSnapshot.exists()
      ? userSnapshot.data()
      : null;

    const connectionCode =
      existingData?.connectionCode || createConnectionCode();

    await setDoc(
      userRef,
      {
        uid: u.uid,
        displayName: u.displayName || "",
        email: u.email?.trim().toLowerCase() || "",
        connectionCode,
      },
      { merge: true }
    );
    await setDoc(
  doc(db, "connectionCodes", connectionCode),
  {
    userId: u.uid,
  },
  { merge: true }
);
  } catch (error) {
    console.error(
      "Unable to sync CitySense user profile:",
      error
    );
  }
}
    setLoading(false);
  });

  return unsub;
}, []);
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (e: any) {
      setError(e.message || "Login failed");
      return false;
    }
  }, []);

  const signup = useCallback(
  async (email: string, password: string, name: string) => {
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(cred.user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        displayName: name,
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });

      return true;
    } catch (e: any) {
      setError(e.message || "Signup failed");
      return false;
    }
  },
  []
);
  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return { user, loading, error, login, signup, logout, journeyStatus, setJourneyStatus };
}
