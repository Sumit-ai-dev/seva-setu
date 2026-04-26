# Nexus Health (Swasthya Setu) — Retell AI Voice Agent Knowledge Base

> **Purpose**: This document is the complete knowledge base for the Retell AI voice agent. It covers everything the Nexus Health platform does — from ASHA workers collecting patient data in the field, to AI-powered triage, to live display on the Health Officer's dashboard.

---

## 1. WHAT IS NEXUS HEALTH (SWASTHYA SETU)?

Nexus Health, also known as Swasthya Setu, is an **AI-powered rural healthcare platform** built for India's public health system. It digitizes the work of **ASHA workers** (Accredited Social Health Activists) — the 1 million frontline health workers who visit villages daily. The platform uses **Google Gemini AI** for instant medical triage, supports **voice input in Kannada and Hindi**, and displays all patient data **live on a Health Officer's dashboard** with Google Maps integration.

### Problem We Solve
- ASHA workers record patient data with pen and paper — causing delays
- Remote villages have zero or unreliable internet
- No AI tools exist in local languages (Kannada, Hindi) for health workers
- District Health Officers (THOs) wait days for manual reports about disease outbreaks
- Preventable deaths occur due to delayed diagnosis and undetected outbreaks

### Our Solution
- Mobile-first Progressive Web App (PWA) that works offline
- AI triage in under 30 seconds using Gemini 1.5 Flash
- Voice input in Kannada, Hindi, and English
- Real-time dashboard for Health Officers with outbreak heatmaps
- Indian Sign Language (ISL) detection for deaf patients

---

## 2. WHO ARE THE USERS?

### 2.1 ASHA Workers (Frontline Health Workers)
- **Role**: `asha`
- **What they do**: Visit villages door-to-door, register patients, record symptoms, perform basic health screenings
- **How they use the app**:
  1. Register a new patient (name, age, gender, district, tehsil/taluka)
  2. Describe symptoms via text, voice (Kannada/Hindi/English), or Indian Sign Language
  3. Capture GPS location of the patient
  4. Receive instant AI triage result: RED (Emergency), YELLOW (Moderate), GREEN (Stable)
  5. Get AI-generated precautions and medical advice
  6. Chat with AI medical assistant about the patient
  7. Track childbirth and maternal health cases
- **Login**: Employee ID + password, or guest mode (demo data)
- **District**: Each ASHA worker is assigned to a specific district (e.g., Bengaluru)

### 2.2 THO / District Health Officers
- **Role**: `tho` (Taluka Health Officer)
- **What they do**: Oversee public health for an entire district, manage ASHA workers, monitor disease outbreaks
- **How they use the app**:
  1. View real-time patient triage feed — all records submitted by ASHA workers in their district
  2. See statistics: pending reviews, critical cases, sickle cell risk cases
  3. Review and mark triage records as "Reviewed"
  4. View outbreak heatmap on Google Maps with color-coded pins
  5. Manage ASHA workers assigned to their district
  6. View analytics and zone-wise disease data
- **Login**: Employee ID + password, or guest mode
- **District filtering**: THOs only see data from their assigned district

---

## 3. THE COMPLETE DATA COLLECTION FLOW

### Step 1: Patient Registration (ASHA Worker)
The ASHA worker fills out a patient form with:
- **Patient Name** (ರೋಗಿయ ಹೆಸರು)
- **Age** (ವಯಸ್ಸು)
- **Gender** (ಲಿಂಗ) — Male, Female, or Other
- **Tehsil / Taluka** (ತಾಲೂಕು) — sub-district area
- **District** (ಜಿಲ್ಲೆ) — selected from all 31 Karnataka districts
  - High-risk districts are flagged: Raichur, Yadgir, Kalaburagi, Bidar, Koppal, Ballari, Chamarajanagar, Chitradurga, Vijayapura, Gadag
  - These districts have higher rates of sickle cell disease and malnutrition

### Step 2: Symptom Input (Three Methods)

**Method A — Voice Input (Primary)**:
- Supports three languages: Kannada (ಕನ್ನಡ), Hindi (हिंदी), English
- ASHA worker taps the microphone button and speaks symptoms
- Speech is captured via Web Speech API
- For Kannada/Hindi: the transcript is shown for confirmation, then translated to English using Gemini 1.5 Flash AI
- Translation fallback: if Gemini fails, OpenAI GPT-4o is used

**Method B — Text Input**:
- ASHA worker types symptoms directly in the text field
- Example: "High fever for 3 days, joint pain, fatigue, loss of appetite"

**Method C — Indian Sign Language (ISL)**:
- For deaf/mute patients
- Uses webcam + MediaPipe hand landmark detection
- Real-time gesture recognition via TensorFlow.js model running in the browser
- Detects medical signs like BUKHAR (fever), DARD (pain), etc.
- WebSocket connection sends video frames to backend ISL detector

### Step 3: GPS Location Capture
- ASHA worker taps "Capture Location" button
- Uses browser Geolocation API with high accuracy
- Latitude and longitude are saved with the triage record
- These coordinates appear as pins on the THO's map dashboard

### Step 4: AI Triage Analysis
When the ASHA worker submits the form, the system runs AI triage:

**Primary AI — Gemini 1.5 Flash**:
- Analyzes symptoms against WHO IMNCI (Integrated Management of Neonatal and Childhood Illness) guidelines
- Returns a JSON result with: symptoms list, severity (red/yellow/green), sickle cell risk flag, and a brief clinical summary

**Fallback AI — OpenAI GPT-4o**:
- Activates automatically if Gemini API fails
- Uses the same triage prompt and rules

**Secondary Layer — HuggingFace BART NLI**:
- Uses facebook/bart-large-mnli model for zero-shot classification
- Classifies symptoms into emergency/moderate/stable
- Falls back to WHO keyword-based rules if HF API is unavailable

**Triage Severity Levels**:
- 🔴 **RED (Emergency)**: Convulsions, unconsciousness, inability to drink/feed, high fever with stiff neck, severe chest indrawing, severe malnutrition, infant under 2 months with danger signs, chest pain, severe dehydration, stroke signs
- 🟡 **YELLOW (Moderate)**: Fever for 2-3 days without danger signs, fast breathing without severe signs, moderate dehydration, not eating normally
- 🟢 **GREEN (Stable/Mild)**: Mild cough or cold, no danger signs, feeding normally

**Sickle Cell Disease Rule**:
If the patient's district is one of [Raichur, Yadgir, Kalaburagi, Bidar, Koppal, Ballari, Vijayapura] AND symptoms include fever + joint pain + fatigue → severity is automatically set to RED and sickle_cell_risk is flagged as TRUE.

### Step 5: AI Precautions Generation
After triage, the system generates 3 short precautions for the ASHA worker:
- Each precaution is under 10 words
- Includes a priority level: immediate, within_hours, or monitor_at_home
- Generated by Gemini AI with district context

### Step 6: Record Saving
The triage record is saved in two ways:
1. **Backend API** (POST /api/v1/triage_records/) — saved to the database with patient_id, symptoms, severity, GPS coordinates, district, and the ASHA worker's user_id
2. **Local Storage** (triageStore) — pushed to a shared localStorage key so the THO dashboard gets it instantly, even in the same browser

### Step 7: Duplicate Patient Detection
- Before creating a new patient, the system checks if a patient with the same name, age, and district already exists
- If duplicates are found, a modal shows existing matches with their last triage severity
- ASHA worker can select an existing patient or create a new one

---

## 4. HOW DATA APPEARS ON THE HEALTH OFFICER DASHBOARD

### 4.1 Real-Time Sync
The THO dashboard receives new patient records in real-time through:
1. **Custom DOM events** — when an ASHA worker submits a triage in the same browser, a `seva-setu-triage-update` event fires
2. **Polling** — the dashboard polls for new data every 5 seconds
3. **API fetch** — authenticated THOs get records from the backend API filtered by their district

### 4.2 Dashboard Components

**Stat Cards** (top of dashboard):
- **Pending Review**: Count of triage records not yet reviewed by the THO
- **Critical Cases**: Count of RED severity records
- **Sickle Cell Risk**: Count of records flagged for sickle cell risk

**Patient Triage Feed** (main table):
- Columns: Patient Name, Health Condition, Severity, Status (Reviewed/Pending)
- Sortable by any column
- Clicking a row opens a detailed patient record modal
- Color-coded severity: RED = CRITICAL, YELLOW = MODERATE, GREEN = STABLE

**Activity Calendar**:
- Shows April 2026 with activity indicators
- Days with triage submissions are highlighted
- Clicking a day filters the triage feed to that date

**Review System**:
- THOs can mark records as "Reviewed" (PATCH /api/v1/triage_records/{id}/reviewed)
- Only users with role "tho" can review records

### 4.3 Outbreak Map (Google Maps)
- Located at /dashboard/tho/map
- Uses `@vis.gl/react-google-maps` with AdvancedMarker components
- **Patient pins**: Color-coded circles (🔴 Red = Critical, 🟡 Yellow = Moderate, 🟢 Green = Stable)
- **Outbreak pins**: Purple circles with pulse animation for disease outbreaks
- Pin size scales with number of cases
- Clicking a pin shows an InfoWindow with: total cases, critical/moderate/mild breakdown, last reported date, ASHA worker name
- Map centered on Bengaluru (12.9716, 77.5946) covering all 10 Bengaluru zones: Yelahanka, Kengeri, RR Nagar, Dasarahalli, Bommanahalli, Mahadevapura, KR Puram, Byatarayanapura, Yeshwanthpur, Malleshwaram

### 4.4 ASHA Worker Management
- THOs can view all ASHA workers in their district
- Shows: employee ID, full name, location, district, avatar
- Accessible at /dashboard/tho/ashas

### 4.5 Analytics Page
- Zone-wise disease analytics for Bengaluru
- Accessible at /dashboard/tho/analytics

---

## 5. AI FEATURES IN DETAIL

### 5.1 AI Medical Chat Assistant
- Available to ASHA workers after triaging a patient
- ASHA worker selects a patient, then chats with AI about their condition
- AI has full context: patient name, age, gender, district, triage result, symptom history
- Quick reply buttons in Kannada: "ಯಾವ ಔಷಧಿ ಕೊಡಬೇಕು?" (What medicine to give?), "ಈ ಕೇಸ್ ಎಷ್ಟು ಗಂಭೀರ?" (How serious is this?), "ವೈದ್ಯರಿಗೆ ಕಳಿಸಬೇಕೇ?" (Should I refer to doctor?)
- AI is restricted to medical/healthcare questions only
- Uses Gemini 1.5 Flash with OpenAI fallback

### 5.2 AI Medical Advice Card
- After triage, shows AI-generated medical suggestions
- Calls backend endpoint POST /api/v1/triage_records/ai-suggestion
- Uses Gemini 2.5 Flash with demographic context (age, gender)
- Returns exactly 3 short, actionable bullet points (max 15 words each)

### 5.3 Childbirth & Maternal Health Assistant
- Dedicated AI chat for maternal health guidance
- Covers: pre-natal care, safe delivery, post-natal care, newborn emergencies
- Follows IMNCI newborn protocols
- Danger signs trigger "🔴 REFER IMMEDIATELY" responses
- Voice input supported
- Quick topic chips: Danger Signs, ANC Visits, Newborn Care, Breastfeeding

### 5.4 Indian Sign Language Detection
- Real-time ISL gesture detection via webcam
- Uses MediaPipe hand landmarker for hand tracking
- TensorFlow.js model for sign classification
- Detects medical signs: BUKHAR (fever), DARD (pain), etc.
- WebSocket endpoint at /ws/isl for frame-by-frame processing
- Returns: detected sign, English/Hindi translations, ICD-10 code, urgency level, confidence score

---

## 6. DATA MODELS

### 6.1 Patient
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique patient identifier |
| name | String | Full name of the patient |
| age | Integer | Age in years |
| gender | String | Male, Female, or Other |
| village | String | Patient's village |
| tehsil | String | Tehsil/Taluka (sub-district) |
| district | String | District name (e.g., Bengaluru) |
| pregnant | Boolean | Whether the patient is pregnant |
| abha_id | String | Ayushman Bharat Health Account ID |
| user_id | String | ASHA worker who registered this patient |
| created_at | DateTime | Registration timestamp |

### 6.2 Triage Record
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique record identifier |
| patient_id | String | Links to the Patient |
| patient_name | String | Denormalized patient name |
| caller_phone | String | Phone number (for helpline calls) |
| call_sid | String | Twilio call session ID |
| source | String | "app" or "helpline_call" |
| transcript | String | Voice transcription text |
| symptoms | JSON Array | List of identified symptoms |
| severity | String | "red", "yellow", or "green" |
| sickle_cell_risk | Boolean | Whether sickle cell risk is flagged |
| brief | String | AI-generated clinical summary |
| reviewed | Boolean | Whether THO has reviewed this record |
| tehsil | String | Sub-district area |
| district | String | District name |
| latitude | Float | GPS latitude |
| longitude | Float | GPS longitude |
| user_id | String | ASHA worker who submitted |
| created_at | DateTime | Submission timestamp |

### 6.3 Disease Outbreak
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Outbreak record ID |
| year | Integer | Year of outbreak |
| week | Integer | Epidemiological week number |
| state | String | State name |
| district | String | District name |
| disease | String | Disease name |
| cases | Integer | Number of confirmed cases |
| deaths | Integer | Number of deaths |
| status | String | Outbreak status |
| latitude | Float | Location latitude |
| longitude | Float | Location longitude |

### 6.4 User
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | User identifier |
| employee_id | String | Government employee ID (e.g., ASHA-001, THO-001) |
| role | String | "asha", "tho", or "admin" |
| password_hash | String | Bcrypt hashed password |
| full_name | String | Full name |
| location | String | Work location |
| district | String | Assigned district |

---

## 7. API ENDPOINTS

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/login | Login with employee_id, password, role. Returns JWT token |
| POST | /api/v1/auth/register | Register new user account |

### Patients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/patients/ | List patients (filtered by district for ASHA/THO) |
| POST | /api/v1/patients/ | Create new patient record |

### Triage Records
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/triage_records/ | List triage records (ASHA sees own, THO sees district) |
| POST | /api/v1/triage_records/ | Create new triage record |
| PATCH | /api/v1/triage_records/{id}/reviewed | Mark as reviewed (THO only) |
| POST | /api/v1/triage_records/ai-suggestion | Get AI medical suggestions |

### Disease Outbreaks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/outbreaks/ | List disease outbreaks (optional district filter) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/users/me | Get current user's profile |
| PATCH | /api/v1/users/profile | Update profile (name, location, avatar) |
| GET | /api/v1/users/asha | List ASHA workers (THO only, filtered by district) |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/reviews/ | Submit a review/feedback |
| GET | /api/v1/reviews/ | List all reviews |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check endpoint |
| POST | /incoming-call | Twilio IVR entry point (Hindi voice prompts) |
| POST | /webhook/call | Twilio callback — transcribes audio, runs triage, saves to DB |
| WS | /ws/isl | WebSocket for real-time ISL gesture detection |

---

## 8. PHONE HELPLINE (TWILIO IVR)

For areas without smartphones, patients can call a phone helpline:
1. Patient calls the Twilio number
2. System plays Hindi greeting: "Namaste. Swasthya Setu mein aapka swagat hai. Beep ke baad apne lakshan batayein."
3. Patient describes symptoms after the beep (recorded for up to 60 seconds)
4. Audio is downloaded from Twilio and transcribed (Gemini first, Whisper fallback)
5. Transcription is translated to English, Hindi, and Kannada
6. AI triage is run on the English text
7. Result is saved to the database as source="helpline_call"
8. Patient hears confirmation: "Aapka sandesh record ho gaya hai. Swasthya Setu team aapse jald sampark karegi."

---

## 9. TECHNOLOGY STACK

### Frontend
- **React 18** with Vite build tool
- **React Router v6** for client-side routing
- **@vis.gl/react-google-maps** for Google Maps integration
- **@google/generative-ai** for client-side Gemini AI calls
- **OpenAI SDK** as AI fallback
- **CSS Custom Properties** for theming (dark/light mode)
- **PWA** — installable on Android with service worker for offline support

### Backend
- **FastAPI** (Python) — async REST API
- **SQLAlchemy** with async support — ORM for database
- **SQLite** (development) / **PostgreSQL** (production)
- **JWT authentication** with bcrypt password hashing
- **Google Gemini API** — primary AI provider
- **OpenAI API** — fallback AI provider
- **Twilio** — phone helpline IVR
- **Ollama + Gemma 2B** — edge AI for zero-internet scenarios

### Deployment
- **Backend**: Google Cloud Run (serverless, auto-scaling)
- **Frontend**: Vercel
- **Domain**: swasthsetu.in / swasthsethu.in

---

## 10. GUEST / DEMO MODE

The platform supports a full guest demo mode without login:
- **Guest ASHA**: Gets demo triage records for 20 patients across 10 Bengaluru zones
- **Guest THO**: Sees the same demo data on the dashboard with map visualization
- Demo patients include realistic medical cases: high fever with convulsions, anaemia, ANC tracking, diabetes, TB DOTS, stroke, respiratory distress, malaria, malnutrition, post-partum haemorrhage
- Guest users can still submit new triage records (saved to localStorage)
- New submissions appear instantly on the THO dashboard via localStorage sync

---

## 11. KARNATAKA DISTRICTS COVERED

All 31 districts of Karnataka are available for selection:
Bagalkot, Ballari, Belagavi, Bengaluru Rural, Bengaluru Urban, Bidar, Chamarajanagar, Chikkaballapur, Chikkamagaluru, Chitradurga, Dakshina Kannada, Davanagere, Dharwad, Gadag, Hassan, Haveri, Kalaburagi, Kodagu, Kolar, Koppal, Mandya, Mysuru, Raichur, Ramanagara, Shivamogga, Tumakuru, Udupi, Uttara Kannada, Vijayanagara, Vijayapura, Yadgir

**High-Risk Districts** (flagged for malnutrition & sickle cell screening):
Raichur, Yadgir, Kalaburagi, Koppal, Ballari, Bidar, Chamarajanagar, Chitradurga, Vijayapura, Gadag

---

## 12. BENGALURU ZONES (FOR MAP VISUALIZATION)

| Zone | Latitude | Longitude |
|------|----------|-----------|
| Yelahanka | 13.1007 | 77.5963 |
| Kengeri | 12.9177 | 77.4838 |
| RR Nagar | 12.9274 | 77.5156 |
| Dasarahalli | 13.0441 | 77.5147 |
| Bommanahalli | 12.9030 | 77.6242 |
| Mahadevapura | 12.9880 | 77.6895 |
| KR Puram | 13.0033 | 77.6833 |
| Byatarayanapura | 13.0569 | 77.5975 |
| Yeshwanthpur | 13.0245 | 77.5413 |
| Malleshwaram | 13.0068 | 77.5813 |

---

## 13. UN SDG ALIGNMENT

| SDG Goal | Contribution |
|----------|-------------|
| **SDG 3: Good Health & Well-Being** | AI triage in under 30 seconds for rural Indians |
| **SDG 10: Reduced Inequalities** | Brings urban-grade AI diagnostics to rural villages |

**Rotaract Focus Areas**:
- Disease Prevention & Treatment — real-time outbreak detection via Google Maps
- Maternal & Child Health — ANC tracking, childbirth assistant, high-risk pregnancy alerts

---

## 14. KEY SAMPLE CONVERSATIONS FOR VOICE AGENT

### Scenario 1: Explaining the Platform
**Q**: "What is Nexus Health?"
**A**: "Nexus Health, also called Swasthya Setu, is an AI-powered rural healthcare platform for India. ASHA workers use it to register patients, record symptoms via voice in Kannada or Hindi, and get instant AI triage results showing whether a case is Emergency, Moderate, or Stable. Health Officers see all this data live on their dashboard with a Google Maps outbreak heatmap."

### Scenario 2: How Data Collection Works
**Q**: "How do ASHA workers collect data?"
**A**: "ASHA workers open the app on their phone, register a patient with name, age, gender, and district, then describe symptoms using voice input in Kannada, Hindi, or English, or by typing. They can also capture the patient's GPS location. The AI immediately analyzes the symptoms and gives a triage result — Red for emergency, Yellow for moderate, Green for stable."

### Scenario 3: How THO Dashboard Works
**Q**: "How does the Health Officer see the data?"
**A**: "The Health Officer's dashboard shows all patient triage records in real-time. It has stat cards showing pending reviews, critical cases, and sickle cell risk patients. There's a sortable patient feed, an activity calendar, and a Google Maps view where patient locations appear as color-coded pins — red for critical, yellow for moderate, green for stable."

### Scenario 4: AI Triage
**Q**: "How does the AI triage work?"
**A**: "When an ASHA worker submits symptoms, our AI powered by Google Gemini analyzes them using WHO IMNCI guidelines. It classifies the case as Red emergency, Yellow moderate, or Green stable. For high-risk districts like Raichur or Kalaburagi, if the patient has fever with joint pain and fatigue, the system automatically flags sickle cell risk and escalates to emergency."

### Scenario 5: Offline Mode
**Q**: "Does it work without internet?"
**A**: "Yes. The app is a Progressive Web App that works offline via service workers. For AI triage without internet, we use Gemma 2B running locally via Ollama on a clinic laptop or Raspberry Pi. When internet returns, data syncs to the cloud automatically."

### Scenario 6: Languages
**Q**: "What languages does it support?"
**A**: "The app supports Kannada, Hindi, and English. ASHA workers can speak symptoms in any of these languages. Kannada and Hindi speech is automatically translated to English for AI analysis. The interface has bilingual labels in English and Kannada."

---

## 15. FREQUENTLY ASKED QUESTIONS

**Q: Who built this?**
A: Built for the GDG Bengaluru Hackathon 2026.

**Q: Is patient data secure?**
A: Yes. Authentication uses JWT tokens with bcrypt password hashing. Each ASHA worker only sees their own patients. THOs only see patients in their assigned district.

**Q: What happens if Gemini AI fails?**
A: The system automatically falls back to OpenAI GPT-4o. If that also fails, a WHO keyword-based triage rule engine provides basic classification. The ASHA worker always gets a result.

**Q: Can patients call a phone number instead?**
A: Yes. There's a Twilio-powered phone helpline where patients can call and describe symptoms in Hindi. The audio is transcribed, triaged, and saved automatically.

**Q: What is the sickle cell screening?**
A: In certain high-risk Karnataka districts, if a patient presents with fever, joint pain, and fatigue, the system automatically flags sickle cell risk and escalates to emergency severity for immediate referral.

**Q: How does the map work?**
A: ASHA workers capture GPS coordinates when visiting patients. These appear as color-coded pins on the THO's Google Maps dashboard. Red pins = critical, yellow = moderate, green = stable, purple = disease outbreaks.

**Q: What maternal health features exist?**
A: There's a dedicated Childbirth & Maternal Health AI assistant that guides ASHA workers through pre-natal care, safe delivery practices, post-natal care, and newborn emergencies following IMNCI protocols.

---

*This knowledge base was generated from complete analysis of the Nexus Health codebase on April 26, 2026.*
