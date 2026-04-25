/**
 * Guest Demo Data
 * Used when a user logs in as guest (no access_token).
 * Provides realistic triage records for both ASHA and THO dashboards.
 */

const now = new Date()
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString()
const hoursAgo = (n) => new Date(now.getTime() - n * 60 * 60 * 1000).toISOString()

// Sangli district taluka centres (lat, lng)
const SANGLI_TALUKAS = {
  'Miraj': { lat: 16.8280, lng: 74.6450 },
  'Kavathe Mahankal': { lat: 16.9100, lng: 74.8300 },
  'Jat': { lat: 17.0480, lng: 75.2340 },
  'Atpadi': { lat: 17.4010, lng: 74.9430 },
  'Khanapur (Vita)': { lat: 17.2790, lng: 74.9690 },
  'Kadegaon': { lat: 17.1200, lng: 74.3500 },
  'Palus': { lat: 17.0140, lng: 74.5350 },
  'Tasgaon': { lat: 17.0330, lng: 74.5980 },
  'Walwa (Islampur)': { lat: 17.0470, lng: 74.3280 },
  'Shirala': { lat: 17.0750, lng: 74.0530 },
}

export const GUEST_TRIAGE_RECORDS = [
  // ── Miraj ──────────────────────────────────────────────────────────────────
  {
    id: 'demo-001',
    patient_id: 'p-001',
    patient_name: 'Meera Shinde',
    age: 28,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Miraj',
    severity: 'red',
    health_condition: 'High fever, convulsions',
    brief: 'High fever 104°F with convulsions since morning — immediate referral',
    created_at: hoursAgo(2), reviewed: false, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Miraj'].lat, longitude: SANGLI_TALUKAS['Miraj'].lng,
  },
  {
    id: 'demo-002',
    patient_id: 'p-002',
    patient_name: 'Raju Pawar',
    age: 45,
    gender: 'Male',
    district: 'Sangli',
    tehsil: 'Miraj',
    severity: 'red',
    health_condition: 'Chest pain, breathlessness',
    brief: 'Moderate chest discomfort, SpO₂ 94%, referred to Miraj Medical College',
    created_at: hoursAgo(5), reviewed: false, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Miraj'].lat + 0.015, longitude: SANGLI_TALUKAS['Miraj'].lng - 0.010,
  },
  // ── Kavathe Mahankal ───────────────────────────────────────────────────────
  {
    id: 'demo-003',
    patient_id: 'p-003',
    patient_name: 'Sunita Kamble',
    age: 32,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Kavathe Mahankal',
    severity: 'yellow',
    health_condition: 'Anaemia, fatigue',
    brief: 'Pale skin, Hb 7.4 — IFA supplementation started, follow-up in 2 weeks',
    created_at: hoursAgo(8), reviewed: false, sickle_cell_risk: true,
    latitude: SANGLI_TALUKAS['Kavathe Mahankal'].lat, longitude: SANGLI_TALUKAS['Kavathe Mahankal'].lng,
  },
  {
    id: 'demo-004',
    patient_id: 'p-004',
    patient_name: 'Anita More',
    age: 24,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Kavathe Mahankal',
    severity: 'yellow',
    health_condition: 'Ante-natal care — 3rd trimester',
    brief: '7 months pregnant, BP 148/96, mild pedal oedema — referred for monitoring',
    created_at: hoursAgo(12), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Kavathe Mahankal'].lat - 0.010, longitude: SANGLI_TALUKAS['Kavathe Mahankal'].lng + 0.012,
  },
  // ── Jat ────────────────────────────────────────────────────────────────────
  {
    id: 'demo-005',
    patient_id: 'p-005',
    patient_name: 'Kishore Jadhav',
    age: 58,
    gender: 'Male',
    district: 'Sangli',
    tehsil: 'Jat',
    severity: 'yellow',
    health_condition: 'Diabetes, foot ulcer',
    brief: 'Poorly controlled T2DM, infected ulcer left foot — wound care initiated',
    created_at: daysAgo(1), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Jat'].lat, longitude: SANGLI_TALUKAS['Jat'].lng,
  },
  {
    id: 'demo-006',
    patient_id: 'p-006',
    patient_name: 'Lakshmi Bhosale',
    age: 9,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Jat',
    severity: 'red',
    health_condition: 'Acute diarrhoea, severe dehydration',
    brief: 'Sunken eyes, dry tongue, 8+ loose stools/day — ORS + IV fluids started',
    created_at: daysAgo(1), reviewed: false, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Jat'].lat + 0.020, longitude: SANGLI_TALUKAS['Jat'].lng - 0.015,
  },
  // ── Atpadi ─────────────────────────────────────────────────────────────────
  {
    id: 'demo-007',
    patient_id: 'p-007',
    patient_name: 'Prakash Nair',
    age: 67,
    gender: 'Male',
    district: 'Sangli',
    tehsil: 'Atpadi',
    severity: 'green',
    health_condition: 'Hypertension follow-up',
    brief: 'BP 136/86 — stable on amlodipine, monthly review completed',
    created_at: daysAgo(2), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Atpadi'].lat, longitude: SANGLI_TALUKAS['Atpadi'].lng,
  },
  {
    id: 'demo-008',
    patient_id: 'p-008',
    patient_name: 'Kavya Reddy',
    age: 19,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Atpadi',
    severity: 'green',
    health_condition: 'Immunisation — DPT booster',
    brief: 'Routine DPT booster administered, no adverse reactions',
    created_at: daysAgo(2), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Atpadi'].lat - 0.012, longitude: SANGLI_TALUKAS['Atpadi'].lng + 0.008,
  },
  // ── Khanapur (Vita) ────────────────────────────────────────────────────────
  {
    id: 'demo-009',
    patient_id: 'p-009',
    patient_name: 'Ramesh Yadav',
    age: 41,
    gender: 'Male',
    district: 'Sangli',
    tehsil: 'Khanapur (Vita)',
    severity: 'yellow',
    health_condition: 'TB — DOTS day 45',
    brief: 'Mild weight loss, persistent cough — DOTS adherence confirmed, sputum re-test ordered',
    created_at: daysAgo(3), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Khanapur (Vita)'].lat, longitude: SANGLI_TALUKAS['Khanapur (Vita)'].lng,
  },
  {
    id: 'demo-010', patient_id: 'p-010',
    patient_name: 'Shalini Desai', age: 35, gender: 'Female',
    district: 'Sangli', tehsil: 'Khanapur (Vita)',
    severity: 'green',
    health_condition: 'Post-natal visit — day 21',
    brief: 'Mother and infant healthy, breastfeeding well, weight gain on track',
    created_at: daysAgo(3), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Khanapur (Vita)'].lat + 0.010, longitude: SANGLI_TALUKAS['Khanapur (Vita)'].lng - 0.010,
  },
  // ── Kadegaon ───────────────────────────────────────────────────────────────
  {
    id: 'demo-011', patient_id: 'p-011',
    patient_name: 'Gopal Deshmukh', age: 72, gender: 'Male',
    district: 'Sangli', tehsil: 'Kadegaon',
    severity: 'red',
    health_condition: 'Stroke — FAST positive',
    brief: 'Sudden facial droop, left arm weakness, slurred speech since 6 AM — emergency referral',
    created_at: daysAgo(4), reviewed: false, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Kadegaon'].lat, longitude: SANGLI_TALUKAS['Kadegaon'].lng,
  },
  {
    id: 'demo-012', patient_id: 'p-012',
    patient_name: 'Rohini Sawant', age: 26, gender: 'Female',
    district: 'Sangli', tehsil: 'Kadegaon',
    severity: 'green',
    health_condition: 'Family planning counselling',
    brief: 'IUD insertion completed, no complications, next review in 6 weeks',
    created_at: daysAgo(4), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Kadegaon'].lat - 0.008, longitude: SANGLI_TALUKAS['Kadegaon'].lng + 0.015,
  },
  // ── Palus ──────────────────────────────────────────────────────────────────
  {
    id: 'demo-013',
    patient_id: 'p-013',
    patient_name: 'Vijay Kumar',
    age: 53,
    gender: 'Male',
    district: 'Sangli',
    tehsil: 'Palus',
    severity: 'yellow',
    health_condition: 'Malaria — P. vivax confirmed',
    brief: 'RDT positive P.vivax, 48h fever cycles — chloroquine course started',
    created_at: daysAgo(5), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Palus'].lat, longitude: SANGLI_TALUKAS['Palus'].lng,
  },
  {
    id: 'demo-014', patient_id: 'p-014',
    patient_name: 'Priya Chavan', age: 14, gender: 'Female',
    district: 'Sangli', tehsil: 'Palus',
    severity: 'green',
    health_condition: 'Nutritional assessment',
    brief: 'MUAC 14.2 cm, weight-for-age normal, growth on track',
    created_at: daysAgo(5), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Palus'].lat + 0.012, longitude: SANGLI_TALUKAS['Palus'].lng - 0.008,
  },
  // ── Tasgaon ────────────────────────────────────────────────────────────────
  {
    id: 'demo-015', patient_id: 'p-015',
    patient_name: 'Manoj Kore', age: 38, gender: 'Male',
    district: 'Sangli', tehsil: 'Tasgaon',
    severity: 'yellow',
    health_condition: 'Snake bite — non-venomous',
    brief: 'Local swelling, no systemic signs — anti-histamine given, observation for 24h',
    created_at: daysAgo(6), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Tasgaon'].lat, longitude: SANGLI_TALUKAS['Tasgaon'].lng,
  },
  {
    id: 'demo-016', patient_id: 'p-016',
    patient_name: 'Deepa Salunkhe', age: 29, gender: 'Female',
    district: 'Sangli', tehsil: 'Tasgaon',
    severity: 'green',
    health_condition: 'ANC — 1st trimester',
    brief: '10 weeks pregnant, IFA + folic acid started, BP and Hb normal',
    created_at: daysAgo(6), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Tasgaon'].lat - 0.010, longitude: SANGLI_TALUKAS['Tasgaon'].lng + 0.012,
  },
  // ── Walwa (Islampur) ───────────────────────────────────────────────────────
  {
    id: 'demo-017', patient_id: 'p-017',
    patient_name: 'Suresh Gaikwad', age: 62, gender: 'Male',
    district: 'Sangli', tehsil: 'Walwa (Islampur)',
    severity: 'red',
    health_condition: 'Respiratory distress',
    brief: 'SpO₂ 83%, bilateral crackles, possible pneumonia — oxygen started, urgent referral',
    created_at: daysAgo(7), reviewed: false, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Walwa (Islampur)'].lat, longitude: SANGLI_TALUKAS['Walwa (Islampur)'].lng,
  },
  {
    id: 'demo-018', patient_id: 'p-018',
    patient_name: 'Nita Bhosale', age: 44, gender: 'Female',
    district: 'Sangli', tehsil: 'Walwa (Islampur)',
    severity: 'green',
    health_condition: 'Cervical cancer screening — VIA',
    brief: 'VIA negative, no acetowhite lesions — next screen in 3 years',
    created_at: daysAgo(8), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Walwa (Islampur)'].lat + 0.008, longitude: SANGLI_TALUKAS['Walwa (Islampur)'].lng - 0.012,
  },
  // ── Shirala ────────────────────────────────────────────────────────────────
  {
    id: 'demo-019', patient_id: 'p-019',
    patient_name: 'Arjun Patil', age: 5, gender: 'Male',
    district: 'Sangli', tehsil: 'Shirala',
    severity: 'yellow',
    health_condition: 'Moderate acute malnutrition',
    brief: 'WAZ -2.5, MUAC 11.6 cm — enrolled in NRC, therapeutic feeding started',
    created_at: daysAgo(9), reviewed: false, sickle_cell_risk: true,
    latitude: SANGLI_TALUKAS['Shirala'].lat, longitude: SANGLI_TALUKAS['Shirala'].lng,
  },
  {
    id: 'demo-020',
    patient_id: 'p-020',
    patient_name: 'Rekha Mishra',
    age: 33,
    gender: 'Female',
    district: 'Sangli',
    tehsil: 'Shirala',
    severity: 'red',
    health_condition: 'Post-partum haemorrhage',
    brief: 'Excessive bleeding 4h post-delivery, uterine atony suspected — emergency referral to Sangli Civil Hospital',
    created_at: daysAgo(10), reviewed: true, sickle_cell_risk: false,
    latitude: SANGLI_TALUKAS['Shirala'].lat - 0.015, longitude: SANGLI_TALUKAS['Shirala'].lng + 0.010,
  },
]

/**
 * Groups the records into patient objects for the ASHA dashboard format.
 */
export function buildAshaPatients(records) {
  const grouped = new Map()
  for (const r of records) {
    const k = `${(r.patient_name || '').toLowerCase()}_${r.age}_${r.tehsil || r.district}`
    if (!grouped.has(k)) {
      grouped.set(k, {
        id: r.patient_id || k,
        name: r.patient_name,
        age: r.age,
        gender: r.gender,
        district: r.district,
        tehsil: r.tehsil,
        triage_records: [],
      })
    }
    grouped.get(k).triage_records.push({
      id: r.id,
      severity: r.severity,
      brief: r.brief,
      created_at: r.created_at,
    })
  }
  return Array.from(grouped.values()).map((p) => {
    p.triage_records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    p.latestSeverity = p.triage_records[0]?.severity || null
    return p
  })
}

export const GUEST_ASHA_WORKERS = [
  { id: 'user-001', employee_id: 'ASHA-001', full_name: 'Priya Sharma', location: 'Miraj', district: 'Sangli' },
  { id: 'user-002', employee_id: 'ASHA-002', full_name: 'Anita Kamble', location: 'Kavathe Mahankal', district: 'Sangli' },
  { id: 'user-003', employee_id: 'ASHA-003', full_name: 'Sunita Bhosale', location: 'Jat', district: 'Sangli' },
  { id: 'user-004', employee_id: 'ASHA-004', full_name: 'Rekha Patil', location: 'Atpadi', district: 'Sangli' },
  { id: 'user-005', employee_id: 'ASHA-005', full_name: 'Maya Deshmukh', location: 'Khanapur (Vita)', district: 'Sangli' },
  { id: 'user-006', employee_id: 'ASHA-006', full_name: 'Sushma More', location: 'Kadegaon', district: 'Sangli' },
  { id: 'user-007', employee_id: 'ASHA-007', full_name: 'Pooja Jadhav', location: 'Palus', district: 'Sangli' },
  { id: 'user-008', employee_id: 'ASHA-008', full_name: 'Kavita Chavan', location: 'Tasgaon', district: 'Sangli' },
  { id: 'user-009', employee_id: 'ASHA-009', full_name: 'Anjali Shinde', location: 'Walwa (Islampur)', district: 'Sangli' },
  { id: 'user-010', employee_id: 'ASHA-010', full_name: 'Lata Kadam', location: 'Shirala', district: 'Sangli' }
]

export const GUEST_REVIEWS = [
  {
    id: 'guest-rev-1',
    userName: 'Kalyani Dash',
    role: 'asha',
    designation: 'ASHA Worker',
    location: 'Village Alpha, Odisha',
    overall: 5,
    comment: "Nexus Health has made my daily home visits so much more organized. The offline mode is a lifesaver in our village where network is patchy.",
  },
  {
    id: 'guest-rev-2',
    userName: 'Dr. Ramesh Pradhan',
    role: 'tho',
    designation: 'Block Medical Officer',
    location: 'Bhubaneswar',
    overall: 5,
    comment: "The real-time tracking of disease outbreaks in my block allows us to deploy resources much faster than before. Truly a game changer for public health.",
  },
  {
    id: 'guest-rev-3',
    userName: 'Meena Kumari',
    role: 'asha',
    designation: 'ASHA Worker',
    location: 'Village Beta, Odisha',
    overall: 4,
    comment: "The voice triage feature helps me record symptoms quickly even when I am busy with patients. It makes documentation so much easier!",
  }
]
