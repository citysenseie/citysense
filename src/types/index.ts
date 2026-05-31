export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface SafetyReport {
  severity?: "low" | "medium" | "high";
  id?: string;
  type: "safe" | "unsafe";
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: Date;
  userId: string;
  photoUrl?: string;
  upvotes?: number;
downvotes?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: string;
  address: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  openNow: boolean;
  image: string;
  priceLevel: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  type: "safe" | "unsafe" | "user" | "restaurant";
  title: string;
  description?: string;
  category?: string;
  timestamp?: Date;
}
