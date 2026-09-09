#!/usr/bin/env python3
"""Debug chatbot intent detection and responses."""

import json
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"
INTENTS_DIR = BASE_DIR / "intents"

# Load intents and check what's actually stored
print("=" * 70)
print("CHATBOT INTENT DEBUGGING")
print("=" * 70)

# Test queries that are failing
test_queries = [
    ("What are the attractions in Naujan", "en"),
    ("What hotels are available in Naujan", "en"),
    ("What are the top tourist attractions", "en"),
    ("Help me plan a day trip", "en"),
    ("What's the best time to visit", "en"),
]

# Load English intents
with open(INTENTS_DIR / "intents_en.json", "r", encoding="utf-8") as f:
    intents_data = json.load(f)

print("\n1. AVAILABLE INTENTS IN JSON:")
print("-" * 70)
for intent in intents_data["intents"][:10]:
    print(f"  • {intent['tag']}: {len(intent.get('patterns', []))} patterns")
    if intent['tag'] in ['Attractions_Nearby', 'Naujan_Accommodations_Budget', 'Itinerary_Plan', 'Best_Time_To_Visit']:
        print(f"    Sample patterns: {intent['patterns'][:3]}")
        print(f"    Sample responses: {intent['responses'][:1]}")

print("\n2. CHECKING INTENT RESPONSE FILES:")
print("-" * 70)
# Check if intent_responses_en.json exists
intent_responses_file = MODELS_DIR / "intent_responses_en.json"
if intent_responses_file.exists():
    with open(intent_responses_file, "r", encoding="utf-8") as f:
        intent_responses = json.load(f)
    
    print(f"✓ intent_responses_en.json found")
    print(f"  Total intents in response file: {len(intent_responses)}")
    
    # Check if key intents exist
    key_intents = ['Attractions_Nearby', 'Naujan_Accommodations_Budget', 'Itinerary_Plan', 'Best_Time_To_Visit', 'LGU_Contact_Mayor']
    print(f"\n  Checking key intents:")
    for intent_tag in key_intents:
        if intent_tag in intent_responses:
            resp = intent_responses[intent_tag]
            if isinstance(resp, list) and len(resp) > 0:
                print(f"    ✓ {intent_tag}: {resp[0][:60]}...")
            else:
                print(f"    ✗ {intent_tag}: Empty or invalid")
        else:
            print(f"    ✗ {intent_tag}: NOT FOUND")
else:
    print(f"✗ intent_responses_en.json NOT FOUND at {intent_responses_file}")

print("\n3. LOADING TRAINED MODELS:")
print("-" * 70)

try:
    import pickle
    from sentence_transformers import SentenceTransformer
    
    # Try to load classifier
    classifier_file = MODELS_DIR / "en_classifier.pkl"
    encoder_file = MODELS_DIR / "en_encoder.pkl"
    
    if classifier_file.exists():
        with open(classifier_file, "rb") as f:
            classifier = pickle.load(f)
        print(f"✓ Classifier loaded: {type(classifier).__name__}")
    else:
        print(f"✗ Classifier NOT FOUND: {classifier_file}")
        classifier = None
    
    if encoder_file.exists():
        with open(encoder_file, "rb") as f:
            encoder = pickle.load(f)
        print(f"✓ Label encoder loaded with {len(encoder.classes_)} classes")
        print(f"  Sample classes: {encoder.classes_[:5]}")
    else:
        print(f"✗ Encoder NOT FOUND: {encoder_file}")
        encoder = None
    
    # Test embedding model
    print(f"\n✓ Loading SentenceTransformer...")
    embedding_model = SentenceTransformer('distiluse-base-multilingual-cased-v2')
    print(f"  Model loaded successfully")
    
    # Test a prediction
    if classifier and encoder:
        print(f"\n4. TESTING PREDICTIONS:")
        print("-" * 70)
        
        test_sentence = "What are the attractions in Naujan"
        embedding = embedding_model.encode([test_sentence], show_progress_bar=False)[0]
        
        # Get prediction
        predicted_idx = classifier.predict([embedding])[0]
        predicted_intent = encoder.inverse_transform([predicted_idx])[0]
        
        # Get decision function for confidence
        if hasattr(classifier, 'decision_function'):
            scores = classifier.decision_function([embedding])[0]
            confidence = scores.max()
        else:
            confidence = classifier.predict_proba([embedding]).max()
        
        print(f"Query: '{test_sentence}'")
        print(f"Predicted Intent: {predicted_intent}")
        print(f"Confidence: {confidence:.4f}")
        
        # Check if response exists
        if intent_responses_file.exists():
            with open(intent_responses_file, "r", encoding="utf-8") as f:
                intent_responses = json.load(f)
            
            if predicted_intent in intent_responses:
                response = intent_responses[predicted_intent]
                if isinstance(response, list) and len(response) > 0:
                    print(f"Response: {response[0][:100]}...")
                else:
                    print(f"Response: (empty or invalid)")
            else:
                print(f"Response: NOT FOUND for intent '{predicted_intent}'")
        
except Exception as e:
    print(f"✗ Error loading models: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("END DEBUG")
print("=" * 70)
