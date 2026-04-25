import fs from 'fs';

const mhd = [
  'Ahilyanagar', 'Akola', 'Amravati', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Chhatrapati Sambhajinagar',
  'Dharashiv', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City',
  'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Palghar', 'Parbhani', 'Bengaluru', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
];
const hrmh = ['Gadchiroli', 'Chandrapur', 'Nagpur', 'Wardha', 'Bhandara', 'Gondia', 'Amravati', 'Yavatmal', 'Akola', 'Washim', 'Buldhana', 'Nandurbar', 'Dhule'];

try {
  // HomePage.jsx
  let hp = fs.readFileSync('src/pages/HomePage.jsx', 'utf8');
  hp = hp.replace(/const ALL_DISTRICTS = \[\s*[\s\S]*?\s*\]/, 'const ALL_DISTRICTS = ' + JSON.stringify(mhd, null, 2));
  hp = hp.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  hp = hp.replaceAll('ଡ୍ୟାଶବୋର୍ଡ', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್');
  hp = hp.replaceAll('ନୂତନ ରୋଗୀ', 'नवीन रुग्ण');
  hp = hp.replaceAll('ଜରୁରୀ', 'ತುರ್ತು');
  hp = hp.replaceAll('ମଧ୍ୟମ', 'ಸಾಧಾರಣ');
  hp = hp.replaceAll('ସ୍ଥିର', 'ಸ್ಥಿರ');
  hp = hp.replaceAll('ତ୍ରୁଟି ଘଟିଛି', 'काहीतरी चूक झाली');
  hp = hp.replaceAll('ପୁନଃ ଚେଷ୍ଟା', 'पुन्हा प्रयत्न करा');
  hp = hp.replaceAll('କୋଣସି ରୋଗୀ ମିଳିଲା ନାହିଁ', 'कोणतेही रुग्ण आढळले नाहीत');
  hp = hp.replaceAll('ଆହୁରି ଦେଖନ୍ତୁ', 'आणखी पहा');
  // Remove Severity tabs from HomePage:
  hp = hp.replace(/\{\/\* Severity tabs \*\/\}\s*\n\s*\<div style=\{\{ display: 'flex'[\s\S]*?\<\/div\>/, '');
  fs.writeFileSync('src/pages/HomePage.jsx', hp);

  // PatientFormPage.jsx
  let pf = fs.readFileSync('src/pages/PatientFormPage.jsx', 'utf8');
  pf = pf.replace(/const ALL_DISTRICTS = \[\s*[\s\S]*?\s*\]/, 'const ALL_DISTRICTS = ' + JSON.stringify(mhd, null, 2));
  pf = pf.replace(/const HIGH_RISK = new Set\(\[\s*[\s\S]*?\s*\]\)/, 'const HIGH_RISK = new Set(' + JSON.stringify(hrmh) + ')');

  pf = pf.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  pf = pf.replaceAll('ଏହି ରୋଗୀ ଆଗରୁ ଅଛନ୍ତି', 'हा रुग्ण आधीच अस्तित्वात आहे');
  pf = pf.replaceAll('ନାମ:', 'नाव:');
  pf = pf.replaceAll('ବୟସ:', 'वय:');
  pf = pf.replaceAll('ଜିଲ୍ଲା:', 'जिल्हा:');
  pf = pf.replaceAll('ନା, ନୂଆ ରୋଗୀ', 'नाही, नवीन रुग्ण');
  pf = pf.replaceAll('ନୂତନ ରୋଗୀ', 'नवीन रुग्ण');
  pf = pf.replaceAll('ରୋଗୀର ନାମ', 'रुग्णाचे नाव');
  pf = pf.replaceAll('ବୟସ', 'वय');
  pf = pf.replaceAll('ଲିଙ୍ଗ', 'लिंग');
  pf = pf.replaceAll('ପୁରୁଷ', 'पुरुष');
  pf = pf.replaceAll('ମହିଳା', 'महिला');
  pf = pf.replaceAll('ଅନ୍ୟ', 'इतर');
  pf = pf.replaceAll('ଜିଲ୍ଲା', 'जिल्हा');
  pf = pf.replaceAll('ଉଚ୍ଚ-ଝୁଁକି ଜିଲ୍ଲା', 'उच्च-धोका असलेले जिल्हे');
  pf = pf.replaceAll('ଅନ୍ୟ ଜିଲ୍ଲା', 'इतर जिल्हे');
  pf = pf.replaceAll('ଲକ୍ଷଣ ବର୍ଣ୍ଣନା କରନ୍ତୁ', 'लक्षणांचे वर्णन करा');
  pf = pf.replace("{ code: 'or-IN', label: 'ଓଡ଼ିଆ' }", "{ code: 'mr-IN', label: 'मराठी' }");
  pf = pf.replaceAll("'or-IN'", "'mr-IN'");
  pf = pf.replace("'or-IN': { speak: 'ଲକ୍ଷଣ କୁହନ୍ତୁ', recording: 'ଶୁଣୁଛି… କହନ୍ତୁ', translating: 'ଅନୁବାଦ ହେଉଛି…' }", "'mr-IN': { speak: 'लक्षणे सांगा', recording: 'ऐकत आहे... बोला', translating: 'भाषांतर होत आहे...' }");
  pf = pf.replaceAll('Odia voice', 'Kannada voice');
  pf = pf.replaceAll('ଓଡ଼ିଆ', 'मराठी');
  pf = pf.replaceAll('ସାଙ୍କେତିକ ଭାଷା', 'ಸೈನ್ ಭಾಷೆ');
  pf = pf.replaceAll('ବିଶ୍ଳେଷଣ କରୁଛି…', 'विश्लेषण करत आहे...');
  pf = pf.replaceAll('ବିଶ୍ଳେଷଣ କରନ୍ତୁ', 'विश्लेषण करा');
  pf = pf.replaceAll('ସତର୍କତା: ସିକଲ ସେଲ ଆଶଙ୍କା', 'चेतावणी: सिकलसेलचा धोका');
  pf = pf.replaceAll('💬 AI ସହ ପଚାରନ୍ତୁ', '💬 AI ला विचारा');
  fs.writeFileSync('src/pages/PatientFormPage.jsx', pf);

  // Sidebar.jsx
  let sb = fs.readFileSync('src/components/Sidebar.jsx', 'utf8');
  sb = sb.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  sb = sb.replaceAll('ଡ୍ୟାଶବୋର୍ଡ', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್');
  sb = sb.replaceAll('ରୋଗୀ ଟ୍ରାଏଜ', 'ರೋಗಿಯ ಟ್ರಯಾಜ್');
  sb = sb.replaceAll('AI ଚ୍ୟାଟ', 'AI ಚಾಟ್');
  sb = sb.replaceAll('ସଙ୍କେତ', 'ಸೈನ್ ಭಾಷೆ');
  sb = sb.replaceAll('ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ', 'आरोग्य सेतू');
  sb = sb.replaceAll('ଲଗ ଆଉଟ', 'लॉग आउट');
  fs.writeFileSync('src/components/Sidebar.jsx', sb);

  // ISLPage.jsx
  let isl = fs.readFileSync('src/pages/ISLPage.jsx', 'utf8');
  isl = isl.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  isl = isl.replaceAll('ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ', 'आरोग्य सेतू');
  isl = isl.replaceAll('ସାଙ୍କେତିକ ଭାଷା', 'ಸೈನ್ ಭಾಷೆ');
  fs.writeFileSync('src/pages/ISLPage.jsx', isl);

  // ChatPage.jsx
  let chat = fs.readFileSync('src/pages/ChatPage.jsx', 'utf8');
  chat = chat.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  chat = chat.replaceAll('ଓଡ଼ିଆ', 'मराठी');
  chat = chat.replace(/odia\:/g, 'kannada:');
  fs.writeFileSync('src/pages/ChatPage.jsx', chat);

  // TriageCard.jsx
  if (fs.existsSync('src/components/TriageCard.jsx')) {
    let tc = fs.readFileSync('src/components/TriageCard.jsx', 'utf8');
    tc = tc.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    tc = tc.replaceAll('ସୁରକ୍ଷିତ', 'ಸುರಕ್ಷಿತ');
    tc = tc.replaceAll('ମଧ୍ୟମ', 'ಸಾಧಾರಣ');
    tc = tc.replaceAll('ଜରୁରୀ', 'ತುರ್ತು');
    tc = tc.replace(/odia\:/g, 'kannada:');
    fs.writeFileSync('src/components/TriageCard.jsx', tc);
  }

  // Globals.css
  let css = fs.readFileSync('src/styles/globals.css', 'utf8');
  css = css.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
  fs.writeFileSync('src/styles/globals.css', css);

  // RoleSelectionPage.jsx
  if (fs.existsSync('src/pages/RoleSelectionPage.jsx')) {
    let rs = fs.readFileSync('src/pages/RoleSelectionPage.jsx', 'utf8');
    rs = rs.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    fs.writeFileSync('src/pages/RoleSelectionPage.jsx', rs);
  }
  
  // DMOLoginPage.jsx
  if (fs.existsSync('src/pages/DMOLoginPage.jsx')) {
    let dl = fs.readFileSync('src/pages/DMOLoginPage.jsx', 'utf8');
    dl = dl.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    fs.writeFileSync('src/pages/DMOLoginPage.jsx', dl);
  }

  // ChildbirthPage.jsx
  if (fs.existsSync('src/pages/ChildbirthPage.jsx')) {
    let cb = fs.readFileSync('src/pages/ChildbirthPage.jsx', 'utf8');
    cb = cb.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    fs.writeFileSync('src/pages/ChildbirthPage.jsx', cb);
  }

  // LoginPage.jsx
  if (fs.existsSync('src/pages/LoginPage.jsx')) {
    let lp = fs.readFileSync('src/pages/LoginPage.jsx', 'utf8');
    lp = lp.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    lp = lp.replaceAll('ଖାତା ତୈରି କରନ୍ତୁ', 'खाते तयार करा');
    lp = lp.replaceAll('ସାଇନ ଇନ', 'लॉग इन करा');
    fs.writeFileSync('src/pages/LoginPage.jsx', lp);
  }

  console.log("Translation complete");
} catch(e) {
  console.error("Error updating files:", e);
}
