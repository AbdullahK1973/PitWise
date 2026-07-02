# PitWise Private Beta Readiness

This is the launch path from the current MVP to TestFlight and Google Play internal testing.

## 1. Backend Production Deployment

- Choose host: Render, Fly.io, Railway, AWS, GCP, Azure, or similar.
- Provision managed PostgreSQL.
- Set production environment:
  - `APP_ENV=production`
  - `DATABASE_URL=postgresql+psycopg://...`
  - `BACKEND_CORS_ORIGINS=https://your-frontend-or-site.example`
  - `BACKEND_TRUSTED_HOSTS=your-api-host.example`
  - `AUTO_CREATE_TABLES=false`
  - `SEED_DATABASE_ON_STARTUP=false`
  - `SEED_DEMO_DATA=false`
  - `AI_MODE=fallback`
- Run `alembic upgrade head`.
- Run `python -m app.seed` to load OBD reference data.
- Verify:
  - `GET /health`
  - `GET /health/db`
  - Manual code lookup from a production mobile build.
- Add database backups, uptime checks, and error logging before public launch.

## 2. Public Web Pages

Publish these pages and replace all `pitwise.example` placeholders:

- Privacy policy from `docs/PRIVACY_POLICY_DRAFT.md`.
- Terms of use from `docs/TERMS_OF_USE_DRAFT.md`.
- Support page from `docs/SUPPORT_PAGE_DRAFT.md`.
- Static HTML pages in `site/`.

Update:

- `frontend/app.config.js` defaults or EAS environment values.
- `frontend/.env`
- Apple App Store Connect metadata.
- Google Play Console metadata.

## 3. App Identity and Assets

- Confirm Android package and iOS bundle ID. Current placeholder: `com.pitwise.app`.
- Add final app icon, adaptive icon foreground, splash image, and store screenshots.
- Confirm app display name: `PitWise`.
- Confirm version/build numbers before each upload.

## 4. EAS Setup

From `frontend/`:

```powershell
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

Production builds:

```powershell
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```

The package scripts run the same commands through `npx eas-cli`:

```powershell
npm run build:android:preview
npm run build:ios:preview
npm run build:android:production
npm run build:ios:production
```

## 5. Real-Device QA

Test on at least:

- One recent Android phone.
- One older Android phone if possible.
- One iPhone.
- At least two BLE OBD2 adapters.
- One vehicle with no stored codes.
- One vehicle or simulator/adapter response with stored codes.

Core test cases:

- Fresh install onboarding.
- Manual lookup for `P0302`, `P0420`, and `P0171`.
- Invalid code handling.
- Bluetooth permission denial.
- Bluetooth off.
- Unsupported adapter.
- Adapter disconnect during read.
- No stored codes.
- Scan history refresh.
- Mechanic-prep view.
- Delete My Data.
- Offline/backend unavailable behavior.
- Dark mode and light mode.

## 6. Store Console Setup

Google Play:

- Create app.
- Upload internal testing Android App Bundle.
- Complete Data Safety form.
- Add privacy policy URL.
- Add screenshots and feature graphic.
- Complete content rating.
- Add testing instructions.

Apple:

- Create bundle ID and app record.
- Upload TestFlight build.
- Add privacy policy URL and support URL.
- Complete App Privacy nutrition labels.
- Add screenshots.
- Add reviewer notes explaining manual-code testing and Bluetooth adapter requirements.

## 7. Public Launch Gate

Do not move beyond private beta until:

- Backend production deploy has backups and monitoring.
- Privacy policy, terms, and support pages are live.
- Bluetooth has been tested with real adapters.
- Data deletion works against production.
- Store screenshots match the production build.
- No safety-sensitive copy implies a guaranteed diagnosis.
