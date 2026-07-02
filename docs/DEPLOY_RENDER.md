# Deploy PitWise Backend on Render

This is the fastest private-beta path for the current repo.

## Before Deploying

Replace placeholders in `render.yaml`:

- `BACKEND_CORS_ORIGINS`: your public website or app landing page domain.
- `BACKEND_TRUSTED_HOSTS`: the Render service hostname or your custom API domain.

If you use a custom API domain, point it at the Render web service and use that same host in:

- `frontend/eas.json`
- `frontend/.env`
- Store reviewer notes if relevant.

## Render Steps

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the repo.
3. Confirm it creates:
   - `pitwise-api` web service.
   - `pitwise-db` PostgreSQL database.
4. Deploy.
5. Verify:

```powershell
Invoke-RestMethod https://YOUR_API_HOST/health
Invoke-RestMethod https://YOUR_API_HOST/health/db
```

The container runs migrations and OBD reference seeding on startup when:

```text
RUN_MIGRATIONS_ON_STARTUP=true
SEED_REFERENCE_DATA_ON_STARTUP=true
```

These are enabled in `render.yaml` for private beta convenience. For a larger production setup, move migrations/seeding into a separate release job.

## Mobile Build Update

After the API is live, replace `https://api.pitwise.example` in `frontend/eas.json` with the real API URL and rebuild preview apps.
