#!/usr/bin/env python3
"""
Comprehensive Intent Pattern Expansion Engine
Generates 25-40 diverse training phrases per intent for all 8 languages
"""

import json
import os
import random
from collections import defaultdict
from typing import List, Dict, Tuple

def load_intents(language):
    """Load intent file for a specific language"""
    filepath = f"../intents/intents_{language}.json"
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_unique_intents(intents_data):
    """Extract unique intents (deduplicate by tag)"""
    seen = set()
    unique = []
    for intent in intents_data['intents']:
        if intent['tag'] not in seen:
            unique.append(intent)
            seen.add(intent['tag'])
    return unique

# ===== PHRASE GENERATION TEMPLATES =====
# These templates create diverse variations from seed concepts

QUESTION_STRUCTURES = {
    'en': [
        "what is {concept}",
        "tell me about {concept}",
        "how about {concept}",
        "what's {concept}",
        "can you explain {concept}",
        "i'd like to know about {concept}",
        "give me info on {concept}",
        "any details on {concept}",
        "describe {concept}",
        "show me {concept}",
        "{concept}?",
        "anything about {concept}",
        "tell me more on {concept}",
        "what do you know about {concept}",
        "provide info on {concept}",
    ],
    'es': [
        "¿qué es {concept}",
        "cuéntame sobre {concept}",
        "¿cómo es {concept}",
        "¿qué hay sobre {concept}",
        "dame información de {concept}",
        "detalles de {concept}",
        "describe {concept}",
        "{concept}?",
        "necesito info de {concept}",
        "información sobre {concept}",
    ],
    'tl': [
        "ano ang {concept}",
        "sabihin mo tungkol sa {concept}",
        "paano ang {concept}",
        "mga detalye ng {concept}",
        "bigyan mo ako ng info tungkol sa {concept}",
        "tungkol sa {concept}",
        "ano pa tungkol {concept}",
        "ipakita mo ang {concept}",
        "{concept}?",
        "may impormasyon ka ba tungkol sa {concept}",
    ],
    'fr': [
        "c'est quoi {concept}",
        "parlez-moi de {concept}",
        "comment est {concept}",
        "donne-moi info sur {concept}",
        "détails sur {concept}",
        "décris {concept}",
        "{concept}?",
        "j'aimerais savoir sur {concept}",
        "informations sur {concept}",
        "plus sur {concept}",
    ],
    'de': [
        "was ist {concept}",
        "erzähl mir über {concept}",
        "wie ist {concept}",
        "info zu {concept}",
        "details zu {concept}",
        "beschreib {concept}",
        "{concept}?",
        "erzählen sie mir von {concept}",
        "auskunft über {concept}",
        "more info on {concept}",
    ],
    'zh': [
        "{concept}是什么",
        "告诉我{concept}",
        "关于{concept}的信息",
        "{concept}的细节",
        "描述{concept}",
        "{concept}怎样",
        "请给我{concept}的信息",
        "{concept}?",
        "告诉我更多关于{concept}",
    ],
    'ja': [
        "{concept}とは",
        "{concept}について教えてください",
        "{concept}の詳細",
        "{concept}を説明してください",
        "{concept}について",
        "{concept}はどうですか",
        "{concept}について知りたい",
        "{concept}?",
        "{concept}についてもっと教えてください",
    ],
    'ko': [
        "{concept}가 뭐예요",
        "{concept}에 대해 말해줄래요",
        "{concept}의 정보",
        "{concept}의 세부사항",
        "{concept}을 설명해줄래요",
        "{concept}은 어떻게",
        "{concept}에 대해 알려줘",
        "{concept}?",
        "{concept}에 대해 더 알려줄래요",
    ],
}

CASUAL_VARIATIONS = {
    'en': [
        "where's {concept}",
        "what's up with {concept}",
        "gimme {concept}",
        "i need {concept}",
        "yo, {concept}",
        "tell me {concept}",
        "help me with {concept}",
        "{concept} yo",
        "hey, {concept}",
        "about {concept}",
    ],
    'es': [
        "dónde está {concept}",
        "qué onda con {concept}",
        "dame {concept}",
        "necesito {concept}",
        "oye {concept}",
        "ayúdame con {concept}",
        "sobre {concept}",
    ],
    'tl': [
        "nasaan ang {concept}",
        "ano ang kalalabasan ng {concept}",
        "bigyan mo ako {concept}",
        "kailangan ko ng {concept}",
        "hey {concept}",
        "tulungan mo ako tungkol {concept}",
    ],
}

FOLLOW_UP_QUESTIONS = {
    'en': [
        "what about {concept}",
        "how about {concept}",
        "anything on {concept}",
        "more on {concept}",
        "details about {concept}",
        "tell me more about {concept}",
        "explain {concept}",
        "any info on {concept}",
    ],
    'es': [
        "¿y qué hay sobre {concept}",
        "¿cómo está {concept}",
        "algún dato sobre {concept}",
        "más información de {concept}",
    ],
}

# Typo variations (simulates user errors)
def generate_typos(word: str, lang: str) -> List[str]:
    """Generate common misspellings/typos"""
    typo_variants = [word]
    
    # Swap adjacent letters
    for i in range(len(word) - 1):
        typo = word[:i] + word[i+1] + word[i] + word[i+2:]
        typo_variants.append(typo)
    
    # Drop a letter
    for i in range(len(word)):
        typo = word[:i] + word[i+1:]
        if len(typo) > 2:
            typo_variants.append(typo)
    
    # Duplicate a letter
    for i in range(len(word)):
        typo = word[:i] + word[i] + word[i:]
        typo_variants.append(typo)
    
    return typo_variants[:5]  # Return top 5 variants

def create_phrase_variants(base_phrase: str, lang: str) -> List[str]:
    """Create multiple variants of a phrase"""
    variants = [base_phrase]
    
    words = base_phrase.split()
    for _ in range(3):
        # Shuffle word order slightly (keep semantic meaning)
        shuffled = words.copy()
        if len(shuffled) > 2:
            idx1, idx2 = random.sample(range(len(shuffled)), 2)
            shuffled[idx1], shuffled[idx2] = shuffled[idx2], shuffled[idx1]
        variants.append(" ".join(shuffled))
    
    return variants

def expand_intent_patterns(intent: Dict, lang: str, target_count: int = 35) -> List[str]:
    """
    Expand an intent's patterns to target count with diverse variations
    """
    existing_patterns = intent.get('patterns', [])
    new_patterns = set(existing_patterns)  # Keep existing patterns
    
    # Extract key concepts from existing patterns
    concepts = []
    for pattern in existing_patterns[:5]:  # Sample existing patterns
        # Take key nouns/verbs
        words = pattern.lower().split()
        concepts.extend(words[-2:])  # Last 2 words often contain core meaning
    
    concepts = list(set(concepts))[:3]  # Top 3 unique concepts
    
    intent_tag = intent.get('tag', 'unknown')
    
    # Generate variations using templates
    question_tmpl = QUESTION_STRUCTURES.get(lang, QUESTION_STRUCTURES['en'])
    casual_tmpl = CASUAL_VARIATIONS.get(lang, CASUAL_VARIATIONS['en'])
    followup_tmpl = FOLLOW_UP_QUESTIONS.get(lang, FOLLOW_UP_QUESTIONS['en'])
    
    # 1. Question structure variations
    for concept in concepts:
        for template in random.sample(question_tmpl, min(3, len(question_tmpl))):
            phrase = template.format(concept=concept)
            new_patterns.add(phrase)
    
    # 2. Casual/slang variations
    for concept in concepts:
        for template in random.sample(casual_tmpl, min(2, len(casual_tmpl))):
            phrase = template.format(concept=concept)
            new_patterns.add(phrase)
    
    # 3. Follow-up style variations
    for concept in concepts:
        for template in random.sample(followup_tmpl, min(2, len(followup_tmpl))):
            phrase = template.format(concept=concept)
            new_patterns.add(phrase)
    
    # 4. Typo/misspelling variations (English/Spanish/Tagalog mainly)
    if lang in ['en', 'es', 'tl']:
        for concept in concepts:
            typos = generate_typos(concept, lang)
            for typo in typos[:2]:
                phrase = random.choice(question_tmpl).format(concept=typo)
                new_patterns.add(phrase)
    
    # 5. Case variations (important for some languages)
    additional_patterns = []
    for pattern in list(new_patterns)[:10]:
        additional_patterns.append(pattern.title())
        additional_patterns.append(pattern.upper())
        additional_patterns.append(pattern.lower())
    
    new_patterns.update(additional_patterns)
    
    # 6. Truncate/short queries
    for concept in concepts:
        new_patterns.add(concept)
        new_patterns.add(concept + "?")
        new_patterns.add("is there " + concept)
    
    # Convert to list and trim to target count
    pattern_list = list(new_patterns)
    
    if len(pattern_list) > target_count:
        # Prioritize: keep existing, then add new unique ones
        existing_set = set(existing_patterns)
        new_set = [p for p in pattern_list if p not in existing_set]
        final_patterns = list(existing_set) + new_set[:target_count - len(existing_set)]
    else:
        final_patterns = pattern_list[:target_count]
    
    return final_patterns[:target_count]

def expand_all_intents_for_language(language: str) -> None:
    """Expand all intents for a given language"""
    print(f"\n{'='*70}")
    print(f"Expanding intents for {language.upper()}")
    print(f"{'='*70}")
    
    intents_data = load_intents(language)
    unique_intents = get_unique_intents(intents_data)
    
    print(f" Loaded {len(unique_intents)} unique intents")
    
    expanded_count = 0
    total_new_patterns = 0
    
    for intent in unique_intents:
        old_count = len(intent.get('patterns', []))
        
        # Expand to 35+ patterns per intent
        target = 35 if old_count < 20 else 40
        expanded_patterns = expand_intent_patterns(intent, language, target_count=target)
        
        intent['patterns'] = expanded_patterns
        new_count = len(expanded_patterns)
        
        if new_count > old_count:
            expanded_count += 1
            added = new_count - old_count
            total_new_patterns += added
            
            if expanded_count <= 10:  # Show first 10 intents
                print(f"  [{intent['tag']:30s}] {old_count:3d} → {new_count:3d} (+{added:2d})")
    
    # Save expanded intents
    output_path = f"../intents/intents_{language}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(intents_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n ✓ {language.upper()}: Expanded {expanded_count}/{len(unique_intents)} intents")
    print(f" ✓ Added {total_new_patterns} total new patterns")
    print(f" ✓ Saved to {output_path}")

def main():
    """Expand all intents for all 8 languages"""
    languages = ['en', 'es', 'tl', 'fr', 'de', 'zh', 'ja', 'ko']
    
    print("="*70)
    print("MULTILINGUAL INTENT PATTERN EXPANSION ENGINE")
    print("="*70)
    
    total_intents = 0
    total_patterns = 0
    
    for lang in languages:
        try:
            expand_all_intents_for_language(lang)
        except Exception as e:
            print(f" ✗ ERROR expanding {lang}: {str(e)}")
    
    print("\n" + "="*70)
    print("EXPANSION COMPLETE - All intents enriched with diverse patterns!")
    print("Next step: Retrain all 8 language models")
    print("="*70)

if __name__ == '__main__':
    main()
