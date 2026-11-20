# CampusResolve AI

[![Live Deployment](https://img.shields.io/badge/Live%20Demo-campusresolve--ai--rho.vercel.app-1F47E8?style=for-the-badge&logo=vercel&logoColor=white)](https://campusresolve-ai-rho.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-CampusResolve-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/exotisk00/CampusResolve)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Campus](https://img.shields.io/badge/Campus-LPU%20Phagwara-FF5722?style=flat-square)](https://www.lpu.in/)

> **"One Campus. One Platform. Smarter Complaint Resolution."**  
> An automated, multilingual grievance triage and real-time resolution platform engineered exclusively for **Lovely Professional University (LPU), Phagwara Campus**.

---

## 📌 Links

- **🌐 Live Production Web App:** [https://campusresolve-ai-rho.vercel.app](https://campusresolve-ai-rho.vercel.app)
- **📂 GitHub Source Repository:** [https://github.com/exotisk00/CampusResolve](https://github.com/exotisk00/CampusResolve)

---

## 🎯 Problem Statement & Solution

### The Campus Challenge
With over 30,000 residents, dozens of academic blocks (e.g., Block 32, 34, 38), boys' hostels (BH-1 to BH-8), and girls' hostels (GH-1 to GH-6), managing daily campus infrastructure issues at LPU is challenging:
- **Misrouted Complaints:** Grievances submitted in everyday student vernacular (Hinglish, Punjabi-influenced English) frequently end up in the wrong department queue.
- **Lost Location Details:** Crucial location context (such as floor or room number) is often missed or misinterpreted during manual triage.
- **Zero Resolution Transparency:** Students are left in the dark after submitting a grievance, unsure whether technicians have inspected the site or completed repairs.
- **Cross-Department Security Risks:** Staff and administrative personnel require strict, isolated queues so technicians only access grievances within their designated trade.

### The CampusResolve AI Solution
CampusResolve AI bridges the gap between students and campus maintenance divisions:
1. **Natural Language Understanding:** Students describe issues in English, Hinglish, or Romanised Punjabi.
2. **Autonomous Location Pinpointing:** Explicitly extracts Block, Floor, and Room details without hallucinating missing data.
3. **Automated Triage to 6 Departments:** Classifies grievances with high precision using Gemini AI or a resilient local rule-based fallback engine (96.67% benchmark accuracy).
4. **Real-Time Cross-Dashboard Sync:** Live Cloud Firestore listeners keep student and staff dashboards synchronized without page reloads.
5. **Strict Role-Based Access Control (RBAC):** Deployed Firestore security rules strictly isolate student data and restrict staff permissions exclusively to their assigned division.

---

## 🏢 The Six Official Complaint Departments

All grievances in CampusResolve AI are strictly routed to one of six official campus divisions:

| Department | Scope & Responsibilities | Common LPU Examples |
| :--- | :--- | :--- |
| 🔧 **Plumbing** | Water supply, pipeline leakages, washrooms, flush valves, taps, geysers, RO purifiers | *"Block 14 washroom me water leakage hai"*<br>*"BH-4 2nd floor water cooler tap broken"* |
| ⚡ **Electrical** | Room fans, switchboards, tube lights, power sockets, AC units, hostel power trips | *"Room 304 fan spark kar raha hai and speed regulator broken"*<br>*"Block 38 classroom AC not switching on"* |
| 📶 **Wi-Fi** | Campus Wi-Fi connectivity, hostel access points, portal login, captive portal issues | *"BH-2 Room 314 me LPU Wi-Fi authenticate nahi ho raha morning se"*<br>*"Central library reading hall 5GHz band frequent packet drops"* |
| 🍽️ **Mess** | Food quality, dining hygiene, utensils, drinking water coolers, mess staff conduct | *"Mess 4 lunch me hygiene issue tha and food quality standard nahi thi"*<br>*"Dining hall water dispenser not cooling"* |
| 📚 **Academic** | Lecture hall projectors, audio systems, classroom seating, laboratory infrastructure | *"Block 32 Room 201 smart board display blinking continuously during lectures"* |
| ❓ **Other** | General campus maintenance, elevators, security, lost & found, transportation | *"Hostel elevator stuck on 3rd floor"*<br>*"Uni-Mall parking pathway broken pavement"* |

---

## 🔄 Complaint Resolution Lifecycle

CampusResolve AI enforces a transparent, multi-stage lifecycle for every grievance:

```
[ Submitted ] ──► [ Under Review ] ──► [ Assigned ] ──► [ In Progress ] ──► [ Resolved ]
      │                                                                           ▲
      └───────────────────────────► [ Rejected ] ─────────────────────────────────┘
```

1. **Submitted:** Complaint filed by student; assigned unique ID (`CR-YYYYMMDD-XXXXXXX`) and timestamped.
2. **Under Review:** Department supervisor triaged grievance and confirmed location details.
3. **Assigned:** Designated technician designated to the ticket.
4. **In Progress:** Maintenance or repair work actively underway on site; staff remarks appended.
5. **Resolved:** Service restored, verified on site, and closed with final staff resolution notes.
6. **Rejected:** Ticket closed with an explanatory remark (e.g. invalid campus location or duplicate).

---

## 👥 Student & Staff Workflows

### 🎓 Student Experience
- **Simple Onboarding:** Sign up with university email. Frontend signup strictly coerces student privileges.
- **Expressive Grievance Submission:** Type naturally in Hinglish or English. Real-time character counters and example prompts guide the student.
- **Live Lifecycle Tracking:** Instant visual timeline with 5 stages (Submitted $\rightarrow$ Under Review $\rightarrow$ Assigned $\rightarrow$ In Progress $\rightarrow$ Resolved).
- **Staff Remarks Stream:** Read timestamped remarks from maintenance officers without refreshing the browser.
- **Resolution Confirmation:** When a complaint is marked Resolved, an emerald verified badge displays the official resolution timestamp and technician remarks.

### 🛠️ Staff Experience
- **Dedicated Portal (`/staff-dashboard`):** Authorized staff (e.g., Danish Kumar for Plumbing) log in to an isolated department dashboard.
- **Live Queue Ingestion:** New student complaints stream into the dashboard immediately via real-time Firestore listeners.
- **Verbatim Integrity & Location Review:** Staff review exact, unaltered student text and structured location cards (`Block`, `Floor`, `Room`).
- **One-Click Status & Note Updates:** Update complaint status and append chronological remarks (`[Date - Staff Name (Dept)]: Notes`).
- **Security Guardrails:** Deployed security rules prevent staff from viewing or mutating complaints belonging to other departments.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDENT CLIENT BROWSER                          │
│               React 18 + Vite SPA  (Tailwind CSS UI)                   │
└──────────────────┬────────────────────────────────▲────────────────────┘
                   │                                │
        1. POST /api/classify             5. Real-Time onSnapshot Sync
                   │                                │
┌──────────────────▼──────────────────┐   ┌─────────┴────────────────────┐
│      VERCEL SERVERLESS BACKEND      │   │       CLOUD FIRESTORE        │
│          Express 5 Router           │   │    (Native Mode Database)    │
│  api/index.js ──► server/index.js   │   ├──────────────────────────────┤
│                                     │   │ • users/{uid}                │
│  ┌───────────────────────────────┐  │   │ • complaints/{ticketId}      │
│  │     Gemini AI Classifier      │  │   │                              │
│  │   (@google/genai SDK)         │  │   │ Protected by deployed        │
│  │   Model: gemini-2.5-flash     │  │   │ firestore.rules:             │
│  ├───────────────────────────────┤  │   │ - Cross-student read block   │
│  │    Rule-Based Fallback Engine │  │   │ - Department queue isolation │
│  │    (96.67% benchmark accuracy)│  │   │ - Field immutability         │
│  └───────────────────────────────┘  │   └─────────▲────────────────────┘
└─────────────────────────────────────┘             │
                                          4. Status & Notes Update
                                                    │
┌───────────────────────────────────────────────────┴────────────────────┐
│                         STAFF CLIENT BROWSER                           │
│      Staff Dashboard  (Authenticated by Department, e.g. Plumbing)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Technology Stack

### Frontend
- **Framework:** [React 18](https://react.dev/) + [Vite 6](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 3.4](https://tailwindcss.com/) with customized SaaS light theme
- **Routing:** [React Router v7](https://reactrouter.com/) with role-based protected routes
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend & Serverless
- **Runtime:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework:** [Express 5](https://expressjs.com/)
- **Serverless Adapter:** Vercel Serverless Functions (`api/index.js`)
- **AI Classification SDK:** [`@google/genai`](https://www.npmjs.com/package/@google/genai) (Google Gemini SDK)

### Database & Authentication
- **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth) (Email & Password)
- **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore) (Native Mode)
- **Security:** Granular Firestore Security Rules (`firestore.rules`)
- **Admin Automation:** Firebase Admin SDK v14 (`scripts/provision_staff.js`, `scripts/test_harness.js`)

---

## 🔒 Security & Data Integrity

CampusResolve AI adheres to enterprise-grade security practices verified by automated test suites:

1. **Role Escalation Defense:** Public signup in `AuthContext.jsx` hardcodes `role: 'student'` and `department: null`. The `firestore.rules` configuration rejects any document creation attempting `role == 'admin'`.
2. **Department Isolation:** Staff members are authenticated by their Firestore profile department. Security rules strictly deny cross-department read and write requests (`permission-denied`).
3. **Field Immutability:** When staff update a complaint, security rules allow modifications **only** to `['status', 'updatedAt', 'staffNote']`. Submitter identity (`userId`), department, ticket ID, and original complaint text are permanently immutable.
4. **Credential Isolation:** Firebase service account keys and API secrets are never committed to version control. Dedicated `.gitignore` safeguards ensure `.env`, `.env.local`, and private JSON credentials remain off public repositories.
5. **Verbatim Input Preservation:** Student complaint descriptions are stored verbatim without rephrasing or inventing missing location details.

---

## ⚙️ Local Development & Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A Google Firebase Project with **Authentication (Email/Password)** and **Firestore Database (Native mode)** enabled.

### 2. Clone Repository
```bash
git clone https://github.com/exotisk00/CampusResolve.git
cd CampusResolve
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables

Create two separate environment configuration files:

#### Frontend Client: `.env.local`
Place this in the project root:
```env
# Public Firebase Web App Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Backend Server: `.env`
Place this in the project root:
```env
# Backend Express Server Port
PORT=5001

# Google Gemini API Key (from Google AI Studio)
# Leave empty to run with resilient rule-based fallback
GEMINI_API_KEY=
```

> **Important Note on Gemini API Integration:**  
> If `GEMINI_API_KEY` is omitted or unconfigured, the system automatically activates its built-in rule-based fallback classifier. The platform functions with full accuracy (96.67% benchmark performance) even without an external API key.

### 5. Run Development Servers

In terminal 1 (start backend server):
```bash
npm run server
```

In terminal 2 (start Vite frontend):
```bash
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing & Verification Suites

The repository contains an automated test and verification suite:

```bash
# 1. Evaluate Rule-Based Classifier Accuracy (60 LPU benchmark complaints)
npm run evaluate

# 2. Run Comprehensive 10-Check Security & Rules Audit
npm run test:audit

# 3. Test Staff Provisioning CLI with input validation and zero leaks
node scripts/test_provision_staff_cli.js

# 4. Verify Test Harness Safety Gates & Historical Record Protection
node scripts/test_harness_security.js

# 5. Execute Complete 10-Step Student-to-Staff Resolution Lifecycle
NODE_ENV=test ALLOW_TEST_CLEANUP=true node --env-file=.env.local scripts/test_student_staff_resolution_lifecycle.js

# 6. Production Bundle Build Verification
npm run build
```

---

## 🚀 Deployment

### Vercel (Production)
The project is configured for deployment on Vercel:
- **Build Command:** `vite build`
- **Output Directory:** `dist`
- **Serverless API Function:** [`api/index.js`](file:///Users/anishkumar/Documents/Code%20fusion/api/index.js) (wraps Express application)
- **Rewrites Configuration:** [`vercel.json`](file:///Users/anishkumar/Documents/Code%20fusion/vercel.json) routes `/api/(.*)` to the serverless function and `/(.*)` to `/index.html` for single-page application routing.

---

## 🔮 Future Improvements

- [ ] **Voice Grievance Input:** Speech-to-text input supporting multi-dialect campus audio submissions.
- [ ] **Image Evidence Uploads:** Secure Cloud Storage attachments allowing students to photograph broken fixtures.
- [ ] **Push & WhatsApp Notifications:** Automated SMS/WhatsApp status updates sent to students upon status transitions.
- [ ] **Facility Asset QR Codes:** Scan QR codes on campus washrooms and labs to auto-fill location details.
- [ ] **Predictive Maintenance Analytics:** Heatmaps highlighting chronic maintenance bottlenecks across LPU hostels.

---

## 📜 License

This project was built for hackathon evaluation and campus infrastructure management at Lovely Professional University (LPU), Phagwara.
