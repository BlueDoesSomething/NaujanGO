#!/usr/bin/env python3
"""Test different hyperparameters for Tagalog model training."""

import os
import json
import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = Path(__file__).parent
INTENTS_DIR = BASE_DIR / "intents"
MODELS_DIR = BASE_DIR / "models"

def load_intents(lang_code):
    """Load intents from JSON file."""
    intents_file = INTENTS_DIR / f"intents_{lang_code}.json"
    with open(intents_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def train_and_test(c_value, gamma_value='scale'):
    """Train and test Tagalog model with given hyperparameters."""
    print(f"\n{'='*60}")
    print(f"Testing Tagalog with C={c_value}, gamma={gamma_value}")
    print(f"{'='*60}")
    
    # Load intents
    intents = load_intents('tl')
    all_patterns = []
    all_tags = []
    
    for intent in intents['intents']:
        tag = intent['tag']
        for pattern in intent['patterns']:
            all_patterns.append(pattern)
            all_tags.append(tag)
    
    print(f"[OK] Loaded {len(intents['intents'])} intents")
    print(f"[OK] Total patterns: {len(all_patterns)}")
    
    # Load embedding model
    print("> Loading embedding model...")
    model = SentenceTransformer('distiluse-base-multilingual-cased-v2')
    
    # Encode patterns
    print(f"> Encoding {len(all_patterns)} patterns...")
    embeddings = model.encode(all_patterns, show_progress_bar=False)
    
    # Train label encoder
    le = LabelEncoder()
    encoded_tags = le.fit_transform(all_tags)
    
    # Train SVM
    print(f"> Training SVM classifier with C={c_value}, gamma={gamma_value}...")
    svm = SVC(C=c_value, gamma=gamma_value, kernel='rbf', probability=True)
    svm.fit(embeddings, encoded_tags)
    
    # Calculate accuracy
    accuracy = svm.score(embeddings, encoded_tags)
    print(f"\n[OK] Training accuracy: {accuracy*100:.2f}%")
    
    # Per-class accuracy
    unique_tags = le.classes_
    print(f"\n> Per-class accuracy (top 5):")
    per_class_accuracies = []
    for tag in unique_tags:
        mask = (encoded_tags == le.transform([tag])[0])
        if mask.sum() > 0:
            tag_accuracy = svm.score(embeddings[mask], encoded_tags[mask])
            per_class_accuracies.append((tag, tag_accuracy))
    
    per_class_accuracies.sort(key=lambda x: x[1], reverse=True)
    for tag, acc in per_class_accuracies[:5]:
        print(f"    {tag}: {acc*100:.1f}%")
    
    return accuracy

# Test different C values
c_values = [0.5, 1.0, 2.0, 3.0, 5.0, 10.0]
results = []

for c_val in c_values:
    acc = train_and_test(c_val)
    results.append((c_val, acc))

print(f"\n\n{'='*60}")
print("SUMMARY - Best C values for Tagalog:")
print(f"{'='*60}")
results.sort(key=lambda x: x[1], reverse=True)
for c_val, acc in results:
    print(f"C={c_val}: {acc*100:.2f}%")

print(f"\n✅ Recommended C value: {results[0][0]} (accuracy: {results[0][1]*100:.2f}%)")
