import os
import re

CSS_CONTENT = """
:root {
  --bg: #f9fafb;
  --surface: #ffffff;
  --text-main: #111111;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --hover-bg: #f3f4f6;
  --primary: #0F6E56;
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  --error-bg: #FEF2F2;
  --error-text: #DC2626;
  --success-bg: #ECFDF5;
  --success-text: #166534;
}

html[data-theme="dark"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --border: #334155;
  --hover-bg: #475569;
  --primary: #10b981;
  --shadow: 0 4px 6px -1px rgba(0,0,0,0.5);
  --error-bg: #450a0a;
  --error-text: #fca5a5;
  --success-bg: #052e16;
  --success-text: #86efac;
}

body {
  background-color: var(--bg);
  color: var(--text-main);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.theme-transition * {
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease !important;
}
"""

with open('src/styles/globals.css', 'a', encoding='utf-8') as f:
    f.write(CSS_CONTENT)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Hex replacements
    replacements = {
        "'#fff'": "'var(--surface)'",
        '"#fff"': "'var(--surface)'",
        "'#ffffff'": "'var(--surface)'",
        "'#f9fafb'": "'var(--bg)'",
        '"#f9fafb"': "'var(--bg)'",
        "'#111'": "'var(--text-main)'",
        '"#111"': "'var(--text-main)'",
        "'#6b7280'": "'var(--text-muted)'",
        '"#6b7280"': "'var(--text-muted)'",
        "'#e5e7eb'": "'var(--border)'",
        '"#e5e7eb"': "'var(--border)'",
        "'#f3f4f6'": "'var(--hover-bg)'",
        '"#f3f4f6"': "'var(--hover-bg)'",
        "'#FEF2F2'": "'var(--error-bg)'",
        "'#DC2626'": "'var(--error-text)'",
        "'#ECFDF5'": "'var(--success-bg)'",
    }
    
    for old, new in replacements.items():
        content = content.replace(old, new)

    # For regex-based replacements where there's no exact string matches 
    # (like border: '1px solid #e5e7eb')
    content = re.sub(r"'1px solid #e5e7eb'", "'1px solid var(--border)'", content)
    content = re.sub(r'"1px solid #e5e7eb"', "'1px solid var(--border)'", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            process_file(os.path.join(root, file))

print("CSS Variables injected and hex codes replaced!")
