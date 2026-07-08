# Agentic Workflow Evidence: PitWise Autonomous Repair-Prep Agent

## What the workflow does

PitWise includes an autonomous background agent that turns a saved vehicle scan into a repair-prep action plan.

When a user taps **Run Agent**, the frontend starts a backend task and polls it while the user can keep using the app. The agent:

1. Loads the user's saved vehicle profile.
2. Reads the user's recent scan history.
3. Selects the latest scan or the scan chosen by the user.
4. Reviews the stored diagnosis and mechanic-prep guidance.
5. Returns progress, activity logs, the backend calls it made, and prioritized next actions.

Example output includes:

- Confirm the drive decision.
- Request proof before approving parts.
- Ask the shop one pointed diagnostic question.
- Use the repair approval gate before spending money.

## Who uses it

The workflow is for everyday drivers who have a check-engine light or OBD2 code and need to prepare for a mechanic conversation. The goal is not to replace a mechanic; it is to help the driver organize evidence, safety guidance, and questions before approving repairs.

## Why it is agentic

The workflow is not a single static response. It runs as a background task with its own lifecycle:

- `queued`
- `running`
- `completed`
- `failed`

The task gathers context from multiple backend sources, records its intermediate activity, and produces a structured result the frontend can poll and render. The frontend also includes a local demo fallback so the workflow can still be demonstrated when the backend is not reachable.

## Main implementation files

- Backend task route: `backend/app/routes/agent.py`
- Background runner: `backend/app/services/agent_runner.py`
- Shared response schemas: `backend/app/schemas.py`
- Frontend API client: `frontend/src/services/api.ts`
- Demo fallback workflow: `frontend/src/services/demoApi.ts`
- Home screen UI: `frontend/src/screens/HomeScreen.tsx`
- First-screen preview: `frontend/src/screens/LoginScreen.tsx`

## One thing that broke during development

The feature initially appeared to be deployed, but it did not show up on the public homepage. The source branch had been updated, but GitHub Pages was serving an older `gh-pages` Expo export. I fixed this by rebuilding the Expo web bundle, updating the `gh-pages` branch directly, and correcting the generated script path from an absolute `/_expo/...` path to a relative `./_expo/...` path so it works under the `/PitWise/` GitHub Pages subpath.

## How to verify

Backend tests:

```powershell
cd backend
python -m pytest
```

Frontend typecheck:

```powershell
cd frontend
npm run typecheck
```

Web export:

```powershell
cd frontend
npm run build:web
```

The deployed web app is available at:

```text
https://abdullahk1973.github.io/PitWise/
```
