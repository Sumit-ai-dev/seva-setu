import os
import re

def fix_homepage():
    filepath = 'src/pages/HomePage.jsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacements
    replacements = {
        "'#1A6E5C'": "'var(--primary)'",
        "TEAL = '#1A6E5C'": "TEAL = 'var(--primary)'",
        "'#374151'": "'var(--text-main)'",
        "'#9ca3af'": "'var(--text-muted)'",
        "'#d1d5db'": "'var(--border)'",
        "`${sevColor}15`": "`color-mix(in srgb, ${sevColor} 15%, transparent)`",
        "`${sevColor}40`": "`color-mix(in srgb, ${sevColor} 40%, transparent)`",
        "`${TEAL}12`": "`color-mix(in srgb, ${TEAL} 12%, transparent)`",
        "`${TEAL}30`": "`color-mix(in srgb, ${TEAL} 30%, transparent)`",
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


def fix_header():
    filepath = 'src/components/GlobalHeader.jsx'
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace("color: '#0F6E56'", "color: 'var(--primary)'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_homepage()
fix_header()
print("Contrast fixes complete!")
