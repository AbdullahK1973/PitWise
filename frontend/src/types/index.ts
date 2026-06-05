export type AppScreen = "loading" | "onboarding" | "home" | "code" | "history" | "detail" | "prep" | "bluetooth";

export type Urgency = "low" | "moderate" | "high" | "critical";
export type DriveSafety = "safe" | "caution" | "avoid driving";

export type Vehicle = {
  id: number;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  mileage?: number | null;
};

export type VehicleInput = Omit<Vehicle, "id">;

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
  vehicle_id: number;
  code: string;
  symptoms?: string | null;
  urgency: Urgency;
  summary: string;
  created_at: string;
  diagnosis: Diagnosis;
};
