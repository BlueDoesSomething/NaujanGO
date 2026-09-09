import sys
import json
sys.path.insert(0, '/MULTILINGUAL_CHATBOT/scripts')

from chatbot_multilingual import handle_request

# Simulate the backend request
test_queries = [
    'What are the top attractions in Naujan?',
    'Show me the interactive map of Naujan',
    'What is the best time to visit Naujan?',
    'What hotels are available?'
]

for query in test_queries:
    payload = {
        'user_msg': query,
        'language': 'en',
        'auto_detect': False,
        'use_cache': False,
        'request_id': 1
    }
    
    result = handle_request(payload)
    
    print(f'\nQuery: {query}')
    print(f'Response: {result["response"][:150]}...' if isinstance(result["response"], str) else f'Response: {result["response"]}')
