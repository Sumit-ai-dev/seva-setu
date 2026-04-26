# 🏥  AI-Powered Rural Healthcare Platform

<div align="center">

![Nexus Health Banner](https://img.shields.io/badge/Nexus%20Health-AI%20Healthcare-blue?style=for-the-badge&logo=google&logoColor=white)

[![Built with Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)
[![Powered by Gemma](https://img.shields.io/badge/Gemma-2B%20Edge%20AI-34A853?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![Google Maps](https://img.shields.io/badge/Google%20Maps%20Platform-Outbreak%20Tracking-EA4335?style=flat-square&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-FBBC04?style=flat-square&logo=googlecloud&logoColor=black)](https://cloud.google.com/run)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

**Built for GDG Bengaluru Hackathon 2026**

*Solving UN SDG 3 (Good Health) *

</div>

---

## 🌍 The Problem

India has **1 million ASHA workers** — the backbone of rural healthcare. They visit villages daily, recording patient data with pen and paper. They face:

- ❌ **Zero internet** in remote villages
- ❌ **No AI tools** to assist triage decisions
- ❌ **Language barriers** — no Kannada-first health tools
- ❌ **Delayed disease outbreak detection** — DHOs wait days for manual reports

**The result:** Preventable deaths from delayed diagnosis, undetected disease outbreaks, and maternal mortality.

---

## 💡 The Solution:Health

Nexus Health is a **Gemini-native, offline-first Progressive Web App** that puts AI-powered triage into the hands of every ASHA worker — regardless of internet connectivity.

```
┌─────────────────────────────────────────────────────────┐
│                     HEALTH ARCHITECTURE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📱 ASHA Worker (Android PWA)                           │
│      └── Patient Registration + GPS Capture             │
│      └── Voice Input (Gemini Whisper)                   │
│      └── Offline Queue (Service Worker)                 │
│             │                                           │
│             ▼ (via local WiFi or internet)              │
│                                                         │
│  🏥 PHC Edge Server (Raspberry Pi / Clinic Laptop)      │
│      └── Gemma 2B (Ollama) — Zero Internet Required     │
│      └── Instant triage when 0 internet                 │
│             │                                           │
│             ▼ (when internet available)                 │
│                                                         │
│  ☁️  Google Cloud Run (FastAPI Backend)                  │
│      └── Gemini 1.5 Flash — Deep AI Triage              │
│      └── Google Maps Platform — Outbreak Heatmap        │
│      └── Cloud SQL PostgreSQL — Patient Records         │
│      └── OpenAI GPT-4o — Fallback if Gemini fails       │
│             │                                           │
│             ▼                                           │
│                                                         │
│  🗺️  THO Dashboard (District Health Officer)            │
│      └── Real-time Google Maps outbreak visualization   │
│      └── Bengaluru zone-wise disease analytics          │
│      └── ASHA worker management + rostering             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### For ASHA Workers (Frontline Health Workers)
| Feature | Technology |
|---|---|
| 🎤 Voice-based symptom input | Gemini 1.5 Flash (Whisper) |
| 🧠 Instant AI triage (Red/Yellow/Green) | Gemini 1.5 Flash |
| 🌏 Kannada language support | Gemini Multilingual |
| 📍 GPS-based patient location capture | Browser Geolocation API |
| 📴 Offline mode — works with 0 internet | Service Worker + Gemma 2B |
| 🤰 Childbirth & ANC tracking | Custom health modules |
| 💬 AI medical assistant chat | Gemini 1.5 Flash |

### For District Health Officers (THOs)
| Feature | Technology |
|---|---|
| 🗺️ Real-time outbreak heatmap | Google Maps Platform |
| 📊 Bengaluru zone analytics | Custom React charts |
| 👷 ASHA worker management | FastAPI + PostgreSQL |
| 🚨 Outbreak alert system | FastAPI background tasks |

### System Architecture
| Feature | Technology |
|---|---|
| ⚡ Dual-provider AI fallback | Gemini → Gemma → OpenAI |
| 🐳 Containerized deployment | Docker + Google Cloud Run |
| 🔐 Secure authentication | JWT + bcrypt |
| 🌙 Dark/light mode | CSS custom properties |
| 📱 Installable Android app (PWA) | Service Worker + manifest.json |

---

## 🧠 AI Architecture: Three Layers of Intelligence

### Layer 1: Gemini 1.5 Flash (Cloud)
Primary AI engine for high-complexity tasks:
- Multilingual triage analysis (Kannada, Hindi, English)
- Audio transcription and symptom extraction
- Medical chatbot for ASHA workers
- Outbreak pattern analysis

### Layer 2: Gemma 2B (Edge — Zero Internet)
Running locally via Ollama at the Primary Health Centre:
- Patient medical summary generation
- Instant triage when the PHC has no internet
- Runs on a cheap Raspberry Pi or clinic laptop
- No API calls, no internet dependency

### Layer 3: OpenAI GPT-4o (Fallback)
Enterprise-grade reliability via automatic fallback:
- Activates automatically if Gemini API fails
- Transparent to the ASHA worker — they always get a result
- Ensures zero downtime for critical health decisions

---

## 🗺️ Google Maps Integration

The THO (District Health Officer) dashboard uses the official `@vis.gl/react-google-maps` library to visualize:

- 🔴 **Critical patients** — red pins
- 🟡 **Moderate patients** — yellow pins
- 🟢 **Stable patients** — green pins
- 🟣 **Disease outbreaks** — purple pins with pulse animation

All pins are plotted using real GPS coordinates captured by ASHA workers in the field. The map is centered on Bengaluru with all 10 district zones covered.

---

## 🚀 Tech Stack

### Frontend
- **React 18** + Vite — High-performance UI
- **@vis.gl/react-google-maps** — Official Google Maps
- **CSS Custom Properties** — Professional design system
- **Vite PWA** — Offline-first Progressive Web App

### Backend
- **FastAPI** — Async Python API (3x faster than Django)
- **SQLAlchemy** — Async ORM (SQLite dev → PostgreSQL prod)
- **JWT** — Secure authentication
- **Ollama** — Local Gemma 2B inference engine

### Google Cloud
- **Gemini 1.5 Flash** — Primary AI model
- **Gemma 2B** — Edge/offline AI model
- **Google Maps Platform** — Geospatial visualization
- **Google Cloud Run** — Serverless, auto-scaling backend
- **Google Cloud SQL** — Managed PostgreSQL (production)

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.ai) (for local Gemma inference)
- Google Maps API Key
- Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Sumit-ai-dev/NexusHealth.git
cd NexusHealth
```

### 2. Start Gemma 2B (Offline AI Engine)
```bash
# Install Ollama from https://ollama.ai
ollama pull gemma:2b
ollama serve  # Starts on localhost:11434
```

### 3. Setup Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your API keys to .env

uvicorn main:app --reload --port 8000
```

### 4. Setup Frontend
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Add VITE_GOOGLE_MAPS_API_KEY and VITE_API_URL

npm run dev  # Starts on localhost:5173
```

### 5. Environment Variables

**Backend (`backend/.env`)**
```env
SECRET_KEY=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=sqlite+aiosqlite:///./test.db
# Production: postgresql+asyncpg://user:pass@host/db
```

**Frontend (`frontend/.env`)**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## 🐳 Production Deployment

### Backend → Google Cloud Run
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/nexus-health-backend
gcloud run deploy nexus-health-backend \
  --image gcr.io/YOUR_PROJECT_ID/nexus-health-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### Frontend → Firebase Hosting
```bash
cd frontend
npm run build
firebase deploy
```

---

## 🏗️ Project Structure

```
nexus-health/                          # Google-style monorepo
├── 📁 backend/                        # Python FastAPI REST API
│   ├── main.py                        # App entrypoint + CORS
│   ├── auth.py                        # JWT authentication
│   ├── models.py                      # SQLAlchemy ORM models
│   ├── schemas.py                     # Pydantic validation schemas
│   ├── database.py                    # Async DB connection pool
│   ├── requirements.txt               # Python dependencies
│   └── routes/
│       ├── triage_routes.py           # Gemini AI triage + Gemma fallback
│       ├── user_routes.py             # ASHA worker management
│       └── outbreak_routes.py         # Disease outbreak tracking
│
├── 📁 frontend/                       # React 18 + Vite PWA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── landing/               # Landing + role selection pages
│   │   │   ├── asha/                  # ASHA worker dashboard + forms
│   │   │   └── tho/                   # District health officer dashboard
│   │   ├── components/
│   │   │   ├── common/                # DistrictHeatmap (Google Maps)
│   │   │   ├── asha/                  # ASHA-specific UI components
│   │   │   └── landing/               # Landing page components
│   │   ├── lib/
│   │   │   ├── guestDemoData.js       # Demo patient data (Bengaluru zones)
│   │   │   └── openai.js              # OpenAI fallback client
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── context/                   # Auth + Theme context providers
│   │   └── styles/
│   │       └── globals.css            # Design system tokens + dark mode
│   └── public/
│       ├── manifest.json              # PWA app manifest
│       └── sw.js                      # Service Worker (offline mode)
│
├── 📁 ml/                             # Machine Learning
│   ├── isl_feature/
│   │   ├── inference/
│   │   │   └── isl_detector.py        # Real-time ISL gesture detection
│   │   └── training/
│   │       ├── train.py               # Model training pipeline
│   │       └── convert_to_tfjs.py     # TF.js export for browser inference
│   ├── hand_landmarker.task           # Google MediaPipe hand model
│   ├── extract_landmarks.py           # Dataset landmark extraction
│   ├── train_isl.py                   # Main ISL training entrypoint
│   └── export_tfjs.py                 # TensorFlow.js model export
│
├── 📁 scripts/                        # Utility & Data Migration Scripts
│   ├── replace_demo_locations.py      # Migrate demo data to Karnataka
│   ├── replace_labels.py              # Update UI label strings
│   ├── replace_locale.py              # Kannada localization updates
│   └── replace_triage_labels.py       # Triage severity label updates
│
├── 📁 docs/                           # Documentation
│   └── TRAIN_ISL_PROMPT.md            # ISL model training guide
│
├── 📁 .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI (lint + build)
│
├── .gitignore
└── README.md
```

---

## 🌱 Impact & UN SDG Alignment

| SDG Goal | How Nexus Health Contributes |
|---|---|
| **SDG 3: Good Health** | AI triage in under 30 seconds for 1 billion rural Indians |
| **SDG 10: Reduced Inequalities** | Brings urban-grade AI diagnostics to rural villages |

**Rotaract Areas of Focus:**
- ✅ **Disease Prevention & Treatment** — Real-time outbreak detection via Google Maps
- ✅ **Maternal & Child Health** — ANC tracking, childbirth assistant, high-risk pregnancy alerts

---

## 👥 Team

Built with ❤️ for **GDG Bengaluru Hackathon 2026**

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.
