#!/usr/bin/env python3
"""Show actual responses from intent database."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"

# Load intent responses
with open(MODELS_DIR / "intent_responses_en.json", "r", encoding="utf-8") as f:
    intent_responses = json.load(f)

# Show responses for key intents from your tests
intents_to_show = [
    "Naujan_Attractions_Major",
    "Hotel_Recommendations", 
    "Itinerary_Plan",
    "Best_Time_To_Visit",
]

print("=" * 80)
print("RESPONSES FROM INTENT DATABASE (intent_responses_en.json)")
print("=" * 80)

for intent in intents_to_show:
    responses = intent_responses.get(intent, [])
    print(f"\n{intent}:")
    print(f"  Total responses: {len(responses)}")
    if responses:
        for i, resp in enumerate(responses[:2], 1):
            print(f"  Response {i}: {resp[:100]}...")
