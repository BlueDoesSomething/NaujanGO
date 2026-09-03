#!/usr/bin/env python3
"""
Enhanced Chatbot Response Formatter
Adds context-aware action buttons to chatbot responses based on intent
"""

import json
from pathlib import Path

BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR.parent / "models"

# Intent-to-actions mapping
INTENT_ACTIONS = {
    # Location/Map-related
    "Naujan_Location": ["show_map", "attractions"],
    "Naujan_Lake_About": ["show_map", "weather"],
    "Naujan_Lake_Activities": ["show_map", "booking"],
    "Naujan_Lake_Wildlife": ["show_map", "photo_tips"],
    "Naujan_Overview": ["attractions", "plan_trip"],
    "Transportation_How_To_Get_There": ["show_map", "booking"],
    
    # Attractions/Activities
    "Attractions_Nearby": ["show_map", "booking", "weather"],
    "Beach_Activities": ["show_map", "booking"],
    "Hiking_Trekking": ["show_map", "weather", "safety"],
    "Diving_Snorkeling": ["show_map", "weather", "booking"],
    "Photo_Spots": ["show_map", "plan_trip"],
    "Mangyan_Culture": ["show_map", "attractions"],
    
    # Hotels/Accommodations
    "Naujan_Accommodations_Budget": ["booking", "show_map"],
    "Naujan_Accommodations_Premium": ["booking", "show_map"],
    "Accommodation_Types": ["booking", "show_map"],
    
    # Planning/Itinerary
    "Itinerary_Plan": ["plan_trip", "attractions", "booking"],
    "Best_Time_To_Visit": ["weather", "plan_trip"],
    "Budget_Travel": ["plan_trip", "booking"],
    "Booking_Help": ["booking"],
    
    # Food/Restaurants
    "Local_Food_Cuisine": ["attractions", "booking"],
    "Restaurants_Dining": ["show_map", "booking"],
    
    # Events/Festivals
    "Festivals_Events": ["plan_trip", "weather"],
    
    # Weather
    "Weather_Info": ["weather", "plan_trip"],
    
    # Contact/Emergency
    "LGU_Contact_Mayor": [],  # No actions needed
    "Emergency_Police": [],
    "Safety_Emergency": [],
    
    # App help
    "App_Capabilities": [],
    "Booking_Help": ["booking"],
    "Help_Features": []
}

# Action translations
ACTION_LABELS = {
    "en": {
        "show_map": {"text": "View Map", "icon": "🗺️"},
        "attractions": {"text": "View Attractions", "icon": "🏝️"},
        "weather": {"text": "Check Weather", "icon": "🌤️"},
        "booking": {"text": "Book Now", "icon": "🏨"},
        "plan_trip": {"text": "Plan Itinerary", "icon": "📅"},
        "photo_tips": {"text": "Photo Tips", "icon": "📸"},
        "safety": {"text": "Safety Info", "icon": "⚠️"}
    },
    "es": {
        "show_map": {"text": "Ver Mapa", "icon": "🗺️"},
        "attractions": {"text": "Ver Atracciones", "icon": "🏝️"},
        "weather": {"text": "Verificar Clima", "icon": "🌤️"},
        "booking": {"text": "Reservar Ahora", "icon": "🏨"},
        "plan_trip": {"text": "Planificar Itinerario", "icon": "📅"},
        "photo_tips": {"text": "Consejos de Fotos", "icon": "📸"},
        "safety": {"text": "Información de Seguridad", "icon": "⚠️"}
    },
    "tl": {
        "show_map": {"text": "Tingnan ang Mapa", "icon": "🗺️"},
        "attractions": {"text": "Tingnan ang Atraksiyon", "icon": "🏝️"},
        "weather": {"text": "Tingnan ang Panahon", "icon": "🌤️"},
        "booking": {"text": "Mag-Book Na", "icon": "🏨"},
        "plan_trip": {"text": "Planuhin ang Itinerary", "icon": "📅"},
        "photo_tips": {"text": "Mga Tips sa Kuha", "icon": "📸"},
        "safety": {"text": "Impormasyon sa Kaligtasan", "icon": "⚠️"}
    },
    "zh": {
        "show_map": {"text": "查看地图", "icon": "🗺️"},
        "attractions": {"text": "查看景点", "icon": "🏝️"},
        "weather": {"text": "检查天气", "icon": "🌤️"},
        "booking": {"text": "立即预订", "icon": "🏨"},
        "plan_trip": {"text": "规划行程", "icon": "📅"},
        "photo_tips": {"text": "摄影技巧", "icon": "📸"},
        "safety": {"text": "安全信息", "icon": "⚠️"}
    },
    "ja": {
        "show_map": {"text": "地図を表示", "icon": "🗺️"},
        "attractions": {"text": "観光スポット", "icon": "🏝️"},
        "weather": {"text": "天気を確認", "icon": "🌤️"},
        "booking": {"text": "今すぐ予約", "icon": "🏨"},
        "plan_trip": {"text": "旅程を計画", "icon": "📅"},
        "photo_tips": {"text": "写真撮影のコツ", "icon": "📸"},
        "safety": {"text": "安全情報", "icon": "⚠️"}
    },
    "ko": {
        "show_map": {"text": "지도 보기", "icon": "🗺️"},
        "attractions": {"text": "관광 명소 보기", "icon": "🏝️"},
        "weather": {"text": "날씨 확인", "icon": "🌤️"},
        "booking": {"text": "지금 예약", "icon": "🏨"},
        "plan_trip": {"text": "여행 계획", "icon": "📅"},
        "photo_tips": {"text": "사진 팁", "icon": "📸"},
        "safety": {"text": "안전 정보", "icon": "⚠️"}
    },
    "fr": {
        "show_map": {"text": "Voir la Carte", "icon": "🗺️"},
        "attractions": {"text": "Voir les Attractions", "icon": "🏝️"},
        "weather": {"text": "Vérifier la Météo", "icon": "🌤️"},
        "booking": {"text": "Réserver Maintenant", "icon": "🏨"},
        "plan_trip": {"text": "Planifier l'Itinéraire", "icon": "📅"},
        "photo_tips": {"text": "Conseils Photographie", "icon": "📸"},
        "safety": {"text": "Information de Sécurité", "icon": "⚠️"}
    },
    "de": {
        "show_map": {"text": "Karte Anzeigen", "icon": "🗺️"},
        "attractions": {"text": "Sehenswürdigkeiten", "icon": "🏝️"},
        "weather": {"text": "Wetter Überprüfen", "icon": "🌤️"},
        "booking": {"text": "Jetzt Buchen", "icon": "🏨"},
        "plan_trip": {"text": "Reise Planen", "icon": "📅"},
        "photo_tips": {"text": "Fototipps", "icon": "📸"},
        "safety": {"text": "Sicherheitsinformation", "icon": "⚠️"}
    }
}

def get_actions_for_intent(intent_tag, language="en"):
    """Get action buttons for a detected intent."""
    action_ids = INTENT_ACTIONS.get(intent_tag, [])
    if not action_ids:
        return []
    
    lang_labels = ACTION_LABELS.get(language, ACTION_LABELS["en"])
    actions = []
    for action_id in action_ids:
        if action_id in lang_labels:
            actions.append({
                "action": action_id,
                **lang_labels[action_id]
            })
    return actions

def format_response_with_actions(response_text, intent_tag, language="en"):
    """Format response with action buttons."""
    actions = get_actions_for_intent(intent_tag, language)
    return {
        "text": response_text,
        "actions": actions,
        "intent": intent_tag
    }
