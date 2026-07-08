import { AgentTask, AuthResponse, Diagnosis, Scan, Vehicle, VehicleInput } from "../types";
import {
  demoGetAgentTask,
  demoGetMechanicPrep,
  demoGetScanHistory,
  demoGetVehicle,
  demoLoginWithEmail,
  demoSaveVehicle,
  demoStartAgentTask,
  demoSubmitCodeLookup,
  demoSubmitIssueDescription
} from "./demoApi";
import { getClientId } from "./storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 3000;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const { headers, signal, ...requestOptions } = options ?? {};
  let response: Response;
  try {
    const clientId = await withTimeout(getClientId(), "client id");
    response = await withTimeout(
      fetch(`${API_URL}${path}`, {
        ...requestOptions,
        headers: {
          "Content-Type": "application/json",
          "X-Pitwise-Client-Id": clientId,
          ...(headers ?? {})
        },
        signal: signal ?? controller.signal
      }),
      path
    );
  } catch (error) {
    controller.abort();
    throw new Error(`Could not reach the PitWise API at ${API_URL} within ${REQUEST_TIMEOUT_MS / 1000} seconds. Make sure the backend is running, then try again.`);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : "Request failed");
  }
  return response.json() as Promise<T>;
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} timed out`)), REQUEST_TIMEOUT_MS);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeout));
}

export function getVehicle() {
  return withDemoFallback(() => request<Vehicle | null>("/vehicles/main"), () => demoGetVehicle());
}

export function loginWithEmail(email: string, displayName?: string) {
  return withDemoFallback(
    () =>
      request<AuthResponse>("/auth/email", {
        method: "POST",
        body: JSON.stringify({
          email,
          display_name: displayName?.trim() || null
        })
      }),
    () => demoLoginWithEmail(email, displayName)
  );
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
  return withDemoFallback(
    () =>
      request<Vehicle>("/vehicles", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    () => demoSaveVehicle(input)
  );
}

export function submitCodeLookup(vehicleId: number | undefined, code: string, symptoms?: string) {
  return withDemoFallback(
    () =>
      request<Scan>("/diagnosis/lookup", {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: vehicleId,
          code,
          symptoms: symptoms?.trim() || null
        })
      }),
    () => demoSubmitCodeLookup(vehicleId, code, symptoms)
  );
}

export function submitIssueDescription(vehicleId: number | undefined, description: string) {
  return withDemoFallback(
    () =>
      request<Scan>("/diagnosis/describe", {
        method: "POST",
        body: JSON.stringify({
          vehicle_id: vehicleId,
          description: description.trim()
        })
      }),
    () => demoSubmitIssueDescription(vehicleId, description)
  );
}

export function getScanHistory() {
  return withDemoFallback(() => request<Scan[]>("/scans"), () => demoGetScanHistory());
}

export function getMechanicPrep(scanId: number) {
  return withDemoFallback(() => request<Diagnosis>(`/mechanic-prep/${scanId}`), () => demoGetMechanicPrep(scanId));
}

export function startAgentTask(goal: string, scanId?: number) {
  return withDemoFallback(
    () =>
      request<AgentTask>("/agent/tasks", {
        method: "POST",
        body: JSON.stringify({
          goal,
          scan_id: scanId ?? null
        })
      }),
    () => demoStartAgentTask(goal, scanId)
  );
}

export function getAgentTask(taskId: string) {
  return withDemoFallback(() => request<AgentTask>(`/agent/tasks/${taskId}`), () => demoGetAgentTask(taskId));
}

export function deleteAccountData() {
  return withDemoFallback(
    () =>
      request<{ status: string }>("/me", {
        method: "DELETE"
      }),
    async () => ({ status: "deleted" })
  );
}

async function withDemoFallback<T>(apiCall: () => Promise<T>, demoCall: () => Promise<T>): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (shouldUseDemoFallback(error)) return demoCall();
    throw error;
  }
}

function shouldUseDemoFallback(error: unknown): boolean {
  if (!API_URL.includes("localhost") && !API_URL.includes("127.0.0.1")) return false;
  const message = error instanceof Error ? error.message : "";
  return message.includes("Could not reach the PitWise API");
}
