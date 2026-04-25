import os

replacements = {
    "नाव": "ಹೆಸರು",
    "वय": "ವಯಸ್ಸು",
    "लिंग": "ಲಿಂಗ",
    "महिला": "ಮಹಿಳೆ",
    "पुरुष": "ಪುರುಷ",
    "तालुका": "ತಾಲೂಕು",
    "जिल्हा": "ಜಿಲ್ಲೆ",
    "लक्षणांचे वर्णन करा": "ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ",
    "जीपीएस स्थान (ऐच्छिक)": "ಜಿಪಿಎಸ್ ಸ್ಥಳ (ಐಚ್ಛಿಕ)",
    "मराठी": "ಕನ್ನಡ",
    "लक्षणे सांगा": "ರೋಗಲಕ್ಷಣಗಳನ್ನು ಹೇಳಿ",
    "विश्लेषण करा": "ವಿಶ್ಲೇಷಿಸಿ",
    "गाव": "ಗ್ರಾಮ",
    "odia-label": "kannada-label"
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
