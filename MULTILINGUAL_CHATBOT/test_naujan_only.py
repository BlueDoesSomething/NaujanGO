"""
Test chatbot to verify Oriental Mindoro references are removed
"""
import sys
sys.path.insert(0, 'scripts')
import enhanced_chatbot_multilingual as bot

test_queries = [
    "Where is Naujan?",
    "Tell me about Naujan",
    "Naujan location",
    "What's in Naujan?",
    "Naujan province",
    "Naujan attractions",
]

print("\n" + "=" * 90)
print("TESTING NAUJAN-ONLY FOCUS (Oriental Mindoro References Removed)".center(90))
print("=" * 90 + "\n")

forbidden_keywords = [
    'oriental mindoro',
    'mimaropa',
    'mindoro region',
    'mindoro province',
]

for query in test_queries:
    response = bot.get_response(query, 'en')
    
    # Check for forbidden keywords
    has_forbidden = False
    for keyword in forbidden_keywords:
        if keyword.lower() in response.lower():
            has_forbidden = True
            break
    
    status = "❌ FAILED" if has_forbidden else "✓ PASS"
    
    print(f'{status} Query: "{query}"')
    print(f'    Response: {response[:100]}{"..." if len(response) > 100 else ""}')
    if has_forbidden:
        print(f'    WARNING: Still contains forbidden reference!')
    print()

print("=" * 90)
print("Test Complete - Chatbot should now focus exclusively on Naujan Municipality".center(90))
print("=" * 90 + "\n")
