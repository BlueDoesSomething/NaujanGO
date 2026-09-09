"""
Test chatbot with fixed confidence thresholds
"""
import sys
sys.path.insert(0, 'scripts')

# Import the chatbot module
import enhanced_chatbot_multilingual as bot

test_queries = [
    "What can I do at Naujan Lake?",
    "how to get to naujan",
    "fiesta in naujan",
    "where is naujan",
    "budget hotel naujan",
    "waterfalls naujan",
    "best time to visit",
    "how much is accommodation",
]

print("\n" + "=" * 80)
print("CHATBOT RESPONSE TEST WITH FIXED THRESHOLDS".center(80))
print("=" * 80 + "\n")

for query in test_queries:
    response = bot.get_response(query, 'en')
    
    # Check if it's the default "don't understand" response
    is_understand_failure = "not quite sure" in response.lower() or "didn't understand" in response.lower()
    status = "❌ FAILED" if is_understand_failure else "✓ OK"
    
    print(f'{status} Query: "{query}"')
    print(f'   Response: {response[:90]}{"..." if len(response) > 90 else ""}')
    print()

print("=" * 80)
print("If all show ✓ OK, the chatbot is now working properly!" .center(80))
print("=" * 80 + "\n")
