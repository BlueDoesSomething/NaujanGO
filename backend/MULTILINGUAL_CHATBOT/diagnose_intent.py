#!/usr/bin/env python3
"""Diagnose intent prediction issues."""

import json
import pickle
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / "models"

# Test queries from user
test_queries = {
    'en': [
        "What are the attractions in Naujan",
        "What hotels and accommodations are available in Naujan",
        "What are the top tourist attractions in Oriental Mindoro",
        "Help me plan a day trip to Oriental Mindoro",
        "What's the best time to visit Oriental Mindoro",
    ]
}

# Load English models
print("=" * 80)
print("INTENT PREDICTION DIAGNOSTIC")
print("=" * 80)

try:
    # Load classifier
    with open(MODELS_DIR / "intent_classifier_en.pkl", "rb") as f:
        clf = pickle.load(f)
    print("✓ Classifier loaded")
    
    # Load label encoder
    with open(MODELS_DIR / "label_encoder_en.pkl", "rb") as f:
        label_encoder = pickle.load(f)
    print(f"✓ Label encoder loaded with {len(label_encoder.classes_)} classes")
    print(f"  Classes: {list(label_encoder.classes_[:10])}...")
    
    # Load embedder
    embedder = SentenceTransformer('distiluse-base-multilingual-cased-v2')
    print("✓ Embedder loaded")
    
    # Load intent responses
    with open(MODELS_DIR / "intent_responses_en.json", "r", encoding="utf-8") as f:
        intent_responses = json.load(f)
    print(f"✓ Intent responses loaded for {len(intent_responses)} intents")
    
    # Load keyword intent map from chatbot_multilingual.py
    # For now, we'll create a minimal version to check the concept
    
    print("\n" + "-" * 80)
    print("TESTING QUERIES:")
    print("-" * 80)
    
    for query in test_queries['en']:
        print(f"\nQuery: \"{query}\"")
        
        # Embed the query
        emb = embedder.encode([query], convert_to_numpy=True, show_progress_bar=False)
        
        # Get predictions with probabilities
        proba = clf.predict_proba(emb)[0]
        tag_index = np.argmax(proba)
        predicted_intent = label_encoder.inverse_transform([tag_index])[0]
        confidence = proba[tag_index]
        
        print(f"  Predicted Intent: {predicted_intent}")
        print(f"  Confidence: {confidence:.4f}")
        
        # Get top 3 predictions
        top3_indices = np.argsort(proba)[-3:][::-1]
        print(f"  Top 3 predictions:")
        for idx in top3_indices:
            intent = label_encoder.inverse_transform([idx])[0]
            conf = proba[idx]
            print(f"    - {intent}: {conf:.4f}")
        
        # Get response
        response = intent_responses.get(predicted_intent, ["NO RESPONSE FOUND"])[0]
        print(f"  Response: {response[:80]}...")
        
        # Check confidence threshold
        CONFIDENCE_THRESHOLDS = {
            'en': 0.20,
        }
        threshold = CONFIDENCE_THRESHOLDS.get('en', 0.40)
        if confidence < threshold:
            print(f"  ⚠️  BELOW THRESHOLD ({threshold}) - Would use keyword fallback!")

except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
