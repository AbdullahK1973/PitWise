# PitWise

PitWise is an MVP mobile-first car issue translator and second-opinion assistant. It helps a driver understand an OBD2 code before talking to a mechanic without claiming to replace diagnosis.

The product focuses on plain-English explanations, conservative urgency guidance, likely causes, common repair paths, rough cost placeholders, and mechanic prep questions.

## Agentic Workflow Evidence

For a concise walkthrough of the autonomous background workflow, see `docs/AGENTIC_WORKFLOW_EVIDENCE.md`.

## Project Tree

```text
.
|-- backend/
|   |-- app/
|   |   |-- routes/
|   |   |-- seed/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- config.py
|   |   |-- database.py
|   |   |-- main.py
|   |   |-- models.py
|   |   `-- schemas.py
|   |-- tests/
|   |-- .env.example
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- screens/
|   |   |-- services/
|   |   |-- theme/
|   |   `-- types/
|   |-- .env.example
|   |-- App.tsx
|   |-- app.config.js
|   |-- eas.json
|   |-- babel.config.js
|   |-- package.json
|   `-- tsconfig.json
|-- .env.example
|-- hello.py
`-- so.py
```

## Backend Setup

From the repo root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In local development, the API can create SQLite tables and seed demo data on startup. The startup behavior is controlled by:

- `AUTO_CREATE_TABLES=true`
- `SEED_DATABASE_ON_STARTUP=true`
- `SEED_DEMO_DATA=true`

The API seeds SQLite on startup with:

- 15 common OBD2 codes
- a demo `2017 Toyota Camry`
- demo scan history for `P0302` and `P0420`

Useful endpoints:

- `GET /health`
- `GET /health/db`
- `POST /vehicles`
- `GET /vehicles/main`
- `POST /diagnosis/lookup`
- `GET /codes/{code}`
- `GET /scans`
- `GET /mechanic-prep/{scan_id}`
- `GET /scans/{scan_id}/report`

## Production Backend and Database

Production should use migrations and a managed database instead of startup table creation.

Recommended production environment:

```text
APP_ENV=production
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DBNAME
BACKEND_CORS_ORIGINS=https://your-production-frontend-or-site.example
BACKEND_TRUSTED_HOSTS=your-api-host.example
AUTO_CREATE_TABLES=false
SEED_DATABASE_ON_STARTUP=false
SEED_DEMO_DATA=false
SQL_ECHO=false
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_RECYCLE_SECONDS=1800
AI_MODE=fallback
```

Run database migrations before releasing:

```powershell
cd backend
alembic upgrade head
```

Seed only the OBD reference data after migrations, without demo vehicle/scan records:

```powershell
cd backend
python -m app.seed
```

For an old local SQLite database that existed before Alembic was added, the simplest development reset is to stop the API, move or delete `backend/pitwise.db`, then run the API again or run `alembic upgrade head`.

Container build:

```powershell
cd backend
docker build -t pitwise-api .
docker run --env-file .env -p 8000:8000 pitwise-api
```

The container does not mutate the database by default. For simple single-container hosts that need startup release tasks, set these opt-in flags:

```text
RUN_MIGRATIONS_ON_STARTUP=true
SEED_REFERENCE_DATA_ON_STARTUP=true
```

Production guardrails:

- `APP_ENV=production` rejects wildcard CORS.
- `APP_ENV=production` rejects wildcard trusted hosts.
- `APP_ENV=production` rejects SQLite database URLs.
- `APP_ENV=production` rejects `AUTO_CREATE_TABLES=true`.
- `APP_ENV=production` rejects `SEED_DATABASE_ON_STARTUP=true`.
- `APP_ENV=production` rejects `SEED_DEMO_DATA=true`.
- Database connections use `pool_pre_ping` plus configurable pool size, overflow, and recycle settings for managed Postgres.
- Alembic migrations add foreign keys, indexes, and check constraints for core vehicle, scan, and OBD code data.
- `/health/db` verifies that the API can reach the configured database.

## Frontend Setup

In a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run start
```

For a physical phone, set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your computer's LAN IP, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
```

Then restart Expo.

## Architecture Notes

- `backend/app/services/ai_service.py` is the AI boundary. It supports deterministic fallback mode now and keeps the response contract ready for live LLM mode.
- The backend uses SQLite for local development and PostgreSQL-compatible SQLAlchemy/Alembic migrations for production.
- Anonymous users are isolated by the `X-Pitwise-Client-Id` header; vehicle and scan history endpoints scope all user data to that id.
- The UI uses simple local screen state instead of a navigation dependency to keep the first MVP small.
- Vehicle data is saved both through the backend and local AsyncStorage.
- All diagnosis copy uses cautious wording such as likely causes, common paths, and may indicate.
- Safety-sensitive categories are treated conservatively in the AI service.

## Seeded Codes

`P0300`, `P0301`, `P0302`, `P0420`, `P0171`, `P0455`, `P0442`, `P0128`, `P0113`, `P0010`, `P0011`, `P0021`, `P0500`, `P0700`, `P0141`.

## Validation

Backend tests:

```powershell
cd backend
pytest
```

Frontend typecheck:

```powershell
cd frontend
npm run typecheck
```

## Private Beta Launch

The repo includes draft launch materials and a step-by-step beta checklist:

- `docs/PRIVATE_BETA_READINESS.md`
- `docs/PRIVACY_POLICY_DRAFT.md`
- `docs/TERMS_OF_USE_DRAFT.md`
- `docs/SUPPORT_PAGE_DRAFT.md`
- `docs/STORE_LISTING_DRAFT.md`
- `docs/DEPLOY_RENDER.md`
- `docs/PUBLISH_STATIC_SITE.md`

The frontend has EAS build profiles in `frontend/eas.json` and dynamic app metadata in `frontend/app.config.js`. Replace `pitwise.example`, `api.pitwise.example`, and the placeholder app identifier `com.pitwise.app` with the real production domain and reserved Apple/Google package identifiers before uploading builds. The `site/` folder contains static privacy, terms, and support pages that can be published to any static host.

## Next Features

- Wire live LLM mode to a provider while preserving deterministic fallback behavior.
- Add Bluetooth OBD2 adapter support for stored codes and freeze-frame data.
- Add image upload for visible issues such as leaks, tire wear, or dashboard warnings.
- Add quote checker and repair approval checklist.
- Add bookmarks, shareable reports, and PDF export.
- Add subscriptions only after the core guidance loop proves valuable.
