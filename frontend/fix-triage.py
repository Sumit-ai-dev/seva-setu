import re
import json

with open('src/pages/PatientFormPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import Sidebar from '../components/Sidebar.jsx'",
    "import TopNav from '../components/TopNav.jsx'\nimport GlobalHeader from '../components/GlobalHeader.jsx'"
)

content = content.replace("<Sidebar />", "")

content = re.sub(
    r'<header className="page-header"[\s\S]*?</header>',
    "<GlobalHeader />\n      <TopNav />",
    content
)

MH_DISTRICTS = [
  "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar", 
  "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", 
  "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Bengaluru", "Raigad", "Ratnagiri", 
  "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
]

content = re.sub(
    r'const ALL_DISTRICTS = \[\s*[\s\S]*?\]',
    "const ALL_DISTRICTS = " + json.dumps(MH_DISTRICTS, indent=2),
    content
)

content = re.sub(
    r'const HIGH_RISK = new Set\(\[[^\]]*\]\)',
    'const HIGH_RISK = new Set(["Gadchiroli","Chandrapur","Nagpur","Wardha","Bhandara","Gondia","Amravati","Yavatmal","Akola","Washim","Buldhana","Nandurbar","Dhule"])',
    content
)

content = content.replace('ନୂତନ ରୋଗୀ', 'नवीन रुग्ण')
content = content.replace('ରୋଗୀର ନାମ', 'रुग्णाचे नाव')
content = content.replace('ବୟସ', 'वय')
content = content.replace('ଲିଙ୍ଗ', 'लिंग')
content = content.replace('ପୁରୁଷ', 'पुरुष')
content = content.replace('ମହିଳା', 'महिला')
content = content.replace('ଅନ୍ୟ', 'इतर')
content = content.replace('ଜିଲ୍ଲା', 'जिल्हा')
content = content.replace('ଲକ୍ଷଣ', 'लक्षणे')
content = content.replace('लक्षणे ଦିଅନ୍ତୁ', 'लक्षणे द्या')
content = content.replace('ଦୟାକରି ସବୁ ତଥ୍ୟ ଦିଅନ୍ତୁ', 'कृपया सर्व माहिती द्या')

with open('src/pages/PatientFormPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
