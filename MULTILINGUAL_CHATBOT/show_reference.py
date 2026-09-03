import json

# Read English patterns as reference
with open(r'intents\intents_en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

# Find accommodation/attraction intents and their pattern count
print("ENGLISH REFERENCE PATTERNS:")
print("=" * 70)

key_intents = [
    'Naujan_Lake_National_Park',
    'Naujan_Eco_Parks', 
    'Naujan_Waterfalls',
    'Naujan_Beaches_Resorts',
    'Naujan_Accommodations_Budget',
    'Naujan_Accommodations_Midrange',
    'Naujan_Accommodations_Upscale',
    'Naujan_Attractions_Major'
]

for en_intent in en_data['intents']:
    if en_intent['tag'] in key_intents:
        print(f"\n{en_intent['tag']}: {len(en_intent['patterns'])} patterns")
        print("Sample patterns:")
        for p in en_intent['patterns'][:5]:
            print(f"  - {p}")
