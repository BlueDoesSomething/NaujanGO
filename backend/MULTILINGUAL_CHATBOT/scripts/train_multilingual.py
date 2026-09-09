"""
Multilingual Chatbot Training Script
Trains separate intent classifiers for each language for better accuracy and performance
"""

import json
import pickle
import numpy as np
import os
from sentence_transformers import SentenceTransformer
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "..", "intents")
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

# Languages to train
LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']

# Embedding model - multilingual
EMBEDDER_NAME = "distiluse-base-multilingual-cased-v2"

def train_language_model(language):
    """Train a specific language model"""
    print(f"\n{'='*60}")
    print(f"Training {language.upper()} Language Model")
    print(f"{'='*60}")
    
    # Load language-specific intents
    intents_file = os.path.join(INTENTS_DIR, f"intents_{language}.json")
    
    if not os.path.exists(intents_file):
        print(f"[ERROR] Intent file not found: {intents_file}")
        return False
    
    try:
        with open(intents_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[ERROR] Error loading intents: {e}")
        return False
    
    intents = data.get('intents', [])
    
    if not intents:
        print(f"[ERROR] No intents found in {language}")
        return False
    
    print(f"[OK] Loaded {len(intents)} intents")
    
    # Collect patterns and tags
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
    print(f"[OK] Total unique tags: {len(set(all_tags))}")
    
    # Load embedding model
    print(f"\n> Loading embedding model: {EMBEDDER_NAME}")
    try:
        embedder = SentenceTransformer(EMBEDDER_NAME)
        print(f"[OK] Embedding model loaded")
    except Exception as e:
        print(f"[ERROR] Error loading embedder: {e}")
        return False
    
    # Encode patterns
    print(f"> Encoding {len(all_patterns)} patterns...")
    try:
        embeddings = embedder.encode(all_patterns, convert_to_numpy=True)
        print(f"[OK] Patterns encoded (shape: {embeddings.shape})")
    except Exception as e:
        print(f"[ERROR] Error encoding patterns: {e}")
        return False
    
    # Train label encoder
    label_encoder = LabelEncoder()
    encoded_tags = label_encoder.fit_transform(all_tags)
    
    print(f"[OK] Label encoder trained")
    print(f"  Classes: {label_encoder.classes_}")
    
    # Train SVM classifier with language-optimized parameters
    print(f"> Training SVM classifier...")
    
    # Language-specific hyperparameter optimization
    param_map = {
        'en': {'C': 1.0, 'gamma': 'scale'},      
        'es': {'C': 8.0, 'gamma': 'scale'},      
        'tl': {'C': 1.2, 'gamma': 'scale'},      # Conservative for Tagalog
        'zh': {'C': 1.0, 'gamma': 'scale'},      
        'ja': {'C': 1.0, 'gamma': 'scale'},      # Keep JA at baseline
        'ko': {'C': 5.0, 'gamma': 'scale'},      
        'fr': {'C': 8.0, 'gamma': 'scale'},      
        'de': {'C': 8.0, 'gamma': 'scale'},      
    }
    
    params = param_map.get(language, {'C': 1.0, 'gamma': 'scale'})
    
    try:
        clf = SVC(kernel='rbf', C=params['C'], gamma=params['gamma'], probability=True, random_state=42, max_iter=2000)
        clf.fit(embeddings, encoded_tags)
        print(f"[OK] SVM classifier trained (C={params['C']}, gamma={params['gamma']})")
    except Exception as e:
        print(f"[ERROR] Error training classifier: {e}")
        return False
    
    # Test accuracy on training data
    train_accuracy = clf.score(embeddings, encoded_tags)
    print(f"[OK] Training accuracy: {train_accuracy:.2%}")
    
    # Save models
    print(f"> Saving models...")
    try:
        # Save embedder name
        embedder_name_file = os.path.join(MODELS_DIR, f"embedder_name.txt")
        with open(embedder_name_file, 'w', encoding='utf-8') as f:
            f.write(EMBEDDER_NAME)
        
        # Save language-specific models
        clf_file = os.path.join(MODELS_DIR, f"intent_classifier_{language}.pkl")
        encoder_file = os.path.join(MODELS_DIR, f"label_encoder_{language}.pkl")
        responses_file = os.path.join(MODELS_DIR, f"intent_responses_{language}.json")
        
        with open(clf_file, 'wb') as f:
            pickle.dump(clf, f)
        
        with open(encoder_file, 'wb') as f:
            pickle.dump(label_encoder, f)
        
        with open(responses_file, 'w', encoding='utf-8') as f:
            json.dump(intent_responses, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] Models saved:")
        print(f"  - {clf_file}")
        print(f"  - {encoder_file}")
        print(f"  - {responses_file}")
        
    except Exception as e:
        print(f"[ERROR] Error saving models: {e}")
        return False
    
    return True

def main():
    """Train models for all languages"""
    print("\n" + "="*60)
    print("MULTILINGUAL CHATBOT MODEL TRAINING")
    print("="*60)
    
    successful = []
    failed = []
    
    for language in LANGUAGES:
        if train_language_model(language):
            successful.append(language)
        else:
            failed.append(language)
    
    # Summary
    print(f"\n{'='*60}")
    print("TRAINING SUMMARY")
    print(f"{'='*60}")
    print(f"[OK] Successfully trained: {len(successful)}/{len(LANGUAGES)}")
    print(f"  Languages: {', '.join(successful).upper()}")
    
    if failed:
        print(f"\n[ERROR] Failed: {len(failed)}/{len(LANGUAGES)}")
        print(f"  Languages: {', '.join(failed).upper()}")
    
    if len(successful) == len(LANGUAGES):
        print(f"\n[SUCCESS] All models trained successfully!")
        return 0
    else:
        print(f"\n[WARNING] Some models failed to train")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
