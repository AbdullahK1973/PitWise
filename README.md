# PitWise

PitWise is an MVP mobile-first car issue translator and second-opinion assistant. It helps a driver understand an OBD2 code before talking to a mechanic without claiming to replace diagnosis.

The product focuses on plain-English explanations, conservative urgency guidance, likely causes, common repair paths, rough cost placeholders, and mechanic prep questions.

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
|   |-- app.json
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

The API seeds SQLite on startup with:

- 15 common OBD2 codes
- a demo `2017 Toyota Camry`
- demo scan history for `P0302` and `P0420`

Useful endpoints:

- `GET /health`
- `POST /vehicles`
- `GET /vehicles/main`
- `POST /diagnosis/lookup`
- `GET /codes/{code}`
- `GET /scans`
- `GET /mechanic-prep/{scan_id}`
- `GET /scans/{scan_id}/report`

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
- The backend uses SQLite for MVP speed and SQLAlchemy models so PostgreSQL can be introduced later with minimal route changes.
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

## Next Features

- Wire live LLM mode to a provider while preserving deterministic fallback behavior.
- Add Bluetooth OBD2 adapter support for stored codes and freeze-frame data.
- Add image upload for visible issues such as leaks, tire wear, or dashboard warnings.
- Add quote checker and repair approval checklist.
- Add bookmarks, shareable reports, and PDF export.
- Add subscriptions only after the core guidance loop proves valuable.
