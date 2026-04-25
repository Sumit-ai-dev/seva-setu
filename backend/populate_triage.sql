-- FINAL SEED DATA FOR TRIAGE ANALYTICS (3 WEEKS)
-- This script ensures your user account is aligned with the 'Sangli' district.

-- 1. ALIGN YOUR ACCOUNT (Update all THO users to Sangli so you see the data)
UPDATE users SET district = 'Sangli' WHERE role = 'tho';
UPDATE users SET location = 'Miraj' WHERE role = 'tho';

-- 2. Ensure at least one ASHA worker exists for the district
INSERT INTO users (id, employee_id, role, password_hash, full_name, location, district, created_at)
VALUES 
('seed-asha-001', 'ASHA-SEED-01', 'asha', '$2b$12$dummyhash', 'Asha Pawar', 'Miraj', 'Sangli', NOW() - INTERVAL '40 days')
ON CONFLICT (employee_id) DO NOTHING;

-- 3. Insert dummy patients
INSERT INTO patients (id, name, age, gender, village, tehsil, district, user_id, created_at)
VALUES
('p-seed-001', 'Ramesh Patil', 45, 'Male', 'Miraj', 'Miraj', 'Sangli', 'seed-asha-001', NOW() - INTERVAL '35 days'),
('p-seed-002', 'Sita Deshmukh', 32, 'Female', 'Miraj', 'Miraj', 'Sangli', 'seed-asha-001', NOW() - INTERVAL '35 days'),
('p-seed-003', 'Vijay Shinde', 58, 'Male', 'Miraj', 'Miraj', 'Sangli', 'seed-asha-001', NOW() - INTERVAL '35 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Clear existing seed records to avoid duplicates (optional but cleaner)
DELETE FROM triage_records WHERE id LIKE 'tr-seed-%';

-- 5. Insert Triage Records for EXACTLY 3 weeks for Miraj
-- WEEK 3 (Oldest: 14-21 days ago)
INSERT INTO triage_records (id, patient_id, patient_name, severity, tehsil, district, user_id, brief, created_at) VALUES
('tr-seed-w3-01', 'p-seed-001', 'Ramesh Patil', 'red', 'Miraj', 'Sangli', 'seed-asha-001', 'Critical', NOW() - INTERVAL '18 days'),
('tr-seed-w3-02', 'p-seed-002', 'Sita Deshmukh', 'yellow', 'Miraj', 'Sangli', 'seed-asha-001', 'Moderate', NOW() - INTERVAL '17 days'),
('tr-seed-w3-03', 'p-seed-003', 'Vijay Shinde', 'green', 'Miraj', 'Sangli', 'seed-asha-001', 'Stable', NOW() - INTERVAL '16 days');

-- WEEK 2 (7-14 days ago)
INSERT INTO triage_records (id, patient_id, patient_name, severity, tehsil, district, user_id, brief, created_at) VALUES
('tr-seed-w2-01', 'p-seed-001', 'Ramesh Patil', 'red', 'Miraj', 'Sangli', 'seed-asha-001', 'Relapse', NOW() - INTERVAL '10 days'),
('tr-seed-w2-02', 'p-seed-002', 'Sita Deshmukh', 'yellow', 'Miraj', 'Sangli', 'seed-asha-001', 'Fever', NOW() - INTERVAL '9 days'),
('tr-seed-w2-03', 'p-seed-001', 'Ramesh Patil', 'red', 'Miraj', 'Sangli', 'seed-asha-001', 'Urgent', NOW() - INTERVAL '11 days');

-- WEEK 1 (Current: 0-7 days ago)
INSERT INTO triage_records (id, patient_id, patient_name, severity, tehsil, district, user_id, brief, created_at) VALUES
('tr-seed-w1-01', 'p-seed-001', 'Ramesh Patil', 'green', 'Miraj', 'Sangli', 'seed-asha-001', 'Recovering', NOW() - INTERVAL '2 days'),
('tr-seed-w1-02', 'p-seed-002', 'Sita Deshmukh', 'yellow', 'Miraj', 'Sangli', 'seed-asha-001', 'Checkup', NOW() - INTERVAL '3 days'),
('tr-seed-w1-03', 'p-seed-003', 'Vijay Shinde', 'red', 'Miraj', 'Sangli', 'seed-asha-001', 'New admission', NOW() - INTERVAL '4 days');
