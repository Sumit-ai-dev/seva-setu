const fs = require('fs');
const path = require('path');

const dir = 'src/pages/';

const translations = {
  // Common strings
  'ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ': 'आरोग्य सेतू',
  'ଗ୍ରାମୀଣ ଓଡ଼ିଶା ପାଇଁ ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ': 'ग्रामीण महाराष्ट्रासाठी आरोग्य सेतू',
  'ଇମେଲ ଠିକଣା': 'ईमेल पत्ता',
  'ପାସୱାର୍ଡ': 'पासवर्ड',
  'ଆଶା କର୍ମୀ ଏବଂ ସ୍ୱାସ୍ଥ୍ୟ ସ୍ୱୟଂସେବକଙ୍କ ପାଇଁ': 'आशा आणि आरोग्य स्वयंसेवकांसाठी',
  'ଖାତା ତୈରି କରନ୍ତୁ': 'खाते तयार करा',
  'ସାଇନ ଇନ': 'लॉग इन करा'
};

const filesToUpdate = Object.keys(translations);

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');
  let changed = false;
  
  for (const [odia, marathi] of Object.entries(translations)) {
    if (content.includes(odia)) {
      content = content.replaceAll(odia, marathi);
      changed = true;
    }
  }

  // Also replace any leftover Noto Sans Oriya
  if (content.includes('Noto Sans Oriya')) {
    content = content.replaceAll('Noto Sans Oriya', 'Noto Sans Devanagari');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path.join(dir, file), content);
    console.log(`Updated ${file}`);
  }
});

console.log('Login pages translated globally!');
