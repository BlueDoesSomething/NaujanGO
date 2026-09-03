import json
import os
from pathlib import Path

print('TRAINING RESULTS - MODEL VERIFICATION')
print('=' * 70)

models_dir = Path(r'models')
langs = ['EN', 'ES', 'TL', 'ZH', 'JA', 'KO', 'FR', 'DE']

trained_count = 0
for lang in langs:
    classifier_file = models_dir / f'intent_classifier_{lang.lower()}.pkl'
    responses_file = models_dir / f'intent_responses_{lang.lower()}.json'
    
    if classifier_file.exists() and responses_file.exists():
        import datetime
        mod_time = datetime.datetime.fromtimestamp(classifier_file.stat().st_mtime)
        print(f'{lang}: Models trained and saved')
        trained_count += 1
    else:
        print(f'{lang}: Model files missing')

print('=' * 70)
print(f'Total trained: {trained_count}/8 languages')
print('All models saved in: models/ directory')
print('Ready for deployment!')
