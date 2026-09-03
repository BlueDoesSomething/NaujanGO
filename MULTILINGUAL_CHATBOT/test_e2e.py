#!/usr/bin/env python3
"""Test end-to-end chatbot response with improved intent detection."""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from chatbot_multilingual import handle_request

test_conversations = [
    {"message": "What are the attractions in Naujan", "language": "en"},
    {"message": "What hotels and accommodations are available", "language": "en"},
    {"message": "What are the top tourist attractions", "language": "en"},
    {"message": "Help me plan a day trip", "language": "en"},
    {"message": "What's the best time to visit", "language": "en"},
]

print("=" * 80)
print("END-TO-END CHATBOT TEST")
print("=" * 80)

for i, test in enumerate(test_conversations, 1):
    print(f"\n[Test {i}] User: \"{test['message']}\"")
    print("-" * 80)
    
    payload = {
        "id": f"test_{i}",
        "message": test["message"],
        "language": test["language"],
        "auto_detect": False,
        "use_cache": False
    }
    
    try:
        result = handle_request(payload)
        response = result.get("response", {})
        
        if isinstance(response, dict):
            print(f"Response Text: {response.get('text', 'N/A')[:100]}")
            if response.get('intent'):
                print(f"Intent: {response.get('intent')}")
            if response.get('actions'):
                print(f"Actions: {[a.get('text', '') for a in response.get('actions', [])]}")
        else:
            print(f"Response: {response[:100]}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 80)
print("Test complete!")
print("=" * 80)
