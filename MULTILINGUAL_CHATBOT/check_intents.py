#!/usr/bin/env python3
"""Check intent mismatch."""

import json

# Load JSON intents
with open("intents/intents_en.json", "r", encoding="utf-8") as f:
    json_data = json.load(f)

# Load response file
with open("models/intent_responses_en.json", "r", encoding="utf-8") as f:
    response_data = json.load(f)

json_intents = set(i["tag"] for i in json_data["intents"])
response_intents = set(response_data.keys())

print(f"JSON file has {len(json_intents)} intents")
print(f"Response file has {len(response_intents)} intents")

# Find missing ones
missing_in_response = json_intents - response_intents
extra_in_response = response_intents - json_intents

if missing_in_response:
    print(f"\n❌ MISSING in response file ({len(missing_in_response)}):")
    for intent in sorted(missing_in_response):
        print(f"  - {intent}")

if extra_in_response:
    print(f"\n⚠️  EXTRA in response file ({len(extra_in_response)}):")
    for intent in sorted(extra_in_response)[:10]:
        print(f"  - {intent}")

print(f"\n✓ Matching intents: {len(json_intents & response_intents)}")
