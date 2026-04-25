import os

replacements = {
    "ओळखलेली लक्षणे": "ಗುರುತಿಸಲಾದ ರೋಗಲಕ್ಷಣಗಳು",
    "काळजीसूचना": "ಮುನ್ನೆಚ್ಚರಿಕೆಗಳು",
    "तातडीचे": "ತುರ್ತು",
    "आपत्कालीन": "ತುರ್ತು",
    "ऐच्छिक": "ಐಚ್ಛಿಕ",
    "लक्षणे": "ರೋಗಲಕ್ಷಣಗಳು",
    "मराठी": "ಕನ್ನಡ",
    "नोंद जतन करत आहे...": "ದಾಖಲೆಯನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "नोंद यशस्वीरीत्या जतन केली": "ದಾಖಲೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
    "माहिती जतन केली जात आहे...": "ಮಾಹಿತಿಯನ್ನು ಉಳಿಸಲಾಗುತ್ತಿದೆ...",
    "रुग्ण": "ರೋಗಿ"
}

def process_dir(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.venv' in root or 'venv' in root:
            continue
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    for k, v in replacements.items():
                        content = content.replace(k, v)
                    
                    if content != original:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Updated {filepath}")
                except Exception as e:
                    print(f"Skipping {filepath} due to error: {e}")

process_dir('/Users/sumitdas/Desktop/swasth/swasthya-setu-full/swasth-scaler/frontend/src')
