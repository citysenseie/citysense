import {
  auth,
  db,
  doc,
  getDoc,
  updateDoc,
} from "@/lib/firebase";

export interface LinkTrustedContactResult {
  userId: string;
  connectionCode: string;
}

const normalizeConnectionCode = (code: string) =>
  code.trim().toUpperCase();

export async function linkTrustedContactToCitySense(
  trustedContactId: string,
  connectionCode: string
): Promise<LinkTrustedContactResult> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error(
      "You must be signed in to link a CitySense account."
    );
  }

  if (!trustedContactId) {
    throw new Error("Trusted contact could not be identified.");
  }

  const normalizedCode =
    normalizeConnectionCode(connectionCode);

  if (!normalizedCode.startsWith("CS-")) {
    throw new Error(
      "Enter a valid CitySense connection code."
    );
  }

  const codeRef = doc(
    db,
    "connectionCodes",
    normalizedCode
  );

  const codeSnapshot = await getDoc(codeRef);

  if (!codeSnapshot.exists()) {
    throw new Error(
      "No CitySense account was found for this connection code."
    );
  }

  const data = codeSnapshot.data();
  const linkedUserId = data.userId as string | undefined;

  if (!linkedUserId) {
    throw new Error(
      "This CitySense connection code is invalid."
    );
  }

  if (linkedUserId === currentUser.uid) {
    throw new Error(
      "You cannot link your own CitySense account as a trusted contact."
    );
  }

  const trustedContactRef = doc(
    db,
    "users",
    currentUser.uid,
    "trustedContacts",
    trustedContactId
  );

  await updateDoc(trustedContactRef, {
    userId: linkedUserId,
    connectionCode: normalizedCode,
  });

  return {
    userId: linkedUserId,
    connectionCode: normalizedCode,
  };
}