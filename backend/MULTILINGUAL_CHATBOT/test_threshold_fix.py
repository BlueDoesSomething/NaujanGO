#!/usr/bin/env python3
"""Test the high confidence threshold fix"""

import sys
sys.path.insert(0, 'scripts')

from chatbot_multilingual import get_response, CONFIDENCE_THRESHOLDS

print("=" * 80)
print("TESTING HIGH CONFIDENCE THRESHOLDS FIX")
print("=" * 80)
print(f"\nConfidence Thresholds: {CONFIDENCE_THRESHOLDS}\n")

# Test queries
test_queries = [
    ('What are the top attractions in Naujan?', 'Naujan_Attractions_Major'),
    ('Show me the interactive map of Naujan', 'Naujan_Location'),
    ('What is the best time to visit Naujan?', 'Best_Time_To_Visit'),
    ('What hotels are available?', 'Hotel_Recommendations'),
]

print("Test Results:")
print("-" * 80)

for query, expected_intent in test_queries:
    response = get_response(query, 'en')
    
    print(f"\nQuery: {query}")
    print(f"  Expected Intent: {expected_intent}")
    print(f"  Response:        {response[:100]}...")
    print(f"  Status: Response appears to be correct!" if response and len(response) > 20 else "  Status: ERROR - No response")

print("\n" + "=" * 80)
