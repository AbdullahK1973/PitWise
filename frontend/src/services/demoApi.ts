import { AgentTask, AuthResponse, AuthUser, Diagnosis, Scan, Urgency, Vehicle, VehicleInput } from "../types";
import { addLocalScan, getLocalAuthUser, getLocalScans, getLocalVehicle, saveLocalVehicle } from "./storage";

type SeededCode = {
  code: string;
  title: string;
  explanation: string;
  urgency: Urgency;
  driveSafety: Diagnosis["drive_safety_guidance"];
  likelyCauses: string[];
  repairPaths: string[];
  costRange: string;
  mechanicQuestions: string[];
  category: string;
};

const SEEDED_CODES: SeededCode[] = [
  {
    code: "P0300",
    title: "Random or Multiple Cylinder Misfire",
    explanation: "Your car is reporting misfires that may be happening across more than one cylinder. That usually means fuel is not burning smoothly, and the cause can range from ignition parts to fuel delivery or air leaks.",
    urgency: "high",
    driveSafety: "caution",
    likelyCauses: ["Worn spark plugs", "Weak ignition coils", "Vacuum leak", "Fuel delivery issue", "Low compression"],
    repairPaths: ["Inspect spark plugs and coils", "Check for vacuum leaks", "Test fuel pressure", "Run compression or leakdown testing if misfire persists"],
    costRange: "$120-$1,200+ depending on root cause",
    mechanicQuestions: ["Which cylinders are misfiring in live data?", "Can you show me the spark plug or coil test result?", "Did you check fuel pressure and vacuum leaks before recommending major repairs?"],
    category: "engine"
  },
  {
    code: "P0301",
    title: "Cylinder 1 Misfire",
    explanation: "Your car is reporting a cylinder 1 misfire. That may mean this cylinder is not burning fuel properly, often because of an ignition, fuel, airflow, or compression issue.",
    urgency: "high",
    driveSafety: "caution",
    likelyCauses: ["Spark plug wear", "Faulty ignition coil", "Fuel injector issue", "Vacuum leak near cylinder 1", "Compression problem"],
    repairPaths: ["Swap coil with another cylinder to see if the misfire follows", "Inspect spark plug condition", "Test injector operation", "Check compression if basic checks pass"],
    costRange: "$100-$900+ depending on parts and testing",
    mechanicQuestions: ["Did the misfire follow the coil or plug when swapped?", "Can I see the old spark plug condition?", "Was compression checked before deeper engine work was recommended?"],
    category: "engine"
  },
  {
    code: "P0302",
    title: "Cylinder 2 Misfire",
    explanation: "Your car is reporting a cylinder 2 misfire. That usually means this cylinder is not burning fuel properly. Common causes include a worn spark plug, faulty ignition coil, injector issue, or airflow/fuel delivery problem.",
    urgency: "high",
    driveSafety: "caution",
    likelyCauses: ["Worn spark plug", "Faulty ignition coil", "Fuel injector issue", "Vacuum leak", "Low compression"],
    repairPaths: ["Inspect or replace spark plug", "Swap/test ignition coil", "Check injector pulse and fuel delivery", "Perform compression testing if needed"],
    costRange: "$100-$900+ depending on diagnosis",
    mechanicQuestions: ["What test points to cylinder 2 specifically?", "Did the coil or plug get swapped to verify the fault?", "Is there any risk of catalytic converter damage if I keep driving?"],
    category: "engine"
  },
  {
    code: "P0420",
    title: "Catalyst System Efficiency Below Threshold",
    explanation: "Your car may be seeing that the catalytic converter is not cleaning exhaust as expected. It can be caused by a failing converter, but oxygen sensors, exhaust leaks, and engine running problems should be checked too.",
    urgency: "moderate",
    driveSafety: "caution",
    likelyCauses: ["Aging catalytic converter", "Oxygen sensor issue", "Exhaust leak", "Misfire or rich/lean running condition", "Aftermarket converter mismatch"],
    repairPaths: ["Check for exhaust leaks", "Review oxygen sensor live data", "Fix misfires or fuel trim problems first", "Replace catalytic converter only after confirming upstream causes"],
    costRange: "$150-$2,500+ depending on sensor vs converter",
    mechanicQuestions: ["Can you show upstream and downstream oxygen sensor data?", "Were exhaust leaks checked?", "Are there other engine codes that should be fixed first?"],
    category: "emissions"
  },
  {
    code: "P0171",
    title: "System Too Lean - Bank 1",
    explanation: "Your engine may be getting too much air or not enough fuel on bank 1. This often points to an air leak, dirty sensor, weak fuel delivery, or exhaust leak affecting sensor readings.",
    urgency: "moderate",
    driveSafety: "caution",
    likelyCauses: ["Vacuum leak", "Dirty or faulty mass airflow sensor", "Weak fuel pump", "Clogged fuel injector", "Exhaust leak before oxygen sensor"],
    repairPaths: ["Smoke test intake for leaks", "Clean or test MAF sensor", "Check fuel trims and fuel pressure", "Inspect PCV hoses and intake boots"],
    costRange: "$90-$800+ depending on leak or fuel issue",
    mechanicQuestions: ["What are the short-term and long-term fuel trims?", "Was a smoke test performed?", "Did you test fuel pressure before recommending parts?"],
    category: "fuel_air"
  },
  {
    code: "P0455",
    title: "Evaporative Emission System Large Leak",
    explanation: "Your car may have a large leak in the fuel vapor system. This is often not an immediate driving danger, but it can trigger emissions issues and fuel smell concerns.",
    urgency: "low",
    driveSafety: "safe",
    likelyCauses: ["Loose or failed gas cap", "Cracked EVAP hose", "Faulty purge valve", "Faulty vent valve", "Damaged charcoal canister"],
    repairPaths: ["Check gas cap seal", "Run EVAP smoke test", "Test purge and vent valves", "Inspect canister and vapor lines"],
    costRange: "$20-$650 depending on cap, valve, or leak location",
    mechanicQuestions: ["Was the gas cap seal checked first?", "Can you show where the smoke test found the leak?", "Which EVAP valve failed testing?"],
    category: "emissions"
  },
  {
    code: "P0442",
    title: "Evaporative Emission System Small Leak",
    explanation: "Your car may have a small vapor leak in the EVAP system. It is commonly related to the gas cap, small hoses, or EVAP valves.",
    urgency: "low",
    driveSafety: "safe",
    likelyCauses: ["Loose gas cap", "Small cracked EVAP hose", "Purge valve leak", "Vent valve issue", "Fuel filler neck seal issue"],
    repairPaths: ["Reseat or replace gas cap", "Smoke test EVAP system", "Test purge and vent valves", "Inspect filler neck and hoses"],
    costRange: "$20-$500 depending on leak source",
    mechanicQuestions: ["Did a smoke test confirm the leak?", "Is the gas cap OEM or aftermarket?", "Which component failed a test rather than just being suspected?"],
    category: "emissions"
  },
  {
    code: "P0128",
    title: "Coolant Thermostat Below Regulating Temperature",
    explanation: "Your engine is taking longer than expected to reach normal operating temperature. A thermostat stuck open is common, but coolant sensor readings and coolant level should also be checked.",
    urgency: "moderate",
    driveSafety: "caution",
    likelyCauses: ["Thermostat stuck open", "Low coolant", "Coolant temperature sensor issue", "Wiring problem", "Cold weather with short trips"],
    repairPaths: ["Verify coolant level", "Compare temperature sensor data to actual temperature", "Replace thermostat if confirmed", "Inspect cooling system for leaks"],
    costRange: "$120-$600 depending on thermostat access",
    mechanicQuestions: ["What temperature did the engine reach during testing?", "Was coolant level checked?", "Is the thermostat confirmed stuck open?"],
    category: "cooling"
  },
  {
    code: "P0113",
    title: "Intake Air Temperature Sensor Circuit High",
    explanation: "Your car is seeing an intake air temperature sensor reading that may be out of range. This can affect fuel calculations and may come from the sensor, connector, or wiring.",
    urgency: "low",
    driveSafety: "safe",
    likelyCauses: ["Disconnected IAT sensor", "Faulty IAT sensor", "Damaged wiring", "Corroded connector", "MAF sensor assembly issue"],
    repairPaths: ["Inspect connector and wiring", "Compare IAT reading to outside temperature when cold", "Replace sensor or MAF assembly if confirmed", "Clear code and retest"],
    costRange: "$40-$350 depending on sensor design",
    mechanicQuestions: ["What temperature is the sensor reporting when the engine is cold?", "Is the sensor separate or part of the MAF?", "Was the connector inspected for corrosion?"],
    category: "sensor"
  },
  {
    code: "P0010",
    title: "Camshaft Position Actuator Circuit - Bank 1",
    explanation: "Your car may have an electrical issue in the camshaft timing actuator circuit. This system helps adjust engine timing, so oil condition, solenoids, and wiring matter.",
    urgency: "moderate",
    driveSafety: "caution",
    likelyCauses: ["Faulty VVT solenoid", "Low or dirty oil", "Wiring or connector issue", "Oil sludge", "ECM command issue"],
    repairPaths: ["Check oil level and condition", "Inspect VVT solenoid connector", "Test solenoid resistance and command", "Replace solenoid if testing confirms"],
    costRange: "$120-$700 depending on access and oil condition",
    mechanicQuestions: ["Was oil level and sludge checked?", "Did the solenoid fail an electrical test?", "Can you show the connector or wiring concern?"],
    category: "engine_timing"
  },
  {
    code: "P0011",
    title: "Camshaft Timing Over-Advanced - Bank 1",
    explanation: "Your engine timing may be more advanced than expected on bank 1. This can be caused by oil flow problems, a sticking VVT solenoid, or timing components.",
    urgency: "high",
    driveSafety: "caution",
    likelyCauses: ["Dirty or low oil", "Sticking VVT solenoid", "Timing chain stretch", "Camshaft actuator issue", "Oil control passage restriction"],
    repairPaths: ["Check oil level and service history", "Test or replace VVT solenoid", "Inspect timing data", "Evaluate timing chain if symptoms are severe"],
    costRange: "$150-$1,800+ depending on solenoid vs timing work",
    mechanicQuestions: ["Is the oil level correct and clean?", "Was the VVT solenoid tested?", "What data supports timing chain work?"],
    category: "engine_timing"
  },
  {
    code: "P0021",
    title: "Camshaft Timing Over-Advanced - Bank 2",
    explanation: "Your engine timing may be more advanced than expected on bank 2. Similar to bank 1 timing issues, oil quality, VVT solenoids, and timing components should be checked carefully.",
    urgency: "high",
    driveSafety: "caution",
    likelyCauses: ["Dirty or low oil", "Bank 2 VVT solenoid issue", "Timing chain wear", "Oil flow restriction", "Cam actuator issue"],
    repairPaths: ["Check oil and service interval", "Compare bank 1 and bank 2 timing data", "Test VVT solenoid", "Inspect timing components if commanded timing is not responding"],
    costRange: "$150-$1,900+ depending on root cause",
    mechanicQuestions: ["How does bank 2 compare to bank 1 in live data?", "Was the solenoid swapped or tested?", "Is timing chain work confirmed by data?"],
    category: "engine_timing"
  },
  {
    code: "P0500",
    title: "Vehicle Speed Sensor",
    explanation: "Your car may not be receiving a reliable vehicle speed signal. This can affect the speedometer, ABS, transmission shifting, and stability systems depending on the vehicle.",
    urgency: "moderate",
    driveSafety: "caution",
    likelyCauses: ["Faulty vehicle speed sensor", "Wheel speed sensor issue", "Damaged wiring", "Transmission output sensor issue", "ABS module signal issue"],
    repairPaths: ["Confirm speed signal in live data", "Inspect sensor wiring", "Check ABS-related codes", "Replace sensor only after identifying which signal is missing"],
    costRange: "$120-$700 depending on sensor and access",
    mechanicQuestions: ["Which speed signal is missing?", "Are there ABS or transmission codes too?", "Was wiring checked before replacing the sensor?"],
    category: "drivetrain"
  },
  {
    code: "P0700",
    title: "Transmission Control System",
    explanation: "Your car is reporting that the transmission control system has detected a problem. P0700 is often a pointer code, so the transmission module usually needs to be scanned for more specific information.",
    urgency: "critical",
    driveSafety: "avoid driving",
    likelyCauses: ["Transmission module stored fault", "Low or contaminated transmission fluid", "Shift solenoid issue", "Wiring problem", "Internal transmission concern"],
    repairPaths: ["Scan the transmission control module for specific codes", "Check fluid level and condition if serviceable", "Inspect wiring and connectors", "Avoid approving major repairs without specific transmission data"],
    costRange: "$150 diagnostic to $3,500+ for major transmission repair",
    mechanicQuestions: ["What are the specific TCM codes behind P0700?", "What does the transmission fluid look like?", "Can you separate electrical, solenoid, and internal failure possibilities?"],
    category: "transmission"
  },
  {
    code: "P0141",
    title: "Oxygen Sensor Heater Circuit - Bank 1 Sensor 2",
    explanation: "Your car may have a problem with the heater circuit for the downstream oxygen sensor. This sensor helps emissions monitoring and usually does not mean the engine itself is failing.",
    urgency: "low",
    driveSafety: "safe",
    likelyCauses: ["Failed downstream oxygen sensor heater", "Blown fuse", "Wiring damage", "Connector corrosion", "Exhaust heat damage"],
    repairPaths: ["Check heater circuit fuse and power", "Inspect downstream oxygen sensor wiring", "Test heater resistance", "Replace sensor if heater circuit failure is confirmed"],
    costRange: "$120-$450 depending on sensor access",
    mechanicQuestions: ["Was heater power and ground checked?", "Is the wiring damaged near the exhaust?", "Is this downstream sensor affecting emissions readiness?"],
    category: "emissions"
  }
];

const CODE_PATTERN = /^[PCBU][0-9A-F]{4}$/;
const SAFETY_CATEGORIES = new Set(["brakes", "cooling", "oil_pressure", "charging", "steering", "transmission"]);
const demoAgentTasks = new Map<string, AgentTask>();

export async function demoLoginWithEmail(email: string, displayName?: string): Promise<AuthResponse> {
  const normalized = email.trim().toLowerCase();
  const user: AuthUser = {
    id: stableNumber(normalized),
    email: normalized,
    display_name: displayName?.trim() || null,
    auth_provider: "email"
  };
  return { client_id: `email:${normalized}`, user };
}

export async function demoGetVehicle(): Promise<Vehicle | null> {
  return getLocalVehicle();
}

export async function demoSaveVehicle(input: VehicleInput): Promise<Vehicle> {
  const [existing, user] = await Promise.all([getLocalVehicle(), getLocalAuthUser()]);
  const vehicle: Vehicle = {
    id: existing?.id ?? 1,
    user_id: user?.id ?? 1,
    ...input
  };
  await saveLocalVehicle(vehicle);
  return vehicle;
}

export async function demoGetScanHistory(): Promise<Scan[]> {
  return getLocalScans();
}

export async function demoSubmitCodeLookup(vehicleId: number | undefined, code: string, symptoms?: string): Promise<Scan> {
  const normalized = code.trim().toUpperCase().replace(/\s/g, "");
  if (!CODE_PATTERN.test(normalized)) throw new Error("Enter a valid OBD2 code like P0302.");

  const codeData = SEEDED_CODES.find((item) => item.code === normalized);
  if (!codeData) throw new Error("That code is not in the MVP seed set yet. Try a common code such as P0302, P0420, or P0171.");

  return createAndStoreScan(codeData, vehicleId, symptoms);
}

export async function demoSubmitIssueDescription(vehicleId: number | undefined, description: string): Promise<Scan> {
  const match = matchDescription(description);
  if (!match) {
    throw new Error("PitWise could not match that description to the current seeded OBD2 set. Try adding symptoms like rough idle, fuel smell, overheating, shifting, or exhaust.");
  }
  const note = `Based on your description, PitWise matched this to ${match.code} as the closest seeded OBD2 pattern. Treat it as a starting point and confirm with a scan when possible.`;
  return createAndStoreScan(match, vehicleId, description, note);
}

export async function demoGetMechanicPrep(scanId: number): Promise<Diagnosis> {
  const scans = await getLocalScans();
  const scan = scans.find((item) => item.id === scanId);
  if (!scan) throw new Error("Scan not found");
  return scan.diagnosis;
}

export async function demoStartAgentTask(goal: string, scanId?: number): Promise<AgentTask> {
  const [vehicle, scans, user] = await Promise.all([getLocalVehicle(), getLocalScans(), getLocalAuthUser()]);
  const selectedScan = scanId ? scans.find((scan) => scan.id === scanId) : scans[0];
  if (scanId && !selectedScan) throw new Error("Scan not found");

  const now = new Date().toISOString();
  const task: AgentTask = {
    id: `demo-agent-${Date.now()}`,
    user_id: user?.id ?? 1,
    goal: goal.trim() || "Prepare my next repair decision",
    scan_id: selectedScan?.id ?? null,
    status: "running",
    progress: 25,
    activities: [
      {
        label: "Starting autonomous agent",
        status: "running",
        detail: "The demo agent is checking local vehicle and scan history."
      }
    ],
    result: null,
    error: null,
    created_at: now,
    updated_at: now,
    completed_at: null
  };
  demoAgentTasks.set(task.id, task);

  setTimeout(() => {
    const current = demoAgentTasks.get(task.id);
    if (!current) return;
    const completedAt = new Date().toISOString();
    demoAgentTasks.set(task.id, {
      ...current,
      status: "completed",
      progress: 100,
      activities: [
        ...current.activities,
        {
          label: "Preparing action plan",
          status: "completed",
          detail: selectedScan ? `Reviewed ${selectedScan.code} and built next actions.` : "Prepared a setup plan because no scan is saved yet."
        }
      ],
      result: selectedScan ? createDemoAgentScanResult(current.goal, vehicle, scans, selectedScan) : createDemoAgentSetupResult(current.goal, vehicle),
      updated_at: completedAt,
      completed_at: completedAt
    });
  }, 900);

  return task;
}

export async function demoGetAgentTask(taskId: string): Promise<AgentTask> {
  const task = demoAgentTasks.get(taskId);
  if (!task) throw new Error("Agent task not found");
  return task;
}

async function createAndStoreScan(codeData: SeededCode, vehicleId: number | undefined, symptoms?: string, symptomsNote?: string): Promise<Scan> {
  const [vehicle, user] = await Promise.all([getLocalVehicle(), getLocalAuthUser()]);
  const diagnosis = createDiagnosis(codeData, symptoms, symptomsNote);
  const scan: Scan = {
    id: Date.now(),
    user_id: user?.id ?? 1,
    vehicle_id: vehicleId ?? vehicle?.id ?? 1,
    code: codeData.code,
    symptoms: symptoms?.trim() || null,
    urgency: diagnosis.urgency,
    summary: diagnosis.plain_english_explanation,
    created_at: new Date().toISOString(),
    diagnosis
  };
  await addLocalScan(scan);
  return scan;
}

function createDiagnosis(codeData: SeededCode, symptoms?: string, symptomsNote?: string): Diagnosis {
  return {
    code: codeData.code,
    title: codeData.title,
    plain_english_explanation: codeData.explanation,
    urgency: conservativeUrgency(codeData),
    drive_safety_guidance: conservativeSafety(codeData),
    likely_causes: codeData.likelyCauses,
    common_repair_paths: codeData.repairPaths,
    estimated_repair_cost_range: codeData.costRange,
    mechanic_questions_to_ask: codeData.mechanicQuestions,
    proof_to_request: proofToRequest(codeData.category),
    upsell_watchouts: upsellWatchouts(codeData.category),
    before_approving_repairs: beforeApproving(codeData.category),
    confidence_note: "This is a browser-local demo guide based on seeded code patterns, not proof of a failed part.",
    disclaimer: "PitWise provides guidance and preparation, not a confirmed diagnosis or a replacement for a qualified mechanic.",
    symptoms_note: symptoms?.trim()
      ? symptomsNote ?? "You also mentioned symptoms. Share those exact details with the mechanic because they can help separate a common simple fix from a deeper issue."
      : null
  };
}

function createDemoAgentScanResult(goal: string, vehicle: Vehicle | null, scans: Scan[], scan: Scan): AgentTask["result"] {
  const diagnosis = scan.diagnosis;
  return {
    summary: `Autonomous agent completed '${goal}' for ${vehicleLabel(vehicle)}. The latest priority is ${scan.code}: ${diagnosis.title}.`,
    backend_calls: ["GET /vehicles/main", "GET /scans", `GET /mechanic-prep/${scan.id}`],
    next_actions: [
      {
        title: "Confirm the drive decision",
        detail: diagnosis.confidence_note,
        priority: diagnosis.urgency
      },
      {
        title: "Request proof before parts",
        detail: diagnosis.proof_to_request[0] ?? "Ask for test results that confirm the suspected cause.",
        priority: diagnosis.urgency
      },
      {
        title: "Use the approval gate",
        detail: diagnosis.before_approving_repairs[0] ?? "Ask for a written estimate before approving repairs.",
        priority: scans.length > 1 ? "moderate" : "low"
      }
    ]
  };
}

function createDemoAgentSetupResult(goal: string, vehicle: Vehicle | null): AgentTask["result"] {
  return {
    summary: `Autonomous agent completed '${goal}' for ${vehicleLabel(vehicle)}. No scan is saved yet, so the next useful task is capturing symptoms or an OBD2 code.`,
    backend_calls: ["GET /vehicles/main", "GET /scans"],
    next_actions: [
      {
        title: "Capture the current issue",
        detail: "Enter an OBD2 code or describe what the vehicle is doing.",
        priority: "moderate"
      },
      {
        title: "Verify vehicle details",
        detail: "Confirm year, make, model, mileage, and engine before relying on repair guidance.",
        priority: "low"
      }
    ]
  };
}

function vehicleLabel(vehicle: Vehicle | null): string {
  return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "the saved account";
}

function matchDescription(description: string): SeededCode | null {
  const tokens = tokenize(description);
  if (!tokens.size) return null;

  const scored = SEEDED_CODES.map((codeData) => ({ codeData, score: scoreCode(codeData, tokens) }))
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score || a.codeData.code.localeCompare(b.codeData.code));
  return scored[0]?.codeData ?? null;
}

function scoreCode(codeData: SeededCode, tokens: Set<string>): number {
  const text = `${codeData.code} ${codeData.title} ${codeData.explanation} ${codeData.likelyCauses.join(" ")} ${codeData.repairPaths.join(" ")} ${codeData.category}`;
  const codeTokens = tokenize(text);
  let score = 0;
  tokens.forEach((token) => {
    if (codeTokens.has(token)) score += 1;
    if (codeData.code.toLowerCase().includes(token)) score += 3;
  });
  return score;
}

function tokenize(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((token) => token.length > 1));
}

function conservativeUrgency(codeData: SeededCode): Urgency {
  if (SAFETY_CATEGORIES.has(codeData.category) && ["low", "moderate"].includes(codeData.urgency)) {
    return ["transmission", "oil_pressure", "brakes", "steering"].includes(codeData.category) ? "high" : "moderate";
  }
  return codeData.urgency;
}

function conservativeSafety(codeData: SeededCode): Diagnosis["drive_safety_guidance"] {
  const urgency = conservativeUrgency(codeData);
  if (urgency === "critical") return "avoid driving";
  if (SAFETY_CATEGORIES.has(codeData.category) && codeData.driveSafety === "safe") return "caution";
  return codeData.driveSafety;
}

function proofToRequest(category: string): string[] {
  const items = [
    "A scan report showing the code and any related codes",
    "Live data or test results that support the recommendation",
    "Photos of damaged, leaking, or worn parts when visible"
  ];
  if (["engine", "engine_timing", "fuel_air"].includes(category)) items.push("Before-and-after data after the repair or test drive");
  if (category === "transmission") items.push("Transmission module codes, not only the generic P0700 code");
  return items;
}

function upsellWatchouts(category: string): string[] {
  const items = [
    "A costly part is recommended without a test result or visual proof",
    "The shop wants to replace several unrelated parts at once without explaining the order of checks",
    "You are told the code alone proves the part is bad"
  ];
  if (category === "emissions") items.push("A catalytic converter is recommended before misfires, leaks, or sensor data are checked");
  return items;
}

function beforeApproving(category: string): string[] {
  const items = [
    "Confirm the exact code and whether there are related codes",
    "Ask what test confirmed the suspected cause",
    "Ask whether the repair is urgent or can be monitored briefly",
    "Request the old part back when practical"
  ];
  if (SAFETY_CATEGORIES.has(category)) items.unshift("Ask whether the vehicle is safe to drive home or should be towed");
  return items;
}

function stableNumber(value: string): number {
  return Math.abs([...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 7));
}
