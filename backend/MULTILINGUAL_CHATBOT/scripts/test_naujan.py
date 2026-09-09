"""
Quick test for Naujan-focused chatbot by importing the module directly.
"""
import sys
sys.path.insert(0, '.')
import chatbot_multilingual as bot

tests = [
    ('What can I do at Naujan Lake?', 'en'),
    ('how to get to naujan', 'en'),
    ('fiesta in naujan', 'en'),
    ('birds in the lake', 'en'),
    ('emergency number naujan', 'en'),
    ('history of naujan', 'en'),
    ('best time to visit naujan', 'en'),
    ('barangays in naujan', 'en'),
    ('where is naujan', 'en'),
    ('budget trip to naujan', 'en'),
]

print("\n=== NAUJAN CHATBOT TEST RESULTS ===\n")
for msg, lang in tests:
    reply = bot.get_response(msg, lang)
    print(f'Q: "{msg}"')
    print(f'A: {reply[:120]}')
    print()

print("=== TESTS COMPLETE ===")
