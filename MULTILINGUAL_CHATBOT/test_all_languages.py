import sys
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
    ('zh', '如何去瑙汉'),
    ('ja', 'ナウハンへの行き方'),
    ('ko', '나우한에 가는 방법'),
]

print('=== Multilingual Test ===')
passed = 0
failed = 0
for lang, query in tests:
    resp = get_response(query, lang, use_cache=False)
    is_fallback = any(kw in resp.lower() for kw in ['not sure', 'please ask', 'try asking', "i'm not sure", "lo siento", "je ne suis pas", "ich bin nicht", "抱歉", "申し訳", "죄송"])
    status = 'FAIL' if is_fallback else 'OK'
    if is_fallback:
        failed += 1
    else:
        passed += 1
    preview = resp[:90].replace('\n', ' ')
    print(f'[{lang}] {status}: {query[:45]}')
    print(f'       -> {preview}')
    print()

print(f'Results: {passed}/{passed+failed} passed')
