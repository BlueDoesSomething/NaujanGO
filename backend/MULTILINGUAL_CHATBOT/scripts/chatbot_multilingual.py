"""
Multilingual Chatbot Inference Script (Optimized for Speed & Accuracy)
Uses language-specific models for faster and more accurate responses
"""

import json
import pickle
import numpy as np
import hashlib
import os
import re
import sys
import threading
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "..", "models")

from sentence_transformers import SentenceTransformer

try:
    sys.path.append(os.path.join(BASE_DIR, "..", "..", "NAUJANDATASETS"))
    from language_detector import LanguageDetector
except Exception:
    LanguageDetector = None

try:
    sys.path.append(os.path.join(BASE_DIR, ".."))
    from response_formatter import format_response_with_actions
except Exception:
    format_response_with_actions = None

# Per-language confidence thresholds — INCREASED to force keyword fallback for accuracy
# CRITICAL FIX: High thresholds bypass unreliable SVM and use working keyword matching
CONFIDENCE_THRESHOLDS = {
    'en': 0.40,   # INCREASED from 0.18 - force keyword fallback
    'es': 0.40,   # INCREASED from 0.15
    'fr': 0.40,   # INCREASED from 0.15
    'de': 0.40,   # INCREASED from 0.15
    'tl': 0.40,   # INCREASED from 0.15
    'zh': 0.40,   # INCREASED from 0.12
    'ja': 0.40,   # INCREASED from 0.12
    'ko': 0.40,   # INCREASED from 0.12
}
LANG_DETECT_THRESHOLD = 0.6
response_cache = {}

# Typo correction map (expanded for broader coverage)
TYPO_MAP = {
    # Common English typos
    'teh': 'the', 'thier': 'their', 'recieve': 'receive',
    'wat': 'what', 'wht': 'what', 'wut': 'what',
    'wer': 'where', 'were': 'where', 'wher': 'where', 'whre': 'where',
    'hw': 'how', 'haw': 'how',
    'helo': 'hello', 'hallo': 'hello', 'hullo': 'hello',
    'halp': 'help', 'hlp': 'help',
    'pls': 'please', 'plz': 'please', 'pleas': 'please',
    'u': 'you', 'yu': 'you',
    'r': 'are', 'ar': 'are',
    'ur': 'your', 'yor': 'your',
    'plz': 'please',
    'thx': 'thanks', 'thnks': 'thanks', 'thanx': 'thanks',
    'ty': 'thank you', 'thnk': 'thank', 'thk': 'thank',
    'gud': 'good', 'gd': 'good',
    'cn': 'can', 'cna': 'can',
    'da': 'the',
    'ther': 'there', 'thre': 'there',
    'bcoz': 'because', 'cuz': 'because', 'cos': 'because',
    'gonna': 'going to', 'wanna': 'want to', 'gotta': 'got to',
    'kinda': 'kind of', 'sorta': 'sort of',
    'ain\'t': 'is not', 'dunno': 'do not know', 'lemme': 'let me',
    'gimme': 'give me', 'tryna': 'trying to',
    # Number-letter substitutions
    '2': 'to', '4': 'for', 'b4': 'before', 'gr8': 'great',
    'tym': 'time', 'tyme': 'time', 'nite': 'night', 'nxt': 'next',
    'plc': 'place', 'plcs': 'places', 'ppl': 'people', 'pls': 'please',
    'kno': 'know', 'knw': 'know', 'bout': 'about', 'abt': 'about',
    'wanna': 'want to', 'gonna': 'going to', 'needa': 'need to',
    'luv': 'love', 'lyk': 'like', 'lik': 'like',
    # Location typos
    'nau jan': 'naujan', 'nauj an': 'naujan', 'nauhan': 'naujan',
    'nauyan': 'naujan', 'nawjan': 'naujan', 'naojan': 'naujan',
    'manygan': 'mangyan', 'mangyan': 'mangyan',
    'sadjya': 'sadya', 'sadyya': 'sadya',
    'tamarau falls': 'tamaraw falls',
    'mambuwa falls': 'mambuaya falls',
    # Word typos
    'numbr': 'number', 'nmbr': 'number',
    'offce': 'office', 'ofice': 'office',
    'polce': 'police', 'polic': 'police',
    'wether': 'weather', 'wheather': 'weather',
    'climat': 'climate', 'clmate': 'climate',
    'locaton': 'location', 'loction': 'location',
    'emergancy': 'emergency', 'emrgency': 'emergency',
    'torist': 'tourist', 'turist': 'tourist',
    'vist': 'visit', 'visist': 'visit',
    'accomodation': 'accommodation', 'acommodation': 'accommodation',
    'itinery': 'itinerary', 'itenerary': 'itinerary',
    'restuarant': 'restaurant', 'restarant': 'restaurant',
    'reccomend': 'recommend', 'recomend': 'recommend',
    'availble': 'available', 'avilable': 'available',
    'boking': 'booking', 'bookng': 'booking',
    'safty': 'safety', 'savety': 'safety',
    'festvals': 'festivals', 'festivls': 'festivals',
    'histori': 'history', 'hstory': 'history',
    'wildlif': 'wildlife', 'wildife': 'wildlife',
    'sustainabl': 'sustainable',
    'eco turism': 'eco tourism',
    'snorkelling': 'snorkeling',
    'scubar': 'scuba',
    'dving': 'diving',
    'bich': 'beach', 'beatch': 'beach',
    'waterfal': 'waterfall',
    'trekign': 'trekking', 'triking': 'trekking',
    'shoping': 'shopping',
    'souvenirs': 'souvenirs',
    'bset': 'best',
    # Filipino informal / text speak
    'ano': 'what', 'saan': 'where', 'paano': 'how',
    'punta': 'go', 'pumunta': 'go', 'magpunta': 'go',
    'meron': 'there is', 'mayroon': 'there is',
    'gusto': 'want', 'nais': 'want',
    'salamat': 'thank you', 'maraming salamat': 'thank you very much',
    'po': '', 'nga': '', 'ba': '', 'kaya': '', 'naman': '',
    'yung': 'the', 'ang': 'the', 'ng': 'of',
    'sa': 'in', 'doon': 'there', 'dito': 'here',
    'iyon': 'that', 'ito': 'this',
    'kwento': 'tell', 'sabihin': 'tell', 'ibigay': 'give',
    'maganda': 'beautiful', 'astig': 'cool', 'ganda': 'beautiful',
    'libre': 'free',
}

# Supported languages
LANGUAGES = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de']

# Load shared embedding model (multilingual)
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

# Models are loaded lazily per language (keeps boot fast and memory low)
loaded_models = {}
_models_lock = threading.Lock()

def get_models(language):
    """Return (clf, label_encoder, intent_responses) for a language, loading it on first use."""
    if language in loaded_models:
        return loaded_models[language]
    with _models_lock:
        if language in loaded_models:
            return loaded_models[language]
        clf, label_encoder, intent_responses = load_language_models(language)
        if clf is not None:
            loaded_models[language] = (clf, label_encoder, intent_responses)
            print(f"Loaded {language} model", file=sys.stderr)
        return loaded_models.get(language, (None, None, None))

def fix_typos(text):
    """Fix common typos"""
    words = text.lower().split()
    fixed = [TYPO_MAP.get(w, w) for w in words]
    return ' '.join(fixed)

def normalize_input(text, language='en'):
    """Normalize user input for consistency - case insensitive"""
    text = text.strip().lower()
    if language == 'en':  # Only apply English typo map for English input
        text = fix_typos(text)
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Normalize whitespace
    text = ' '.join(text.split())
    return text

def get_cache_key(text, language='en'):
    """Generate cache key from normalized text and language"""
    normalized = normalize_input(text, language)
    return hashlib.md5(f"{language}::{normalized}".encode()).hexdigest()

# Keyword-to-intent mapping used as a fallback when model confidence is low.
# Keys are intent tags; values are lists of keywords/phrases that strongly
# suggest that intent.
KEYWORD_INTENT_MAP = {
    # ── Core Naujan intents ──────────────────────────────────────────────────
    "Naujan_Location": [
        # English
        "where is naujan", "location of naujan", "naujan located",
        "where in mindoro", "find naujan", "naujan address",
        "naujan coordinates", "naujan map", "direction to naujan",
        # Spanish
        "donde esta naujan", "ubicacion de naujan", "como llegar naujan",
        # French
        "ou est naujan", "ou se trouve naujan", "localisation naujan",
        # German
        "wo ist naujan", "wo liegt naujan", "standort naujan",
        # Tagalog
        "nasaan ang naujan", "lokasyon ng naujan", "saan ang naujan",
    ],
    "Naujan_Lake_About": [
        # English
        "naujan lake", "lake naujan", "naujan lake info",
        "about the lake", "naujan lake facts", "ramsar naujan",
        "biggest lake mindoro", "5th largest lake", "wetland naujan",
        "naujan lake overview", "what is naujan lake",
        # Spanish
        "lago naujan", "lago de naujan", "informacion lago",
        # French
        "lac naujan", "lac de naujan", "informations lac",
        # German
        "see naujan", "naujan see", "naujan see info",
        # Tagalog
        "lawa ng naujan", "naujan lake ano", "tungkol sa lawa",
    ],
    "Naujan_Lake_Wildlife": [
        "birds naujan", "wildlife naujan", "birdwatching naujan",
        "crocodile naujan", "animals in the lake", "philippine duck",
        "migratory birds naujan", "bird species naujan",
        "ecology naujan lake", "biodiversity naujan",
    ],
    "Naujan_Lake_Activities": [
        # English
        "activities lake", "things to do at lake", "boat ride lake",
        "kayak lake", "fishing lake", "lake tour", "boat rental",
        "cruise lake naujan", "lake activities", "swim in lake",
        "visit the lake", "spend time at lake",
        # Spanish
        "actividades lago", "actividades naujan", "que hacer lago",
        "paseo en bote", "pesca lago naujan",
        # French
        "activites lac", "que faire lac", "activites naujan",
        "bateaux lac naujan", "excursion lac",
        # German
        "aktivitaten see", "aktivitaten naujan", "ausflug see",
        "was tun naujan", "bootsfahrt see",
        # Tagalog
        "aktibidad sa lawa", "ano gagawin lawa", "biyahe sa lawa",
    ],
    "Naujan_Overview": [
        "about naujan", "naujan info", "overview naujan",
        "what is naujan", "naujan facts", "tell me about naujan",
        "naujan municipality", "what naujan offers", "highlights naujan",
        "naujan summary", "naujan tourism",
    ],
    "LGU_Contact_Mayor": [
        "lgu naujan", "mayor naujan", "municipal hall naujan",
        "naujan government", "contact lgu", "mayor office",
        "henry teves", "municipal government", "lgu contact",
        "naujan public office", "municipality office",
    ],
    "Emergency_Police": [
        "police naujan", "police station naujan", "police number",
        "call police", "police contact naujan", "police help",
    ],
    "Safety_Emergency": [
        "emergency", "ambulance", "hospital naujan", "medical help",
        "first aid", "fire station", "coast guard", "safety tip",
        "is it safe", "crime", "911", "rescue",
    ],
    "Agriculture_Crops": [
        "farming naujan", "crops naujan", "rice naujan", "coconut naujan",
        "copra", "rice farm", "coconut farm", "agri tour", "harvest",
        "rice paddies", "agriculture mindoro", "farmers naujan",
    ],
    "Naujan_Agriculture": [
        "agricultural tourism naujan", "farm visit naujan",
        "rice production", "coconut plantation", "agri eco tour",
        "freshwater farming", "fish farming naujan",
    ],
    "Weather_Info": [
        "weather", "forecast", "rain in naujan", "temperature",
        "typhoon", "climate naujan", "humidity", "sunny", "storm",
    ],
    "Itinerary_Plan": [
        "itinerary", "day trip naujan", "what to plan", "trip plan",
        "schedule naujan", "plan visit", "day plan naujan",
        "2 day trip naujan", "weekend plan naujan", "3 day naujan",
    ],
    # ── Rewritten Naujan-focused intents ────────────────────────────────────
    "Transportation_How_To_Get_There": [
        # English
        "how to get to naujan", "ferry calapan naujan",
        "batangas pier", "fastcraft", "roro ferry", "starlite",
        "montenegro lines", "how to go to naujan", "travel to naujan",
        "manila to naujan", "calapan to naujan", "route to naujan",
        # Spanish
        "como llegar", "como ir a naujan", "como viajar",
        "autobus a naujan", "ferry a naujan", "ruta a naujan",
        # French
        "comment aller", "comment se rendre", "aller a naujan",
        "bus pour naujan", "ferry pour naujan", "comment voyager",
        # German
        "wie kommt man", "wie fahre ich", "wie reist man",
        "bus nach naujan", "fahre nach naujan", "anreise naujan",
        # Tagalog
        "paano pumunta", "paano makarating", "sakay papunta",
        "bus papunta naujan", "ruta naujan", "direksyon naujan",
    ],
    "Local_Transport": [
        "jeepney", "tricycle", "habal habal", "multicab",
        "getting around naujan", "commute naujan", "local transport",
        "van for hire naujan", "pedicab naujan",
    ],
    "Local_Food_Cuisine": [
        "food in naujan", "what to eat", "restaurant naujan",
        "cuisine naujan", "delicacy naujan", "seafood lake",
        "kakanin", "binagoongan", "carinderia", "tilapia naujan",
        "maliputo fish", "fresh fish lake", "local dish naujan",
        "local food", "local food and cuisine", "food", "cuisine",
        "restaurants", "where to eat", "eatery", "dining",
    ],
    "Festivals_Events": [
        "festival naujan", "fiesta naujan", "town fiesta",
        "september 8 naujan", "naujan patron saint",
        "our lady nativity", "celebration naujan",
        "annual event naujan", "cultural event naujan",
    ],
    "Naujan_Natural_Features": [
        "nature naujan", "sadya river", "river naujan",
        "swimming naujan", "outdoor scenery", "rice fields scenery",
        "coastline naujan", "mangrove naujan", "scenic view naujan",
        "natural spots naujan", "natural features",
    ],
    "Hiking_Trekking": [
        "hiking naujan", "trekking naujan", "nature walk lake",
        "eco trail naujan", "trail naujan lake", "bird walk",
        "guided walk lake", "camping lake", "outdoor adventure naujan",
        "nature trail", "park trail naujan",
        "hiking", "hiking available", "is there hiking", "trek",
        "trekking", "trail", "camping", "outdoor activities",
        "is there hiking available",
    ],
    "Mangyan_Culture": [
        "mangyan", "indigenous naujan", "tribe naujan", "hanunuo",
        "ambahan", "abaca", "ethnic group", "mangyan craft",
        "mangyan village", "indigenous community",
    ],
    "Best_Time_To_Visit": [
        "best time", "when to visit naujan", "rainy season",
        "dry season", "typhoon season", "peak season",
        "amihan", "habagat", "birdwatching season", "migration season",
        "when to go", "best month", "ideal time naujan",
    ],
    "Budget_Travel": [
        "budget naujan", "cost naujan", "how much", "affordable naujan",
        "cheap trip naujan", "expenses naujan", "price naujan",
        "ferry fare", "magkano", "daily budget naujan",
        "total cost naujan", "how expensive naujan",
    ],
    "Accommodation_Types": [
        "hotel naujan", "where to stay naujan", "guesthouse naujan",
        "inn naujan", "pension house naujan", "accommodation naujan",
        "lodging naujan", "room naujan", "stay near lake",
        "resort naujan", "overnight naujan",
        "where should i stay", "should i stay", "stay in naujan",
    ],
    "Booking_Help": [
        "book", "reserve", "reservation", "booking", "check in",
        "check out", "how to book", "book a room", "lakbay booking",
    ],
    "App_Capabilities": [
        "what can you do", "features", "capability", "help me with",
        "what does lakbay", "about lakbay", "services", "what this app",
    ],
    "Shopping_Souvenirs": [
        "souvenir naujan", "pasalubong naujan", "shopping naujan",
        "handicraft naujan", "local product naujan", "market naujan",
        "buy fish lake", "mangyan basket", "coconut product naujan",
        "local honey naujan", "kakanin naujan", "what to buy naujan",
    ],
    "History_Heritage": [
        "history naujan", "heritage naujan", "historical naujan",
        "colonial naujan", "war mindoro", "naujan church",
        "old church naujan", "ww2 mindoro", "founding naujan",
        "heritage building", "batle of mindoro",
    ],
    "Eco_Tourism": [
        "eco tourism naujan", "sustainable naujan", "responsible travel",
        "nature trip lake", "conservation naujan", "green travel",
        "mangrove tour", "wildlife tour naujan", "eco friendly naujan",
        "bird watching tour", "lake eco tour", "ramsar wetland",
    ],
    "Naujan_Barangays": [
        "barangays naujan", "villages naujan", "list of barangays",
        "how many barangays", "barangay names", "poblacion naujan",
        "communities naujan", "baryo naujan",
    ],
    # ── MISSING INTENTS (Added to fix fallback matching) ──────────────────────
    "Naujan_Attractions_Major": [
        "attractions naujan", "places of interest naujan", "visitor attractions",
        "where should i go naujan", "naujanan places", "things to visit naujan",
        "attractions in naujan", "tourist spots naujan", "top attractions",
        "attractions", "places to visit", "tourist attractions", "main attractions",
        "what to see naujan", "must see naujan", "best places naujan",
        "tourist destination naujan", "sightseeing naujan",
    ],
    "Hotel_Recommendations": [
        "hotel naujan", "recommend hotel", "suggest places to stay",
        "where to stay in naujan", "accommodation options", "hotel recommendations",
        "cheap hotels naujan", "good hotel naujan",
        "hotel", "hotels", "hotel available", "accommodations available",
        "where to stay", "places to stay", "accommodation recommend",
    ],
    "Naujan_Best_Activities": [
        "best activities naujan", "what to do naujan", "things to do",
        "fun things naujan", "guided tour naujan", "day trip naujan",
        "activities in naujan", "land activities naujan",
        "activities", "things to do", "best activities",
    ],
    "Naujan_Accommodations_Budget": [
        "budget accommodation naujan", "cheap guesthouse", "guesthouse naujan",
        "lodging naujan", "traveller's inn", "cheap stay naujan",
        "affordable accommodation naujan", "budget hotel naujan",
        "budget accommodation", "cheap hotel", "budget stay",
    ],
    "Naujan_Accommodations_Midrange": [
        "mid range naujan", "3 star hotel naujan", "eco resort naujan",
        "balay murraya", "cottage naujan", "family resort naujan",
        "medium price naujan", "comfortable hotel naujan",
        "midrange", "mid range", "eco resort", "cottage",
    ],
    "Naujan_Accommodations_Upscale": [
        "upscale naujan", "luxury hotel naujan", "premium accommodation",
        "wedding venue naujan", "private pool naujan", "honeymoon naujan",
        "balinese style", "high end naujan", "resort naujan",
        "luxury", "upscale", "premium", "honeymoon resort",
    ],
    "Naujan_Waterfalls": [
        "waterfall naujan", "waterfalls in naujan", "hanging bridge bathala",
        "mineral pools naujan", "waterfall hiking", "waterfall tour",
        "falls naujan", "cascades naujan",
        "waterfall", "waterfalls", "hiking trail",
    ],
    "Naujan_Beaches_Resorts": [
        "beach naujan", "beach resort naujan", "scenic beach",
        "beach dining naujan", "beach activities naujan",
        "resort beach", "seaside naujan",
        "beach", "beach resort", "seaside",
    ],
    "Naujan_Eco_Parks": [
        "eco park naujan", "botanical garden", "nature park naujan",
        "agrigold farm", "educational workshops", "farms naujan",
        "park naujan", "green space naujan",
        "eco park", "botanical garden", "nature park", "farm",
    ],
    "Naujan_Lake_National_Park": [
        "lake national park", "naujan lake activities", "boating naujan",
        "philipine duck naujan", "tranquil lake", "lake tour",
        "lake naujan activities", "serene lake naujan",
        "lake activities", "boating", "lake tour",
    ],
    "Naujan_Event_Venues": [
        "event venue naujan", "conference venue naujan", "wedding venue",
        "bahay tuklasan", "corporate venue naujan", "party venue naujan",
        "reception venue", "venue rental naujan",
        "event venue", "conference venue", "wedding venue",
    ],
    "Photo_Spots": [
        "photo spots naujan", "scenic viewpoints", "photo walk",
        "best time for photo", "photography naujan", "photo locations",
        "picture spots naujan", "instagram worthy naujan",
        "photo spots", "scenic viewpoints", "photography",
    ],
    "Simbahang_Bato": [
        "simbahang bato", "bancuro ruins", "moss covered ruins",
        "spanish heritage naujan", "heritage ruins", "old church ruins",
        "ruins naujan", "historical ruins naujan",
        "ruins", "heritage", "old church",
    ],
    "Cost_Estimates": [
        "cost estimate", "how much does", "trip cost naujan",
        "expense naujan", "price estimate", "budget estimate",
        "accommodation cost", "transport cost", "travel expense",
        "cost", "how much", "price", "expense",
    ],
    "Historical_Mayors": [
        "historical mayors naujan", "mayors list naujan", "past mayors naujan",
        "former municipal leaders naujan", "all past mayors naujan", "who was mayor naujan",
        "mayors before naujan", "previous mayor naujan",
        "list of all mayors", "complete mayors list", "mayors history naujan",
    ],
    "Municipal_Government_Structure": [
        "government structure naujan", "government departments",
        "municipal offices naujan", "engineering department", "health department",
        "government organization", "municipal structure",
        "government structure", "government departments", "municipal offices",
    ],
    "Municipal_Vice_Mayor": [
        "vice mayor naujan", "candido melgar", "vice mayor information",
        "who is vice mayor", "vice mayor office", "vice leadership",
        "vice mayor", "vice leadership",
    ],
    "Thank_You": [
        "thank you", "thanks", "salamat", "thank u", "that helped",
        "appreciate it", "grateful", "thanks a lot",
        "thanks", "thank you", "grateful",
    ],
    # ── Generic intents ──────────────────────────────────────────────────────
    "greeting": [
        # English
        "hi", "hello", "hey", "good morning", "good afternoon",
        "good evening", "howdy", "start", "kumusta",
        # Spanish/French/German/Other
        "hola", "bonjour", "guten tag", "buenas", "ciao",
        "salut", "hallo", "merhaba", "olá",
    ],
    "goodbye": [
        # English
        "bye", "goodbye", "thank you", "thanks", "see you",
        "salamat", "ciao", "later", "ingat",
        # Spanish/French/German/Other
        "gracias", "merci", "danke", "adios", "au revoir",
        "auf wiedersehen", "arrivederci", "tchao",
    ],
}


def _keyword_score(normalized_text):
    """
    Score each intent by counting keyword hits in the user's message.
    Uses word boundary matching to avoid partial keyword matches.
    Returns (best_tag, best_score). best_tag is None when no keyword matched.
    """
    import re
    
    # Split text into words for matching
    text_words = set(re.findall(r'\b\w+\b', normalized_text.lower()))
    
    best_tag = None
    best_score = 0
    
    for tag, keywords in KEYWORD_INTENT_MAP.items():
        score = 0
        
        for kw in keywords:
            kw_lower = kw.lower()
            
            # Check if full keyword phrase is in text (for multi-word keywords)
            if kw_lower in normalized_text:
                score += 2  # Multi-word phrase match gets higher weight
            else:
                # Check if all words in the keyword are in the text
                kw_words = set(re.findall(r'\b\w+\b', kw_lower))
                if kw_words and kw_words.issubset(text_words):
                    score += 1  # Single words in keyword match
        
        if score > best_score:
            best_score = score
            best_tag = tag
    
    return (best_tag, best_score) if best_score > 0 else (None, 0)

def keyword_fallback(normalized_text):
    """
    Score each intent by counting keyword hits in the user's message.
    Returns the best matching intent tag or None.
    """
    tag, _ = _keyword_score(normalized_text)
    return tag

def get_response(user_input, language='en', use_cache=True):
    """
    Get response from chatbot with language-specific model
    
    Args:
        user_input (str): User's message
        language (str): Language code ('en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de')
        use_cache (bool): Whether to use response caching
    
    Returns:
        str: Response string from the chatbot
    """
    
    # Validate language
    if language not in LANGUAGES:
        language = 'en'
    
    # Check cache
    cache_key = get_cache_key(user_input, language)
    if use_cache and cache_key in response_cache:
        return response_cache[cache_key]
    
    # Normalize input (language-aware — avoids mangling non-English text)
    normalized = normalize_input(user_input, language)
    
    # Load language-specific models (lazy, cached)
    clf, label_encoder, intent_responses = get_models(language)
    if clf is None:
        return get_low_confidence_response(language)
    
    # Keyword-first accuracy: solid curated phrase matches beat the unreliable SVM
    # (score >= 2 means the exact phrase was present verbatim in the message)
    kw_tag, kw_score = _keyword_score(normalized)
    if kw_tag and kw_score >= 2:
        kw_responses = intent_responses.get(kw_tag, [])
        if kw_responses:
            import random
            response = random.choice(kw_responses)
            if use_cache:
                response_cache[cache_key] = response
            return response
    
    # Encode input
    if embedder is None:
        return get_low_confidence_response(language)
    
    try:
        emb = embedder.encode([normalized], convert_to_numpy=True, show_progress_bar=False)
    except Exception as e:
        print(f"Error encoding input: {e}", file=sys.stderr)
        return get_low_confidence_response(language)
    
    # Get prediction
    try:
        proba = clf.predict_proba(emb)[0]
        confidence = np.max(proba)
        tag_index = np.argmax(proba)
        tag = label_encoder.inverse_transform([tag_index])[0]
    except Exception as e:
        print(f"Error predicting: {e}", file=sys.stderr)
        return get_low_confidence_response(language)
    
    # Low confidence — try keyword fallback before giving up
    threshold = CONFIDENCE_THRESHOLDS.get(language, 0.40)
    if confidence < threshold:
        fallback_tag = keyword_fallback(normalized)
        if fallback_tag:
            # Use the keyword-matched intent's response (works for all languages)
            fallback_responses = intent_responses.get(fallback_tag, [])
            if fallback_responses:
                import random
                response = random.choice(fallback_responses)
                if use_cache:
                    response_cache[cache_key] = response
                return response
        response = get_low_confidence_response(language)
        if use_cache:
            response_cache[cache_key] = response
        return response
    
    # Get intent response
    responses = intent_responses.get(tag, [])
    if responses:
        import random
        response = random.choice(responses)
        if use_cache:
            response_cache[cache_key] = response
        return response
    
    # Fallback
    response = get_low_confidence_response(language)
    if use_cache:
        response_cache[cache_key] = response
    return response

def get_low_confidence_response(language='en'):
    """Get a helpful clarification request with topic suggestions."""
    responses = {
        'en': (
            "I'm not sure I fully understood that. Here are topics I can help with about Naujan:\n\n"
            "🏝️ Naujan attractions & natural features\n"
            "🌊 Naujan Lake & activities\n"
            "🏨 Hotels & accommodations in Naujan\n"
            "🗺️ How to get to Naujan\n"
            "🍽️ Local food & restaurants\n"
            "🎭 Festivals & cultural events\n"
            "🏔️ Hiking, eco-tourism & outdoor activities\n"
            "🛍️ Shopping & local souvenirs\n"
            "🌤️ Best time to visit & weather\n"
            "📞 Emergency contacts & travel safety\n\n"
            "Try asking: \"What are the attractions in Naujan?\" "
            "or \"How do I get to Naujan?\""
        ),
        'es': "No estoy seguro de entender. ¿Puedes reformular eso? Puedo ayudarte con información sobre Naujan: atracciones, Lago Naujan, hoteles, transporte, comida local, festivales, senderismo, tiendas, clima y seguridad.",
        'tl': "Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong tungkol sa Naujan: mga atraksyon, Lawa ng Naujan, hotel, transportasyon, pagkain, mga pista, hiking, pamimili, panahon at seguridad.",
        'zh': "我不太确定我理解了。我可以帮您解答关于瑙詹（Naujan）的问题：景点、瑙詹湖、酒店、交通、当地美食、节庆活动、徒步、购物、天气和安全。请换一种方式提问。",
        'ja': "申し訳ございませんが、よく理解できませんでした。ナウハン（Naujan）に関する観光スポット、ナウハン湖、ホテル予約、交通、地元料理、祭り、ハイキング、ショッピング、天気、安全についてお手伝いできます。",
        'ko': "죄송하지만 이해를 못했습니다. 나우한(Naujan)에 대해 도움을 드릴 수 있습니다: 관광지, 나우한 호수, 호텔, 교통, 현지 음식, 축제, 하이킹, 쇼핑, 날씨, 안전.",
        'fr': "Je ne suis pas sûr de bien comprendre. Je peux vous aider avec des informations sur Naujan: sites touristiques, Lac Naujan, réservation d'hôtel, transport, cuisine locale, festivals, randonnée, shopping, météo et sécurité.",
        'de': "Ich bin mir nicht sicher, dass ich das verstanden habe. Ich kann Ihnen mit Informationen über Naujan helfen: Sehenswürdigkeiten, Naujan-See, Hotelbuchung, Transport, Lokalküche, Festivals, Wandern, Einkaufen, Wetter und Sicherheit."
    }
    return responses.get(language, responses['en'])

def resolve_language(user_input, preferred_language='en', auto_detect=False):
    """Resolve language based on preference and optional auto-detection."""
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
    global response_cache
    response_cache = {}

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
    
    # Get the response and intent tag
    response_text = get_response(user_msg, resolved_language, use_cache)
    
    # Try to detect intent for action buttons
    normalized_msg = normalize_input(user_msg, resolved_language).lower()
    intent_tag = keyword_fallback(normalized_msg)
    
    # Format response with action buttons if formatter available
    if format_response_with_actions and intent_tag:
        formatted_response = format_response_with_actions(response_text, intent_tag, resolved_language)
        return {"id": request_id, "response": formatted_response}
    else:
        return {"id": request_id, "response": response_text}

# CLI interface (line-delimited JSON)
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
