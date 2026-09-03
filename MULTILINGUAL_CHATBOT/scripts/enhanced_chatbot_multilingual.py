"""
Enhanced Multilingual Chatbot with Improved Speed, Accuracy & Typo Handling
"""

import json
import pickle
import numpy as np
import hashlib
import os
import re
import sys
from difflib import SequenceMatcher
from functools import lru_cache

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")

from sentence_transformers import SentenceTransformer

try:
    sys.path.append(os.path.join(BASE_DIR, "..", "..", "NAUJANDATASETS"))
    from language_detector import LanguageDetector
except Exception:
    LanguageDetector = None

CONFIDENCE_THRESHOLD = 0.20  # Optimized threshold based on model analysis
LANG_DETECT_THRESHOLD = 0.6
FUZZY_MATCH_THRESHOLD = 0.85
response_cache = {}
pattern_cache = {}

LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']

# Common typo mappings
TYPO_MAP = {
    'teh': 'the', 'wat': 'what', 'wer': 'where', 'were': 'where',
    'hw': 'how', 'helo': 'hello', 'halp': 'help', 'pls': 'please',
    'u': 'you', 'r': 'are', 'ur': 'your', 'plz': 'please',
    'thx': 'thanks', 'ty': 'thank you', 'gud': 'good',
    'nau jan': 'naujan', 'nauj an': 'naujan'
}

# Load embedder once
try:
    embedder_name_file = os.path.join(MODELS_DIR, "embedder_name.txt")
    if os.path.exists(embedder_name_file):
        with open(embedder_name_file, 'r', encoding='utf-8') as f:
            embedder_name = f.read().strip()
    else:
        embedder_name = "distiluse-base-multilingual-cased-v2"
    
    embedder = SentenceTransformer(embedder_name)
    embedder.max_seq_length = 128  # Optimize for speed
except Exception as e:
    print(f"Error loading embedder: {e}", file=sys.stderr)
    embedder = None

def load_language_models(language):
    """Load models for a specific language"""
    try:
        clf_file = os.path.join(MODELS_DIR, f"intent_classifier_{language}.pkl")
        encoder_file = os.path.join(MODELS_DIR, f"label_encoder_{language}.pkl")
        responses_file = os.path.join(MODELS_DIR, f"intent_responses_{language}.json")
        
        if not all(os.path.exists(f) for f in [clf_file, encoder_file, responses_file]):
            return None, None, None
        
        with open(clf_file, 'rb') as f:
            clf = pickle.load(f)
        
        with open(encoder_file, 'rb') as f:
            label_encoder = pickle.load(f)
        
        with open(responses_file, 'r', encoding='utf-8') as f:
            intent_responses = json.load(f)
        
        return clf, label_encoder, intent_responses
    
    except Exception as e:
        print(f"Error loading {language} models: {e}", file=sys.stderr)
        return None, None, None

# Preload all models
loaded_models = {}
print("Preloading language models...", file=sys.stderr)
for lang in LANGUAGES:
    clf, label_encoder, intent_responses = load_language_models(lang)
    if clf is not None:
        loaded_models[lang] = (clf, label_encoder, intent_responses)
        print(f"Loaded {lang} model", file=sys.stderr)
print("All models loaded", file=sys.stderr)

def fix_typos(text):
    """Fix common typos"""
    words = text.lower().split()
    fixed = [TYPO_MAP.get(w, w) for w in words]
    return ' '.join(fixed)

def normalize_input(text):
    """Enhanced normalization with typo correction"""
    text = text.strip().lower()
    text = fix_typos(text)
    text = re.sub(r'[^\w\s]', '', text)
    text = ' '.join(text.split())
    return text

@lru_cache(maxsize=1024)
def fuzzy_match(s1, s2):
    """Fast fuzzy string matching"""
    return SequenceMatcher(None, s1, s2).ratio()

def get_cache_key(text, language='en'):
    """Generate cache key"""
    normalized = normalize_input(text)
    return hashlib.md5(f"{language}::{normalized}".encode()).hexdigest()

def get_response(user_input, language='en', use_cache=True):
    """
    Get response with enhanced typo handling and speed optimization
    """
    
    if language not in LANGUAGES:
        language = 'en'
    
    # Check cache
    cache_key = get_cache_key(user_input, language)
    if use_cache and cache_key in response_cache:
        return response_cache[cache_key]
    
    # Normalize input
    normalized = normalize_input(user_input)
    
    # Load language-specific models
    if language not in loaded_models:
        clf, label_encoder, intent_responses = load_language_models(language)
        if clf is None:
            return get_low_confidence_response(language)
        loaded_models[language] = (clf, label_encoder, intent_responses)
    else:
        clf, label_encoder, intent_responses = loaded_models[language]
    
    if embedder is None:
        return get_low_confidence_response(language)
    
    try:
        # Fast encoding
        emb = embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    except Exception as e:
        print(f"Error encoding: {e}", file=sys.stderr)
        return get_low_confidence_response(language)
    
    try:
        proba = clf.predict_proba(emb)[0]
        confidence = np.max(proba)
        tag_index = np.argmax(proba)
        tag = label_encoder.inverse_transform([tag_index])[0]
    except Exception as e:
        print(f"Error predicting: {e}", file=sys.stderr)
        return get_low_confidence_response(language)
    
    # Low confidence check
    if confidence < CONFIDENCE_THRESHOLD:
        response = get_low_confidence_response(language)
        if use_cache:
            response_cache[cache_key] = response
        return response
    
    # Get response
    responses = intent_responses.get(tag, [])
    if responses:
        response = responses[0]
        if use_cache:
            response_cache[cache_key] = response
        return response
    
    response = get_low_confidence_response(language)
    if use_cache:
        response_cache[cache_key] = response
    return response

def get_low_confidence_response(language='en'):
    """Get clarification request"""
    responses = {
        'en': "I'm not quite sure I understand. Could you rephrase that?",
        'es': "No estoy seguro de entender. ¿Puedes reformular eso?",
        'tl': "Hindi ko po masyadong maintindihan. Pwede po bang ulitin?",
        'zh': "我不太确定我理解了。你能重新表述一下吗？",
        'ja': "申し訳ございませんが、よく理解できませんでした。言い直していただけますか？",
        'ko': "죄송하지만 이해를 못했습니다. 다시 말씀해 주시겠어요?",
        'fr': "Je ne suis pas sûr de bien comprendre. Pouvez-vous reformuler?",
        'de': "Ich bin mir nicht sicher, dass ich das verstanden habe. Können Sie umformulieren?"
    }
    return responses.get(language, responses['en'])

def resolve_language(user_input, preferred_language='en', auto_detect=False):
    """Resolve language"""
    preferred = preferred_language if preferred_language in LANGUAGES else None

    if not auto_detect or LanguageDetector is None:
        return preferred or 'en'

    detected_lang, confidence = LanguageDetector.detect_language(user_input)
    if detected_lang in LANGUAGES:
        if preferred is None:
            return detected_lang
        if detected_lang != preferred and confidence >= LANG_DETECT_THRESHOLD:
            return detected_lang

    return preferred or 'en'

def clear_cache():
    """Clear response cache"""
    global response_cache, pattern_cache
    response_cache = {}
    pattern_cache = {}

def build_error_response(request_id=None):
    error_responses = {
        'en': "Sorry, I didn't understand that.",
        'es': "Lo siento, no entendí eso.",
        'tl': "Pasensya na, hindi ko naintindihan iyon.",
        'zh': "抱歉，我没有理解那个。",
        'ja': "申し訳ございません。理解できませんでした。",
        'ko': "죄송합니다. 이해하지 못했습니다.",
        'fr': "Désolé, je n'ai pas compris cela.",
        'de': "Entschuldigung, das habe ich nicht verstanden."
    }
    return {"id": request_id, "response": error_responses.get('en')}

def handle_request(payload):
    request_id = payload.get('id')
    user_msg = payload.get('message', '')
    language = payload.get('language', 'en')
    auto_detect = payload.get('auto_detect', False)
    use_cache = payload.get('use_cache', True)

    resolved_language = resolve_language(user_msg, language, auto_detect)
    response = get_response(user_msg, resolved_language, use_cache)
    return {"id": request_id, "response": response}

if __name__ == "__main__":
    try:
        for line in sys.stdin:
            raw = line.strip()
            if not raw:
                continue
            try:
                parsed_data = json.loads(raw)
                output = handle_request(parsed_data)
            except json.JSONDecodeError:
                output = build_error_response()
            print(json.dumps(output, ensure_ascii=False))
            sys.stdout.flush()
    except Exception as e:
        print(f"Server error: {str(e)}", file=sys.stderr)
