"""
Auto-enhance and retrain all languages (except English)
"""
import json
import os
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "..", "intents")

# Typo patterns for each language
TYPO_PATTERNS = {
    'es': {
        'hola': ['ola', 'hla', 'hol'],
        'donde': ['dond', 'dnde', 'dode'],
        'que': ['q', 'ke', 'qe'],
        'como': ['com', 'cmo', 'komo'],
        'gracias': ['grax', 'grcias', 'grasias'],
        'naujan': ['nau jan', 'nauj an', 'nauhan'],
    },
    'tl': {
        'kumusta': ['kmusta', 'kumsta', 'kmsta'],
        'salamat': ['slmat', 'salamaat', 'slamat'],
        'saan': ['san', 'saan', 'sn'],
        'ano': ['an', 'ano', 'anu'],
        'naujan': ['nau jan', 'nauj an', 'nauhan'],
        'paano': ['pano', 'paanu', 'pno'],
    },
    'zh': {
        '你好': ['你好', 'nihao'],
        '谢谢': ['谢谢', 'xiexie'],
        '在哪里': ['在哪里', 'zai nali'],
    },
    'ja': {
        'こんにちは': ['こんにちは', 'konnichiwa'],
        'ありがとう': ['ありがとう', 'arigatou'],
        'どこ': ['どこ', 'doko'],
    },
    'ko': {
        '안녕하세요': ['안녕하세요', 'annyeonghaseyo'],
        '감사합니다': ['감사합니다', 'gamsahamnida'],
        '어디': ['어디', 'eodi'],
    },
    'fr': {
        'bonjour': ['bonj our', 'bonjr', 'bjr'],
        'merci': ['mrci', 'mersi', 'mrc'],
        'ou': ['ou', 'où', 'u'],
        'naujan': ['nau jan', 'nauj an'],
    },
    'de': {
        'hallo': ['halo', 'hllo', 'hal lo'],
        'danke': ['dnke', 'danke', 'dank'],
        'wo': ['wo', 'w'],
        'naujan': ['nau jan', 'nauj an'],
    }
}

def add_typo_variants(patterns, lang):
    """Add typo variants to patterns"""
    new_patterns = set(patterns)
    typos = TYPO_PATTERNS.get(lang, {})
    
    for pattern in patterns[:50]:  # Limit to avoid explosion
        pattern_lower = pattern.lower()
        for correct, variants in typos.items():
            if correct in pattern_lower:
                for variant in variants:
                    new_pattern = pattern_lower.replace(correct, variant)
                    new_patterns.add(new_pattern)
                    new_patterns.add(new_pattern.capitalize())
                    new_patterns.add(new_pattern.upper())
    
    return sorted(list(new_patterns))

def enhance_language(lang):
    """Enhance intents for a language"""
    filepath = os.path.join(INTENTS_DIR, f"intents_{lang}.json")
    
    if not os.path.exists(filepath):
        print(f"Skipping {lang} - file not found")
        return 0
    
    print(f"\nEnhancing {lang}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    total_added = 0
    for intent in data['intents']:
        original_count = len(intent['patterns'])
        intent['patterns'] = add_typo_variants(intent['patterns'], lang)
        added = len(intent['patterns']) - original_count
        total_added += added
    
    # Save enhanced file
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  Added {total_added} patterns to {lang}")
    return total_added

def retrain_models():
    """Retrain all models"""
    print("\n" + "="*60)
    print("RETRAINING MODELS...")
    print("="*60)
    
    train_script = os.path.join(BASE_DIR, "train_multilingual.py")
    
    try:
        result = subprocess.run(
            ['python', train_script],
            cwd=os.path.dirname(train_script),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("\n✓ Models retrained successfully!")
            return True
        else:
            print(f"\n✗ Training failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"\n✗ Error retraining: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("AUTO-ENHANCE & RETRAIN (Non-English Languages)")
    print("="*60)
    
    # Enhance all languages except English
    languages = ['es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']
    total = 0
    
    for lang in languages:
        added = enhance_language(lang)
        total += added
    
    print(f"\n{'='*60}")
    print(f"Total patterns added: {total}")
    print(f"{'='*60}")
    
    # Ask to retrain
    print("\nRetrain models with enhanced patterns? (y/n): ", end='')
    choice = input().strip().lower()
    
    if choice == 'y':
        success = retrain_models()
        if success:
            print("\n✓ All done! Chatbot enhanced and retrained.")
        else:
            print("\n✗ Training failed. Check errors above.")
    else:
        print("\nSkipped retraining. Run train_multilingual.py manually.")
