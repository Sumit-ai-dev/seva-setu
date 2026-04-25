const fs = require('fs');
let file = fs.readFileSync('src/pages/PatientFormPage.jsx', 'utf8');

// 1. Swap Sidebar for GlobalHeader & TopNav
file = file.replace(
  "import Sidebar from '../components/Sidebar.jsx'",
  "import TopNav from '../components/TopNav.jsx'\nimport GlobalHeader from '../components/GlobalHeader.jsx'"
);

// 2. Remove Sidebar mount
file = file.replace("<Sidebar />", "");

// 3. Replace the header block using regex
file = file.replace(
  /<header className="page-header"[\s\S]*?<\/header>/g,
  "<GlobalHeader />\n      <TopNav />"
);

// 4. Update MH Districts
const MH_DISTRICTS = [
  "Ahilyanagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Chhatrapati Sambhajinagar", 
  "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", 
  "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", 
  "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
];
file = file.replace(
  /const ALL_DISTRICTS = \[\s*[\s\S]*?\]/,
  "const ALL_DISTRICTS = " + JSON.stringify(MH_DISTRICTS, null, 2)
);

// 5. Update high risk MH districts
file = file.replace(
  /const HIGH_RISK = new Set\(\[[^\]]*\]\)/,
  'const HIGH_RISK = new Set(["Gadchiroli","Chandrapur","Nagpur","Wardha","Bhandara","Gondia","Amravati","Yavatmal","Akola","Washim","Buldhana","Nandurbar","Dhule"])'
);

// 6. Marathi strings
file = file.replace(/ନୂତନ ରୋଗୀ/g, 'नवीन रुग्ण');
file = file.replace(/ରୋଗୀର ନାମ/g, 'रुग्णाचे नाव');
file = file.replace(/ବୟସ/g, 'वय');
file = file.replace(/ଲିଙ୍ଗ/g, 'लिंग');
file = file.replace(/ପୁରୁଷ/g, 'पुरुष');
file = file.replace(/ମହିଳା/g, 'महिला');
file = file.replace(/ଅନ୍ୟ/g, 'इतर');
file = file.replace(/ଜିଲ୍ଲା/g, 'जिल्हा');
file = file.replace(/ଲକ୍ଷଣ/g, 'लक्षणे');
file = file.replace(/लक्षणे ଦିଅନ୍ତୁ/g, 'लक्षणे द्या');
file = file.replace(/ଦୟାକରି ସବୁ ତଥ୍ୟ ଦିଅନ୍ତୁ/g, 'कृपया सर्व माहिती द्या');

fs.writeFileSync('src/pages/PatientFormPage.jsx', file);
console.log("PatientFormPage cleanly fixed!");
