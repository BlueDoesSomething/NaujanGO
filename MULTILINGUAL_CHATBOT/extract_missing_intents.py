#!/usr/bin/env python3
"""Extract all intents and generate missing keyword mappings."""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent

# Load all intents from JSON
with open(BASE_DIR / "intents" / "intents_en.json", "r", encoding="utf-8") as f:
    intents_data = json.load(f)

all_intents = set(i["tag"] for i in intents_data["intents"])

# Extract keywords already in the map from chatbot_multilingual.py
current_map_intents = {
    "Naujan_Location", "Naujan_Lake_About", "Naujan_Lake_Wildlife", 
    "Naujan_Lake_Activities", "Naujan_Overview", "LGU_Contact_Mayor",
    "Emergency_Police", "Safety_Emergency", "Agriculture_Crops",
    "Naujan_Agriculture", "Weather_Info", "Itinerary_Plan",
    "Transportation_How_To_Get_There", "Local_Transport", "Local_Food_Cuisine",
    "Festivals_Events", "Naujan_Natural_Features", "Hiking_Trekking",
    "Mangyan_Culture", "Best_Time_To_Visit", "Budget_Travel",
    "Accommodation_Types", "Booking_Help", "App_Capabilities",
    "Shopping_Souvenirs", "History_Heritage", "Eco_Tourism",
    "Naujan_Barangays", "greeting", "goodbye"
}

missing = all_intents - current_map_intents

print(f"Total intents in JSON: {len(all_intents)}")
print(f"Intents in current keyword map: {len(current_map_intents)}")
print(f"MISSING intents ({len(missing)}):")
for intent in sorted(missing):
    print(f"  - {intent}")

# Show sample patterns for missing intents to guide keyword generation
print("\n" + "=" * 80)
print("SAMPLE PATTERNS FOR MISSING INTENTS:")
print("=" * 80)

for intent_tag in sorted(missing):
    intent_obj = next((i for i in intents_data["intents"] if i["tag"] == intent_tag), None)
    if intent_obj:
        patterns = intent_obj.get("patterns", [])[:5]
        print(f"\n{intent_tag}:")
        print(f"  Patterns: {patterns}")
