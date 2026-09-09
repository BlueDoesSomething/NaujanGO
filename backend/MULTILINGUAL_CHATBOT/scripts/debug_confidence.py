import sys
sys.path.insert(0, '.')
import chatbot_multilingual as bot
import numpy as np

tests = [
    ('paano pumunta sa naujan', 'tl'),
    ('mga barangay ng naujan', 'tl'),
    ('panahon sa naujan', 'tl'),
    ('como llegar a naujan', 'es'),
    ('aves lago naujan', 'es'),
    ('wie kommt man nach naujan', 'de'),
    ('如何去瑙汉', 'zh'),
    ('ナウハンへの行き方', 'ja'),
    ('나우한 가는 방법', 'ko'),
]

print("=== Confidence Debug ===\n")
for msg, lang in tests:
    clf, le, responses = bot.loaded_models[lang]
    normalized = bot.normalize_input(msg)
    emb = bot.embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    proba = clf.predict_proba(emb)[0]
    top3_idx = np.argsort(proba)[-3:][::-1]
    print(f'[{lang}] "{msg}" (normalized: "{normalized}")')
    for idx in top3_idx:
        tag = le.inverse_transform([idx])[0]
        print(f'  {tag}: {proba[idx]:.3f}')
    print()
