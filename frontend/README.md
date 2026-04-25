# 🏥 Swasthya Setu

**Healthcare Bridge for Rural Odisha** — An intelligent healthcare triage system for ASHA workers and District Medical Officers using MediaPipe ISL hand sign detection and GPT-4o clinical analysis.

## 🎯 Feature

### For ASHA Workers (Patient-Facing)

#### 1. **ISL Hand Sign Language Detection** (`/isl`)
- Real-time hand gesture recognition using MediaPipe Hands
- **8 symptoms via hand signs:**
  - 🤚 **FEVER**: Open palm, all fingers extended
  - 🫱 **HELP**: Thumbs up (index + middle + ring up)
  - ☮️ **HEADACHE**: Peace sign (index + middle up)
  - 👆 **PAIN**: Single index finger
  - 🤌 **DIARRHEA**: Middle + ring fingers (no index)
  - 🤢 **VOMITING**: Ring + pinky (no index/middle)
  - 👊 **COUGH**: Closed fist tapping chest twice
  - 👍 **YES**: Thumb up (confirm)
  - ✌️ **NO**: V-shape wave (deny)
- Adaptive detection works at any hand distance/angle from camera
- 7-frame stability buffer prevents false positives
- SVG step-by-step guides for each sign
- Bilingual (English + Odia) interface

#### 2. **Patient Triage Form** (`/patient`)
- Collect patient details: name, age, gender, district, phone
- Manual symptom entry + ISL hand sign import
- **AI-powered clinical triage** via GPT-4o:
  - Severity level: RED (emergency) / YELLOW (urgent) / GREEN (monitor)
  - Sickle cell disease risk assessment
  - Clinical summary & brief description
  - Odia translation for field use
- **Precautions section** (second GPT-4o call):
  - 3 actionable precautions with emoji hints
  - Priority badge (immediate / within hours / monitor at home)
  - Odia translations for each precaution

#### 3. **Patient Dashboard** (`/home`)
- **View all triaged patients** grouped by name + age + district
- **Severity indicators**: RED left-border on critical cases
- **Visit count badge**: How many times patient was triaged
- **Severity trend dots**: Last 3 visits color-coded (green/yellow/red)
- **Search & filter**: By patient name, district
- **Delete patient records**: Remove entire patient + triage history
- **Revisit patient**: Auto-prefill form with last triage details
- Real-time updates from Supabase

#### 4. **Patient Deduplication**
- Automatic duplicate detection on name + age + district match
- Modal prompt: "ହଁ, ଏହି ରୋଗୀ" (Yes, this patient) / "ନା, ନୂଆ ରୋଗୀ" (No, new patient)
- Prevents duplicate records in database
- Links multiple visits to same `patient_id`

#### 5. **Authentication**
- Email/password sign-up and login via Supabase
- Google OAuth integration
- Session management

### For District Medical Officers (Admin Dashboard)

#### 6. **DMO Login Portal** (`/dmo-login`)
- Separate login for District Medical Officers
- **Fake authentication** (for hackathon) — no real identity verification
- Fields: District dropdown (all 30 Odisha districts), officer name, employee ID
- Saves to localStorage, redirects to `/dmo-dashboard`
- Bilingual form (English + Odia)

#### 7. **Live Outbreak Intelligence Dashboard** (`/dmo-dashboard`)
- **Real-time disease surveillance** powered by Supabase realtime
- **Summary stats** (auto-refresh every 30 seconds):
  - Total cases today
  - RED emergency cases (pulsing border if >0)
  - Sickle cell risk cases (last 7 days)
  - Unreviewed helpline calls
- **Interactive district heatmap**:
  - Leaflet.js map of Odisha
  - Circle markers color-coded by RED case count:
    - 🟢 Green: 0 RED cases
    - 🟠 Amber: 1–2 RED cases
    - 🔴 Red: 3–5 RED cases
    - 🔴 Dark red: 6+ RED cases
  - Popup on click shows detailed breakdown
  - Light CartoDB tiles
- **Outbreak alerts**:
  - Red dismissable banner for districts with 3+ RED cases in 24h
  - Auto-triggers on new emergency triage
  - Toast notification: "🔴 New emergency case in {district}"
- **District leaderboard table**:
  - Sorted by RED count (descending)
  - Columns: Total, RED, YELLOW, GREEN, Sickle Cell, Last Case
  - Red-highlighted rows for hotspots (RED > 2)
- **Recent emergency feed** (right panel):
  - Last 10 RED cases
  - Patient name (masked: first name only), district, time-ago
  - Brief triage summary
  - Auto-refresh every 30 seconds
- **Top 5 symptom frequency chart**:
  - Horizontal bar chart (last 7 days)
  - CSS-only visualization
  - Teal gradient bars
- **Real-time subscriptions**:
  - Supabase `postgres_changes` channel listens for new triage inserts
  - Instant updates to all stats
  - Toast notification on new RED cases
- **Logout button**: Clears DMO session, returns to `/dmo-login`

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + React Router v6
- **Database**: Supabase (PostgreSQL)
  - Tables: `patients`, `triage_records`
  - Row-level security enabled
  - Realtime subscriptions enabled
- **AI**: OpenAI GPT-4o
  - Triage analysis (severity, sickle cell risk, summary)
  - Precaution generation with JSON output
  - Symptom translation to Odia
- **Hand Detection**: MediaPipe Hands (lite model)
  - 3D landmark tracking
  - Curl-ratio finger detection (1.15x threshold)
  - Adaptive palm-relative thresholds
  - 480×360 resolution, 7-frame stability buffer
- **Maps**: Leaflet.js (district outbreak heatmap)
- **Styling**: CSS-in-JS (inline styles) with CSS Grid/Flexbox
- **Fonts**: Noto Sans Oriya (bilingual support)
- **Dev Tools**: ESLint, Prettier (configured)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key
- Browser with webcam access (for ISL detection)

### Installation

```bash
git clone https://github.com/Jayant-kernel/swasthya-setu-2.git
cd swasthya-setu-2
npm install
```

### Environment Setup

Create `.env` in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

Run this SQL in your Supabase SQL editor to create tables:

```sql
-- Create patients table
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer,
  gender text,
  district text,
  phone text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.patients enable row level security;
create policy "Users manage patients" on public.patients
  for all using (true) with check (true);

-- Add patient_id FK to triage_records
alter table public.triage_records
  add column if not exists patient_id uuid references public.patients(id);

-- Enable realtime for outbreak dashboard
alter table public.triage_records replica identity full;

-- Create triage_records if not exists
create table if not exists public.triage_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id),
  patient_name text,
  age integer,
  gender text,
  district text,
  phone text,
  symptoms jsonb,
  severity text,
  sickle_cell_risk boolean,
  clinical_summary text,
  brief text,
  source text default 'asha_app',
  reviewed boolean default false,
  created_at timestamptz default now()
);

alter table public.triage_records enable row level security;
create policy "Users view/insert records" on public.triage_records
  for all using (true) with check (true);
```

### Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 📱 App Structure

```
src/
├── pages/
│   ├── LoginPage.jsx          # ASHA worker login
│   ├── HomePage.jsx            # Patient dashboard
│   ├── PatientFormPage.jsx     # Triage form + ISL import
│   ├── ISLPage.jsx             # Hand sign detection
│   ├── ChatPage.jsx            # (Legacy) Symptom chatbot
│   ├── DMOLoginPage.jsx        # District officer login
│   └── DMODashboardPage.jsx    # Outbreak surveillance
├── components/
│   ├── ProtectedRoute.jsx      # Auth guard
│   └── VisitHistory.jsx        # Patient visit timeline
├── context/
│   └── PatientContext.jsx      # Patient data provider
├── lib/
│   ├── supabase.js             # Supabase client
│   └── openai.js               # OpenAI client
├── App.jsx                      # Router config
└── index.css                    # Global styles
```

---

## 🎨 Design Highlights

- **ASHA app**: Light teal/green (`#0F6E56`) accent, clean white cards, Odia-first interface
- **DMO dashboard**: Dark navy control-room aesthetic (`#0f172a`), real-time pulsing indicators, high-contrast data visualization
- **Responsive**: Mobile-first, works on tablets (landscape for ISL detection)
- **Accessibility**: Bilingual (English + Odia), clear button labels, error messages in both languages

---

## 🔒 Security

- Row-level security enabled on all tables
- No credentials stored in frontend code (via `.env`)
- Supabase JWT tokens managed by client library
- DMO portal uses localStorage (fake auth for hackathon — upgrade before production)

---

## 📊 Data Flow

1. **ASHA triage**: Patient → ISL hand signs (or manual symptoms) → GPT-4o analysis → Supabase
2. **Patient dedup**: Name+age+district match → Modal confirmation → Link to existing patient_id
3. **DMO surveillance**: Supabase realtime → Dashboard stats/map/leaderboard → Toast alerts on new RED cases
4. **History tracking**: All triages linked via patient_id → Visit count + trend dots visible to ASHA

---

## 🚧 Known Limitations

- DMO login is **fake** (no real authentication) — designed for hackathon demo
- ISL detection requires **good lighting** and **clear hand visibility**
- Sickle cell risk is estimated by GPT-4o, not diagnostic
- Map only shows districts (not sub-divisions)
- Symptom frequency uses `symptoms` JSONB array; ensure consistent formatting

---

## 🔮 Future Enhancements

- Real DMO authentication (LDAP/OAuth with state ID system)
- Offline mode for ASHA workers (service worker + local DB)
- SMS alerts for critical RED cases
- Video consultation integration with eSanjeevani
- Multi-hand ISL detection (doctor + patient interaction)
- Predictive outbreak modeling
- Export triage data to CSV/PDF

---

## 📄 License

Open source for healthcare use. Built during hackathon.

---

## 🤝 Contributing

Bug reports and feature requests welcome. Fork and PR!

---

**Made with 💚 for rural healthcare in Odisha**
