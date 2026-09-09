"""
Intent Pattern Expander
Automatically expands patterns with case variations and common alternatives
"""

import json
import os
import re

INTENTS_DIR = os.path.join(os.path.dirname(__file__), "..", "intents")

def expand_pattern(pattern):
    """Generate variations of a pattern"""
    variations = set()
    
    # Original
    variations.add(pattern)
    
    # Lowercase
    variations.add(pattern.lower())
    
    # Uppercase
    variations.add(pattern.upper())
    
    # Title case
    variations.add(pattern.title())
    
    # Capitalize first letter only
    variations.add(pattern.capitalize())
    
    # Common typos/variations
    typo_map = {
        'naujan': ['naujan', 'nau jan', 'nauyan', 'nauhan'],
        'where': ['where', 'were', 'wher', 'whre'],
        'what': ['what', 'wat', 'wht', 'wut'],
        'how': ['how', 'hw', 'haw'],
        'you': ['you', 'u', 'yu'],
        'are': ['are', 'r', 'ar'],
        'the': ['the', 'teh', 'da'],
        'please': ['please', 'pls', 'plz', 'pleas'],
        'thank': ['thank', 'thanks', 'thanx', 'thx', 'ty'],
        'hello': ['hello', 'helo', 'hallo', 'hullo'],
        'help': ['help', 'halp', 'hlp']
    }
    
    # Apply typo variations (limit to avoid explosion)
    for word, typos in typo_map.items():
        if word in pattern.lower():
            for typo in typos[:2]:  # Limit to 2 variations
                new_pattern = re.sub(r'\b' + word + r'\b', typo, pattern, flags=re.IGNORECASE)
                if new_pattern != pattern:
                    variations.add(new_pattern)
    
    return list(variations)

def expand_intents_file(language_code):
    """Expand patterns in an intents file"""
    filepath = os.path.join(INTENTS_DIR, f"intents_{language_code}.json")
    
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_before = 0
    total_after = 0
    
    for intent in data.get('intents', []):
        patterns = intent.get('patterns', [])
        total_before += len(patterns)
        
        # Expand patterns
        expanded = set()
        for pattern in patterns:
            expanded.update(expand_pattern(pattern))
        
        # Remove duplicates and sort
        intent['patterns'] = sorted(list(expanded))
        total_after += len(intent['patterns'])
    
    # Save expanded file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"{language_code}: {total_before} -> {total_after} patterns (+{total_after - total_before})")

if __name__ == "__main__":
    languages = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']
    
    print("Expanding intent patterns...")
    for lang in languages:
        expand_intents_file(lang)
    
    print("\nDone! All intent files have been expanded.")
    print("Note: Retrain models after expanding patterns for best results.")
