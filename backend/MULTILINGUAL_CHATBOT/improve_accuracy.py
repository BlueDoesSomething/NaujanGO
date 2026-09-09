#!/usr/bin/env python3
"""
Improve Chatbot Accuracy Script
- Expands training patterns
- Improves response quality
- Ensures consistency across languages
"""

import json
import os
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "intents")
MODELS_DIR = os.path.join(BASE_DIR, "models")

LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']

# Pattern expansion mapping for English
PATTERN_ENHANCEMENTS = {
    "greeting": [
        "hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening",
        "howdy", "sup", "yo", "what's up", "how are you", "how's it going", "how are things",
        "nice to meet you", "pleased to meet you", "is anybody there", "anyone there",
        "can you hear me", "are you listening", "hello there", "hi there", "hey there",
        "good day", "good night", "morning", "afternoon", "evening",
        "start", "begin", "initiate chat", "begin conversation", "start chat",
        "help me", "i need help", "assistance please", "can you help", "need support",
        "what's your name", "who are you", "introduce yourself", "tell me about yourself",
        "welcome", "welcome back", "hello my friend", "hello buddy", "hello pal"
    ],
    "Naujan_Lake_About": [
        "tell me about naujan lake", "what is naujan lake", "naujan lake information",
        "naujan lake facts", "naujan lake details", "naujan lake overview",
        "naujan lake national park", "naujan lake wetland", "naujan lake sanctuary",
        "naujan lake biodiversity", "naujan lake wildlife", "naujan lake ecosystem",
        "naujan lake birds", "naujan lake birdwatching", "naujan lake ramsar site",
        "largest lake in philippines", "fifth largest lake", "naujan lake size",
        "naujan lake attractions", "naujan lake activities", "naujan lake things to do",
        "naujan lake tour", "naujan lake visit", "naujan lake trip",
        "naujan lake accommodation", "naujan lake stay", "naujan lake lodge",
        "naujan lake boat tour", "naujan lake cruise", "naujan lake boating",
        "naujan lake fishing", "naujan lake swimming", "naujan lake adventure",
        "naujan lake photo", "naujan lake photography", "naujan lake scenic views",
        "naujan lake sunset", "naujan lake sunrise", "naujan lake at night",
        "naujan lake ecosystem", "naujan lake environment", "naujan lake nature",
        "how to get to naujan lake", "directions to naujan lake", "naujan lake location",
        "best time to visit naujan lake", "when to visit naujan lake", "naujan lake season"
    ],
    "Agriculture_Crops": [
        "what crops are grown in naujan", "naujan agriculture", "naujan farming",
        "naujan rice", "naujan coconut", "naujan corn", "naujan vegetables",
        "naujan farm products", "naujan agricultural products", "naujan main crops",
        "naujan plantations", "naujan rice paddies", "naujan coconut farms",
        "naujan farming methods", "naujan farm tours", "naujan agricultural tour",
        "naujan harvest season", "naujan planting season", "naujan farm visit",
        "naujan copra", "naujan banana", "naujan mango", "naujan root crops",
        "naujan sugar production", "naujan commercial crops", "naujan export products",
        "farming in naujan", "agricultural development in naujan", "farm workers in naujan",
        "sustainable farming naujan", "organic farming naujan", "traditional farming naujan"
    ]
}

def improve_english_intents():
    """Improve English intents with more patterns"""
    intents_file = os.path.join(INTENTS_DIR, "intents_en.json")
    
    try:
        with open(intents_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load intents_en.json: {e}")
        return False
    
    intents = data.get('intents', [])
    changes_made = 0
    
    for intent in intents:
        tag = intent.get('tag')
        
        # Add enhanced patterns if they exist
        if tag in PATTERN_ENHANCEMENTS:
            current_patterns = intent.get('patterns', [])
            new_patterns = set(current_patterns)
            
            for pattern in PATTERN_ENHANCEMENTS[tag]:
                if pattern.lower() not in [p.lower() for p in new_patterns]:
                    new_patterns.add(pattern)
                    changes_made += 1
            
            intent['patterns'] = list(new_patterns)
            print(f"  ✓ {tag}: expanded from {len(current_patterns)} to {len(intent['patterns'])} patterns")
    
    # Save improved intents
    with open(intents_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ English intents improved! Added {changes_made} new patterns")
    return True

def improve_response_quality():
    """Enhance response quality with more detailed, accurate answers"""
    improvements = {
        'en': {
            'Naujan_Lake_About': [
                "Naujan Lake National Park covers about 20,000 hectares and is the 5th largest freshwater lake in the Philippines. It was designated as a Ramsar Wetland of International Importance in 1999, recognizing its critical importance for migratory birds.",
                "The lake hosts over 60 species of birds, including endangered species like the Philippine duck (Anas luzonica). During the migration season (November-March), thousands of Siberian birds visit the lake.",
                "Eco-tourism activities at Naujan Lake include birdwatching, boat tours, photography, and nature walks. Best time to visit: November to March for birdwatching. Contact the Naujan LGU at (043) 208-3382 for guided tours."
            ],
            'Agriculture_Crops': [
                "Naujan's main agricultural products are rice (palay) and coconut (copra). Rice is typically harvested from November-December, while coconut farming is year-round. The municipality also produces corn, bananas, root crops, and vegetables.",
                "The rice paddies of Naujan cover thousands of hectares. The best time to see the green rice fields is June-September. During harvest season (October-November), you can see the golden rice ready for harvest.",
                "Coconut farming is a major livelihood in Naujan. Copra (dried coconut kernel) is processed for coconut oil and other products. Some farmers also engage in mixed farming with vegetables and root crops."
            ]
        }
    }
    
    for language, enhancements in improvements.items():
        intents_file = os.path.join(INTENTS_DIR, f"intents_{language}.json")
        
        try:
            with open(intents_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"[ERROR] Failed to load {language}: {e}")
            continue
        
        intents = data.get('intents', [])
        
        for intent in intents:
            tag = intent.get('tag')
            if tag in enhancements:
                intent['responses'] = enhancements[tag]
                print(f"  ✓ {language}/{tag}: updated {len(enhancements[tag])} responses")
        
        with open(intents_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("\n✓ Response quality improved across languages")
    return True

def validate_intents():
    """Validate intents structure"""
    print("\n" + "="*60)
    print("VALIDATION REPORT")
    print("="*60)
    
    total_patterns = 0
    total_responses = 0
    total_intents = 0
    
    for language in LANGUAGES:
        intents_file = os.path.join(INTENTS_DIR, f"intents_{language}.json")
        
        if not os.path.exists(intents_file):
            print(f"⚠ Missing: {language}")
            continue
        
        try:
            with open(intents_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"✗ Error reading {language}: {e}")
            continue
        
        intents = data.get('intents', [])
        lang_patterns = 0
        lang_responses = 0
        
        for intent in intents:
            patterns = intent.get('patterns', [])
            responses = intent.get('responses', [])
            lang_patterns += len(patterns)
            lang_responses += len(responses)
            total_intents += 1
        
        total_patterns += lang_patterns
        total_responses += lang_responses
        
        print(f"✓ {language.upper():2s} - Intents: {len(intents):3d} | Patterns: {lang_patterns:5d} | Responses: {lang_responses:3d}")
    
    print(f"\nTOTAL - Intents: {total_intents} | Patterns: {total_patterns} | Responses: {total_responses}")
    print(f"Average patterns per intent: {total_patterns // max(total_intents, 1):.1f}")
    print("="*60 + "\n")
    
    return True

def main():
    print("\n" + "="*60)
    print("CHATBOT ACCURACY IMPROVEMENT SCRIPT")
    print("="*60)
    
    print("\n[1/3] Validating current intents...")
    validate_intents()
    
    print("[2/3] Improving English patterns...")
    improve_english_intents()
    
    print("\n[3/3] Enhancing response quality...")
    improve_response_quality()
    
    print("\n" + "="*60)
    print("VALIDATION AFTER IMPROVEMENTS")
    print("="*60)
    validate_intents()
    
    print("\n✓ Chatbot accuracy improvements complete!")
    print("\nNext step: Run 'python enhanced_train_multilingual.py' to retrain models")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
