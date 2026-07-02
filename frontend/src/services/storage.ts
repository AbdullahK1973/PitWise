import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, Vehicle } from "../types";

const VEHICLE_KEY = "pitwise.vehicle";
const CLIENT_ID_KEY = "pitwise.clientId";
const AUTH_USER_KEY = "pitwise.authUser";

export async function getLocalVehicle(): Promise<Vehicle | null> {
  const raw = await AsyncStorage.getItem(VEHICLE_KEY);
  return raw ? (JSON.parse(raw) as Vehicle) : null;
}

export async function saveLocalVehicle(vehicle: Vehicle): Promise<void> {
  await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
}

export async function clearLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([VEHICLE_KEY, CLIENT_ID_KEY, AUTH_USER_KEY]);
}

export async function getLocalAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export async function saveAuthSession(clientId: string, user: AuthUser): Promise<void> {
  await AsyncStorage.multiSet([
    [CLIENT_ID_KEY, clientId],
    [AUTH_USER_KEY, JSON.stringify(user)]
  ]);
}

export async function setClientId(clientId: string): Promise<void> {
  await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
}

export async function getClientId(): Promise<string> {
  const existing = await AsyncStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const randomPart = Math.random().toString(36).slice(2);
  const timestampPart = Date.now().toString(36);
  const clientId = `pitwise-${timestampPart}-${randomPart}`;
  await AsyncStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
}
