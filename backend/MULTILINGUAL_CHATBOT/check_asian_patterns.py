import json

files = {
    'ZH': r'intents\intents_zh.json',
    'JA': r'intents\intents_ja.json',
    'KO': r'intents\intents_ko.json'
}

for lang, path in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    naujan = [i for i in data['intents'] if 'Naujan' in i.get('tag', '')]
    total_patterns = sum(len(i.get('patterns', [])) for i in naujan)
    print(f'{lang}: {len(naujan)} Naujan intents, {total_patterns} patterns')
    for intent in naujan:
        tag = intent['tag']
        count = len(intent.get('patterns', []))
        print(f'  - {tag}: {count} patterns')
