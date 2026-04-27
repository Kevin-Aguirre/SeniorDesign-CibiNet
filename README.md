# CibiNet

**Stop wasting food. Start sharing it.**

CibiNet is a full-stack web platform that connects surplus food donors with recipients in real time, with geographic discovery, food safety tracking, and coordinated pickup logistics.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Test Accounts](#test-accounts)

---

## Overview

CibiNet is a Senior Design project built to reduce food waste by giving food donors — restaurants, grocery stores, households — a simple way to post surplus food, and giving recipients a way to discover and claim nearby donations before they expire.

The platform supports two user roles:

- **Donor** — Posts food listings with type, quantity, address, and expiry time
- **Recipient** — Browses nearby available food on a map, claims listings, and coordinates pickup

When a claim is made, both parties receive in-app notifications with contact info and a coordination ID for handoff. A background scheduler automatically expires listings past their stated expiry time.

---

## Features

- **Role-based authentication** — Separate Donor and Recipient accounts with session persistence
- **Create food listings** — Donors specify food type, quantity, address, and hours until expiry
- **Geographic discovery** — Recipients search available listings within a configurable radius, viewable on an interactive map or as a filterable list
- **Atomic claiming** — Race-condition-safe claim mechanism prevents double-booking a listing
- **Logistics coordination** — Two fulfillment modes: `self_pickup` and `third_party` delivery; generates a coordination ID (e.g. `COORD-42`) for both parties
- **In-app notifications** — Donors and recipients are notified on successful claims with contact details and logistics info
- **Safety acknowledgment** — Recipients must acknowledge food safety terms before pickup
- **Auto-expiry** — Background scheduler runs every 5 minutes to mark past-expiry listings as expired
- **Audit logging** — All actions (listing created, claimed, expired, cancelled) are recorded with timestamps

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| Tailwind CSS | 3.4 | Utility-first styling |
| Leaflet / react-leaflet | 1.9 / 5.0 | Interactive maps |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.x | Runtime |
| TurboGears 2 | 2.5 | Web framework (WSGI) |
| SQLAlchemy | 2.0 | ORM |
| PostgreSQL | 14+ | Database |
| psycopg | 3.2 | PostgreSQL driver |
| Beaker | 1.13 | Session management |

---

## Project Structure

```
SeniorDesign-CibiNet/
├── backend/
│   ├── main.py                  # WSGI app entry point + background scheduler
│   ├── model.py                 # SQLAlchemy models (User, Listing, Claim, Notification, AuditLog)
│   ├── schemas.py               # Response serialization helpers
│   ├── db_init.py               # Database creation script
│   ├── db_seed.py               # Test data seeding script
│   ├── requirements.txt         # Python dependencies
│   └── controllers/
│       ├── auth.py              # Register, login, logout, session check
│       ├── listings.py          # Create listings, nearby search, claim
│       ├── claims.py            # View, acknowledge, cancel claims
│       ├── notifications.py     # User notification inbox
│       ├── users.py             # User profile, donor listing history
│       └── system.py           # Manual cleanup, audit log
│
└── frontend/
    ├── package.json
    ├── vite.config.ts           # Dev server (port 3000) + proxy to backend
    ├── tailwind.config.js
    └── src/
        ├── App.tsx              # Root component + routing
        ├── api/client.ts        # Typed API request layer
        ├── context/AuthContext.tsx
        ├── components/
        │   ├── Layout.tsx
        │   ├── ProtectedRoute.tsx
        │   ├── ListingCard.tsx
        │   └── ListingMap.tsx
        ├── pages/
        │   ├── Landing.tsx
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Listings.tsx     # Browse/discover (Recipients)
        │   ├── NewListing.tsx   # Post donation (Donors)
        │   ├── MyListings.tsx   # Donor dashboard
        │   ├── MyClaims.tsx     # Recipient dashboard
        │   └── Notifications.tsx
        └── types/index.ts       # Shared TypeScript interfaces
```

---

## Getting Started

Both the backend and frontend must be running simultaneously during development.

### Prerequisites

| Tool | Required version | Used for |
|---|---|---|
| Python | 3.10 or newer | Backend runtime |
| Node.js | 18 or newer (npm 9+) | Frontend build & dev server |
| PostgreSQL | 14 or newer | Database (install natively **or** run via Docker — pick one) |
| Docker | 20.10 or newer | Only required if using the Docker-based PostgreSQL option |

Verify with `python3 --version`, `node --version`, `psql --version`, `docker --version`.

### Backend Setup

#### 1. Provision PostgreSQL

CibiNet connects to PostgreSQL via the `CIBINET_DB_URL` environment variable. If unset, it falls back to:

```
postgresql+psycopg://cibinet:cibinet@localhost:5432/cibinet_dev
```

Pick **one** of the two options below. Both produce a database that matches the default URL — no further configuration needed.

##### Option A — Native PostgreSQL install

Run on a machine where `psql` is installed and you have access to the Postgres server:

```bash
createuser --pwprompt cibinet     # at the prompt, enter password: cibinet
createdb --owner=cibinet cibinet_dev
```

##### Option B — PostgreSQL in Docker

**Before running any `docker` command, the Docker daemon must be running.** If you see `Cannot connect to the Docker daemon at unix:///var/run/docker.sock` (Linux) or `error during connect` (macOS/Windows), the daemon is not up yet.

**Linux** (Docker Engine, systemd-based distros — Ubuntu, Fedora, Debian, Arch, etc.):

```bash
sudo systemctl start docker          # start the daemon now
sudo systemctl enable docker         # optional: auto-start on boot
```

If `docker` commands print a permission error, prefix them with `sudo`. To skip `sudo` permanently, run `sudo usermod -aG docker $USER` once and log out + back in.

**macOS** (Docker Desktop or OrbStack): launch the app from `/Applications` (or run `open -a Docker`) and wait until the menu-bar icon shows "Docker Desktop is running".

**Windows** (Docker Desktop): launch Docker Desktop from the Start menu and wait until the system tray icon reports "Engine running". Run the `docker` commands below in PowerShell, WSL2, or Git Bash. WSL2 is recommended — Docker Desktop integrates with it automatically.

Verify the daemon is reachable on any platform:

```bash
docker info >/dev/null && echo "docker is up"
```

Then start the database container (one-time):

```bash
docker run --name cibinet-db \
  -e POSTGRES_USER=cibinet \
  -e POSTGRES_PASSWORD=cibinet \
  -e POSTGRES_DB=cibinet_dev \
  -p 5432:5432 \
  -d postgres:16
```

On subsequent shell sessions, the container already exists — just restart it:

```bash
docker start cibinet-db    # start existing container
docker stop  cibinet-db    # stop it when you're done
```

##### Using a non-default database (skip this unless you actually need it)

If — and only if — you're connecting to a Postgres instance that does **not** match the default credentials (`cibinet` / `cibinet` / `localhost:5432` / `cibinet_dev`), export an override in the same shell that will run the Python commands. **Replace every placeholder below with real values; do not run this line as-is:**

```bash
export CIBINET_DB_URL="postgresql+psycopg://<your-user>:<your-pass>@<your-host>:<your-port>/<your-db>"
```

If you ran the Docker or native setup above with the defaults, **skip this step entirely.**

#### 2. Install dependencies and start the server

Wait until PostgreSQL is accepting connections. Pick the check that matches your setup:

```bash
# If you used Option A (native install) — requires the Postgres client tools
pg_isready -h localhost -p 5432

# If you used Option B (Docker) — works without psql installed
docker exec cibinet-db pg_isready -U cibinet
```

Either should print `accepting connections`. Then:

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# Install dependencies (psycopg 3 is included)
pip install -r requirements.txt

# Create all tables (idempotent — safe to re-run)
python db_init.py

# Load test data (recommended for first-time setup; clears existing rows first)
python db_seed.py

# Start the API server on port 8080
python main.py
```

The API will be available at `http://localhost:8080/api/`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server on port 3000
npm run dev
```

The app will be available at `http://localhost:3000`. API requests are proxied to the backend automatically via Vite's dev server config.

To build for production:

```bash
npm run build
```

---

## API Reference

All endpoints are prefixed with `/api/`.

### Auth — `/api/auth/`
| Method | Path | Description |
|---|---|---|
| POST | `/register` | Create a new account (`email`, `password`, `role`) |
| POST | `/login` | Authenticate and start a session |
| POST | `/logout` | End the current session |
| GET | `/check_status` | Return the current session's user info |

### Listings — `/api/listings/`
| Method | Path | Description |
|---|---|---|
| GET | `/nearby` | Get available listings by proximity (`lat`, `lon`, `radius`, optional `food_type`) |
| POST | `/create` | Post a new food donation (`food_type`, `quantity`, `address_text`, `hours_until_expiry`) |
| POST | `/claim` | Claim an available listing (`listing_id`, `logistics_type`) |

### Claims — `/api/claims/`
| Method | Path | Description |
|---|---|---|
| GET | `/mine` | Get all claims made by the current recipient |
| GET | `/view` | Get details of a single claim (`claim_id`) |
| POST | `/acknowledge` | Mark food safety terms as acknowledged (`claim_id`) |
| POST | `/cancel` | Cancel a claim and restore the listing (`claim_id`) |

### Notifications — `/api/notifications/`
| Method | Path | Description |
|---|---|---|
| GET | `/mine` | Get all notifications for the current user |

### Users — `/api/users/`
| Method | Path | Description |
|---|---|---|
| GET | `/me` | Get the current user's profile |
| GET | `/my_listings` | Get all listings posted by the current donor |

### System — `/api/system/`
| Method | Path | Description |
|---|---|---|
| POST | `/cleanup` | Manually trigger expiry of past-due listings |
| GET | `/audit_log` | Query the audit log (optional `limit`, default 50) |

---

## Database Schema

| Table | Key Columns |
|---|---|
| `users` | `user_id`, `email`, `password_hash`, `role` (`Donor`/`Recipient`), `created_at` |
| `listings` | `listing_id`, `donor_id`, `food_type`, `quantity`, `status` (`available`/`claimed`/`expired`), `latitude`, `longitude`, `address_text`, `expiry_time` |
| `claims` | `claim_id`, `listing_id`, `recipient_id`, `logistics_type`, `safety_ack_received`, `claimed_at` |
| `notifications` | `notification_id`, `user_id`, `type`, `message_body`, `sent_at` |
| `audit_logs` | `log_id`, `user_id`, `action`, `entity_type`, `entity_id`, `timestamp` |

---

## Test Accounts

After running `python db_seed.py`, the following accounts are available:

| Email | Role | Password |
|---|---|---|
| `donor1@example.com` | Donor | `password123` |
| `donor2@example.com` | Donor | `password123` |
| `recipient1@example.com` | Recipient | `password123` |
| `recipient2@example.com` | Recipient | `password123` |

---

> **Note:** This project is configured for local development. Before any production deployment, the hardcoded session secret in `main.py` should be replaced with an environment variable, password hashing should be upgraded from SHA-256 to bcrypt/argon2, the PostgreSQL credentials in `CIBINET_DB_URL` should come from a secrets manager, and the geocoding stub in `listings.py` should be wired to a real mapping API.
