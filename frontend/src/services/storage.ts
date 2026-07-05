import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser, Scan, Vehicle } from "../types";

const VEHICLE_KEY = "pitwise.vehicle";
const CLIENT_ID_KEY = "pitwise.clientId";
const AUTH_USER_KEY = "pitwise.authUser";
const SCANS_KEY = "pitwise.scans";

export async function getLocalVehicle(): Promise<Vehicle | null> {
  const raw = await AsyncStorage.getItem(VEHICLE_KEY);
  return raw ? (JSON.parse(raw) as Vehicle) : null;
}

export async function saveLocalVehicle(vehicle: Vehicle): Promise<void> {
  await AsyncStorage.setItem(VEHICLE_KEY, JSON.stringify(vehicle));
}

export async function getLocalScans(): Promise<Scan[]> {
  const raw = await AsyncStorage.getItem(SCANS_KEY);
  return raw ? (JSON.parse(raw) as Scan[]) : [];
}

export async function saveLocalScans(scans: Scan[]): Promise<void> {
  await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(scans));
}

export async function addLocalScan(scan: Scan): Promise<void> {
  const scans = await getLocalScans();
  await saveLocalScans([scan, ...scans]);
}

export async function clearLocalData(): Promise<void> {
  await AsyncStorage.multiRemove([VEHICLE_KEY, CLIENT_ID_KEY, AUTH_USER_KEY, SCANS_KEY]);
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
