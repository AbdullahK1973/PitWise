#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS_ON_STARTUP:-false}" = "true" ]; then
  alembic upgrade head
fi

if [ "${SEED_REFERENCE_DATA_ON_STARTUP:-false}" = "true" ]; then
  python -m app.seed
fi

exec gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind "0.0.0.0:${PORT:-8000}"
