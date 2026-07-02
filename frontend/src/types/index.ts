export type AppScreen = "loading" | "login" | "onboarding" | "home" | "code" | "history" | "detail" | "prep" | "settings" | "bluetooth";

export type AuthUser = {
  id: number;
  email?: string | null;
  display_name?: string | null;
  auth_provider: string;
  avatar_url?: string | null;
};

export type AuthResponse = {
  client_id: string;
  user: AuthUser;
};

export type Urgency = "low" | "moderate" | "high" | "critical";
export type DriveSafety = "safe" | "caution" | "avoid driving";

export type Vehicle = {
  id: number;
  user_id: number;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  mileage?: number | null;
};

export type VehicleInput = Omit<Vehicle, "id" | "user_id">;

export type Diagnosis = {
  code: string;
  title: string;
  plain_english_explanation: string;
  urgency: Urgency;
  drive_safety_guidance: DriveSafety;
  likely_causes: string[];
  common_repair_paths: string[];
  estimated_repair_cost_range: string;
  mechanic_questions_to_ask: string[];
  proof_to_request: string[];
  upsell_watchouts: string[];
  before_approving_repairs: string[];
  confidence_note: string;
  disclaimer: string;
  symptoms_note?: string | null;
};

export type Scan = {
  id: number;
  user_id: number;
  vehicle_id: number;
  code: string;
  symptoms?: string | null;
  urgency: Urgency;
  summary: string;
  created_at: string;
  diagnosis: Diagnosis;
};
