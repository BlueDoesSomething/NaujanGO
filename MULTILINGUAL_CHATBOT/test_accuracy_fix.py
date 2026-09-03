#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test the specific issues mentioned in the conversation."""

import json
import sys
import io
from pathlib import Path

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from chatbot_multilingual import handle_request

# Test cases from the conversation
test_cases = [
    {
        "query": "What are the top attractions in Naujan?",
        "expected_intent": "Naujan_Attractions_Major",
        "should_not_contain": ["mayor", "Bonifacio Evora", "Leon Garong"]
    },
    {
        "query": "Where can i locate Naujan",
        "expected_intent": "Naujan_Location",
        "should_contain": ["1st Class Municipality", "Mindoro"]
    },
    {
        "query": "What are the attractions of Naujan",
        "expected_intent": "Naujan_Attractions_Major",
        "should_not_contain": ["mayor", "Bonifacio Evora"]
    },
    {
        "query": "Who is the mayor of Naujan",
        "expected_intent": "LGU_Contact_Mayor",
        "should_contain": ["Henry Joel C. Teves"]
    },
    {
        "query": "Tell me about Naujan Lake",
        "expected_intent": "Naujan_Lake_About",
        "should_contain": ["20,000 hectares", "5th largest", "Ramsar"]
    },
    {
        "query": "How to get to Naujan",
        "expected_intent": "Transportation_How_To_Get_There",
        "should_contain": ["Batangas", "ferry", "Calapan"]
    }
]

print("=" * 80)
print("ACCURACY VERIFICATION TEST")
print("=" * 80)
print()

passed = 0
failed = 0

for i, test in enumerate(test_cases, 1):
    query = test["query"]
    expected_intent = test["expected_intent"]
    
    print(f"Test {i}: \"{query}\"")
    print("-" * 80)
    
    payload = {
        "id": f"test_{i}",
        "message": query,
        "language": "en",
        "auto_detect": False,
        "use_cache": False
    }
    
    result = handle_request(payload)
    response = result.get("response", {})
    
    if isinstance(response, dict):
        text = response.get('text', str(response))
        intent = response.get('intent', 'unknown')
    else:
        text = str(response)
        intent = "unknown"
    
    # Check intent
    intent_match = intent == expected_intent
    
    # Check should_contain
    contains_check = True
    if "should_contain" in test:
        for phrase in test["should_contain"]:
            if phrase.lower() not in text.lower():
                contains_check = False
                print(f"  ❌ Missing expected phrase: '{phrase}'")
    
    # Check should_not_contain
    not_contains_check = True
    if "should_not_contain" in test:
        for phrase in test["should_not_contain"]:
            if phrase.lower() in text.lower():
                not_contains_check = False
                print(f"  ❌ Contains unwanted phrase: '{phrase}'")
    
    # Overall result
    if intent_match and contains_check and not_contains_check:
        print(f"  ✅ PASSED")
        print(f"  Intent: {intent}")
        print(f"  Response: {text[:100]}...")
        passed += 1
    else:
        print(f"  ❌ FAILED")
        print(f"  Expected Intent: {expected_intent}")
        print(f"  Actual Intent: {intent}")
        print(f"  Response: {text[:150]}...")
        failed += 1
    
    print()

print("=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"Total Tests: {len(test_cases)}")
print(f"✅ Passed: {passed}")
print(f"❌ Failed: {failed}")
print(f"Success Rate: {(passed/len(test_cases)*100):.1f}%")
print()

if failed == 0:
    print("🎉 ALL TESTS PASSED! The chatbot accuracy has been fixed!")
else:
    print(f"⚠️ {failed} test(s) still need attention.")
