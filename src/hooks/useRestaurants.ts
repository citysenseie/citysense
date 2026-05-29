import { useState, useEffect } from "react";
import type { Restaurant } from "@/types";

const DEMO_RESTAURANTS: Restaurant[] = [
  { id: "1", name: "Blue Bottle Coffee", category: "Cafe", rating: 4.6, distance: "120m", address: "1 Rockefeller Plaza", latitude: 40.7128, longitude: -74.006, safetyScore: 88, openNow: true, image: "cafe", priceLevel: 2 },
  { id: "2", name: "Joe's Pizza", category: "Pizza", rating: 4.7, distance: "240m", address: "7 Carmine St", latitude: 40.7135, longitude: -74.0052, safetyScore: 82, openNow: true, image: "pizza", priceLevel: 1 },
  { id: "3", name: "The Dead Rabbit", category: "Bar", rating: 4.5, distance: "350m", address: "30 Water St", latitude: 40.7115, longitude: -74.007, safetyScore: 75, openNow: true, image: "bar", priceLevel: 3 },
  { id: "4", name: "Sweetgreen", category: "Salad", rating: 4.4, distance: "180m", address: "413 Broadway", latitude: 40.714, longitude: -74.0045, safetyScore: 90, openNow: true, image: "salad", priceLevel: 2 },
  { id: "5", name: "Ippudo NY", category: "Ramen", rating: 4.6, distance: "420m", address: "65 4th Ave", latitude: 40.712, longitude: -74.008, safetyScore: 85, openNow: false, image: "ramen", priceLevel: 2 },
  { id: "6", name: "Levain Bakery", category: "Bakery", rating: 4.8, distance: "310m", address: "167 W 74th St", latitude: 40.713, longitude: -74.0065, safetyScore: 92, openNow: true, image: "bakery", priceLevel: 2 },
  { id: "7", name: "Shake Shack", category: "Burger", rating: 4.3, distance: "500m", address: "Madison Square Park", latitude: 40.711, longitude: -74.003, safetyScore: 78, openNow: true, image: "burger", priceLevel: 2 },
  { id: "8", name: "Ten Thousand Coffee", category: "Cafe", rating: 4.5, distance: "150m", address: "14 Wall St", latitude: 40.7145, longitude: -74.005, safetyScore: 87, openNow: true, image: "cafe2", priceLevel: 2 },
];

export function useRestaurants() {
  const [restaurants] = useState<Restaurant[]>(DEMO_RESTAURANTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return { restaurants, loading };
}
