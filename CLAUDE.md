# Fortress Score — Frontend

## What This Project Is
Frontend dashboard for Fortress Score — an external cyber-risk scoring platform.
Users add organizations (domains), trigger scans, and see their Fortress Score with category breakdowns, asset-level findings, and score history over time.

## Tech Stack
- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **HTTP**: Axios (with auth token interceptor)
- **Charts**: Recharts (score history trend line, category bar chart)
- **Icons**: Lucide React
- **Auth**: JWT stored in localStorage, attached to every request
- **Backend API**: http://localhost:3000 (dev) / EC2 URL (prod)

## Follow clear-feed-ui patterns exactly
The `clear-feed-ui` folder is available in this workspace as reference.
Copy patterns from:
- Auth flow (login/register pages, token storage)
- Sidebar navigation component
- Page layout and card styles
- API service functions (axios wrapper)
- Protected route setup in App.tsx

## Pages to Build

### 1. Login / Register
- Same as clear-feed-ui auth pages
- POST /api/auth/login → store JWT → redirect to dashboard

### 2. Dashboard (/)
- **Fortress Score gauge** — big number 0–100 with color (green/yellow/orange/red)
- **Score label** — Excellent / Good / Moderate / High Risk / Critical
- **4 category cards** — TLS Risk, Header Risk, Network Risk, Email Risk (each 0–100)
- **Score trend chart** — line chart of score over time (Recharts)
- **Last scanned** timestamp
- **"Run New Scan" button**

### 3. Organizations (/organizations)
- List of orgs user has added (name + domain + current score + last scan date)
- "+ Add Organization" button → modal with name + rootDomain fields
- Click org → go to that org's detail/dashboard
- Delete org button with confirm dialog

### 4. Scan Results (/scans/:id)
- Scan status badge (PENDING / RUNNING / COMPLETE / FAILED)
- **Auto-poll** GET /api/scans/:id every 3 seconds while status is PENDING or RUNNING
- Show loading spinner while scanning
- Once COMPLETE: show Fortress Score + 4 category scores
- **Findings list** — filterable by category (TLS/HEADERS/NETWORK/EMAIL)
- Each finding card: asset hostname | category badge | risk score | signals list

### 5. Assets (/organizations/:orgId/assets)
- List of discovered assets (subdomains, IPs)
- Each row: hostname | type badge | discovered date | risk score
- Click asset → show its scan results across all categories

### 6. Score History (/organizations/:orgId/history)
- Line chart of Fortress Score over time
- Table of past scans with date + score + status

### 7. Settings (/settings)
- Change password
- Account info

## Sidebar Navigation
```
Dashboard        /              (LayoutDashboard icon)
Organizations    /organizations (Building2 icon)
Settings         /settings      (Settings icon)
```

## Score Color Coding (use everywhere)
```
0–20   → green  (#22c55e) — Excellent
21–40  → teal   (#14b8a6) — Good
41–60  → yellow (#eab308) — Moderate
61–80  → orange (#f97316) — High Risk
81–100 → red    (#ef4444) — Critical
```

## API Service Functions to Build (src/lib/services.ts)
```typescript
// Auth
login(email, password)
register(name, email, password)

// Organizations
getOrganizations()
createOrganization(name, rootDomain)
deleteOrganization(id)

// Scans
triggerScan(orgId)               // POST /api/scans
getScan(scanId)                  // GET /api/scans/:id (poll this)
getScanResults(scanId)           // GET /api/scans/:id/results
getOrgScans(orgId)               // GET /api/organizations/:orgId/scans

// Score
getOrgScore(orgId)               // GET /api/organizations/:orgId/score
getScoreHistory(orgId)           // GET /api/organizations/:orgId/score/history

// Assets
getOrgAssets(orgId)              // GET /api/organizations/:orgId/assets
```

## API Response Shapes

### GET /api/organizations/:orgId/score
```json
{
  "fortressScore": 42,
  "label": "Moderate",
  "tlsScore": 30,
  "headerScore": 55,
  "networkScore": 40,
  "emailScore": 20,
  "lastScannedAt": "2026-03-28T10:00:00Z"
}
```

### GET /api/scans/:id
```json
{
  "id": "uuid",
  "status": "COMPLETE",
  "fortressScore": 42,
  "tlsScore": 30,
  "headerScore": 55,
  "networkScore": 40,
  "emailScore": 20,
  "startedAt": "2026-03-28T10:00:00Z",
  "completedAt": "2026-03-28T10:05:00Z"
}
```

### GET /api/scans/:id/results
```json
[
  {
    "id": "uuid",
    "category": "TLS",
    "riskScore": 30,
    "asset": { "hostname": "vpn.example.com", "type": "SUBDOMAIN" },
    "signals": [
      { "check": "TLSv1 enabled", "riskValue": 30, "passed": false },
      { "check": "Certificate valid", "riskValue": 0, "passed": true }
    ]
  }
]
```

### GET /api/organizations/:orgId/assets
```json
[
  { "id": "uuid", "hostname": "vpn.example.com", "type": "SUBDOMAIN", "discoveredAt": "..." },
  { "id": "uuid", "ipAddress": "52.21.1.1", "type": "IP", "discoveredAt": "..." }
]
```

## How to Initialize This Project
```bash
npm create vite@latest fortress-score-ui -- --template react-ts
cd fortress-score-ui
npm install
npm install axios recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Key Notes
- Scan polling: poll every 3s while PENDING/RUNNING, stop when COMPLETE/FAILED
- Score gauge: just a large styled number with color — no need for complex SVG gauge
- Follow clear-feed-ui file/folder structure exactly for consistency
- All types go in src/lib/types.ts
- All API calls go in src/lib/services.ts
