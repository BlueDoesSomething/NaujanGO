import json
from pathlib import Path

print("\n" + "=" * 80)
print("REMOVING ORIENTAL MINDORO REFERENCES - NAUJAN ONLY FOCUS".center(80))
print("=" * 80 + "\n")

intents_dir = Path('intents')
files = {
    'EN': 'intents_en.json',
    'ES': 'intents_es.json',
    'TL': 'intents_tl.json',
    'ZH': 'intents_zh.json',
    'JA': 'intents_ja.json',
    'KO': 'intents_ko.json',
    'FR': 'intents_fr.json',
    'DE': 'intents_de.json'
}

# Patterns to remove (contains Oriental Mindoro or MIMAROPA references)
UNWANTED_KEYWORDS = [
    'oriental mindoro',
    'mimaropa',
    'mindoro region',
    'mindoro province',
]

# Response replacements
RESPONSE_REPLACEMENTS = {
    'oriental mindoro': 'Naujan',
    'Oriental Mindoro': 'Naujan',
    '1st class municipality in Oriental Mindoro': 'a municipality',
    '1st Class Municipality in Oriental Mindoro': 'a municipality',
    'on the northeastern coast of Mindoro': 'known for agriculture and tourism',
    'on the northeast coast of Mindoro': 'known for agriculture and tourism',
    'MIMAROPA region': 'Philippines',
    'Oriental Mindoro region': 'Naujan',
}

for lang, fname in files.items():
    fpath = intents_dir / fname
    print(f"Processing {lang}...")
    
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    patterns_removed = 0
    responses_modified = 0
    
    # Process intents
    for intent in data['intents']:
        # Clean patterns
        original_patterns = len(intent.get('patterns', []))
        cleaned_patterns = []
        
        for pattern in intent.get('patterns', []):
            # Check if pattern contains unwanted keywords
            skip = False
            for keyword in UNWANTED_KEYWORDS:
                if keyword.lower() in pattern.lower():
                    skip = True
                    patterns_removed += 1
                    break
            
            if not skip:
                cleaned_patterns.append(pattern)
        
        intent['patterns'] = cleaned_patterns
        
        # Clean responses
        for i, response in enumerate(intent.get('responses', [])):
            for old_text, new_text in RESPONSE_REPLACEMENTS.items():
                if old_text in response:
                    intent['responses'][i] = response.replace(old_text, new_text)
                    responses_modified += 1
                    response = intent['responses'][i]
    
    # Save file
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  ✓ Removed {patterns_removed} patterns with Oriental Mindoro/MIMAROPA")
    print(f"  ✓ Updated {responses_modified} response references")
    print()

print("=" * 80)
print("CLEANUP COMPLETE - Chatbot now focuses exclusively on Naujan Municipality!".center(80))
print("=" * 80 + "\n")
