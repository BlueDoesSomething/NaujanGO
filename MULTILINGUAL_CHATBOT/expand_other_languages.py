#!/usr/bin/env python3
"""
Expand language patterns for English, Spanish, Tagalog, French, and German.
This script adds semantic variations and alternative phrasings to make the chatbot
more responsive to natural language queries in each language.
"""

import json
import os

# Define expansion patterns for each language
expansion_maps = {
    'en': {  # English
        'Naujan_Lake_National_Park': [
            "naujan lake national park",
            "naujan lake park",
            "naujan lake",
            "largest lake in mindanao",
            "naujan lake visit",
            "things to do at naujan lake",
            "naujan lake birdwatching",
            "naujan lake boating",
            "naujan lake tour",
            "naujan lake trip",
            "naujan lake cruise",
            "what can i do at naujan lake",
            "naujan lake scenery",
            "naujan lake fishing",
            "naujan lake nature",
            "naujan lake wildlife",
            "ramsar wetland",
            "naujan lake ecotourism",
            "sacred place naujan lake",
            "peaceful naujan lake",
            "beautiful naujan lake",
            "naujan national park info",
            "how to get to naujan lake",
            "naujan lake visitor info",
            "best time to visit naujan lake",
            "naujan lake sunset",
            "naujan lake guide service",
            "naujan lake photography",
            "naujan lake photo spots",
            "naujan lake endemic birds",
            "naujan lake attractions",
            "exploring naujan lake",
            "naujan lake adventure",
            "naujan lake packages"
        ],
        'Naujan_Accommodations_Budget': [
            "budget hotel naujan",
            "cheap accommodation naujan",
            "budget friendly naujan",
            "inexpensive hotel naujan",
            "affordable naujan hotel",
            "low cost naujan hotel",
            "budget naujan lodging",
            "cheapest place to stay naujan",
            "under 500 pesos naujan",
            "backpacker hostel naujan",
            "guest house naujan budget",
            "hostel naujan",
            "family lodge naujan",
            "cheap rooms naujan",
            "affordable rooms naujan",
            "budget stay naujan",
            "economy hotel naujan",
            "value for money naujan hotel",
            "best budget hotel naujan",
            "cheapest accommodation"
        ],
        'Naujan_Location': [
            "where is naujan",
            "naujan location",
            "what province is naujan in",
            "naujan philippines",
            "find naujan on map",
            "how to find naujan",
            "naujan town",
            "where exactly is naujan",
            "naujan map",
            "naujan in the philippines",
            "locate naujan",
            "naujan province",
            "mindoro naujan",
            "naujan mindoro",
            "how to get to naujan",
            "directions to naujan",
            "where in mindoro is naujan",
            "naujan municipality",
            "first class municipality naujan",
            "naujan oriental mindoro"
        ],
        'Transportation': [
            "how to get to naujan",
            "transportation to naujan",
            "reach naujan",
            "travel to naujan",
            "get to naujan",
            "ways to get to naujan",
            "bus to naujan",
            "ferry to naujan",
            "transportation options naujan",
            "driving to naujan",
            "flight to naujan",
            "travel time to naujan",
            "routes to naujan",
            "land trip to naujan",
            "sea route naujan",
            "how long to naujan",
            "which way to naujan"
        ],
        'Food_Cuisine': [
            "naujan food",
            "local cuisine naujan",
            "what to eat in naujan",
            "naujan dishes",
            "naujan specialties",
            "local delicacies naujan",
            "naujan restaurants",
            "best food naujan",
            "try naujan",
            "taste naujan cuisine",
            "naujan recipes",
            "seafood naujan",
            "vegetables naujan",
            "local delicacies",
            "naujan gastronomic",
            "eat in naujan"
        ],
        'Festival_Events': [
            "naujan festival",
            "naujan events",
            "when is naujan festival",
            "local celebrations naujan",
            "naujan holidays",
            "annual events naujan",
            "fiestas naujan",
            "naujan celebration",
            "cultural events naujan",
            "when to visit naujan events"
        ]
    },
    'es': {  # Spanish
        'Naujan_Lake_National_Park': [
            "parque nacional lago naujan",
            "lago naujan",
            "naujan parque",
            "mayor lago en mindanao",
            "visitar lago naujan",
            "qué hacer en lago naujan",
            "observación de aves naujan",
            "paseo en bote naujan",
            "tour del lago naujan",
            "viaje al lago naujan",
            "crucero del lago naujan",
            "qué puedo hacer en naujan",
            "paisaje del lago naujan",
            "pesca en naujan",
            "naturaleza naujan",
            "fauna naujan",
            "humedal ramsar",
            "ecoturismo naujan",
            "lugar sagrado naujan",
            "ambiente tranquilo naujan",
            "ambiente hermoso naujan",
            "información parque naujan",
            "cómo llegar a naujan",
            "información visitantes naujan",
            "mejor tiempo visitar naujan",
            "atardecer naujan",
            "servicio de guía naujan",
            "fotografía naujan",
            "lugares fotogénicos naujan",
            "aves endémicas naujan",
            "atracciones naujan",
            "explorar naujan",
            "aventura naujan"
        ],
        'Naujan_Accommodations_Budget': [
            "hotel presupuesto naujan",
            "alojamiento barato naujan",
            "hospedaje económico naujan",
            "hotel asequible naujan",
            "alojamiento asequible naujan",
            "hospedaje bajo costo naujan",
            "hotel presupuestario naujan",
            "lugar barato para dormir naujan",
            "menos de 500 pesos naujan",
            "albergue mochilero naujan",
            "pensión barata naujan",
            "hostal naujan",
            "hospedería familiar naujan",
            "cuartos baratos naujan",
            "habitaciones asequibles naujan",
            "hospedaje económico naujan",
            "hotel económico naujan",
            "alojamiento de valor naujan",
            "mejor hospedaje naujan",
            "alojamiento más barato"
        ],
        'Naujan_Location': [
            "dónde está naujan",
            "ubicación naujan",
            "en qué provincia está naujan",
            "naujan filipinas",
            "encontrar naujan en el mapa",
            "cómo encontrar naujan",
            "pueblo naujan",
            "dónde exactamente está naujan",
            "mapa naujan",
            "naujan en filipinas",
            "localizar naujan",
            "provincia naujan",
            "mindoro naujan",
            "naujan mindoro",
            "cómo llegar a naujan",
            "direcciones a naujan",
            "dónde en mindoro está naujan",
            "municipio naujan",
            "municipio de primera clase naujan",
            "naujan oriental mindoro"
        ],
        'Transportation': [
            "cómo llegar a naujan",
            "transporte a naujan",
            "llegar a naujan",
            "viajar a naujan",
            "ir a naujan",
            "formas de llegar a naujan",
            "autobús a naujan",
            "ferry a naujan",
            "opciones de transporte naujan",
            "conducir a naujan",
            "vuelo a naujan",
            "tiempo de viaje a naujan",
            "rutas a naujan",
            "viaje por tierra a naujan",
            "ruta marítima naujan",
            "cuánto tiempo a naujan"
        ],
        'Food_Cuisine': [
            "comida naujan",
            "cocina local naujan",
            "qué comer en naujan",
            "platos naujan",
            "especialidades naujan",
            "delicadezas locales naujan",
            "restaurantes naujan",
            "mejor comida naujan",
            "probar naujan",
            "gastronomía naujan",
            "recetas naujan",
            "mariscos naujan",
            "verduras naujan",
            "comida regional",
            "delicias culinarias naujan",
            "comer en naujan"
        ],
        'Festival_Events': [
            "festival naujan",
            "eventos naujan",
            "cuándo es festival naujan",
            "celebraciones locales naujan",
            "fiestas naujan",
            "eventos anuales naujan",
            "festividades naujan",
            "celebración naujan",
            "eventos culturales naujan",
            "cuándo visitar eventos naujan"
        ]
    },
    'tl': {  # Tagalog
        'Naujan_Lake_National_Park': [
            "lawa naujan national park",
            "naujan na lawa",
            "naujan lawa",
            "pinakamalaking lawa sa mindanao",
            "bisitahin ang naujan",
            "ano ang magagawa sa naujan",
            "bantayan ng ibon sa naujan",
            "paglalayag sa naujan",
            "tour ng naujan",
            "paglalakbay sa naujan",
            "cruise sa naujan",
            "ano ang pwedeng gawin sa naujan",
            "tanawin ng naujan",
            "pagisda sa naujan",
            "kalikasan ng naujan",
            "hayop sa naujan",
            "ramsar wetland",
            "ekoturismo naujan",
            "banal na lugar naujan",
            "makapatag na kapaligiran naujan",
            "magandang kapaligiran naujan",
            "impormasyon national park naujan",
            "paano makarating sa naujan",
            "impormasyon bisita naujan",
            "pinakamahusay na oras bisitahin naujan",
            "paglalabas ng araw naujan",
            "serbisyo ng gabay naujan",
            "potograpiya sa naujan",
            "lugar sa larawan naujan",
            "ibon na endemic naujan",
            "atraksyon naujan",
            "tuklasin ang naujan",
            "pakikipagsapalaran naujan"
        ],
        'Naujan_Accommodations_Budget': [
            "budget hotel naujan",
            "murang tulugan naujan",
            "abot-kayang kuwarto naujan",
            "hotel na abot-kaya naujan",
            "tahanan budget naujan",
            "mababang gastos kuwarto naujan",
            "hostel naujan",
            "pinakamurang lugar matulog naujan",
            "ilalim 500 pesos naujan",
            "backpacker hostel naujan",
            "pensyon naujan",
            "albergue naujan",
            "pamilyang lodge naujan",
            "murang kuwarto naujan",
            "abot-kayang kwarto naujan",
            "budget stay naujan",
            "ekonomiya hotel naujan",
            "halaga para sa pera naujan",
            "pinakamagandang budget hotel naujan",
            "pinakamurang accommodation"
        ],
        'Naujan_Location': [
            "nasaan ang naujan",
            "lokasyon naujan",
            "anong lalawigan ang naujan",
            "naujan pilipinas",
            "hanapin ang naujan sa mapa",
            "paano mahanap ang naujan",
            "bayan naujan",
            "nasaan ang naujan nang eksakto",
            "mapa naujan",
            "naujan sa pilipinas",
            "ihanay ang naujan",
            "lalawigan naujan",
            "mindoro naujan",
            "naujan mindoro",
            "paano makarating sa naujan",
            "direksyon sa naujan",
            "saan sa mindoro ang naujan",
            "munisipyo naujan",
            "unang klaseng munisipyo naujan",
            "naujan oriental mindoro"
        ],
        'Transportation': [
            "paano makarating sa naujan",
            "transportasyon sa naujan",
            "umahay sa naujan",
            "maglakbay sa naujan",
            "pumunta sa naujan",
            "mga paraan upang makarating sa naujan",
            "bus sa naujan",
            "ferry sa naujan",
            "mga opsyon sa transportasyon naujan",
            "magmaneho sa naujan",
            "flight sa naujan",
            "oras ng paglalakbay sa naujan",
            "mga ruta sa naujan",
            "paglalakbay sa lupa naujan",
            "marutang dagat naujan",
            "gaano katagal sa naujan"
        ],
        'Food_Cuisine': [
            "pagkain naujan",
            "lokal na putahe naujan",
            "ano ang kainin sa naujan",
            "mga putahe naujan",
            "mga specialty naujan",
            "mga delicacy naujan",
            "mga restaurant naujan",
            "pinakamagandang pagkain naujan",
            "subukan ang naujan",
            "lasa ng naujan",
            "mga recipe naujan",
            "dagat naujan",
            "gulay naujan",
            "lokal na pagkain",
            "kulinaryo naujan",
            "kumain sa naujan"
        ],
        'Festival_Events': [
            "fiesta naujan",
            "mga event naujan",
            "kailan ang fiesta naujan",
            "lokal na selebrasyon naujan",
            "kaarawan naujan",
            "taunang kaganapan naujan",
            "pagdiriwang naujan",
            "kasiyahan naujan",
            "mga event ng kultura naujan",
            "kailan bisitahin ang event naujan"
        ]
    },
    'fr': {  # French
        'Naujan_Lake_National_Park': [
            "parc national lac naujan",
            "lac naujan",
            "parc naujan",
            "plus grand lac de mindanao",
            "visiter le lac naujan",
            "que faire au lac naujan",
            "observation des oiseaux naujan",
            "promenade en bateau naujan",
            "visite du lac naujan",
            "voyage au lac naujan",
            "croisière du lac naujan",
            "que puis-je faire à naujan",
            "paysage du lac naujan",
            "pêche à naujan",
            "nature naujan",
            "faune naujan",
            "zone humide ramsar",
            "écotourisme naujan",
            "lieu sacré naujan",
            "environnement paisible naujan",
            "environnement beau naujan",
            "information parc naujan",
            "comment aller à naujan",
            "information visiteurs naujan",
            "meilleur moment visiter naujan",
            "coucher de soleil naujan",
            "service de guide naujan",
            "photographie naujan",
            "lieux photo naujan",
            "oiseaux endémiques naujan",
            "attractions naujan",
            "explorer naujan",
            "aventure naujan"
        ],
        'Naujan_Accommodations_Budget': [
            "hôtel budget naujan",
            "logement pas cher naujan",
            "hébergement économique naujan",
            "hôtel abordable naujan",
            "logement abordable naujan",
            "hébergement à bas coût naujan",
            "auberge budget naujan",
            "endroit pas cher où dormir naujan",
            "moins de 500 pesos naujan",
            "auberge routière naujan",
            "pension bon marché naujan",
            "auberge de jeunesse naujan",
            "gîte familial naujan",
            "chambres pas chères naujan",
            "chambres abordables naujan",
            "hébergement économique naujan",
            "hôtel économique naujan",
            "logement bon rapport qualité-prix naujan",
            "meilleur hôtel budget naujan",
            "logement le moins cher"
        ],
        'Naujan_Location': [
            "où est naujan",
            "emplacement naujan",
            "dans quelle province est naujan",
            "naujan philippines",
            "trouver naujan sur la carte",
            "comment trouver naujan",
            "ville naujan",
            "où exactement est naujan",
            "carte naujan",
            "naujan aux philippines",
            "localiser naujan",
            "province naujan",
            "mindoro naujan",
            "naujan mindoro",
            "comment se rendre à naujan",
            "directions vers naujan",
            "où à mindoro se trouve naujan",
            "municipalité naujan",
            "municipalité de première classe naujan",
            "naujan oriental mindoro"
        ],
        'Transportation': [
            "comment aller à naujan",
            "transport vers naujan",
            "se rendre à naujan",
            "voyager à naujan",
            "aller à naujan",
            "façons d'aller à naujan",
            "bus vers naujan",
            "ferry vers naujan",
            "options de transport naujan",
            "conduire à naujan",
            "vol vers naujan",
            "durée du voyage à naujan",
            "itinéraires vers naujan",
            "voyage terrestre naujan",
            "route maritime naujan",
            "combien de temps à naujan"
        ],
        'Food_Cuisine': [
            "nourriture naujan",
            "cuisine locale naujan",
            "que manger à naujan",
            "plats naujan",
            "spécialités naujan",
            "mets locaux naujan",
            "restaurants naujan",
            "meilleure nourriture naujan",
            "essayer naujan",
            "saveur naujan",
            "recettes naujan",
            "fruits de mer naujan",
            "légumes naujan",
            "nourriture régionale",
            "délices culinaires naujan",
            "manger à naujan"
        ],
        'Festival_Events': [
            "festival naujan",
            "événements naujan",
            "quand festival naujan",
            "célébrations locales naujan",
            "fêtes naujan",
            "événements annuels naujan",
            "festivités naujan",
            "célébration naujan",
            "événements culturels naujan",
            "quand visiter événements naujan"
        ]
    },
    'de': {  # German
        'Naujan_Lake_National_Park': [
            "nationalpark naujan see",
            "naujan see",
            "naujan park",
            "größter see auf mindanao",
            "naujan see besuchen",
            "was kann man am naujan see tun",
            "vogelbeobachtung naujan",
            "bootfahrt naujan",
            "naujan see tour",
            "reise zum naujan see",
            "naujan see kreuzfahrt",
            "was kann ich am naujan see tun",
            "naujan see landschaft",
            "fischen am naujan see",
            "naujan natur",
            "naujan wildlife",
            "ramsar feuchtgebiet",
            "naujan ökotourismus",
            "heiliger ort naujan",
            "ruhige umgebung naujan",
            "schöne umgebung naujan",
            "naujan park information",
            "wie komme ich zum naujan see",
            "naujan besucher information",
            "beste zeit naujan see zu besuchen",
            "naujan sonnenuntergang",
            "naujan führer service",
            "naujan fotografie",
            "naujan foto orte",
            "naujan endemische vögel",
            "naujan attraktionen",
            "naujan erkunden",
            "naujan abenteuer"
        ],
        'Naujan_Accommodations_Budget': [
            "budget hotel naujan",
            "günstige unterkunft naujan",
            "erschwingliches hotel naujan",
            "budgetfreundliche unterkunft naujan",
            "günstige zimmer naujan",
            "niedriger preis hotel naujan",
            "herberge naujan",
            "billiger schlafplatz naujan",
            "unter 500 pesos naujan",
            "rucksack herberge naujan",
            "günstige pension naujan",
            "jugendherberge naujan",
            "familienloge naujan",
            "billige zimmer naujan",
            "erschwingliche zimmer naujan",
            "budget unterkunft naujan",
            "wirtschaftshotel naujan",
            "wert für geld naujan",
            "bestes budget hotel naujan",
            "günstigste unterkunft"
        ],
        'Naujan_Location': [
            "wo ist naujan",
            "naujan ort",
            "in welcher provinz liegt naujan",
            "naujan philippinen",
            "naujan auf der karte finden",
            "wie man naujan findet",
            "stadt naujan",
            "wo genau liegt naujan",
            "naujan karte",
            "naujan in den philippinen",
            "naujan lokalisieren",
            "provinz naujan",
            "mindoro naujan",
            "naujan mindoro",
            "wie komme ich nach naujan",
            "richtungen nach naujan",
            "wo auf mindoro liegt naujan",
            "gemeinde naujan",
            "erste klasse gemeinde naujan",
            "naujan oriental mindoro"
        ],
        'Transportation': [
            "wie komme ich nach naujan",
            "transport nach naujan",
            "reaches naujan",
            "reisen nach naujan",
            "fahrt nach naujan",
            "arten nach naujan zu gehen",
            "bus nach naujan",
            "fähre nach naujan",
            "transportmittel naujan",
            "fahren nach naujan",
            "flug nach naujan",
            "reisezeit nach naujan",
            "routen nach naujan",
            "landfahrt naujan",
            "seeroute naujan",
            "wie lange nach naujan"
        ],
        'Food_Cuisine': [
            "naujan essen",
            "lokale küche naujan",
            "was man in naujan essen kann",
            "naujan gerichte",
            "naujan spezialitäten",
            "lokale köstlichkeiten naujan",
            "naujan restaurants",
            "bestes essen naujan",
            "naujan probieren",
            "naujan geschmack",
            "naujan rezepte",
            "naujan meeresfrüchte",
            "naujan gemüse",
            "regionale küche",
            "gastronomie naujan",
            "essen in naujan"
        ],
        'Festival_Events': [
            "fest naujan",
            "ereignisse naujan",
            "wann ist fest naujan",
            "lokale feiern naujan",
            "feiertage naujan",
            "jährliche veranstaltungen naujan",
            "festlichkeiten naujan",
            "feier naujan",
            "kulturelle veranstaltungen naujan",
            "wann ereignisse naujan besuchen"
        ]
    }
}

def expand_language_patterns(language_code, intents_file):
    """
    Expand patterns in a language's intents file.
    
    Args:
        language_code: Language code (en, es, tl, fr, de)
        intents_file: Path to the intents JSON file
    """
    
    # Load existing intents
    with open(intents_file, 'r', encoding='utf-8') as f:
        intents_data = json.load(f)
    
    # Get expansion patterns for this language
    expansions = expansion_maps.get(language_code, {})
    
    # Map of intent tags to expansion keys
    tag_mapping = {
        'Naujan_Lake_National_Park': 'Naujan_Lake_About',
        'Naujan_Accommodations_Budget': 'Naujan_Accommodations_Budget',
        'Naujan_Location': 'Naujan_Location',
        'Transportation': 'Transportation_How_To_Get_There',
        'Food_Cuisine': 'Local_Food_Cuisine',
        'Festival_Events': 'Festivals_Events'
    }
    
    # Process each intent
    for intent in intents_data.get('intents', []):
        tag = intent.get('tag')
        
        # Find matching expansion key
        expansion_key = None
        for exp_key, tags in tag_mapping.items():
            if tag == tags:
                expansion_key = exp_key
                break
        
        # Add expanded patterns if available
        if expansion_key and expansion_key in expansions:
            current_patterns = set(intent.get('patterns', []))
            new_patterns = expansions[expansion_key]
            
            # Avoid duplicates
            for pattern in new_patterns:
                if pattern.lower() not in [p.lower() for p in current_patterns]:
                    current_patterns.add(pattern)
            
            intent['patterns'] = sorted(list(current_patterns))
            print(f"✓ Expanded {tag}: {len(new_patterns)} new patterns added")
        else:
            # Count current patterns
            print(f"  {tag}: {len(intent.get('patterns', []))} patterns")
    
    # Save updated intents back
    with open(intents_file, 'w', encoding='utf-8') as f:
        json.dump(intents_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ {language_code.upper()} intents updated: {intents_file}\n")

def main():
    """Main function to expand patterns for all non-Asian languages."""
    
    # Define language codes and their respective intents files
    languages = {
        'en': 'intents/intents_en.json',
        'es': 'intents/intents_es.json',
        'tl': 'intents/intents_tl.json',
        'fr': 'intents/intents_fr.json',
        'de': 'intents/intents_de.json'
    }
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("=" * 70)
    print("EXPANDING PATTERNS FOR NON-ASIAN LANGUAGES")
    print("=" * 70)
    print()
    
    for lang_code, intents_path in languages.items():
        full_path = os.path.join(base_dir, intents_path)
        
        if os.path.exists(full_path):
            print(f"Processing {lang_code.upper()}...")
            expand_language_patterns(lang_code, full_path)
        else:
            print(f"⚠️  File not found: {full_path}")
    
    print("=" * 70)
    print("PATTERN EXPANSION COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Review the updated intents files for accuracy")
    print("2. Run training: python scripts/train_multilingual.py")
    print("3. Test the chatbot with: python scripts/chatbot_multilingual.py")

if __name__ == '__main__':
    main()
