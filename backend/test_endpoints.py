import requests

print("\n--- Testing Backend Endpoints ---")

headers = {"Authorization": "Bearer null"} # Guest token test

print("\n1. Testing Patient Creation:")
try:
    resp = requests.post("http://localhost:8000/api/v1/patients/", headers=headers, json={
        "name": "John Doe",
        "age": 45,
        "gender": "male",
        "village": "Test Village",
        "tehsil": "Test Tehsil",
        "district": "Bengaluru"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        patient_id = resp.json().get("id")
        print("Success! Created patient ID:", patient_id)
    else:
        print("Failed:", resp.text)
        patient_id = "test"
except Exception as e:
    print("Error:", e)

print("\n2. Testing Triage Record Save:")
try:
    resp = requests.post("http://localhost:8000/api/v1/triage_records/", headers=headers, json={
        "patient_id": patient_id,
        "patient_name": "John Doe",
        "symptoms": ["high fever", "chills"],
        "severity": "high",
        "brief": "Patient has high fever",
        "district": "Bengaluru"
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Success! Triage record saved.")
    else:
        print("Failed:", resp.text)
except Exception as e:
    print("Error:", e)

print("\n3. Testing Gemini AI Suggestion:")
try:
    resp = requests.post("http://localhost:8000/api/v1/triage_records/ai-suggestion", headers=headers, json={
        "symptoms": ["high fever", "blood in stool"],
        "severity": "Emergency",
        "patient_gender": "Male",
        "patient_age": 58
    })
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print("Success! AI Suggestion received:")
        print(resp.json().get("suggestion"))
    else:
        print("Failed:", resp.text)
except Exception as e:
    print("Error:", e)

