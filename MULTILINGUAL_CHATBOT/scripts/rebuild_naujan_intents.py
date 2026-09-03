"""
Rebuilds intents_en.json to focus exclusively on Naujan, Oriental Mindoro.
- Removes intents about other municipalities (Puerto Galera, Calapan, Baco, etc.)
- Rewrites generic intents with Naujan-specific content and patterns
- Keeps/expands all existing Naujan-specific intents
"""

import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INTENTS_FILE = os.path.join(BASE_DIR, "..", "intents", "intents_en.json")

# ---------------------------------------------------------------------------
# Intents to REMOVE (other-municipality-specific, not relevant to Naujan)
# ---------------------------------------------------------------------------
INTENTS_TO_REMOVE = {
    "Puerto_Galera_Info",
    "Calapan_Info",
    "Baco_Info",
    "Other_Municipalities_Info",
    "All_Municipalities",
    "Diving_Water_Sports",   # replaced by Naujan_Lake_Activities
    "Beaches_Info",          # replaced by Naujan_Coast
}

# ---------------------------------------------------------------------------
# Intents to completely REPLACE (tag stays, patterns & responses changed)
# ---------------------------------------------------------------------------
INTENTS_TO_REPLACE = {

    # ── Overview ────────────────────────────────────────────────────────────
    "Oriental_Mindoro_Overview": {
        "tag": "Naujan_Overview",
        "patterns": [
            "about naujan", "what is naujan", "tell me about naujan",
            "naujan info", "naujan overview", "naujan municipality",
            "describe naujan", "naujan facts", "info on naujan",
            "what is special about naujan", "why visit naujan",
            "naujan tourist destination", "naujan travel guide",
            "what does naujan offer", "highlights of naujan",
            "naujan features", "naujan attractions overview",
            "interesting things about naujan", "tell me more about naujan",
            "is naujan worth visiting", "naujan tourism",
            "naujan oriental mindoro", "naujan mindoro",
            "naujan province info", "municipality of naujan",
            "general info about naujan", "naujan summary",
            "what can i do in naujan", "things about naujan",
            "naujan travel", "visit naujan", "explore naujan",
            "naujan guide", "naujan philippines", "naujan oriental",
            "1st class municipality naujan", "naujan class municipality",
            "abut naujan", "abt naujan", "tell me bout naujan",
            "naujan infomation", "info naujan", "naujan facts philippines",
            "nwajan", "nawjan overview", "naujan mindro",
        ],
        "responses": [
            "Naujan is a 1st Class Municipality in Oriental Mindoro, Philippines. "
            "It is best known for Naujan Lake National Park — the 5th largest lake in the Philippines "
            "and a RAMSAR Wetland of International Importance. Naujan is also home to rich agriculture "
            "(rice and coconut), Mangyan indigenous communities, and warm, hospitable people.",

            "Naujan, Oriental Mindoro offers: Naujan Lake National Park (birdwatching, eco-tours, boating), "
            "heritage sites like the old Naujan Church, thriving rice and coconut farms, Mangyan cultural heritage, "
            "and serene river ecosystems like Sadya River. It is a peaceful and scenic destination away from "
            "crowded tourist areas.",

            "Key facts about Naujan: Located on the northeastern coast of Mindoro Island. "
            "Languages spoken: Filipino, English, and local dialects. Population ~70,000+. "
            "Main industries: rice farming, coconut/copra, fishing, and eco-tourism. "
            "The municipality borders Calapan to the northwest and is about 30-45 minutes by van or jeep."
        ]
    },

    # ── Transportation ───────────────────────────────────────────────────────
    "Transportation_How_To_Get_There": {
        "tag": "Transportation_How_To_Get_There",
        "patterns": [
            "how to get to naujan", "how do i go to naujan",
            "how to reach naujan", "going to naujan", "travel to naujan",
            "trip to naujan", "directions to naujan", "route to naujan",
            "transport to naujan", "what is the way to naujan",
            "how can i reach naujan", "commute to naujan",
            "bus to naujan", "jeep to naujan", "van to naujan",
            "from manila to naujan", "manila to naujan",
            "batangas to naujan", "how long is the trip to naujan",
            "travel time naujan", "distance manila to naujan",
            "ferry then naujan", "after ferry how to go to naujan",
            "calapan to naujan", "from calapan to naujan",
            "how to go from calapan to naujan", "van calapan naujan",
            "jeepney calapan to naujan", "bus calapan naujan",
            "nearest port to naujan", "calapan port naujan",
            "how far is naujan from calapan", "distance calapan to naujan",
            "paano pumunta sa naujan", "paano makarating sa naujan",
            "ruta papunta sa naujan", "transport papunta naujan",
            "how 2 get 2 naujan", "hw do i get to naujan",
            "way to get to naujan", "reaching naujan",
            "getting to naujan from manila", "travel from manila to naujan",
            "how far is naujan from manila", "route manila naujan",
            "ferry schedule to near naujan", "what ferry goes near naujan",
            "batangas pier calapan naujan route",
            "from batangas to naujan", "batangas to naujan route",
            "transportation to naujan oriental mindoro",
            "is there a bus to naujan", "is there a van to naujan",
            "what vehicle goes to naujan",
            "hw to get to nawjan", "how to get to nwajan",
        ],
        "responses": [
            "How to get to Naujan:\n"
            "1. From Manila: Take a bus (Buendia or EDSA terminals) to Batangas Pier (~2 hours).\n"
            "2. Take a ferry from Batangas Pier to Calapan Port:\n"
            "   - Fastcraft: ~1 hour (₱280–₱350)\n"
            "   - RORO ferry: ~3 hours (₱150–₱200)\n"
            "   - Ferry companies: Montenegro Lines, Starlite Ferries, ATSC\n"
            "3. From Calapan Port: Take a jeepney or van to Naujan (~30–45 minutes, ₱40–₱80).\n"
            "Van/jeepney terminals in Calapan City serve Naujan regularly.",

            "Getting to Naujan from Manila step by step:\n"
            "Manila → Batangas Pier (bus, ~2 hrs) → Calapan Port (ferry, ~1–3 hrs) → "
            "Naujan (jeepney/van, ~30–45 min).\n"
            "Total travel time from Manila: approximately 4–6 hours depending on ferry schedule. "
            "Tip: Book the morning ferry (6–7 AM departure) from Batangas to arrive in Naujan before noon.",

            "Nearest transport hub to Naujan is Calapan City (capital of Oriental Mindoro), "
            "just 30–45 minutes away. From Calapan, jeepneys and vans regularly serve Naujan. "
            "The van terminal in Calapan is near the port area. Fare is approximately ₱40–₱80."
        ]
    },

    # ── Local Transport ──────────────────────────────────────────────────────
    "Local_Transport": {
        "tag": "Local_Transport",
        "patterns": [
            "local transport in naujan", "getting around naujan",
            "transport within naujan", "how to move around in naujan",
            "commute in naujan", "jeepney in naujan", "tricycle in naujan",
            "local vehicles naujan", "habal habal naujan",
            "van for hire naujan", "multicab naujan",
            "tricycle fare naujan", "jeep fare naujan",
            "how much tricycle naujan", "local fare in naujan",
            "cheap transport naujan", "rent a motorbike naujan",
            "bike naujan", "walk in naujan", "distances in naujan",
            "how to get to naujan lake from town", "transport to naujan lake",
            "how far is the lake from poblacion", "how to reach naujan lake",
            "barangay transport naujan", "jeep to barangay",
            "tricycle to barangay naujan", "habal habal to lake",
            "pedicab naujan", "kuliglig naujan",
            "paano gumalaw sa naujan", "local transport sa naujan",
            "local commute naujan", "moving around naujan",
            "public transport inside naujan", "modes of transport naujan",
            "how to get around naujan", "ways to travel inside naujan",
            "motorbike taxi naujan", "ride in naujan",
        ],
        "responses": [
            "Getting around Naujan:\n"
            "• Tricycle — most common for short distances within the poblacion (₱10–₱30 per ride)\n"
            "• Habal-habal (motorbike taxi) — for reaching far barangays and Naujan Lake area\n"
            "• Jeepney — connects Naujan to Calapan and nearby towns\n"
            "• Van for hire — best for day tours around Naujan Lake and nearby areas\n"
            "• Kuliglig (hand tractor) — used in rural barangays\n"
            "The national highway passes through Naujan, making it easy to flag down transport.",

            "From Naujan Poblacion to Naujan Lake: approximately 15–25 minutes by tricycle or habal-habal. "
            "Hire a local guide or boat operator at the lake's shoreline for tours. "
            "For trips to nearby barangays, habal-habal is the most practical option. "
            "Jeepney/van rides back to Calapan leave from the town proper."
        ]
    },

    # ── Local Food ───────────────────────────────────────────────────────────
    "Local_Food_Cuisine": {
        "tag": "Local_Food_Cuisine",
        "patterns": [
            "food in naujan", "local food naujan", "what to eat in naujan",
            "naujan cuisine", "food specialty naujan", "best food in naujan",
            "local delicacy naujan", "traditional food naujan",
            "authentic naujan food", "native food naujan",
            "where to eat in naujan", "restaurant in naujan",
            "carinderia naujan", "eatery naujan", "dining in naujan",
            "food options naujan", "must try food naujan",
            "naujan dishes", "famous dish naujan", "rice naujan",
            "coconut food naujan", "seafood naujan lake",
            "fresh fish naujan", "fish from naujan lake",
            "frog naujan lake", "freshwater food naujan",
            "kakanin naujan", "rice cake naujan", "native sweet naujan",
            "market food naujan", "palengke food naujan",
            "cheap food naujan", "affordable meals naujan",
            "street food naujan", "night market naujan",
            "carenderia near naujan lake", "food near the lake",
            "what does naujan serve", "local restaurant naujan",
            "ano ang pagkain sa naujan", "masarap na pagkain sa naujan",
            "pagkain sa naujan", "food 2 try in naujan",
            "what food 2 eat naujan", "tasty food naujan",
            "wat to eat naujan", "naujan delicasy",
        ],
        "responses": [
            "Must-try food in Naujan:\n"
            "• Freshwater fish from Naujan Lake — grilled tilapia, mudfish (dalag), and maliputo (endemic lake fish)\n"
            "• Rice-based dishes — Naujan is a major rice-producing town, so rice is always fresh and plentiful\n"
            "• Coconut-based dishes — ginataan, laing, and coconut vinegar (suka ng niyog)\n"
            "• Binagoongan (pork/fish in shrimp paste) with fresh vegetables\n"
            "• Native kakanin (rice cakes): puto, kutsinta, suman\n"
            "• Fresh frog legs (local delicacy near the lake area)\n"
            "Find affordable meals at carinderias near the Naujan public market.",

            "Dining in Naujan: Carinderias (local eateries) near the town market serve affordable Filipino meals "
            "(₱80–₱150/meal). For fresh fish, ask locals for the nearest fish vendor near Naujan Lake. "
            "Try local coconut wine (tuba) and fresh buko (young coconut) drinks available from roadside stalls. "
            "During fiestas and market days, street food stalls sell local snacks and kakanin."
        ]
    },

    # ── Festivals & Events ───────────────────────────────────────────────────
    "Festivals_Events": {
        "tag": "Festivals_Events",
        "patterns": [
            "festivals in naujan", "events in naujan", "fiesta in naujan",
            "naujan town fiesta", "naujan celebrations", "naujan festival",
            "local events naujan", "annual events naujan",
            "when is the naujan fiesta", "what month is naujan fiesta",
            "naujan patron saint", "patron saint of naujan",
            "naujan founding anniversary", "naujan anniversary",
            "what are the festivals in naujan", "cultural events naujan",
            "celebration in naujan", "upcoming events naujan",
            "naujan lake festival", "eco tourism fair naujan",
            "birdwatching event naujan", "agricultural fair naujan",
            "harvest festival naujan", "fiesta date naujan",
            "town fiesta date naujan", "pistang bayan naujan",
            "kapistahan naujan", "pasko naujan", "christmas naujan",
            "summer event naujan", "what events to attend in naujan",
            "how is naujan celebrated", "local celebration naujan",
            "naujan celebration schedule", "when is the naujan celebration",
            "feast day naujan", "patron day naujan",
            "festvals naujan", "fiestas naujan", "annual fest naujan",
            "festival schedule naujan", "naujan events calendar",
        ],
        "responses": [
            "Naujan Town Fiesta: Celebrated every September 8 in honor of the Nativity of the Blessed Virgin Mary "
            "(Our Lady of the Nativity), the patroness of Naujan. The celebration includes a solemn mass at Naujan Church, "
            "street parades, cultural shows, food fairs, and live performances at the town plaza.",

            "Key events in Naujan:\n"
            "• September 8 — Town Fiesta (Nativity of the BVM / Our Lady of the Nativity)\n"
            "• November–March — Birdwatching season at Naujan Lake (peak migration of Siberian birds)\n"
            "• November–December — Harvest season festivals in rice-farming barangays\n"
            "• Various months — Barangay-level patron saint fiestas with local food, games, and dances\n"
            "• Eco-Tourism Fairs — occasionally organized by the LGU near Naujan Lake National Park",

            "Naujan's biggest celebration is the September 8 fiesta honoring its patron, Our Lady of the Nativity. "
            "During the fiesta week, the town plaza fills with food stalls, games, cultural presentations, "
            "and religious processions. Visitors are welcome to join and experience authentic local culture."
        ]
    },

    # ── Waterfalls / Natural Features ────────────────────────────────────────
    "Waterfalls_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "natural attractions naujan", "nature in naujan",
            "waterfalls near naujan", "waterfall in naujan",
            "rivers in naujan", "river in naujan", "sadya river",
            "streams in naujan", "swimming in naujan",
            "nature spot naujan", "scenic places naujan",
            "natural wonders naujan", "nature trip naujan",
            "outdoors in naujan", "outdoor naujan",
            "forest in naujan", "trees in naujan",
            "wildlife outside the lake", "birds outside the lake naujan",
            "crocodile habitat naujan", "mangrove in naujan",
            "mangrove forest naujan", "coastal area naujan",
            "shore in naujan", "naujan coastline",
            "swimming in the river naujan", "river swim naujan",
            "clean river naujan", "fresh water swimming naujan",
            "where to swim in naujan", "swimming spot naujan",
            "natural pool naujan", "scenic view naujan",
            "scenic overlook naujan", "hill in naujan",
            "mountain view naujan", "rice field view naujan",
            "rice paddies naujan", "coconut plantation view naujan",
            "farm view naujan", "green landscape naujan",
            "natural scenery naujan", "what nature does naujan have",
            "nature places naujan", "natural sights naujan",
            "outdor naujan", "rivers near lake naujan",
        ],
        "responses": [
            "Natural attractions in Naujan:\n"
            "• Naujan Lake — the centerpiece: 20,000+ hectare freshwater lake, perfect for boating and birdwatching\n"
            "• Sadya River — a river ecosystem feeding into the lake, ideal for a peaceful nature walk\n"
            "• Rice paddies and coconut plantations — scenic countryside views year-round\n"
            "• Coastal areas — Naujan has a stretch of coastline on the northeastern side of Mindoro\n"
            "• Mangrove areas — found along the lake shores, important fish nursery zones\n"
            "• Rolling hills and lowlands — great for scenic photography and farm visits",

            "While Naujan is not known for waterfalls, it offers rich freshwater and wetland nature experiences. "
            "Sadya River is a peaceful stream near the lake area often visited by locals for fishing and relaxation. "
            "The vast rice fields (best viewed June–October when green, or harvest time November–December) "
            "provide stunning rural Philippine scenery."
        ]
    },

    # ── Hiking / Eco Trails ──────────────────────────────────────────────────
    "Hiking_Trekking": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "hiking in naujan", "trekking in naujan", "trek naujan",
            "nature walk naujan", "eco walk naujan", "trail naujan",
            "nature trail naujan", "bird watching trail naujan",
            "walking trail naujan lake", "guided walk naujan lake",
            "eco trail naujan", "forest trek naujan",
            "outdoor adventure naujan", "adventure in naujan",
            "nature adventure naujan", "explore nature naujan",
            "hiking trail around naujan lake", "trail around the lake",
            "walkway naujan lake", "path naujan lake",
            "camping in naujan", "camping near naujan lake",
            "overnight camping naujan", "camp naujan lake",
            "around the lake hike", "lake trail",
            "birdwatching hike naujan", "bird trail naujan",
            "guided nature tour naujan", "nature tour naujan",
            "wildlife watch naujan lake", "wildlife trail naujan",
            "wildlife observation naujan", "mangrove walk naujan",
            "mangrove trail naujan", "farm visit naujan",
            "agri tour naujan", "agricultural tour naujan",
            "rice farm tour", "coconut farm visit naujan",
            "landscape tour naujan", "countryside walk naujan",
            "what outdoor activities naujan", "outdoor activities naujan",
            "trekign naujan", "triking naujan", "hiknig naujan",
            "hike near the lake", "walk near naujan lake",
        ],
        "responses": [
            "Outdoor activities around Naujan:\n"
            "• Birdwatching walks along the shores of Naujan Lake (best Nov–March during migration season)\n"
            "• Mangrove trail walks along the lake edges — great for photography and wildlife spotting\n"
            "• Guided eco-tours of the lake watershed managed by park rangers and the Naujan LGU\n"
            "• Countryside walks through rice paddies and coconut farms (arrange with local guides)\n"
            "• Camping near the lake shore (coordinate with the Naujan Lake National Park rangers)\n"
            "Contact the Naujan LGU at (043) 208-3382 to arrange guided nature tours.",

            "Eco-trail tip: The Naujan Lake National Park surroundings have unguided and guided walking paths. "
            "For safety and the best experience, hire a local ranger-guide — they know bird locations, "
            "safe water routes, and can take you to the best observation spots. "
            "Bring binoculars, a hat, and insect repellent. Best time: early morning (5–8 AM) for birdwatching."
        ]
    },

    # ── Mangyan Culture ──────────────────────────────────────────────────────
    "Mangyan_Culture": {
        "tag": "Mangyan_Culture",
        "patterns": [
            "mangyan in naujan", "mangyan naujan", "mangyan culture naujan",
            "indigenous people naujan", "tribal community naujan",
            "mangyan tribe naujan", "mangyan village naujan",
            "visit mangyan community naujan", "mangyan settlement naujan",
            "indigenous community naujan", "native tribe in naujan",
            "ethnic group naujan", "mangyan heritage naujan",
            "who are the mangyan in naujan", "what tribe lives in naujan",
            "local tribe naujan", "indigenous culture naujan",
            "mangyan crafts naujan", "mangyan basket naujan",
            "buy mangyan crafts naujan", "mangyan art naujan",
            "mangyan weaving naujan", "mangyan jewelry naujan",
            "hanunuo mangyan", "mangyan script mindoro",
            "pre colonial writing mindoro", "traditional culture naujan",
            "mangyan way of life", "indigenous way of life naujan",
            "mangyan traditional food", "mangyan music naujan",
            "ambahan poetry", "mangyan poetry",
            "how to visit mangyan community", "guided tour mangyan",
            "respect mangyan culture", "cultural sensitivity mangyan",
            "manygan naujan", "mangyan tibe naujan", "mangyan peple naujan",
            "local culture naujan", "culture in naujan",
            "indigenous peple naujan", "tribes in naujan",
        ],
        "responses": [
            "Mangyan communities in Naujan: Several Mangyan indigenous groups (mainly Iraya and Alangan tribes) "
            "live in the upland and forested barangays of Naujan. They are known for handwoven rattan and abaca baskets, "
            "traditional jewelry, and the ambahan — a form of pre-colonial poetry still practiced today. "
            "Some communities engage in sustainable farming of root crops and wild herbs.",

            "To visit Mangyan communities in Naujan responsibly:\n"
            "• Always arrange visits through the Naujan LGU or a certified community guide\n"
            "• Do NOT enter communities unannounced or without permission\n"
            "• Purchasing Mangyan crafts directly supports their livelihood\n"
            "• Avoid photography without asking permission first\n"
            "• The Hanunuo Mangyan script (a pre-colonial writing system) is still taught within communities — "
            "it is a UNESCO-recognized intangible cultural heritage of the Philippines.",

            "Mangyan handicrafts available in Naujan area: woven baskets (rattan and abaca), "
            "decorative bags, traditional jewelry, and abaca cloth. "
            "Look for certified fair-trade sellers to ensure artisans receive fair compensation."
        ]
    },

    # ── Best Time to Visit ───────────────────────────────────────────────────
    "Best_Time_To_Visit": {
        "tag": "Best_Time_To_Visit",
        "patterns": [
            "best time to visit naujan", "when to visit naujan",
            "when to go to naujan", "best month to go to naujan",
            "best season for naujan", "ideal time naujan",
            "right time to visit naujan", "good time to visit naujan",
            "when is rainy season in naujan", "dry season naujan",
            "typhoon season naujan", "rainy months naujan",
            "dry months naujan", "weather season naujan",
            "summer naujan", "when is summer in naujan",
            "peak season naujan", "off season naujan",
            "avoid typhoon naujan", "safe to visit naujan",
            "best time to see birds naujan", "birdwatching season naujan",
            "when are migratory birds in naujan",
            "bird migration naujan lake", "best time birdwatching",
            "november visit naujan", "december visit naujan",
            "march visit naujan", "april visit naujan",
            "climate naujan", "weather in naujan", "temperature naujan",
            "amihan naujan", "habagat naujan", "typhoon naujan",
            "when does it rain in naujan", "rainy naujan",
            "best tym 2 go naujan", "when 2 visit naujan",
            "bset time naujan", "good weather naujan",
            "best time to see the lake", "when is lake at best",
        ],
        "responses": [
            "Best time to visit Naujan:\n"
            "• November–May (dry season) — ideal weather for exploring the lake, farms, and heritage sites\n"
            "• November–March — BEST for birdwatching at Naujan Lake: migratory birds from Siberia and East Asia arrive\n"
            "• December–February — coolest and most comfortable months for outdoor activities\n"
            "• June–October — rainy/typhoon season; the rice fields are lush and green, but travel may be disrupted\n"
            "Tip: Visit early morning (5–8 AM) year-round for the best birdwatching experience at the lake.",

            "Naujan travel seasons:\n"
            "• Amihan (northeast monsoon, Nov–Feb): dry, cool, calm — best for Lake visits and eco-tours\n"
            "• Habagat (southwest monsoon, June–Oct): rainy season — rice paddies are vivid green but typhoons are possible\n"
            "• Peak bird migration: November to March — Philippine Ducks, Spotted Whistling Ducks, and Siberian migratory birds\n"
            "• Town Fiesta: September 8 — a great time to experience local culture even during the wet season"
        ]
    },

    # ── Budget Travel ────────────────────────────────────────────────────────
    "Budget_Travel": {
        "tag": "Budget_Travel",
        "patterns": [
            "how much to travel to naujan", "budget for naujan",
            "cost of trip to naujan", "cheap trip naujan",
            "affordable naujan", "how expensive is naujan",
            "travel budget naujan", "daily expenses naujan",
            "how much does it cost to visit naujan",
            "estimated budget naujan", "budget breakdown naujan",
            "3 day budget naujan", "weekend budget naujan",
            "budget traveler naujan", "backpacker budget naujan",
            "how much to spend in naujan", "total cost naujan trip",
            "transport cost naujan", "ferry fare to naujan",
            "how much is the ferry to calapan", "ferry fee batangas calapan",
            "van fare naujan", "tricycle cost naujan",
            "food cost naujan", "meals price naujan", "cheap food naujan",
            "accommodation price naujan", "hotel rate naujan",
            "how much hotel naujan", "guesthouse rate naujan",
            "inn price naujan", "cheap stay naujan",
            "entrance fee naujan lake", "tour cost naujan lake",
            "boat tour price naujan", "boat rental naujan",
            "guide fee naujan", "ranger fee naujan lake",
            "average daily budget naujan", "how much money for naujan",
            "magkano ang biyahe sa naujan", "magkano sa naujan",
            "budget trevl naujan", "cheap trip to naujan",
            "how much $ for naujan", "how much pesos naujan",
        ],
        "responses": [
            "Budget guide for a Naujan trip:\n"
            "• Ferry (Batangas → Calapan): ₱150–₱350 (RORO or fastcraft)\n"
            "• Bus (Manila → Batangas Pier): ₱150–₱200\n"
            "• Van/Jeepney (Calapan → Naujan): ₱40–₱80\n"
            "• Tricycle within Naujan: ₱10–₱30 per ride\n"
            "• Meals at carinderia: ₱80–₱150 per meal\n"
            "• Budget accommodation (inn/guesthouse): ₱400–₱1,000/night\n"
            "• Boat tour at Naujan Lake: ₱200–₱500 (small group, negotiable)\n"
            "• Guide fee at Naujan Lake: ₱150–₱300\n"
            "Estimated daily budget: ₱600–₱1,200 for a budget traveler.",

            "Naujan is one of the most affordable destinations in Oriental Mindoro. "
            "A 3-day trip (including ferry from Manila, accommodation, food, and lake tour) "
            "can be done for approximately ₱2,500–₱4,500 per person on a budget. "
            "Accommodation options are basic but clean. Street food and carinderia meals are very affordable."
        ]
    },

    # ── Accommodation ────────────────────────────────────────────────────────
    "Accommodation_Types": {
        "tag": "Accommodation_Types",
        "patterns": [
            "where to stay in naujan", "hotel in naujan",
            "accommodation in naujan", "lodging naujan",
            "guesthouse naujan", "inn naujan", "pension house naujan",
            "place to sleep naujan", "overnight naujan",
            "room for rent naujan", "transient house naujan",
            "resort in naujan", "resort near naujan lake",
            "hotel near naujan lake", "lodge near lake",
            "eco lodge naujan", "cheap hotel naujan",
            "affordable accommodation naujan", "budget stay naujan",
            "best place to stay in naujan", "recommended hotel naujan",
            "where to book accommodation naujan", "book hotel naujan",
            "lakbay hotel naujan", "naujan hotel booking",
            "airbnb naujan", "vacation rental naujan",
            "pay per night naujan", "bed and breakfast naujan",
            "hostel near naujan", "camping naujan lake",
            "where can i sleep naujan", "sleep in naujan",
            "hotels near the lake", "accommodation near naujan lake",
            "nearby accommodation naujan", "places to stay naujan",
            "saan matutulog sa naujan", "accomodation naujan",
            "acommodation near naujan", "hotel nir naujan lake",
            "lodging near naujan", "stay in naujan",
        ],
        "responses": [
            "Accommodation options in Naujan:\n"
            "• Small inns and guesthouses in the town proper (poblacion) — ₱400–₱1,000/night\n"
            "• Pension houses near the town center — budget-friendly, basic amenities\n"
            "• Some eco-lodges and community homestays near Naujan Lake (arrange through the LGU)\n"
            "• For more hotel choices, Calapan City (30–45 min away) has more options including 3-star hotels\n"
            "Use the LAKBAY Hotels section to browse and book available accommodations in and around Naujan.",

            "Staying in Naujan: Accommodation is simple but comfortable. "
            "Most guesthouses are in the poblacion area, close to the market and transport. "
            "If you want to be closer to the lake, ask the Naujan LGU (043) 208-3382 about homestay or "
            "eco-lodge arrangements with local families near the Naujan Lake National Park."
        ]
    },

    # ── Shopping & Souvenirs ─────────────────────────────────────────────────
    "Shopping_Souvenirs": {
        "tag": "Shopping_Souvenirs",
        "patterns": [
            "souvenirs in naujan", "what to buy in naujan",
            "pasalubong naujan", "local products naujan",
            "handicrafts naujan", "things to buy in naujan",
            "shopping naujan", "where to shop in naujan",
            "buy local products naujan", "local market naujan",
            "palengke naujan", "naujan public market",
            "market in naujan", "tiangge naujan",
            "mangyan crafts naujan buy", "where to buy mangyan baskets",
            "abaca products naujan", "rattan products naujan",
            "woven basket naujan", "handmade products naujan",
            "organic products naujan", "coconut products naujan",
            "local honey naujan", "honey from naujan",
            "kakanin naujan buy", "native sweets naujan",
            "rice products naujan", "dried fish naujan",
            "fresh fish market naujan", "fish from the lake",
            "buy dried fish naujan", "seafood market naujan",
            "take home from naujan", "bring home from naujan",
            "gifts from naujan", "souvenir shop naujan",
            "saan bibilhin ang pasalubong sa naujan",
            "pasalubong sa naujan", "shoping naujan",
            "what can i buy naujan", "souvenirs to get",
            "ano ang pasalubong sa naujan",
        ],
        "responses": [
            "Best pasalubong and local products from Naujan:\n"
            "• Mangyan woven baskets and bags (rattan/abaca) — buy from certified community sellers\n"
            "• Fresh and dried fish from Naujan Lake (maliputo, tilapia, dalag)\n"
            "• Organic rice and rice products (locally grown, fresh)\n"
            "• Coconut-based products: virgin coconut oil, copra candy, coconut vinegar (suka ng niyog)\n"
            "• Local honey from upland beekeepers\n"
            "• Native kakanin (puto, suman, kutsinta) from the town market\n"
            "Find these at the Naujan Public Market, especially on market days.",

            "Shopping in Naujan: The Naujan Public Market is the best place for fresh produce, "
            "local fish, native sweets, and handicrafts. Market days are livelier in the early morning. "
            "For Mangyan crafts, ask the LGU to connect you with community-certified sellers to ensure "
            "the artisans are fairly compensated."
        ]
    },

    # ── History & Heritage ───────────────────────────────────────────────────
    "History_Heritage": {
        "tag": "History_Heritage",
        "patterns": [
            "history of naujan", "naujan history", "historical facts naujan",
            "heritage naujan", "historical sites naujan",
            "old church naujan", "naujan church", "saint mary naujan",
            "church in naujan", "how old is naujan church",
            "naujan heritage buildings", "historical landmark naujan",
            "heritage site naujan", "old buildings naujan",
            "colonial history naujan", "spanish era naujan",
            "when was naujan founded", "founding of naujan",
            "origin of naujan", "how did naujan start",
            "naujan in history", "early history naujan",
            "world war 2 naujan", "japanese era naujan",
            "battle of mindoro naujan", "mindoro ww2",
            "american era naujan", "pre colonial naujan",
            "ancient naujan", "mangyan history naujan",
            "indigenous history naujan", "cultural heritage naujan",
            "historical museum naujan", "artifacts naujan",
            "town plaza naujan", "naujan plaza history",
            "history ng naujan", "kasaysayan ng naujan",
            "histori naujan", "historiy of naujan",
            "heritag naujan", "historical nawan",
            "old naujan", "heritage walk naujan",
        ],
        "responses": [
            "History of Naujan:\n"
            "Naujan is one of the oldest settlements in Oriental Mindoro. The municipality was established "
            "during the Spanish colonial period. The Our Lady of the Nativity Parish Church (Naujan Church) "
            "is a historic landmark that has served as the spiritual center of the community for centuries. "
            "During World War II, the Battle of Mindoro took place nearby as American forces liberated the island "
            "from Japanese occupation in December 1944–January 1945.",

            "Heritage sites in Naujan:\n"
            "• Naujan Church (Our Lady of the Nativity Parish) — built during the Spanish colonial era, "
            "a cornerstone of the town's identity and still an active parish\n"
            "• Naujan Town Plaza — the historic center of the municipality\n"
            "• Naujan Lake National Park — declared a national park and RAMSAR wetland site, "
            "protecting the lake's ecological and cultural significance\n"
            "• Mangyan cultural communities in the upland barangays — living heritage of pre-colonial culture",

            "Naujan Lake has been central to the community's livelihood for generations — "
            "local fishermen have depended on it for centuries. The lake was declared a RAMSAR Wetland "
            "of International Importance in 1999, recognizing its global ecological significance. "
            "The Mangyan people have inhabited the Mindoro interior (including Naujan's uplands) "
            "for over 2,000 years before Spanish colonization."
        ]
    },

    # ── Safety & Emergency ───────────────────────────────────────────────────
    "Safety_Emergency": {
        "tag": "Safety_Emergency",
        "patterns": [
            "emergency number naujan", "emergency hotline naujan",
            "police number naujan", "police contact naujan",
            "who to call emergency naujan", "ambulance naujan",
            "hospital naujan", "clinic naujan", "medical naujan",
            "fire station naujan", "bureau of fire naujan",
            "coast guard naujan", "rescue naujan",
            "help emergency naujan", "what number to call naujan",
            "911 naujan", "safety tip naujan", "safe in naujan",
            "is naujan safe", "travel safety naujan",
            "safe travel to naujan", "is it safe to visit naujan",
            "crime nautjan", "theft naujan", "danger naujan",
            "what to do in emergency in naujan", "emergencies naujan",
            "accident in naujan", "contact police naujan",
            "lgu emergency naujan", "mayor office contact",
            "naujan police station", "police station naujan",
            "medical emergency naujan", "first aid naujan",
            "lake safety naujan lake", "boat safety naujan",
            "water safety naujan lake", "swimming safety lake",
            "typhoon safety naujan", "flood naujan",
            "emer gency naujan", "emrgency number naujan",
            "safty tips naujan", "emergency contact naujan",
            "who to contact emergency in naujan",
        ],
        "responses": [
            "Emergency contacts in Naujan:\n"
            "• Naujan Police Station: (043) 208-3362\n"
            "• Naujan Mayor's Office / LGU: (043) 208-3382 / (043) 208-3479\n"
            "• National Emergency Hotline: 911\n"
            "• Bureau of Fire Protection (Naujan): contact through LGU if local number unavailable\n"
            "• Nearest major hospital: Oriental Mindoro Provincial Hospital in Calapan — (043) 288-2532\n"
            "• Philippine National Red Cross: 143",

            "Travel safety in Naujan:\n"
            "• Naujan is generally a safe, peaceful community for tourists\n"
            "• Always inform your accommodation or a local contact of your plans when visiting the lake\n"
            "• When boating on Naujan Lake, always wear a life jacket — the lake can develop sudden wind\n"
            "• Avoid swimming in the lake unsupervised or at night\n"
            "• During typhoon season (June–October), check weather forecasts before traveling\n"
            "• Keep photocopies of your ID and emergency contacts accessible"
        ]
    },

    # ── Eco Tourism ──────────────────────────────────────────────────────────
    "Eco_Tourism": {
        "tag": "Eco_Tourism",
        "patterns": [
            "eco tourism in naujan", "eco tour naujan",
            "sustainable tourism naujan", "responsible travel naujan",
            "nature based tourism naujan", "green tourism naujan",
            "environmental tourism naujan", "eco friendly naujan",
            "conservation tourism naujan", "community based tourism naujan",
            "nature park naujan", "nature tour naujan",
            "guided nature tour naujan", "wildlife tour naujan",
            "eco trip naujan", "lake eco tour",
            "birdwatching tour naujan lake", "bird tour naujan",
            "bird watching naujan lake", "bird watching tour naujan",
            "birdwatch naujan", "bird trip naujan",
            "boat eco tour naujan lake", "kayak naujan lake",
            "kayaking naujan lake", "canoeing naujan lake",
            "boat tour naujan lake", "lake tour naujan",
            "lake cruise naujan", "fishing tour naujan lake",
            "community tour naujan", "farm eco tour naujan",
            "mangrove tour naujan", "mangrove walk naujan lake",
            "conservation naujan", "protect environment naujan",
            "wildlif tour naujan", "eco turism naujan",
            "sustainabl travel naujan", "nature lover naujan",
            "zero waste travel naujan", "green travel naujan",
            "leave no trace naujan", "local guide eco tour naujan",
            "park ranger naujan lake", "national park tour naujan",
        ],
        "responses": [
            "Eco-tourism in Naujan centers on Naujan Lake National Park:\n"
            "• Birdwatching tours — spot Philippine Ducks, Spotted Whistling Ducks, herons, egrets, "
            "and Siberian migratory birds (best November–March)\n"
            "• Boat tours on Naujan Lake — explore the lake's 20,000+ hectares with a local boatman\n"
            "• Kayaking and canoeing — rent from local operators near the lake\n"
            "• Mangrove walk tours along the lake's shorelands\n"
            "• Farm-to-table agri-tourism visits to rice and coconut farms\n"
            "• Mangyan cultural community visits (arranged through the LGU)\n"
            "Contact the Naujan LGU at (043) 208-3382 to arrange eco-tours.",

            "Responsible eco-tourism guidelines for Naujan Lake:\n"
            "• Always hire a licensed local guide / park ranger\n"
            "• Do not litter — pack out all waste\n"
            "• Do not disturb nesting birds or wildlife\n"
            "• Do not fish in restricted sanctuary zones\n"
            "• Take only photos, leave only footprints\n"
            "• Entrance and boat fees support conservation and local livelihoods\n"
            "Naujan Lake is a RAMSAR Wetland of International Importance — please help protect it."
        ]
    },
}

# ---------------------------------------------------------------------------
# NEW intents to ADD (Naujan-specific topics not previously covered)
# ---------------------------------------------------------------------------
NEW_INTENTS = [
    {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "activities at naujan lake", "what to do at naujan lake",
            "things to do at the lake", "lake activities naujan",
            "boating naujan lake", "boat ride naujan lake",
            "boat rental naujan lake", "rent a boat naujan",
            "kayak naujan lake", "kayaking at naujan lake",
            "canoeing naujan lake", "canoe at the lake",
            "fishing naujan lake", "fish in naujan lake",
            "fishing trip naujan", "catch fish naujan lake",
            "swimming naujan lake", "swim in naujan lake",
            "can i swim in naujan lake", "is it safe to swim in lake",
            "frogs in naujan lake", "crocodile in lake",
            "wildlife at the lake", "animals at naujan lake",
            "birds at naujan lake", "bird watching lake naujan",
            "picnic naujan lake", "picnic at the lake",
            "relax at naujan lake", "day trip naujan lake",
            "half day naujan lake", "tour the lake naujan",
            "visit the lake", "see the lake naujan",
            "explore the lake", "lakeside activities naujan",
            "lake trip naujan", "how to enjoy naujan lake",
            "what activities at the lake", "recreation naujan lake",
            "water activities naujan lake", "lake experience naujan",
            "cruising naujan lake", "photo tour lake naujan",
            "sunset at naujan lake", "sunrise naujan lake",
            "sunset view lake", "best view of the lake",
            "observation deck naujan lake", "viewpoint lake naujan",
            "boat tour lake", "lake tour guide",
            "guided lake tour", "lake day trip",
            "what to see at the lake", "sightseeing naujan lake",
            "activities sa naujan lake", "magawa naujan lake",
            "byahe sa naujan lake", "pumunta sa lawa",
            "birdwatching naujan lake activities",
            "activities in the lake area", "near the lake activities",
        ],
        "responses": [
            "Activities at Naujan Lake:\n"
            "• Birdwatching — the main attraction; over 100 bird species including the endangered Philippine Duck\n"
            "• Boat tours — hire a local boatman to cruise the lake and explore bird habitats (₱200–₱500)\n"
            "• Kayaking and canoeing — paddle through calm lake waters, available through local operators\n"
            "• Fishing — both recreational and guided fishing tours are available (best early morning)\n"
            "• Photography — stunning views at sunrise  and during migration season (Nov–March)\n"
            "• Picnicking at designated lakeside spots\n"
            "• Mangrove exploration tours along the lake's fringe forests\n"
            "Contact the Naujan LGU (043) 208-3382 for boat and guide arrangements.",

            "Naujan Lake do's and don'ts:\n"
            "✅ Hire a licensed local guide / park ranger\n"
            "✅ Wear a life jacket on all boat trips\n"
            "✅ Visit early morning (5–8 AM) for the best birdwatching\n"
            "✅ Bring binoculars, camera, hat, and insect repellent\n"
            "❌ Don't swim without supervision — the lake has freshwater crocodiles\n"
            "❌ Don't fish in restricted sanctuary zones\n"
            "❌ Don't litter — the lake is a protected RAMSAR wetland\n"
            "Boat tour price: approx. ₱200–₱500 per group (negotiable with local boatmen)."
        ]
    },
    {
        "tag": "Naujan_Barangays",
        "patterns": [
            "barangays in naujan", "list of barangays naujan",
            "all barangays of naujan", "how many barangays in naujan",
            "barangay naujan", "villages in naujan",
            "poblacion naujan", "downtown naujan",
            "far barangays naujan", "baryo sa naujan",
            "mga barangay sa naujan", "neighborhoods naujan",
            "districts of naujan", "what are the barangays",
            "barangay list naujan oriental mindoro",
            "communities in naujan", "how many villages naujan",
            "where are the barangays", "barangay names naujan",
            "brgy naujan", "brangay naujan",
        ],
        "responses": [
            "Naujan has 39 barangays including: Adrialuna, Agos, Alag, Antipolo, Apitong, Araw-araw, "
            "Bagong Buhay, Bancuro, Barcenaga, Bayani, Buhangin, Caburo, Calangatan, Calsapa, "
            "Ilayang Ilog, Lalud, Latag, Libis ng Navotas, Ligaya, Llorente, Macatoc, Madalunot, "
            "Magdalena, Malaya, Malinao, Malvar, Manaul, Mapaya, Masagana, Masaguing, "
            "Melgar A, Melgar B, Metolza, Montelago, Nag-iba I, Nag-iba II, Pagkalinawan, "
            "Palayan, Pambisan Malaki, Pambisan Munti, Pangalawang Buhangin, Papandayan, "
            "Pili, Poblacion I, Poblacion II, Poblacion III, Pula, Putican-Cabulo, "
            "San Agustin I, San Agustin II, Santa Cruz, Santo Tomas, Wawa, and more. "
            "The Poblacion barangays form the town center.",

            "Naujan's 39 barangays spread across lowland rice farming areas, coastal zones, and upland forests. "
            "The Poblacion (town center) is where the church, plaza, market, and LGU are located. "
            "Montelago and other upland barangays are where Mangyan communities are found. "
            "Lakeside barangays border Naujan Lake National Park."
        ]
    },
    {
        "tag": "Naujan_Agriculture",
        "patterns": [
            "farming in naujan", "agriculture naujan",
            "crops in naujan", "rice farming naujan",
            "coconut farming naujan", "what do they farm in naujan",
            "main crops naujan", "agricultural products naujan",
            "rice fields naujan", "rice paddies naujan",
            "coconut plantation naujan", "copra naujan",
            "farm visit naujan", "agri tour naujan",
            "agricultural tourism naujan", "rice production naujan",
            "corn farming naujan", "vegetable farm naujan",
            "mango farm naujan", "banana farm naujan",
            "fish farming naujan", "aquaculture naujan",
            "fishing industry naujan", "livelihood naujan",
            "primary industry naujan", "economy of naujan",
            "livelihood of naujan", "how do people earn in naujan",
            "what is the main industry of naujan",
            "farmers in naujan", "fishing naujan",
            "palayan naujan", "palawit naujan",
            "agrikultura sa naujan", "pagsasaka sa naujan",
            "crops grown naujan", "what crops naujan",
        ],
        "responses": [
            "Naujan's agriculture:\n"
            "• Rice — Naujan is one of Oriental Mindoro's major rice-producing municipalities. "
            "Wide rice paddies line the roads, especially beautiful when green (June–October) or during harvest (Nov–Dec)\n"
            "• Coconut/Copra — copra (dried coconut kernel) is a significant export product\n"
            "• Corn, root crops, vegetables, mango, and banana are also grown\n"
            "• Freshwater fishing in Naujan Lake — tilapia, maliputo, mudfish (dalag), and frogs\n"
            "Agriculture is the backbone of Naujan's economy and a great agri-tourism draw.",

            "Agri-tourism in Naujan: Visit local rice farms during planting season (June–July) "
            "or harvest season (November–December) for an authentic Filipino farming experience. "
            "Coconut farms offer coconut climbing demonstrations and fresh buko (young coconut) tastings. "
            "Contact the Naujan LGU (043) 208-3382 to arrange farm visits."
        ]
    },
]


def rebuild_intents():
    with open(INTENTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    original_tags = [i["tag"] for i in data["intents"]]
    print(f"Original intents: {len(original_tags)}")

    new_intents = []
    removed = []
    replaced = []

    for intent in data["intents"]:
        tag = intent["tag"]

        # Remove intents not relevant to Naujan
        if tag in INTENTS_TO_REMOVE:
            removed.append(tag)
            continue

        # Replace intents with Naujan-specific content
        if tag in INTENTS_TO_REPLACE:
            new_intents.append(INTENTS_TO_REPLACE[tag])
            replaced.append(tag)
            continue

        # Keep all Naujan-specific intents as-is
        new_intents.append(intent)

    # Add completely new Naujan intents
    added_tags = []
    existing_tags = {i["tag"] for i in new_intents}
    for ni in NEW_INTENTS:
        if ni["tag"] not in existing_tags:
            new_intents.append(ni)
            added_tags.append(ni["tag"])

    data["intents"] = new_intents

    with open(INTENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nRemoved ({len(removed)}): {', '.join(removed)}")
    print(f"\nReplaced/rewritten ({len(replaced)}): {', '.join(replaced)}")
    print(f"\nAdded new ({len(added_tags)}): {', '.join(added_tags)}")

    final_tags = [i["tag"] for i in new_intents]
    print(f"\nFinal intents ({len(final_tags)}):")
    for t in final_tags:
        cnt = next(len(i["patterns"]) for i in new_intents if i["tag"] == t)
        print(f"  {t}: {cnt} patterns")


if __name__ == "__main__":
    rebuild_intents()
