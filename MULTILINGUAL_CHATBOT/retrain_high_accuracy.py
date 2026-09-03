"""
High Accuracy Retraining Script for Naujan Chatbot
Addresses intent misclassification issues
"""

import json
import pickle
import numpy as np
import os
from sentence_transformers import SentenceTransformer
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "intents")
MODELS_DIR = os.path.join(BASE_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)

LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']
EMBEDDER_NAME = "distiluse-base-multilingual-cased-v2"

def train_high_accuracy_model(language):
    """Train with optimized parameters for high accuracy"""
    print(f"\n{'='*60}")
    print(f"HIGH ACCURACY TRAINING: {language.upper()}")
    print(f"{'='*60}")
    
    intents_file = os.path.join(INTENTS_DIR, f"intents_{language}.json")
    
    if not os.path.exists(intents_file):
        print(f"[ERROR] File not found: {intents_file}")
        return False
    
    with open(intents_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    intents = data.get('intents', [])
    print(f"[OK] Loaded {len(intents)} intents")
    
    all_patterns = []
    all_tags = []
    intent_responses = {}
    
    for intent in intents:
        tag = intent.get('tag')
        patterns = intent.get('patterns', [])
        responses = intent.get('responses', [])
        
        intent_responses[tag] = responses
        
        for pattern in patterns:
            all_patterns.append(pattern)
            all_tags.append(tag)
    
    print(f"[OK] Total patterns: {len(all_patterns)}")
    print(f"[OK] Unique intents: {len(set(all_tags))}")
    
    # Load embedder
    print(f"\n> Loading embedder: {EMBEDDER_NAME}")
    embedder = SentenceTransformer(EMBEDDER_NAME)
    print(f"[OK] Embedder loaded")
    
    # Encode patterns
    print(f"> Encoding patterns...")
    embeddings = embedder.encode(all_patterns, convert_to_numpy=True, show_progress_bar=True)
    print(f"[OK] Encoded shape: {embeddings.shape}")
    
    # Encode labels
    label_encoder = LabelEncoder()
    encoded_tags = label_encoder.fit_transform(all_tags)
    print(f"[OK] Label encoder trained with {len(label_encoder.classes_)} classes")
    
    # High accuracy SVM parameters
    print(f"\n> Training HIGH ACCURACY SVM...")
    
    # Optimized parameters for better classification
    clf = SVC(
        kernel='rbf',
        C=10.0,              # Higher C for stricter classification
        gamma='scale',
        probability=True,
        random_state=42,
        max_iter=5000,       # More iterations
        class_weight='balanced'  # Handle class imbalance
    )
    
    clf.fit(embeddings, encoded_tags)
    
    # Evaluate
    train_accuracy = clf.score(embeddings, encoded_tags)
    print(f"[OK] Training accuracy: {train_accuracy:.2%}")
    
    # Cross-validation
    print(f"> Running cross-validation...")
    cv_scores = cross_val_score(clf, embeddings, encoded_tags, cv=5)
    print(f"[OK] CV accuracy: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
    
    # Save models
    print(f"\n> Saving models...")
    
    embedder_name_file = os.path.join(MODELS_DIR, "embedder_name.txt")
    with open(embedder_name_file, 'w', encoding='utf-8') as f:
        f.write(EMBEDDER_NAME)
    
    clf_file = os.path.join(MODELS_DIR, f"intent_classifier_{language}.pkl")
    encoder_file = os.path.join(MODELS_DIR, f"label_encoder_{language}.pkl")
    responses_file = os.path.join(MODELS_DIR, f"intent_responses_{language}.json")
    
    with open(clf_file, 'wb') as f:
        pickle.dump(clf, f)
    
    with open(encoder_file, 'wb') as f:
        pickle.dump(label_encoder, f)
    
    with open(responses_file, 'w', encoding='utf-8') as f:
        json.dump(intent_responses, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Models saved successfully")
    print(f"  - Classifier: {clf_file}")
    print(f"  - Encoder: {encoder_file}")
    print(f"  - Responses: {responses_file}")
    
    return True

def main():
    print("\n" + "="*60)
    print("HIGH ACCURACY RETRAINING - NAUJAN CHATBOT")
    print("="*60)
    
    successful = []
    failed = []
    
    for language in LANGUAGES:
        try:
            if train_high_accuracy_model(language):
                successful.append(language)
            else:
                failed.append(language)
        except Exception as e:
            print(f"[ERROR] Failed to train {language}: {e}")
            failed.append(language)
    
    print(f"\n{'='*60}")
    print("RETRAINING SUMMARY")
    print(f"{'='*60}")
    print(f"[OK] Successfully trained: {len(successful)}/{len(LANGUAGES)}")
    print(f"  Languages: {', '.join(successful).upper()}")
    
    if failed:
        print(f"\n[ERROR] Failed: {len(failed)}/{len(LANGUAGES)}")
        print(f"  Languages: {', '.join(failed).upper()}")
    
    if len(successful) == len(LANGUAGES):
        print(f"\n[SUCCESS] All models retrained with high accuracy!")
        return 0
    else:
        print(f"\n[WARNING] Some models failed")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
