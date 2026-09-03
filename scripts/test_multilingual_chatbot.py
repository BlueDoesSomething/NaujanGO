#!/usr/bin/env python
"""
Test script for Multilingual Chatbot Language Detection and Response
This demonstrates the chatbot's ability to detect and respond in multiple languages
"""

import json
import subprocess
import sys
import os

# Add the NAUJANDATASETS directory to path
base_dir = os.path.dirname(os.path.abspath(__file__))
naujandatasets_dir = os.path.join(base_dir, '..', 'NAUJANDATASETS')
if os.path.exists(naujandatasets_dir):
    sys.path.insert(0, naujandatasets_dir)

try:
    from language_detector import LanguageDetector
    HAS_DETECTOR = True
except ImportError:
    HAS_DETECTOR = False
    print("Warning: language_detector module not found. Language detection may be limited.")

# Test messages in different languages
TEST_MESSAGES = [
    # English
    {
        "message": "Hello, what can you tell me about Naujan Lake?",
        "language_code": "en",
        "language_name": "English"
    },
    # Spanish
    {
        "message": "¡Hola! ¿Cuál es la ubicación de Naujan?",
        "language_code": "es",
        "language_name": "Spanish"
    },
    # Tagalog
    {
        "message": "Kumusta! Saan ang Naujan Lake?",
        "language_code": "tl",
        "language_name": "Tagalog"
    },
    # Chinese (Simplified)
    {
        "message": "你好，请告诉我关于瑙汉的信息。",
        "language_code": "zh",
        "language_name": "Chinese (Simplified)"
    },
    # Japanese
    {
        "message": "こんにちは、瑙汉について教えてください。",
        "language_code": "ja",
        "language_name": "Japanese"
    },
    # Korean
    {
        "message": "안녕하세요, 瑙汉에 대해 알려주세요.",
        "language_code": "ko",
        "language_name": "Korean"
    },
    # French
    {
        "message": "Bonjour, parlez-moi de Naujan s'il vous plaît.",
        "language_code": "fr",
        "language_name": "French"
    },
    # German
    {
        "message": "Hallo, erzählen Sie mir von Naujan, bitte.",
        "language_code": "de",
        "language_name": "German"
    },
]


def test_language_detection():
    """Test language detection capability"""
    if not HAS_DETECTOR:
        print("❌ Language detector not available. Skipping detection tests.")
        return
    
    print("\n" + "="*80)
    print("LANGUAGE DETECTION TEST")
    print("="*80)
    
    detector = LanguageDetector()
    
    for test in TEST_MESSAGES:
        message = test["message"]
        expected_lang = test["language_code"]
        lang_name = test["language_name"]
        
        detected_lang, confidence = detector.detect_language(message)
        match = "✅" if detected_lang == expected_lang else "❌"
        
        print(f"\n{match} {lang_name}")
        print(f"   Message: {message[:60]}{'...' if len(message) > 60 else ''}")
        print(f"   Expected: {expected_lang} | Detected: {detected_lang}")
        print(f"   Confidence: {confidence:.1%}")


def test_chatbot_responses():
    """Test chatbot responses for each language"""
    print("\n" + "="*80)
    print("CHATBOT RESPONSE TEST")
    print("="*80)
    print("Testing chatbot responses in different languages...\n")
    
    chatbot_script = os.path.join(base_dir, '..', 'NAUJANDATASETS', 'chatbot_embeddings.py')
    
    if not os.path.exists(chatbot_script):
        print("❌ Chatbot script not found at:", chatbot_script)
        return
    
    for i, test in enumerate(TEST_MESSAGES[:3], 1):  # Test first 3 languages
        message = test["message"]
        language = test["language_code"]
        lang_name = test["language_name"]
        
        print(f"\n[Test {i}] {lang_name}")
        print(f"Message: {message}")
        
        # Prepare input with auto_detect enabled
        input_data = {
            "message": message,
            "language": None,  # Let it auto-detect
            "auto_detect": True,
            "use_cache": False
        }
        
        try:
            # Run chatbot script
            result = subprocess.run(
                ["python", chatbot_script],
                input=json.dumps(input_data),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and result.stdout.strip():
                response = result.stdout.strip()
                print(f"Response: {response[:100]}{'...' if len(response) > 100 else ''}")
                print("✅ Response generated successfully")
            else:
                print(f"❌ Failed to get response")
                if result.stderr:
                    print(f"   Error: {result.stderr[:100]}")
        
        except subprocess.TimeoutExpired:
            print("❌ Request timed out")
        except Exception as e:
            print(f"❌ Error: {str(e)}")


def test_supported_languages():
    """Display supported languages"""
    print("\n" + "="*80)
    print("SUPPORTED LANGUAGES")
    print("="*80)
    
    if HAS_DETECTOR:
        detector = LanguageDetector()
        languages = detector.get_all_supported_languages()
        
        print("\nThe multilingual chatbot supports the following languages:\n")
        for code, name in sorted(languages.items()):
            print(f"  • {code.upper():3s} - {name}")
    else:
        print("\n❌ Language detector not available")
        return
    
    print("\n" + "-"*80)
    print("Features:")
    print("  ✅ Automatic language detection from user message")
    print("  ✅ Multilingual responses based on detected language")
    print("  ✅ Fallback to English if language not detected")
    print("  ✅ Support for both Latin and non-Latin scripts")
    print("  ✅ Character and keyword-based language detection")
    print("-"*80)


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "MULTILINGUAL CHATBOT TEST SUITE" + " "*27 + "║")
    print("╚" + "="*78 + "╝")
    
    # Run tests
    test_supported_languages()
    test_language_detection()
    test_chatbot_responses()
    
    print("\n" + "="*80)
    print("TEST SUITE COMPLETED")
    print("="*80 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
