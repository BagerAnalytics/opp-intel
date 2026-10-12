# OppIntel Platform — Project Handover & Context Export

> **How to use this on your new computer:**  
> When you open Antigravity on your new laptop, simply paste the summary section or point Antigravity to this file. It contains the complete architecture, live infrastructure credentials, database URLs, recent fixes, and local development setup.

---

## 1. Executive Summary & Infrastructure Overview

**Project Name:** OppIntel (Opportunity Intelligence Platform for Premier Agric & Badger Analytics)  
**GitHub Repository:** `https://github.com/BagerAnalytics/opp-intel.git` (`main` branch)  
**Status:** Successfully and completely migrated away from Railway.

### Active Cloud Architecture
| Layer | Provider | Status | URL / Host |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Live (Free tier) | `https://opp-intel.vercel.app` |
| **Backend** | **Render.com** | Live (Docker Service) | `https://opp-intel-backend.onrender.com` |
| **Database** | **Supabase** | Live (PostgreSQL 15/16) | `aws-0-eu-west-1.pooler.supabase.com:5432` |
| **NAS / VPN** | **Tailscale + UGREEN** | Configured in Docker | `100.77.182.88:5005` (WebDAV) |

---

## 2. Live Database (Supabase)

* **Host:** `aws-0-eu-west-1.pooler.supabase.com`
* **Port:** `5432` *(Important: Use port 5432 Session Pooler, NOT port 6543 Transaction Pooler, to avoid SQLAlchemy prepared statement limits).*
* **Database Name:** `postgres`
* **Username:** `postgres.qcgjafhpafjowzqaodky`
* **Full Connection URL:**
  ```text
  postgresql://postgres.qcgjafhpafjowzqaodky:PremierAgric%4001@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
  ```
  *(Note: The `@` in the password `PremierAgric@01` MUST be URL-encoded as `%40` or SQLAlchemy/psycopg2 will fail).*
* **Tables Migrated (557 total rows):**
  - `users` (Admin: `support@premieragric.co.za`, User: `premieragric1@gmail.com`)
  - `settings`
  - `portals` (170 records)
  - `contacts` (317 records)
  - `opportunities` (57 live records)
  - `compliance_documents` (7 records)
  - `scraper_progress`
  - `daily_stats`

---

## 3. Live Backend Service (Render.com)

* **Dashboard Service Name:** `opp-intel-backend` (or `oppintel-backend`)
* **Environment:** `Docker` (built from `backend/Dockerfile` using `backend/start.sh`)
* **Region:** `Frankfurt (EU Central)` (low-latency connection to Supabase Ireland)
* **Root Directory:** `backend`
* **Live Base URL:** `https://opp-intel-backend.onrender.com`

### Required Environment Variables on Render:
```env
DATABASE_URL=postgresql://postgres.qcgjafhpafjowzqaodky:PremierAgric%4001@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY=gsk_...
GROQ_KEY_ADDED_DATE=...
SCRAPERAPI_KEY=...
SMTP_USER=...
SMTP_PASS=...
TAILSCALE_AUTHKEY=tskey-auth-...
NAS_IP=100.77.182.88
WEBDAV_USERNAME=...
WEBDAV_PASSWORD=...
```
*(Render provides `PORT` automatically; do not override it. Unused variables like `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` were intentionally excluded as Groq is used for LLM extraction).*

---

## 4. Live Frontend Service (Vercel)

* **Deployment URL:** `https://opp-intel.vercel.app`
* **Framework:** Next.js (App Router, Tailwind CSS, Turbopack)
* **Environment Variables in Vercel (Type: Config):**
  ```env
  NEXT_PUBLIC_API_URL=https://opp-intel-backend.onrender.com
  ```
  *(Important: Do NOT include a trailing slash).*

---

## 5. Summary of Recent Fixes Implemented

1. **Complete Railway Decommissioning:**
   - Recovered raw database volume using custom Railway template `:18`.
   - Migrated all data flawlessly to Supabase using bulk object insertion with proper dependency ordering.
   - Deployed backend to Render Docker container.
2. **Prevented Scraper Data Loss:**
   - Removed aggressive startup cleanup in `backend/main.py` that previously wiped any opportunity with an empty description.
3. **Automated Closing of Expired Opportunities:**
   - Implemented `close_expired_opportunities()` in `backend/scrapers/run_all.py` using `dateutil.parser` with fuzzy string parsing.
   - Automatically marks expired opportunities as `closed` (the frontend filters these out of the active view while preserving historical tracking).
4. **Multi-Device Sign In Fix:**
   - Centralized all frontend API requests into `frontend/src/lib/api.ts` with fallback to Render.
   - Replaced hardcoded dead Railway URLs across `login/page.tsx`, `compliance`, `geospatial`, `network`, `pipeline`, `settings`, `page.tsx`, and modals.
5. **Reliable Sign Out:**
   - Updated sign out action to perform a clean browser reset (`window.location.href = '/login'`), wiping both `oppintel_token` and `oppintel_user`.
   - Added a dedicated, always-accessible **Sign Out** button in the sidebar footer (`Sidebar.tsx`) in addition to the header profile menu.

---

## 6. How to Set Up & Run on Your New Computer

### Step 1: Clone Repository
```bash
git clone https://github.com/BagerAnalytics/opp-intel.git
cd opp-intel
```

### Step 2: Backend Local Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` containing:
```env
DATABASE_URL=postgresql://postgres.qcgjafhpafjowzqaodky:PremierAgric%4001@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

Run backend locally:
```bash
uvicorn main:app --reload --port 8000
```

### Step 3: Frontend Local Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Handover Prompt for Antigravity on New Computer

When starting a conversation with Antigravity on your new computer, you can copy and paste this prompt:

```text
Hi Antigravity, I'm working on the OppIntel platform (https://github.com/BagerAnalytics/opp-intel.git).
Here is the context:
- Frontend is on Vercel (https://opp-intel.vercel.app), Next.js App Router.
- Backend is on Render (https://opp-intel-backend.onrender.com), FastAPI Python in Docker.
- Database is PostgreSQL on Supabase (aws-0-eu-west-1.pooler.supabase.com:5432/postgres).
- Centralized frontend API is in frontend/src/lib/api.ts pointing to the Render backend.
- Railway has been completely decommissioned.
Please inspect the repository and let me know you have full context.
```
