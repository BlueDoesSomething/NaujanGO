"""
Comprehensive chatbot test with Naujan-specific queries
"""
import sys
sys.path.insert(0, 'scripts')
import enhanced_chatbot_multilingual as bot

naujan_queries = [
    # Lake activities
    "What can I do at Naujan Lake?",
    "boat rides on naujan lake",
    "birdwatching naujan",
    # Accommodations
    "budget hotel naujan",
    "luxury resort naujan",
    "midrange hotel in naujan",
    # Attractions
    "waterfalls in naujan",
    "eco parks naujan",
    "beaches naujan",
    # Travel info
    "how to get to naujan",
    "where is naujan",
    "best time to visit naujan",
    # Activities
    "things to do in naujan",
    "tourist attractions naujan",
    "restaurants in naujan",
    # Translations for multilingual
    "¿Dónde está naujan? (Spanish)",
    "Saan ang naujan? (Tagalog)",
]

print("\n" + "=" * 90)
print("COMPREHENSIVE NAUJAN CHATBOT TEST (Fixed Thresholds)".center(90))
print("=" * 90 + "\n")

success_count = 0
fail_count = 0

for query in naujan_queries:
    response = bot.get_response(query, 'en')
    is_fail = "not quite sure" in response.lower() or "didn't understand" in response.lower()
    
    if not is_fail:
        success_count += 1
        status = "✓"
    else:
        fail_count += 1
        status = "✗"
    
    # Clean response for display
    response_preview = response.replace('\n', ' ')[:70]
    print(f'{status} {query[:40]:40} → {response_preview}...')

print()
print("=" * 90)
print(f"Results: {success_count}/{len(naujan_queries)} queries understood (+{(success_count/len(naujan_queries)*100):.0f}%)".center(90))
if fail_count == 0:
    print("SUCCESS! Chatbot is now working properly!".center(90))
else:
    print(f"{fail_count} queries still failing - may need further tuning".center(90))
print("=" * 90 + "\n")
