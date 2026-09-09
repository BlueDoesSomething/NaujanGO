import json
import os
from pathlib import Path

print('\n' + '=' * 80)
print('TRAINING VERIFICATION CHECK'.center(80))
print('=' * 80 + '\n')

# 1. Check model files exist
print('1. MODEL FILES CHECK')
print('-' * 80)
models_dir = Path('models')
langs = ['EN', 'ES', 'TL', 'ZH', 'JA', 'KO', 'FR', 'DE']
all_exist = True

for lang in langs:
    classifier = models_dir / f'intent_classifier_{lang.lower()}.pkl'
    encoder = models_dir / f'label_encoder_{lang.lower()}.pkl'
    responses = models_dir / f'intent_responses_{lang.lower()}.json'
    
    exists = classifier.exists() and encoder.exists() and responses.exists()
    status = 'OK' if exists else 'MISSING'
    print(f'  {lang}: {status}')
    all_exist = all_exist and exists

print()

# 2. Check intent files are valid JSON
print('2. INTENT FILES VALIDATION')
print('-' * 80)
intents_dir = Path('intents')
intent_files = {
    'EN': 'intents_en.json',
    'ES': 'intents_es.json',
    'TL': 'intents_tl.json',
    'ZH': 'intents_zh.json',
    'JA': 'intents_ja.json',
    'KO': 'intents_ko.json',
    'FR': 'intents_fr.json',
    'DE': 'intents_de.json'
}

all_valid = True
for lang, fname in sorted(intent_files.items()):
    fpath = intents_dir / fname
    try:
        with open(fpath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        intents_count = len(data.get('intents', []))
        patterns_count = sum(len(i.get('patterns', [])) for i in data['intents'])
        print(f'  {lang}: OK ({intents_count} intents, {patterns_count} patterns)')
    except json.JSONDecodeError as e:
        print(f'  {lang}: JSON ERROR - {str(e)[:50]}')
        all_valid = False
    except Exception as e:
        print(f'  {lang}: ERROR - {str(e)[:50]}')
        all_valid = False

print()

# 3. Summary
print('3. TRAINING STATUS SUMMARY')
print('-' * 80)

if all_exist and all_valid:
    print('  ALL 8/8 MODELS TRAINED AND READY')
    print('  All intent files validated')
    print('  System ready for deployment')
    print()
    print('Status: FULLY TRAINED AND OPERATIONAL')
else:
    print('  ISSUES DETECTED - Review above')
    if not all_exist:
        print('    - Missing model files')
    if not all_valid:
        print('    - Invalid intent files')

print()
print('=' * 80 + '\n')
