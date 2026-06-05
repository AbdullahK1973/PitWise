import AsyncStorage from "@react-native-async-storage/async-storage";
import { Vehicle } from "../types";

const VEHICLE_KEY = "pitwise.vehicle";

export async function getLocalVehicle(): Promise<Vehicle | null> {
  const raw = await AsyncStorage.getItem(VEHICLE_KEY);
  return raw ? (JSON.parse(raw) as Vehicle) : null;
}

export async function saveLocalVehicle(vehicle: Vehicle): Promise<void> {
  await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
}
