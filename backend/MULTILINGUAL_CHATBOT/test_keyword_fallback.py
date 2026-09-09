#!/usr/bin/env python3
"""Test keyword fallback matching with improved logic."""

import sys
import os
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

# Import the chatbot module to test keyword_fallback
import importlib.util
spec = importlib.util.spec_from_file_location("chatbot_multilingual", str(BASE_DIR / "scripts" / "chatbot_multilingual.py"))
chatbot_module = importlib.util.module_from_spec(spec)

# Test the keyword fallback function
test_queries = [
    ("what are the attractions in naujan", "Naujan_Attractions_Major"),
    ("what hotels are available in naujan", "Hotel_Recommendations"),
    ("what are the top tourist attractions", "Naujan_Attractions_Major"),
    ("help me plan a day trip", "Itinerary_Plan"),
    ("whats the best time to visit", "Best_Time_To_Visit"),
]

print("=" * 80)
print("KEYWORD FALLBACK TEST")
print("=" * 80)

# Import the keyword map and function
from chatbot_multilingual import KEYWORD_INTENT_MAP

# Define the improved keyword_fallback function
def keyword_fallback(normalized_text):
    """
    Score each intent by counting keyword hits in the user's message.
    Uses word boundary matching to avoid partial keyword matches.
    Returns the best matching intent tag or None.
    """
    # Split text into words for matching
    text_words = set(re.findall(r'\b\w+\b', normalized_text.lower()))
    
    best_tag = None
    best_score = 0
    best_matches = []
    
    for tag, keywords in KEYWORD_INTENT_MAP.items():
        score = 0
        match_details = []
        
        for kw in keywords:
            kw_lower = kw.lower()
            
            # Check if full keyword phrase is in text (for multi-word keywords)
            if kw_lower in normalized_text:
                score += 2  # Multi-word phrase match gets higher weight
                match_details.append((kw, 2))
            else:
                # Check if all words in the keyword are in the text
                kw_words = set(re.findall(r'\b\w+\b', kw_lower))
                if kw_words and kw_words.issubset(text_words):
                    score += 1  # Single words in keyword match
                    match_details.append((kw, 1))
        
        if score > best_score:
            best_score = score
            best_tag = tag
            best_matches = match_details
    
    return best_tag if best_score > 0 else None, best_score, best_matches

print("\nTesting keyword fallback on low-confidence queries:\n")

for query, expected_intent in test_queries:
    matched_intent, score, matches = keyword_fallback(query)
    
    status = "OK" if matched_intent == expected_intent else "FAIL"
    print(f"[{status}] Query: \"{query}\"")
    print(f"  Expected: {expected_intent}")
    print(f"  Got:      {matched_intent or 'NONE'} (score={score})")
    
    if matches:
        print(f"  Matched keywords: {matches[:3]}")
    
    if matched_intent != expected_intent:
        print(f"  WARNING: MISMATCH!")
    print()

print("=" * 80)
