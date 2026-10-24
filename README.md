# 🚨 Tracer — Autonomous Incident Sentinel for Data Pipelines

> **Autonomous AI incident-investigation agent for mission-critical data pipelines.** Continuous 24/7 patrol, cryptographic audit chaining (SHA-256), single-use human approval gates (zero unapproved database writes), and real-time multi-channel emergency pager (Google SMTP + Cellular SMS + Web Pager).

---

## 🌟 Highlights & Architecture

- **Autonomous SRE Sentinel:** Continuously sweeps data pipeline nodes in topological order, detecting silent failures, schema drifts, and SLA cutoffs.
- **Apple-Curved Workflow Studio Canvas:** Spacious node architecture with continuous squircle rear cards (`.apple-curve-card`, `rounded-[28px]`), live ticking telemetry, SVG connector cables, and dynamic firefighter worker animation.
- **High-Density SRE Operations Grid:** Instant toggle between visual canvas and tabular operations grid (`EndpointGrid`).
- **Cryptographic Audit Trail (AUD-1 & AUD-2):** Every step, tool execution hash, and action token is chained with SHA-256 for 100% mathematical tamper evidence.
- **Human Approval Gate (APR-2 & APR-6):** Code-level single-use token guard strictly blocks all unauthorized writes (0 violations guaranteed).
- **Outbound Notification Gateway:** Live TLS 1.3 direct email dispatch via Google Mail SMTP and instant mobile pager alerting.
- **Command Palette (`Ctrl+K`):** Raycast/Linear-grade search and command palette for instantaneous keyboard-driven operations.

---

## 🚀 Deployment Guide

### Option 1: Deploy on Render (Full-Stack or Backend Service)

Render automatically detects Python and FastAPI:

1. Link your GitHub repository (`https://github.com/nidhinrajm55-sudo/Usheee`) on **[Render Dashboard](https://dashboard.render.com/)**.
2. Create a new **Web Service**:
   - **Environment:** `Python`
   - **Build Command:** `pip install -r requirements.txt && npm install && npm run build`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Add the following **Environment Variables** in Render:
   - `PYTHON_VERSION`: `3.11.9`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_USER`: `your-email@gmail.com` *(e.g. your Gmail address)*
   - `SMTP_PASS`: `your-16-character-app-password` *(Google App Password from myaccount.google.com/apppasswords)*
   - `SMTP_SENDER_NAME`: `Tracer Incident Sentinel`
   - `DEFAULT_RECIPIENT_EMAIL`: `nidhinrajm55@gmail.com`
   - `DEFAULT_RECIPIENT_PHONE`: `9074121510`
4. Click **Deploy Web Service**! Render will build the frontend, package the backend, and provide your live URL (e.g., `https://usheee.onrender.com`).

---

### Option 2: Deploy Frontend on Vercel

If you host your frontend on Vercel and your backend on Render:

1. Import your GitHub repository on **[Vercel Dashboard](https://vercel.com/new)**.
2. Vercel automatically reads `vercel.json` and configures:
   - **Framework:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://your-tracer-service.onrender.com` *(your Render backend URL)*
4. Click **Deploy**! Vercel will launch your frontend on global edge CDN.

---

## 💻 Local Development Quickstart

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/nidhinrajm55-sudo/Usheee.git
cd Usheee

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your SMTP and phone notification preferences
```

### 3. Build & Run
```bash
# Build frontend bundle
npm run build

# Start FastAPI backend & static server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 🧪 Automated Acceptance Tests

Run the core acceptance verification suite:
```bash
python -m backend.test_core
```
Output:
```text
PASS: APR-6 - Attempted 3 unapproved writes, all blocked strictly.
PASS: PACK-1 - Logistics 3rd pack loaded and executed checks seamlessly.
PASS: ENV-4 - One-click reset completed in 0.06ms (< 5000ms target).
PASS: AUD-2 - Tamper-evident hash chain verified with 100% integrity.
PASS: NTF-10 - SMS dispatch to 9074121510, Email dispatch to nidhinrajm55@gmail.com, and audit verification verified.
ALL CORE UNIT TESTS PASSED!
```

---

## 🛡️ License & Authors
Built with precision for mission-critical distributed pipeline reliability.
- **On-Call Lead / Incident Commander:** Nidhin Raj
