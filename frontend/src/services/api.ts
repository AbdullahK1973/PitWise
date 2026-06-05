import { Diagnosis, Scan, Vehicle, VehicleInput } from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : "Request failed");
  }
  return response.json() as Promise<T>;
}

export function getVehicle() {
  return request<Vehicle | null>("/vehicles/main");
}

export function saveVehicle(input: VehicleInput) {
  return request<Vehicle>("/vehicles", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function submitCodeLookup(vehicleId: number | undefined, code: string, symptoms?: string) {
  return request<Scan>("/diagnosis/lookup", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: vehicleId,
      code,
      symptoms: symptoms?.trim() || null
    })
  });
}

export function getScanHistory() {
  return request<Scan[]>("/scans");
}

export function getMechanicPrep(scanId: number) {
  return request<Diagnosis>(`/mechanic-prep/${scanId}`);
}
