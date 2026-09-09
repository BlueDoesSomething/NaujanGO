"""
Debug script to test model predictions and confidence scores
"""
import pickle
import json
import os
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Setup paths
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / 'models'

# Test queries
test_queries = {
    'en': [
        "What can I do at Naujan Lake?",
        "how to get to naujan",
        "fiesta in naujan",
        "where is naujan",
        "budget hotel naujan",
        "waterfalls naujan",
   ]
}

print("\n" + "=" * 80)
print("MODEL CONFIDENCE SCORE DEBUG TEST".center(80))
print("=" * 80 + "\n")

# Load embedder
try:
    embedder = SentenceTransformer('distiluse-base-multilingual-cased-v2')
    print("[OK] Embedder loaded\n")
except Exception as e:
    print(f"[ERROR] Failed to load embedder: {e}")
    sys.exit(1)

# Test English model
print("TESTING ENGLISH MODEL")
print("-" * 80)

clf_file = MODELS_DIR / 'intent_classifier_en.pkl'
encoder_file = MODELS_DIR / 'label_encoder_en.pkl'
responses_file = MODELS_DIR / 'intent_responses_en.json'

try:
    with open(clf_file, 'rb') as f:
        clf = pickle.load(f)
    print(f"[OK] Classifier loaded")
    
    with open(encoder_file, 'rb') as f:
        label_encoder = pickle.load(f)
    print(f"[OK] Label encoder loaded")
    
    with open(responses_file, 'r', encoding='utf-8') as f:
        intent_responses = json.load(f)
    print(f"[OK] Responses loaded\n")
    
except Exception as e:
    print(f"[ERROR] Failed to load models: {e}")
    sys.exit(1)

# Test predictions
print("PREDICTION RESULTS")
print("-" * 80)

for query in test_queries['en']:
    # Normalize
    normalized = query.lower().strip()
    
    # Encode
    try:
        emb = embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    except Exception as e:
        print(f"ERROR encoding {query}: {e}")
        continue
    
    # Predict
    try:
        proba = clf.predict_proba(emb)[0]
        confidence = proba.max()
        tag_index = proba.argmax()
        tag = label_encoder.inverse_transform([tag_index])[0]
        
        # Get top 3 predictions
        top_indices = proba.argsort()[-3:][::-1]
        top_preds = []
        for idx in top_indices:
            t = label_encoder.inverse_transform([idx])[0]
            c = proba[idx]
            top_preds.append(f"{t} ({c:.3f})")
        
        print(f'\nQuery: "{query}"')
        print(f"Predicted: {tag} (confidence: {confidence:.3f})")
        print(f"Top 3: {', '.join(top_preds)}")
        print()
        
    except Exception as e:
        print(f"[ERROR] Prediction failed: {e}")

print("-" * 80)
print("\nCONFIDENCE THRESHOLD CHECK")
print("-" * 80)

confids = []
for query in test_queries['en']:
    normalized = query.lower().strip()
    emb = embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    proba = clf.predict_proba(emb)[0]
    confids.append(proba.max())

avg_conf = sum(confids) / len(confids)
min_conf = min(confids)
max_conf = max(confids)

print(f"Average confidence: {avg_conf:.3f}")
print(f"Min confidence: {min_conf:.3f}")
print(f"Max confidence: {max_conf:.3f}")
print(f"Current thresholds: EN=0.40, ES=0.25, TL=0.25")
print(f"\nRecommendation: If avg < 0.40, thresholds need lowering")

print("\n" + "=" * 80 + "\n")
