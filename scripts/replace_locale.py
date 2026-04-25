import os

replacements = {
    "Karnataka": "Karnataka",
    "karnataka": "karnataka",
    "KARNATAKA": "KARNATAKA",
    "Bengaluru": "Bengaluru",
    "Kannada": "Kannada",
    "kannada:": "kannada:",
    "kannada: ": "kannada: ",
    ".kannada": ".kannada",
    "kannada}": "kannada}",
    "kannada }": "kannada }",
    "{kannada:": "{kannada:",
    "ತುರ್ತು": "ತುರ್ತು",
    "ಸಾಧಾರಣ": "ಸಾಧಾರಣ",
    "ಸ್ಥಿರ": "ಸ್ಥಿರ",
    "ಸುರಕ್ಷಿತ": "ಸುರಕ್ಷಿತ",
    "ತುರ್ತು": "ತುರ್ತು",
    "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "ರೋಗಿಯ ಟ್ರಯಾಜ್": "ರೋಗಿಯ ಟ್ರಯಾಜ್",
    "AI ಚಾಟ್": "AI ಚಾಟ್",
    "ಸೈನ್ ಭಾಷೆ": "ಸೈನ್ ಭಾಷೆ"
}

def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.venv' in root:
            continue
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx') or file.endswith('.py'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original = content
                for k, v in replacements.items():
                    content = content.replace(k, v)
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Updated {filepath}")

process_dir('/Users/sumitdas/Desktop/swasth/swasthya-setu-full/swasth-scaler/')
