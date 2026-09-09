import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, 'scripts')
from chatbot_multilingual import get_response

tests = [
    ('en', 'what is naujan lake'),
    ('tl', 'paano pumunta sa naujan'),
    ('tl', 'ano ang mga aktibidad sa naujan lake'),
    ('es', 'como llegar a naujan'),
    ('es', 'que actividades hay en el lago naujan'),
    ('fr', 'comment aller a naujan'),
    ('de', 'wie kommt man nach naujan'),
    ('zh', '\u5982\u4f55\u53bb\u7409\u6c49'),
    ('ja', '\u30ca\u30a6\u30cf\u30f3\u3078\u306e\u884c\u304d\u65b9'),
    ('ko', '\ub098\uc6b0\ud55c\uc5d0 \uac00\ub294 \ubc29\ubc95'),
]

print('=== Multilingual Test ===')
passed = 0
failed = 0
for lang, query in tests:
    resp = get_response(query, lang, use_cache=False)
    is_fallback = any(kw in resp.lower() for kw in [
        'not sure', 'please ask', 'try asking', "i'm not sure",
        "lo siento", "je ne suis pas", "ich bin nicht sicher",
        "no estoy seguro",
    ])
    status = 'FAIL' if is_fallback else 'OK'
    if is_fallback:
        failed += 1
    else:
        passed += 1
    preview = resp[:80].replace('\n', ' ')
    print(f'[{lang}] {status}: query=[{query}]')
    print(f'       -> {preview}')
    print()

print(f'Results: {passed}/{passed+failed} passed')
