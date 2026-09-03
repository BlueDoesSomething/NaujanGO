"""
Chatbot Performance Optimizer & Benchmark
"""

import json
import time
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from enhanced_chatbot_multilingual import get_response, clear_cache, loaded_models

# Test queries for benchmarking
TEST_QUERIES = {
    'en': [
        "hello",
        "where is naujan",
        "what is the weather",
        "contact mayor",
        "police emergency",
        "what crops are grown",
        "tell me about naujan lake",
        "plan a trip",
        "helo can u halp me",  # Typos
        "were is naujan located",  # Typos
        "wat is teh weather",  # Typos
    ],
    'es': [
        "hola",
        "donde esta naujan",
        "clima",
        "contacto alcalde",
    ],
    'tl': [
        "kumusta",
        "nasaan ang naujan",
        "panahon",
        "mayor contact",
    ]
}

def benchmark_response_time(language='en', iterations=10):
    """Benchmark response time"""
    print(f"\n{'='*60}")
    print(f"Benchmarking {language.upper()} - {iterations} iterations")
    print(f"{'='*60}")
    
    queries = TEST_QUERIES.get(language, TEST_QUERIES['en'])
    results = []
    
    for query in queries:
        times = []
        
        # Warm-up
        get_response(query, language, use_cache=False)
        
        # Benchmark without cache
        for _ in range(iterations):
            clear_cache()
            start = time.time()
            response = get_response(query, language, use_cache=False)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
        
        avg_no_cache = sum(times) / len(times)
        
        # Benchmark with cache
        times_cached = []
        for _ in range(iterations):
            start = time.time()
            response = get_response(query, language, use_cache=True)
            elapsed = (time.time() - start) * 1000
            times_cached.append(elapsed)
        
        avg_cached = sum(times_cached) / len(times_cached)
        
        results.append({
            'query': query,
            'no_cache_ms': round(avg_no_cache, 2),
            'cached_ms': round(avg_cached, 2),
            'speedup': round(avg_no_cache / avg_cached, 2) if avg_cached > 0 else 0,
            'response': response[:50] + '...' if len(response) > 50 else response
        })
        
        print(f"\nQuery: '{query}'")
        print(f"  No Cache: {avg_no_cache:.2f}ms")
        print(f"  Cached:   {avg_cached:.2f}ms")
        print(f"  Speedup:  {avg_no_cache/avg_cached:.2f}x")
        print(f"  Response: {response[:60]}...")
    
    return results

def test_typo_handling():
    """Test typo handling accuracy"""
    print(f"\n{'='*60}")
    print("Testing Typo Handling")
    print(f"{'='*60}")
    
    typo_tests = [
        ("hello", "helo"),
        ("hello", "hllo"),
        ("where is naujan", "were is naujan"),
        ("where is naujan", "were is nau jan"),
        ("what is the weather", "wat is teh weather"),
        ("can you help me", "can u halp me"),
        ("thank you", "thx"),
        ("please help", "pls halp"),
    ]
    
    correct = 0
    total = len(typo_tests)
    
    for correct_query, typo_query in typo_tests:
        response_correct = get_response(correct_query, 'en')
        response_typo = get_response(typo_query, 'en')
        
        match = response_correct == response_typo
        if match:
            correct += 1
        
        print(f"\nCorrect: '{correct_query}'")
        print(f"Typo:    '{typo_query}'")
        print(f"Match:   {'✓' if match else '✗'}")
        print(f"Response: {response_typo[:60]}...")
    
    accuracy = (correct / total) * 100
    print(f"\n{'='*60}")
    print(f"Typo Handling Accuracy: {accuracy:.1f}% ({correct}/{total})")
    print(f"{'='*60}")
    
    return accuracy

def test_multilingual_accuracy():
    """Test multilingual response accuracy"""
    print(f"\n{'='*60}")
    print("Testing Multilingual Accuracy")
    print(f"{'='*60}")
    
    for lang, queries in TEST_QUERIES.items():
        print(f"\n{lang.upper()}:")
        for query in queries[:3]:
            response = get_response(query, lang)
            print(f"  Q: {query}")
            print(f"  A: {response[:60]}...")

def generate_performance_report():
    """Generate comprehensive performance report"""
    print("\n" + "="*60)
    print("CHATBOT PERFORMANCE REPORT")
    print("="*60)
    
    # Model loading status
    print(f"\nLoaded Models: {len(loaded_models)}/{len(['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de'])}")
    for lang in loaded_models:
        print(f"  ✓ {lang}")
    
    # Benchmark English
    en_results = benchmark_response_time('en', iterations=5)
    
    # Test typo handling
    typo_accuracy = test_typo_handling()
    
    # Test multilingual
    test_multilingual_accuracy()
    
    # Summary
    avg_no_cache = sum(r['no_cache_ms'] for r in en_results) / len(en_results)
    avg_cached = sum(r['cached_ms'] for r in en_results) / len(en_results)
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    print(f"Average Response Time (No Cache): {avg_no_cache:.2f}ms")
    print(f"Average Response Time (Cached):   {avg_cached:.2f}ms")
    print(f"Cache Speedup:                    {avg_no_cache/avg_cached:.2f}x")
    print(f"Typo Handling Accuracy:           {typo_accuracy:.1f}%")
    print(f"Loaded Languages:                 {len(loaded_models)}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    generate_performance_report()
