import { AuthResponse, Diagnosis, Scan, Vehicle, VehicleInput } from "../types";
import { getClientId } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const clientId = await getClientId();
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Pitwise-Client-Id": clientId,
        ...(options?.headers ?? {})
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Could not reach the PitWise API at ${API_URL}. Make sure the backend is running, then try again.`);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : "Request failed");
  }
  return response.json() as Promise<T>;
}

export function getVehicle() {
  return request<Vehicle | null>("/vehicles/main");
}

export function loginWithEmail(email: string, displayName?: string) {
  return request<AuthResponse>("/auth/email", {
    method: "POST",
    body: JSON.stringify({
      email,
      display_name: displayName?.trim() || null
    })
  });
}

export function loginWithGoogleAccessToken(accessToken: string) {
  return request<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({
      access_token: accessToken
    })
  });
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

export function submitIssueDescription(vehicleId: number | undefined, description: string) {
  return request<Scan>("/diagnosis/describe", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: vehicleId,
      description: description.trim()
    })
  });
}

export function getScanHistory() {
  return request<Scan[]>("/scans");
}

export function getMechanicPrep(scanId: number) {
  return request<Diagnosis>(`/mechanic-prep/${scanId}`);
}

export function deleteAccountData() {
  return request<{ status: string }>("/me", {
    method: "DELETE"
  });
}
