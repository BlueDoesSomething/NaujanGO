"""
Intent Pattern Enhancer - Adds typo variations to existing patterns
"""

import json
import os
import re
from itertools import product

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "..", "intents")

# Common typo patterns
TYPO_VARIATIONS = {
    'the': ['teh', 'the', 'th'],
    'what': ['wat', 'what', 'wht'],
    'where': ['were', 'where', 'wher'],
    'how': ['hw', 'how', 'hwo'],
    'hello': ['helo', 'hello', 'hllo'],
    'help': ['halp', 'help', 'hlp'],
    'please': ['pls', 'please', 'plz', 'pleas'],
    'you': ['u', 'you', 'yu'],
    'are': ['r', 'are', 'ar'],
    'your': ['ur', 'your', 'yor'],
    'thanks': ['thx', 'thanks', 'thnks'],
    'thank': ['thank', 'thnk', 'thk'],
    'good': ['gud', 'good', 'gd'],
    'naujan': ['nau jan', 'naujan', 'nauj an', 'nauhan'],
    'can': ['can', 'cn', 'cna'],
    'there': ['there', 'ther', 'thre'],
    'contact': ['contact', 'contct', 'cntact'],
    'number': ['number', 'numbr', 'nmbr', 'no'],
    'office': ['office', 'offce', 'ofice'],
    'mayor': ['mayor', 'mayr', 'myor'],
    'police': ['police', 'polce', 'polic'],
    'emergency': ['emergency', 'emergancy', 'emrgency'],
    'weather': ['weather', 'wether', 'wheather'],
    'climate': ['climate', 'climat', 'clmate'],
    'location': ['location', 'locaton', 'loction'],
    'lake': ['lake', 'lak', 'laek'],
    'agriculture': ['agriculture', 'agriclture', 'agri'],
    'crops': ['crops', 'crps', 'crop'],
    'tourist': ['tourist', 'turist', 'torist'],
    'visit': ['visit', 'vist', 'visist'],
    'itinerary': ['itinerary', 'itinery', 'itenerary']
}

def generate_typo_variants(text, max_typos=2):
    """Generate typo variants of a text"""
    words = text.lower().split()
    variants = []
    
    # Original
    variants.append(text)
    
    # Single word typos
    for i, word in enumerate(words):
        if word in TYPO_VARIATIONS:
            for typo in TYPO_VARIATIONS[word]:
                if typo != word:
                    new_words = words.copy()
                    new_words[i] = typo
                    variants.append(' '.join(new_words))
    
    # Double word typos (limited)
    if len(words) >= 2 and max_typos >= 2:
        for i in range(len(words)):
            for j in range(i+1, min(i+2, len(words))):
                if words[i] in TYPO_VARIATIONS and words[j] in TYPO_VARIATIONS:
                    for typo1 in TYPO_VARIATIONS[words[i]][:2]:
                        for typo2 in TYPO_VARIATIONS[words[j]][:2]:
                            if typo1 != words[i] or typo2 != words[j]:
                                new_words = words.copy()
                                new_words[i] = typo1
                                new_words[j] = typo2
                                variants.append(' '.join(new_words))
    
    return list(set(variants))

def enhance_intents_file(filepath):
    """Enhance a single intents file"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    enhanced_count = 0
    
    for intent in data['intents']:
        original_patterns = intent['patterns'].copy()
        new_patterns = set(original_patterns)
        
        # Add typo variants for key patterns
        sample_patterns = original_patterns[:20]  # Limit to avoid explosion
        
        for pattern in sample_patterns:
            variants = generate_typo_variants(pattern, max_typos=1)
            for variant in variants:
                if variant not in new_patterns:
                    new_patterns.add(variant)
                    enhanced_count += 1
        
        intent['patterns'] = sorted(list(new_patterns))
    
    # Save enhanced file
    output_path = filepath.replace('.json', '_enhanced.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  Added {enhanced_count} typo variants")
    print(f"  Saved to {output_path}")
    
    return enhanced_count

def enhance_all_intents():
    """Enhance all intent files"""
    total_enhanced = 0
    
    for lang in ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']:
        filepath = os.path.join(INTENTS_DIR, f"intents_{lang}.json")
        if os.path.exists(filepath):
            count = enhance_intents_file(filepath)
            total_enhanced += count
        else:
            print(f"File not found: {filepath}")
    
    print(f"\nTotal patterns added: {total_enhanced}")
    print("Enhancement complete!")

if __name__ == "__main__":
    enhance_all_intents()
