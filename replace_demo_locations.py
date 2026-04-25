import os

file_path = "frontend/src/lib/guestDemoData.js"

with open(file_path, "r") as f:
    content = f.read()

replacements = {
    "'Sangli'": "'Bengaluru'",
    "Sangli district taluka": "Bengaluru district zones",
    "SANGLI_TALUKAS": "BENGALURU_ZONES",
    "'Miraj'": "'Yelahanka'",
    "'Kavathe Mahankal'": "'Kengeri'",
    "'Jat'": "'RR Nagar'",
    "'Atpadi'": "'Dasarahalli'",
    "'Khanapur (Vita)'": "'Bommanahalli'",
    "'Kadegaon'": "'Mahadevapura'",
    "'Palus'": "'KR Puram'",
    "'Tasgaon'": "'Byatarayanapura'",
    "'Walwa (Islampur)'": "'Yeshwanthpur'",
    "'Shirala'": "'Malleshwaram'",
    "Sangli Civil Hospital": "Victoria Hospital",
    "Miraj Medical College": "BMCRI"
}

coords = {
    "'Yelahanka': { lat: 16.8280, lng: 74.6450 }": "'Yelahanka': { lat: 13.1007, lng: 77.5963 }",
    "'Kengeri': { lat: 16.9100, lng: 74.8300 }": "'Kengeri': { lat: 12.9177, lng: 77.4838 }",
    "'RR Nagar': { lat: 17.0480, lng: 75.2340 }": "'RR Nagar': { lat: 12.9274, lng: 77.5156 }",
    "'Dasarahalli': { lat: 17.4010, lng: 74.9430 }": "'Dasarahalli': { lat: 13.0441, lng: 77.5147 }",
    "'Bommanahalli': { lat: 17.2790, lng: 74.9690 }": "'Bommanahalli': { lat: 12.9030, lng: 77.6242 }",
    "'Mahadevapura': { lat: 17.1200, lng: 74.3500 }": "'Mahadevapura': { lat: 12.9880, lng: 77.6895 }",
    "'KR Puram': { lat: 17.0140, lng: 74.5350 }": "'KR Puram': { lat: 13.0033, lng: 77.6833 }",
    "'Byatarayanapura': { lat: 17.0330, lng: 74.5980 }": "'Byatarayanapura': { lat: 13.0569, lng: 77.5975 }",
    "'Yeshwanthpur': { lat: 17.0470, lng: 74.3280 }": "'Yeshwanthpur': { lat: 13.0245, lng: 77.5413 }",
    "'Malleshwaram': { lat: 17.0750, lng: 74.0530 }": "'Malleshwaram': { lat: 13.0068, lng: 77.5813 }"
}

for old, new in replacements.items():
    content = content.replace(old, new)

for old, new in coords.items():
    content = content.replace(old, new)

with open(file_path, "w") as f:
    f.write(content)

print("Updated guestDemoData.js to Karnataka locations")
