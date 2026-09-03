#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test current chatbot responses."""

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

test_queries = [
    "What are the top attractions in Oriental Mindoro?",
    "Tell me about Naujan Lake",
    "How do I get to Oriental Mindoro?",
]

print("=" * 80)
print("CURRENT CHATBOT RESPONSE TEST")
print("=" * 80)

for query in test_queries:
    print(f"\nUser: \"{query}\"")
    print("-" * 80)
    
    payload = {
        "id": "test",
        "message": query,
        "language": "en",
        "auto_detect": False,
        "use_cache": False
    }
    
    result = handle_request(payload)
    response = result.get("response", {})
    
    if isinstance(response, dict):
        text = response.get('text', response)
        intent = response.get('intent', 'unknown')
    else:
        text = response
        intent = "unknown"
    
    print(f"Intent: {intent}")
    print(f"Response: {text[:150]}")
