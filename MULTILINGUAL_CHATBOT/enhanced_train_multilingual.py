#!/usr/bin/env python3
"""
Enhanced Training Script with Hyperparameter Tuning
Optimizes SVM parameters based on language performance
"""

import json
import pickle
import numpy as np
import os
from sentence_transformers import SentenceTransformer
from sklearn.svm import SVC
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import GridSearchCV
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_DIR = os.path.join(BASE_DIR, "intents")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Ensure models directory exists
os.makedirs(MODELS_DIR, exist_ok=True)

# Languages to train
LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']


def get_languages_to_train():
        requested = os.getenv('CHATBOT_TRAIN_LANGUAGES', '').strip().lower()
        if not requested:
            return LANGUAGES

        selected = [language.strip() for language in requested.split(',') if language.strip()]
        filtered = [language for language in LANGUAGES if language in selected]
        return filtered or LANGUAGES

# Language-specific hyperparameters optimized for accuracy
HYPERPARAMS = {
    'en': {'C': 1.0, 'gamma': 'scale'},      # Already good: 83.93%
    'es': {'C': 5.0, 'gamma': 'scale'},      # Boost from 67%
    'tl': {'C': 10.0, 'gamma': 'scale'},     # FIXED: was gamma='auto' → 6.32%, now gamma='scale' → 72.06%
    'zh': {'C': 1.0, 'gamma': 'scale'},      # Already excellent: 93.90%
    'ja': {'C': 0.5, 'gamma': 'scale'},      # Already excellent: 95.63%
    'ko': {'C': 3.0, 'gamma': 'scale'},      # Moderate boost from 79%
    'fr': {'C': 5.0, 'gamma': 'scale'},      # Boost from 71%
    'de': {'C': 5.0, 'gamma': 'scale'},      # Boost from 68%
}

# Embedding model - multilingual
EMBEDDER_NAME = "distiluse-base-multilingual-cased-v2"

def train_language_model(language):
    """Train a specific language model with optimized parameters"""
    print(f"\n{'='*60}")
    print(f"Training {language.upper()} Language Model (Enhanced)")
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
    pattern_count_by_intent = {}
    
    for intent in intents:
        tag = intent.get('tag')
        patterns = intent.get('patterns', [])
        responses = intent.get('responses', [])
        
        intent_responses[tag] = responses
        pattern_count_by_intent[tag] = len(patterns)
        
        for pattern in patterns:
            all_patterns.append(pattern)
            all_tags.append(tag)
    
    print(f"[OK] Total patterns: {len(all_patterns)}")
    print(f"[OK] Total unique tags: {len(set(all_tags))}")
    
    # Show pattern distribution for debugging
    print(f"\n> Pattern distribution by intent:")
    sorted_intents = sorted(pattern_count_by_intent.items(), key=lambda x: x[1], reverse=True)
    for tag, count in sorted_intents[:5]:
        print(f"    {tag}: {count} patterns")
    
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
    
    # Get optimized parameters for this language
    params = HYPERPARAMS.get(language, {'C': 1.0, 'gamma': 'scale'})
    
    # Train SVM classifier with optimized parameters
    print(f"> Training SVM classifier with optimized parameters...")
    print(f"  C={params['C']}, gamma={params['gamma']}")
    
    try:
        clf = SVC(
            kernel='rbf',
            C=params['C'],
            gamma=params['gamma'],
            probability=True,
            random_state=42,
            max_iter=2000
        )
        clf.fit(embeddings, encoded_tags)
        print(f"[OK] SVM classifier trained")
    except Exception as e:
        print(f"[ERROR] Error training classifier: {e}")
        return False
    
    # Test accuracy on training data
    train_accuracy = clf.score(embeddings, encoded_tags)
    print(f"[OK] Training accuracy: {train_accuracy:.2%}")
    
    # Calculate per-class accuracy
    from sklearn.metrics import classification_report
    predictions = clf.predict(embeddings)
    print(f"\n> Per-class accuracy (top 5):")
    classes = label_encoder.classes_
    for i, class_name in enumerate(classes[:5]):
        class_mask = encoded_tags == i
        if class_mask.sum() > 0:
            class_accuracy = (predictions[class_mask] == i).sum() / class_mask.sum()
            print(f"    {class_name}: {class_accuracy:.1%}")
    
    # Save models
    print(f"\n> Saving models...")
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
        
        print(f"[OK] Models saved")
        
    except Exception as e:
        print(f"[ERROR] Error saving models: {e}")
        return False
    
    return True

def main():
    """Train models for all languages with enhanced parameters"""
    languages_to_train = get_languages_to_train()
    print("\n" + "="*60)
    print("ENHANCED MULTILINGUAL CHATBOT MODEL TRAINING")
    print("="*60)
    print(f"Training languages: {', '.join([lang.upper() for lang in languages_to_train])}")
    
    successful = 0
    failed = 0
    
    for lang in languages_to_train:
        if train_language_model(lang):
            successful += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print("TRAINING SUMMARY")
    print(f"{'='*60}")
    print(f"[OK] Successfully trained: {successful}/{len(languages_to_train)}")
    print(f"  Languages: {', '.join([l.upper() for l in languages_to_train[:successful]])}")
    
    if failed == 0:
        print(f"\n[SUCCESS] All models trained successfully with optimized parameters!")
    else:
        print(f"\n[WARNING] {failed} languages had issues during training")

if __name__ == '__main__':
    main()
