import { useEffect, useState } from "react";
import { auth, db, collection, addDoc, getDocs } from "@/lib/firebase";

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
}

export function useTrustedContacts() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = async () => {
    const user = auth.currentUser;

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(
        collection(db, "users", user.uid, "trustedContacts")
      );

      const data: TrustedContact[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<TrustedContact, "id">),
      }));

      setContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
    }

    setLoading(false);
  };

  const addContact = async (name: string, phone: string) => {
    const user = auth.currentUser;

    if (!user) return;

    await addDoc(
      collection(db, "users", user.uid, "trustedContacts"),
      {
        name,
        phone,
      }
    );

    await loadContacts();
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    addContact,
    reload: loadContacts,
  };
}