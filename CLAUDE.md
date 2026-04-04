# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the project

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# First-time setup (creates cibinet_dev.db)
python db_init.py
python db_seed.py

# Start the API server (port 8080)
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # dev server on port 3000, proxies /api → localhost:8080
npm run build # type-check + production build
```

Both must run simultaneously for the full stack to work. The Vite proxy in `vite.config.ts` forwards all `/api/*` requests to the backend, so there are no CORS issues in development.

### Reset the database
```bash
cd backend && python db_seed.py   # clear_all() runs first, safe to re-run anytime
```

## Architecture

### Backend — TurboGears 2 + SQLAlchemy + SQLite

**URL routing** is purely object-based (no decorators or route tables). TurboGears maps URL segments to controller class attributes:
- `/api/*` → `ApiController` (in `controllers/__init__.py`)
- `/api/auth/*` → `AuthController`
- `/api/listings/*` → `ListingController`
- `/api/claims/*` → `ClaimController`
- `/api/users/*` → `UserController`
- `/api/notifications/*` → `NotificationController`
- `/api/system/*` → `SystemController`

All endpoints are `GET` by default (TurboGears routes by method name). Every handler is decorated with `@expose('json')` and returns a plain dict.

**Session auth** uses TurboGears' `tg_session` (cookie-based). After login, `tg_session['user_id']` and `tg_session['user_role']` are set and read by all protected endpoints. There is no JWT or token middleware.

**Response shapes** are defined as classes in `backend/schemas.py`. Each class takes a SQLAlchemy model object in `__init__` and exposes `to_dict()`. Controllers import and call these — never construct response dicts inline.

**Database** is a single SQLite file (`backend/cibinet_dev.db`). The shared `session` instance is imported from `model.py` into every controller. Always call `session.flush()` before using a newly-created object's PK (needed before `dispatch_claim_notifications` so `claim.claim_id` is assigned).

### Frontend — React 19 + TypeScript + Tailwind + Vite

**Auth state** lives in `AuthContext.tsx`. Currently `MOCK_AUTH = true`, which bypasses the real backend and stores a fake user in `localStorage`. To connect to the real backend, set `MOCK_AUTH = false` and implement the TODO blocks in that file.

**API calls** all go through `frontend/src/api/client.ts`. The `api` object mirrors the backend's controller/endpoint hierarchy. All requests are GET with query params (matching TurboGears' default routing). The client needs to be updated for the new controllers (`claims`, `users`, `notifications`) added after the initial build.

**Types** for API responses are in `frontend/src/types/index.ts`. Keep these in sync with `backend/schemas.py` — the backend is the source of truth for field names.

**Route protection** is handled by `ProtectedRoute.tsx`, which reads from `useAuth()`.

## Key design decisions

- **Claim atomicity**: `listings/claim` sets `listing.status = 'claimed'` and creates a `Claim` record in one transaction. Use `session.flush()` (not `commit()`) mid-transaction when you need the generated PK before the transaction closes.
- **Address obfuscation**: `ListingMapSchema` intentionally omits `address_text`. The full address is only exposed after a claim is made, via `ClaimSchema`. Do not add address fields to `ListingMapSchema`.
- **Notification dispatch**: `dispatch_claim_notifications()` in `notifications.py` creates in-app `Notification` records for both parties. It does **not** commit — the calling controller owns the transaction. Must be called after `session.flush()` so `claim.claim_id` is available.
- **Seed data**: `db_seed.py` covers all models and all endpoint scenarios. See the printed summary when running it for test credentials and which listing/claim IDs to use for each endpoint.

# Project Guidelines
- Do not add comments to the code unless explicitly requested.
- Maintain existing indentation and style.