export interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: "home" | "school" | "work" | "other";
}