import sys
sys.path.insert(0, 'scripts')
import numpy as np
from chatbot_multilingual import loaded_models, normalize_input, embedder, CONFIDENCE_THRESHOLDS

tests = [
    ('fr', 'comment aller a naujan'),
    ('de', 'wie kommt man nach naujan'),
    ('zh', '\u5982\u4f55\u53bb\u7409\u6c49'),
    ('ja', '\u30ca\u30a6\u30cf\u30f3\u3078\u306e\u884c\u304d\u65b9'),
    ('ko', '\ub098\uc6b0\ud55c\uc5d0 \uac00\ub294 \ubc29\ubc95'),
]

print('=== Debug Confidence After Fixes ===')
for lang, query in tests:
    normalized = normalize_input(query, lang)
    print(f'[{lang}] Input: {query!r}')
    print(f'       Normalized: {normalized!r}')
    threshold = CONFIDENCE_THRESHOLDS.get(lang, 0.40)
    
    if lang not in loaded_models:
        print(f'       ERROR: {lang} model not loaded')
        continue
    
    clf, label_encoder, intent_responses = loaded_models[lang]
    emb = embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    proba = clf.predict_proba(emb)[0]
    top3_idx = np.argsort(proba)[-3:][::-1]
    
    print(f'       Threshold: {threshold}')
    for idx in top3_idx:
        tag = label_encoder.inverse_transform([idx])[0]
        print(f'       {tag}: {proba[idx]:.3f}{"  <<< PASS" if idx == top3_idx[0] and proba[idx] >= threshold else ""}')
    print()
