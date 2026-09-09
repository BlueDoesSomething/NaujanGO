"""
Rebuild all non-English language intent files to focus on Naujan, Oriental Mindoro.
Removes non-Naujan intents and rewrites generic intents with Naujan-specific content.
"""
import json, os, shutil

INTENTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'intents')

# ═══════════════════════════════════════════════════════════════════════════════
# TAGALOG (tl)
# ═══════════════════════════════════════════════════════════════════════════════
TL_INTENTS = {
    "Oriental_Mindoro_Overview": {
        "tag": "Naujan_Overview",
        "patterns": [
            "tungkol sa naujan", "ano ang naujan", "ipakilala ang naujan",
            "overview ng naujan", "impormasyon tungkol sa naujan",
            "sabihin mo sa akin ang tungkol sa naujan",
            "ano ang espesyal sa naujan", "bakit bisitahin ang naujan",
            "naujan turismo", "naujan highlights", "naujan facts",
            "naujan municipality", "naujan oriental mindoro",
        ],
        "responses": [
            "Ang Naujan ay isang 1st Class Municipality sa Oriental Mindoro, Pilipinas. "
            "Kilala ito sa Naujan Lake — ang ika-5 pinakamalaking lawa sa Pilipinas at "
            "Ramsar Wetland ng pandaigdigang kahalagahan. Ang bayan ay mayaman sa agrikultura "
            "(bigas, niyog), kultura ng Mangyan, at ekolohiya ng lawa. Lugar ito para sa "
            "bird-watching, pangingisda, at eco-tourism.",
            "Ang Naujan, Oriental Mindoro ay tahanan ng Naujan Lake National Park, isa sa "
            "mga pinaka-biodiversity-rich na lugar sa Pilipinas. May 39 barangay ang bayan "
            "na may mahalagang koneksyon ng agrikultura at ekolohiya.",
        ]
    },
    "All_Municipalities_TL": None,  # REMOVE
    "Puerto_Galera_TL": None,       # REMOVE
    "Transportation_TL": {
        "tag": "Transportation_How_To_Get_There",
        "patterns": [
            "paano pumunta sa naujan", "paano makarating sa naujan",
            "ferry papunta sa naujan", "ruta papunta sa naujan",
            "mula manila papunta naujan", "mula calapan papunta naujan",
            "sakay papunta naujan", "bus papunta naujan",
            "van papunta naujan", "paano pumunta oriental mindoro",
            "tagal ng byahe sa naujan", "roro ferry naujan",
            "batangas pier naujan", "starlite ferry naujan",
            "sasakyan papunta naujan", "paano makakarating",
        ],
        "responses": [
            "Paano pumunta sa Naujan:\n"
            "1. Mula Manila: sakay ng bus sa Buendia o EDSA terminal papunta sa Batangas Pier (~2 oras).\n"
            "2. Sakay ng RORO o FastCraft ferry papunta sa Calapan Port (~1.5–2 oras).\n"
            "3. Mula Calapan: sakay ng jeepney o van papunta sa Naujan (~30–45 minuto, ~₱40–₱60).\n"
            "Rekomendasyon: Maaga pumunta sa pier para maiwasan ang mahabang pila.",
        ]
    },
    "Local_Food_TL": {
        "tag": "Local_Food_Cuisine",
        "patterns": [
            "lokal na pagkain sa naujan", "ano ang kakainin sa naujan",
            "pagkain ng naujan", "tilapia sa lawa", "seafood sa naujan",
            "restaurant sa naujan", "carinderia sa naujan",
            "masarap na pagkain naujan", "lutong naujan",
            "maliputo na isda", "espesyalidad na pagkain",
            "ano ang matikim sa naujan", "native food naujan",
        ],
        "responses": [
            "Dapat tikman sa Naujan:\n"
            "• Sariwang tilapia at maliputo mula sa Naujan Lake\n"
            "• Inihaw na isda at ulam na gawa sa sariwang catch mula sa lawa\n"
            "• Tinola at sinigang na manok o isda sa mga lokal na carinderia\n"
            "• Kakanin (puto, bibingka, sapin-sapin) sa mga lokal na palengke\n"
            "• Niyog-based na pagkain at lutuin mula sa sariwang niyog ng Naujan\n"
            "Pinakamainam na kumain sa mga carinderia malapit sa pamilihan ng Naujan para maranasan ang tunay na lasa.",
        ]
    },
    "Festivals_TL": {
        "tag": "Festivals_Events",
        "patterns": [
            "pista sa naujan", "fiesta ng naujan", "selebrasyon sa naujan",
            "opisyal na pista sa naujan", "buwan ng kahusayan naujan",
            "Setyembre 8 naujan", "patron ng naujan", "mga okasyon sa naujan",
            "cultural event sa naujan", "kaarawan ng bayan",
            "Nuestra Senora ng naujan", "anibersaryo ng naujan",
        ],
        "responses": [
            "Pangunahing mga okasyon sa Naujan:\n"
            "• Setyembre 8 — Town Fiesta (Pagsilang ng Mahal na Birhen / Our Lady of the Nativity)\n"
            "• Nobyembre–Marso — Panahon ng bird migration sa Naujan Lake\n"
            "• Buwanang mga Barangay Fiesta — iba't ibang petsa bawat barangay\n"
            "• Pampook na mga pagdiriwang kasama ang pagkain at cultural shows\n"
            "Pinakamahalagang pagdiriwang sa bayan: Setyembre 8 Fiesta, na nagtatampok ng "
            "prusisyon, pagkain, at mga lokal na aktibidad.",
        ]
    },
    "Mangyan_TL": {
        "tag": "Mangyan_Culture",
        "patterns": [
            "mga mangyan sa naujan", "kultura ng mangyan", "katutubo ng mindoro",
            "hanunuo mangyan", "ambahan na tula", "abaca weaving mangyan",
            "kultura ng katutubong tao", "komunidad ng mangyan",
            "pagbisita sa mangyan", "sining mangyan", "tribu ng mindoro",
            "indigenous people ng mindoro",
        ],
        "responses": [
            "Ang mga Mangyan ay ang mga katutubo ng Mindoro. May walong tribu: Hanunuo, "
            "Buhid, Iraya, Alangan, Tadyawan, Tau-buid, Bangon, at Ratagnon. Sila ay "
            "kilala sa kanilang:\n"
            "• Script ng Hanunuo-Mangyan — pre-kolonyal na sistema ng pagsulat na kinikilala ng UNESCO\n"
            "• Ambahan — tradisyonal na mga tula na ginupit sa kawayan\n"
            "• Paghahabi ng abaca at mga basket na rattan\n"
            "Sa pagbisita sa Mangyan na komunidad, laging maging magalang at kumuha ng "
            "tamang gabay. Huwag kumuha ng larawan nang walang pahintulot.",
        ]
    },
    "Best_Time_TL": {
        "tag": "Best_Time_To_Visit",
        "patterns": [
            "pinakamainam na panahon para bumisita sa naujan", "kailan pumunta sa naujan",
            "tag-ulan sa naujan", "tag-araw sa naujan",
            "season sa naujan", "panahon ng bagyo mindoro",
            "amihan sa naujan", "habagat sa naujan",
            "pinakamainam na buwan", "best month naujan",
            "kailan pinakamaganda ang lawa",
        ],
        "responses": [
            "Panahon ng paglalakbay sa Naujan:\n"
            "• Amihan (Nobyembre–Pebrero): malamig at tuyo, pinakamainam para sa bird-watching sa lawa\n"
            "• Tag-araw (Marso–Mayo): mainit, perpekto para sa pag-explore at picnicking\n"
            "• Habagat (Hunyo–Oktubre): maalon at maulap; maganda ang palayan ngunit posibleng bagyo\n"
            "Pinakamagandang bumisita: Nobyembre–Abril para sa malinaw na kalangitan at "
            "migration ng mga ibon.",
        ]
    },
    "App_Capabilities_TL": {
        "tag": "App_Capabilities",
        "patterns": [
            "ano ang magagawa mo", "kakayahan ng chatbot", "ano ang lakbay",
            "tungkol sa lakbay app", "saan ako makakatulong",
            "ano ang serbisyo ng lakbay", "gamit ng lakbay",
            "paano gamitin ang lakbay", "features ng app",
        ],
        "responses": [
            "Ako ang iyong LAKBAY travel assistant para sa Naujan, Oriental Mindoro! Makakatulong ako sa:\n"
            "• Impormasyon tungkol sa Naujan Lake at mga eco-attractions\n"
            "• Pag-book ng hotel at accommodation\n"
            "• Itinerary planning para sa iyong trip\n"
            "• GPS navigation at mapa ng Naujan\n"
            "• Impormasyon sa LGU, emergency contacts, at lokal na serbisyo\n"
            "• Panahon, transportasyon, pagkain, at kultura ng Naujan\n"
            "Tanungin mo ako tungkol sa Naujan!",
        ]
    },
    "Booking_Help_TL": {
        "tag": "Booking_Help",
        "patterns": [
            "paano mag-book ng hotel sa naujan", "mag-book sa lakbay",
            "pagreserba ng hotel naujan", "check-in check-out naujan",
            "paano mag-reserve ng accommodation", "pag-book ng kwarto",
            "available ba ang hotel sa naujan", "hotel booking process",
        ],
        "responses": [
            "Para mag-book ng hotel sa LAKBAY:\n"
            "1. Pumunta sa 'Hotels' section ng app.\n"
            "2. I-browse ang mga available na hotel sa Naujan.\n"
            "3. Piliin ang iyong check-in at check-out dates.\n"
            "4. Beripikahin ang detalye at i-confirm ang iyong booking.\n"
            "Kailangan ng account para makumpleto ang booking. Ang mga reserbasyong nakansela "
            "nang 24 oras bago ang check-in ay libre.",
        ]
    },
    "Waterfalls_TL": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "likas na lugar sa naujan", "ilog sa naujan", "sadya river naujan",
            "kalikasan ng naujan", "magandang tanawin sa naujan",
            "rice fields sa naujan", "palayan ng naujan",
            "mangrove sa naujan", "natural features ng naujan",
            "outdoor scenery naujan", "likas na kagandahan",
        ],
        "responses": [
            "Mga likas na tampok ng Naujan:\n"
            "• Naujan Lake — ika-5 pinakamalaking lawa sa Pilipinas; tahanan ng daan-daang uri ng ibon\n"
            "• Sadya River — magandang ilog para sa swimming at pag-enjoy ng kalikasan\n"
            "• Malawak na Palayan — kilala ang Naujan sa masaganang pagtatanim ng bigas\n"
            "• Kagubatan ng Niyog — mga taniman na nagbibigay ng copra at niyog\n"
            "• Coastal Mangroves — nagpoprotekta ng baybayin at nagbibigay ng tirahan sa mga isda",
        ]
    },
    "Diving_TL": None,   # REMOVE
    "Safety_TL": {
        "tag": "Safety_Emergency",
        "patterns": [
            "emergency contacts sa naujan", "ligtas ba ang naujan",
            "pulis sa naujan", "ospital sa naujan", "klinika sa naujan",
            "ambulansya naujan", "numero ng pulis naujan",
            "bureau of fire naujan", "bangkay ng coast guard naujan",
            "safety tips naujan", "first aid naujan",
        ],
        "responses": [
            "Emergency contacts sa Naujan:\n"
            "• Naujan PNP (Pulis): (043) 208-3362\n"
            "• Municipal Hall: (043) 208-3382\n"
            "• Naujan District Hospital: (043) 208-3380\n"
            "• Bureau of Fire Protection: (043) 208-3385\n"
            "• National Emergency Hotline: 911\n\n"
            "Ang Naujan ay isang mapayapang komunidad. Palaging sabihin sa iyong "
            "accommodation ang iyong itinerary kapag nagbibiyahe sa bundok o sa lawa.",
        ]
    },
}

# ═══════════════════════════════════════════════════════════════════════════════
# Additional new intents for TL (matching EN additions)
# ═══════════════════════════════════════════════════════════════════════════════
TL_NEW_INTENTS = [
    {
        "tag": "Naujan_Lake_Wildlife",
        "patterns": [
            "mga ibon sa naujan lake", "wildlife sa lawa", "bird watching sa naujan",
            "philippine duck sa lawa", "migratory birds naujan",
            "crocodile sa naujan", "hayop sa naujan lake",
            "biodiversity ng lawa", "rare birds naujan",
        ],
        "responses": [
            "Ang Naujan Lake ay tahanan ng mahigit 100 uri ng ibon, kabilang ang:\n"
            "• Philippine Duck (Anas luzonica) — endangered na endemic species\n"
            "• Migratory waterfowl mula Siberia at East Asia (Nobyembre–Marso)\n"
            "• Mga lawin, alon, at sarimanok na naninirahan sa paligid ng lawa\n"
            "• Freshwater crocodile (Crocodylus mindorensis) — critically endangered\n"
            "Ang pinakamainam na panahon para sa bird-watching ay Nobyembre hanggang Marso "
            "ng maaga sa umaga.",
        ]
    },
    {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "ano ang maaaring gawin sa naujan lake", "aktibidad sa lawa",
            "boat ride sa lawa", "kayak sa lawa", "pangingisda sa lawa",
            "pagbabangka sa naujan lake", "lake tour naujan",
            "paligid ng lawa", "picnic sa lawa", "maglaro sa lawa",
        ],
        "responses": [
            "Mga aktibidad sa Naujan Lake:\n"
            "• Bird-watching — ang pangunahing atraksyon; daan-daang uri ng ibon\n"
            "• Bangka tour — magsewa ng lokal na bangka para maglayag sa lawa\n"
            "• Pangingisda — ang mga lokal na mangingisda ay nagbibigay ng guided tours\n"
            "• Kayaking — mag-explore ng mga kuweba at mangrove edges ng lawa\n"
            "• Lakad sa kalikasan — mag-lakad sa mga eco-trail sa paligid ng National Park\n"
            "• Picnicking — mga itinakdang lugar sa pampang ng lawa\n"
            "Makipag-ugnayan sa Naujan LGU para sa impormasyon sa pahintulot at lokal na gabay.",
        ]
    },
    {
        "tag": "Naujan_Barangays",
        "patterns": [
            "mga barangay ng naujan", "ilang barangay ang naujan",
            "listahan ng barangay sa naujan", "poblacion ng naujan",
            "mga komunidad sa naujan", "baryo sa naujan",
        ],
        "responses": [
            "Ang Naujan ay may 39 barangay na nagkalat sa lowland farming areas, coastal zones, "
            "at upland forests. Ang Poblacion (town center) ang pinakamalaking barangay. "
            "Ilan sa mga kilalang barangay:\n"
            "• Poblacion — town center na may munisipal na tanggapan at pamilihan\n"
            "• Naujan Lake shore barangays — mga komunidad ng mangingisda\n"
            "• Upland barangays — malapit sa mga kagubatan at taniman ng Mangyan\n"
            "Para sa kumpletong listahan, makipag-ugnayan sa Naujan Municipal Hall: (043) 208-3382.",
        ]
    },
    {
        "tag": "Naujan_Agriculture",
        "patterns": [
            "pagsasaka sa naujan", "palayan ng naujan", "niyog sa naujan",
            "copra sa naujan", "ani sa naujan", "agrikultura sa mindoro",
            "mga magsasaka ng naujan", "eco-agri tour naujan",
            "fish farming sa lawa",
        ],
        "responses": [
            "Ang Naujan ay isa sa mga pangunahing lungsod ng agrikultura sa Oriental Mindoro:\n"
            "• Palay (bigas) — pangunahing pananim; kilala sa masaganang pag-aani\n"
            "• Niyog/Copra — pangalawang pangunahing produkto ng probinsya\n"
            "• Pangingisda sa lawa — tilapia, maliputo, at iba pang sariwang isda\n"
            "• Mais, saging, at gulay — suplementaryong mga pananim\n"
            "• Eco-agri tours — bisitahin ang mga lokal na farm at makita ang proseso ng pagtatanim ng bigas",
        ]
    },
    {
        "tag": "Eco_Tourism",
        "patterns": [
            "eco-tourism sa naujan", "responsible travel naujan",
            "sustainable na paglalakbay", "conservation sa lawa",
            "bird watching tour", "mangrove tour naujan",
            "wildlife tour sa lawa", "green travel naujan",
            "nature trip sa naujan", "ramsar wetland tour",
        ],
        "responses": [
            "Eco-tourism sa Naujan Lake:\n"
            "• Bird-watching guided tours (pinakamainam: Nobyembre–Marso)\n"
            "• Bangka eco-tours sa lawa at mga mangrove\n"
            "• Bisita sa mga sustainable na farm at organic farming\n"
            "• Lakad sa eco-trail sa paligid ng National Park\n"
            "• Mga programang nagtataguyod ng konserbasyon ng Ramsar wetland\n"
            "Sumunod sa Leave No Trace principles at huwag magsaboy ng basura sa paligid ng lawa.",
        ]
    },
    {
        "tag": "Accommodation_Types",
        "patterns": [
            "hotel sa naujan", "kung saan matutulog sa naujan",
            "guesthouse sa naujan", "inn sa naujan", "pension house sa naujan",
            "accommodation sa naujan", "kwarto sa naujan",
            "resort malapit sa lawa", "overnight sa naujan",
            "matutulog malapit sa naujan lake",
        ],
        "responses": [
            "Mga opsyon sa pananatili sa Naujan:\n"
            "• Mga budget guesthouse at pension house sa Poblacion (₱500–₱1,200/gabi)\n"
            "• Mga lokal na inn malapit sa bayan (₱800–₱2,000/gabi)\n"
            "• Eco-lodge malapit sa Naujan Lake (limited availability)\n"
            "• Homestay na nag-aalok ng lokal na karanasan sa komunidad\n"
            "I-browse ang Hotels section ng LAKBAY app para makita ang kasalukuyang available "
            "na accommodation at mag-book online.",
        ]
    },
    {
        "tag": "Budget_Travel",
        "patterns": [
            "gastos sa naujan", "budget trip naujan", "magkano sa naujan",
            "abot-kayang byahe naujan", "presyo sa naujan",
            "pamasahe sa ferry", "daily budget naujan", "mura bang pumunta naujan",
        ],
        "responses": [
            "Budget guide para sa Naujan trip:\n"
            "• Ferry (Batangas → Calapan): ₱150–₱350 (RORO o FastCraft)\n"
            "• Bus (Manila → Batangas Pier): ₱150–₱250\n"
            "• Jeepney/Van (Calapan → Naujan): ₱40–₱60\n"
            "• Budget accommodation: ₱500–₱1,200 bawat gabi\n"
            "• Pagkain sa carinderia: ₱80–₱150 bawat kain\n"
            "• Boat tour sa lawa: ₱300–₱800 (depende sa grupo at tagal)\n"
            "Tinatayang daily budget: ₱800–₱1,500 para sa budget traveler.",
        ]
    },
    {
        "tag": "History_Heritage",
        "patterns": [
            "kasaysayan ng naujan", "heritage ng naujan", "nakaraan ng naujan",
            "simbahan ng naujan", "kolonyal na kasaysayan ng naujan",
            "lumang simbahan ng naujan", "sinaunang panahon ng naujan",
        ],
        "responses": [
            "Kasaysayan at pamana ng Naujan:\n"
            "• Ang Naujan ay itinatag noong 1578 ng mga Espanyol na misyonero\n"
            "• Simbahan ng Our Lady of the Nativity — itinayo noong panahon ng kolonyal na Espanyol, "
            "makasaysayang landmark sa Poblacion\n"
            "• Ang mga katutubo (Mangyan) ay naninirahan sa Mindoro nang mahigit 2,000 taon\n"
            "• Noong Ikalawang Digmaang Pandaigdig, ang Mindoro ay naging kasasakayan ng mga "
            "labanan ng guerrilla laban sa mg Hapon\n"
            "• Ang Naujan Lake ay naging sentro ng pangingisda at kabuhayan ng mga komunidad sa loob ng maraming siglo",
        ]
    },
    {
        "tag": "Hiking_Trekking",
        "patterns": [
            "hiking sa naujan", "eco trail sa lawa", "lakad sa kalikasan",
            "bird watching trail", "guided walk sa lawa",
            "outdoor adventure sa naujan", "camping malapit sa lawa",
            "nature trail naujan",
        ],
        "responses": [
            "Mga outdoor na aktibidad sa Naujan:\n"
            "• Eco-trail sa paligid ng Naujan Lake National Park\n"
            "• Bird-watching walks na may gabay sa mga pampang ng lawa\n"
            "• Paglalakad sa kagubatan kasama ang mga lokal na gabay\n"
            "• Camping spot malapit sa lawa (kailangan ng pahintulot mula sa DENR)\n"
            "• Paglalakbay sa mga upland barangay kasama ang komunidad ng Mangyan\n"
            "Makipag-ugnayan sa Naujan LGU o DENR para sa mga gabay at permit.",
        ]
    },
    {
        "tag": "Local_Transport",
        "patterns": [
            "paggalaw sa naujan", "lokal na transportasyon", "jeepney sa naujan",
            "tricycle sa naujan", "habal-habal sa naujan", "multicab sa naujan",
            "commute sa naujan", "paano maglakad sa naujan",
        ],
        "responses": [
            "Paggalaw sa loob ng Naujan:\n"
            "• Tricycle — pangunahing lokal na sasakyan; ₱10–₱30 para sa maiikling distansya\n"
            "• Jeepney — para sa mas mahahabang ruta papunta sa mga barangay\n"
            "• Habal-habal (motorsiklo) — para sa mga lugar na hindi maabot ng jeep\n"
            "• Van/Multicab for hire — para sa grupo o mas malaking grupo\n"
            "Ang pagiging mapagpasensya ay mahalaga sa lokal na transportasyon.",
        ]
    },
    {
        "tag": "Shopping_Souvenirs",
        "patterns": [
            "pasalubong sa naujan", "pamimili sa naujan", "souvenir ng naujan",
            "lokal na produkto ng naujan", "palengke ng naujan",
            "handicraft ng naujan", "mangyan crafts naujan",
            "ano ang bibilhin sa naujan",
        ],
        "responses": [
            "Mga pasalubong at souvenir mula sa Naujan:\n"
            "• Mga basket at bag na gawa ng Mangyan (rattan/abaca)\n"
            "• Sariwang isda mula sa Naujan Lake (tilapia, maliputo)\n"
            "• Lokal na kakanin (puto, bibingka, sapin-sapin)\n"
            "• Organic na coconut products (virgin coconut oil, copra)\n"
            "• Lokal na pulot-pukyutan (honey) mula sa mga kabundukan\n"
            "Bisitahin ang Naujan Public Market sa Poblacion para sa iba't ibang lokal na produkto.",
        ]
    },
]

# ═══════════════════════════════════════════════════════════════════════════════
# SPANISH (es)
# ═══════════════════════════════════════════════════════════════════════════════
ES_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "como llegar a naujan", "viaje a naujan", "ferry desde manila a naujan",
            "ruta a naujan", "cuanto tiempo llegar a naujan", "roro ferry naujan",
            "batangas pier ferry", "de calapan a naujan", "bus manila batangas",
            "transporte a oriental mindoro", "fastcraft calapan",
            "cuan lejos esta naujan de manila",
        ],
        "responses": [
            "Cómo llegar a Naujan:\n"
            "1. Desde Manila: bus desde EDSA o Buendia al Terminal de Batangas (~2 horas).\n"
            "2. Ferry RORO o FastCraft desde Batangas Pier a Calapan Port (~1.5–2 horas).\n"
            "3. Desde Calapan: jeepney o van hacia el sur hasta Naujan (~30–45 min, ~₱40–₱60).\n"
            "Consejo: Salir temprano para evitar filas en el puerto.",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "sobre naujan", "informacion sobre naujan", "que es naujan",
            "descripcion de naujan", "naujan oriental mindoro",
            "resumen de naujan", "cuentame sobre naujan",
            "que ofrece naujan", "atractivos de naujan",
        ],
        "responses": [
            "Naujan es un municipio de 1a clase en Oriental Mindoro, Filipinas. "
            "Es conocido por el Lago Naujan — el 5to lago más grande de Filipinas y "
            "Sitio Ramsar de importancia internacional. El municipio destaca por su "
            "agricultura (arroz, coco), herencia mangyan y rico ecosistema lacustre. "
            "Es un destino ideal para avistamiento de aves, pesca y ecoturismo.",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "naturaleza en naujan", "rio sadya", "rio de naujan",
            "paisaje de naujan", "arrozales de naujan", "manglar naujan",
            "vista panoramica naujan", "rasgos naturales naujan",
            "vida silvestre naujan", "parque nacional naujan lake",
        ],
        "responses": [
            "Rasgos naturales de Naujan:\n"
            "• Lago Naujan — 5to lago más grande de Filipinas, refugio de aves\n"
            "• Río Sadya — ideal para nadar y disfrutar de la naturaleza\n"
            "• Vastos arrozales — Naujan es famoso por su producción de arroz\n"
            "• Plantaciones de coco — fuente de copra y productos de coco\n"
            "• Manglares costeros — protegen la costa y albergan peces",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "actividades en el lago naujan", "tour en bote lago naujan",
            "kayak en el lago", "pesca en lago naujan", "paseo en barca naujan",
            "nadar en lago naujan", "que hacer en lago naujan",
            "excursion al lago", "avistamiento aves lago naujan",
        ],
        "responses": [
            "Actividades en el Lago Naujan:\n"
            "• Avistamiento de aves — más de 100 especies incluyendo el Pato Filipino\n"
            "• Paseo en barca — alquilar una barca local para navegar el lago\n"
            "• Pesca — los pescadores locales ofrecen tours guiados\n"
            "• Kayaking — explorar orillas y manglares del lago\n"
            "• Senderismo por senderos eco del Parque Nacional\n"
            "• Picnic y relajación en las orillas del lago",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "como reservar un hotel en naujan", "reserva de hotel lakbay",
            "proceso de reserva", "check in check out lakbay",
            "como se reserva alojamiento", "hotel disponible naujan",
        ],
        "responses": [
            "Para reservar un hotel en LAKBAY:\n"
            "1. Ve a la sección 'Hoteles'.\n"
            "2. Explora los hoteles disponibles en Naujan.\n"
            "3. Selecciona tus fechas de entrada y salida.\n"
            "4. Verifica los detalles y confirma tu reserva.\n"
            "Se necesita cuenta para completar la reserva.",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "ecoturismo naujan", "turismo sostenible naujan",
            "avistamiento de aves naujan", "tour manglar naujan",
            "tour fauna lago naujan", "viaje verde naujan",
            "turismo responsable naujan", "conservacion lago naujan",
        ],
        "responses": [
            "Ecoturismo en Lago Naujan:\n"
            "• Tours guiados de avistamiento de aves (mejor época: nov–mar)\n"
            "• Excursiones en barca por el lago y manglares\n"
            "• Visitas a granjas sostenibles y agricultura orgánica\n"
            "• Caminatas por senderos eco del Parque Nacional\n"
            "• Programas de conservación del Sitio Ramsar\n"
            "Sigue los principios de Leave No Trace y respeta el hábitat natural.",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "transporte local en naujan", "como moverse en naujan",
            "jeepney naujan", "tricycle naujan", "como desplazarse",
            "movilidad en naujan", "combi naujan", "habal habal naujan",
        ],
        "responses": [
            "Cómo moverse en Naujan:\n"
            "• Tricycle — transporte local principal; ₱10–₱30 trayectos cortos\n"
            "• Jeepney — rutas más largas hacia barangays\n"
            "• Habal-habal (moto) — para lugares de difícil acceso\n"
            "• Van/Multicab for hire — para grupos\n"
            "La paciencia es clave con el transporte local.",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "senderismo naujan", "trekking naujan", "sendero eco lago naujan",
            "caminata en la naturaleza", "aventura al aire libre naujan",
            "camping cerca del lago", "excursion naturaleza naujan",
        ],
        "responses": [
            "Actividades al aire libre en Naujan:\n"
            "• Senderos eco alrededor del Parque Nacional Lago Naujan\n"
            "• Caminatas de avistamiento de aves con guías locales\n"
            "• Camping cerca del lago (requiere permiso DENR)\n"
            "• Visitas a comunidades Mangyan en las montañas\n"
            "• Travesías por barangays rurales\n"
            "Contacta al LGU de Naujan o DENR para guías y permisos.",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "presupuesto para naujan", "costo visita naujan", "cuanto cuesta ir a naujan",
            "viaje economico naujan", "gastos en naujan", "precio ferry naujan",
            "precio alojamiento naujan", "viaje barato naujan",
        ],
        "responses": [
            "Guía de presupuesto para Naujan:\n"
            "• Ferry (Batangas → Calapan): ₱150–₱350 (RORO o FastCraft)\n"
            "• Bus (Manila → Batangas): ₱150–₱250\n"
            "• Jeepney/Van (Calapan → Naujan): ₱40–₱60\n"
            "• Alojamiento básico: ₱500–₱1,200 por noche\n"
            "• Comida en carinderia: ₱80–₱150 por comida\n"
            "• Tour en barca del lago: ₱300–₱800\n"
            "Presupuesto diario estimado: ₱800–₱1,500 para viajero con presupuesto ajustado.",
        ]
    },
    "Naujan_Getting_There": None,  # merge into Transportation_How_To_Get_There above
}
ES_TO_REMOVE = {"Naujan_Getting_There"}

# ═══════════════════════════════════════════════════════════════════════════════
# FRENCH (fr) – same structure as ES
# ═══════════════════════════════════════════════════════════════════════════════
FR_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "comment aller a naujan", "voyage a naujan", "ferry de manille a naujan",
            "itineraire vers naujan", "trajet naujan", "roro ferry naujan",
            "batangas pier ferry", "de calapan a naujan", "bus manila batangas",
            "transport vers oriental mindoro", "fastcraft calapan",
        ],
        "responses": [
            "Comment se rendre à Naujan :\n"
            "1. Depuis Manille : bus depuis EDSA ou Buendia jusqu'au Terminal de Batangas (~2h).\n"
            "2. Ferry RORO ou FastCraft de Batangas Pier à Calapan Port (~1,5–2h).\n"
            "3. Depuis Calapan : jeepney ou van vers le sud jusqu'à Naujan (~30–45 min, ~₱40–₱60).\n"
            "Conseil : Partir tôt pour éviter les longues files au port.",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "a propos de naujan", "informations sur naujan", "qu est ce que naujan",
            "description de naujan", "naujan oriental mindoro",
            "resume de naujan", "parle moi de naujan",
            "ce que propose naujan", "attractions de naujan",
        ],
        "responses": [
            "Naujan est une municipalité de 1ère classe en Oriental Mindoro, Philippines. "
            "Elle est célèbre pour le Lac Naujan — le 5ème plus grand lac des Philippines et "
            "Site Ramsar d'importance internationale. La ville se distingue par son agriculture "
            "(riz, noix de coco), son héritage Mangyan et son riche écosystème lacustre. "
            "C'est une destination idéale pour l'observation des oiseaux, la pêche et l'écotourisme.",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "nature a naujan", "riviere sadya", "riviere de naujan",
            "paysage de naujan", "rizieres de naujan", "mangrove naujan",
            "vue panoramique naujan", "caracteristiques naturelles naujan",
            "faune et flore naujan", "parc national lac naujan",
        ],
        "responses": [
            "Caractéristiques naturelles de Naujan :\n"
            "• Lac Naujan — 5ème plus grand lac des Philippines, refuge pour les oiseaux\n"
            "• Rivière Sadya — idéale pour se baigner et profiter de la nature\n"
            "• Vastes rizières — Naujan est renommé pour sa production de riz\n"
            "• Plantations de noix de coco — source de copra et de produits à base de noix de coco\n"
            "• Mangroves côtières — protègent le littoral et abritent les poissons",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "activites au lac naujan", "tour en bateau lac naujan",
            "kayak sur le lac", "peche au lac naujan", "promenade en bateau naujan",
            "nager dans le lac naujan", "que faire au lac naujan",
            "excursion au lac", "observation des oiseaux lac naujan",
        ],
        "responses": [
            "Activités au Lac Naujan :\n"
            "• Observation des oiseaux — plus de 100 espèces dont le Canard des Philippines\n"
            "• Promenade en bateau — louer un bateau local pour naviguer sur le lac\n"
            "• Pêche — les pêcheurs locaux proposent des tours guidés\n"
            "• Kayaking — explorer les rives et les mangroves du lac\n"
            "• Randonnée sur les sentiers éco du Parc National\n"
            "• Pique-nique et détente sur les rives du lac",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "comment reserver un hotel a naujan", "reservation hotel lakbay",
            "processus de reservation", "check in check out lakbay",
            "comment reserver un logement", "hotel disponible naujan",
        ],
        "responses": [
            "Pour réserver un hôtel sur LAKBAY :\n"
            "1. Allez dans la section 'Hôtels'.\n"
            "2. Parcourez les hôtels disponibles à Naujan.\n"
            "3. Sélectionnez vos dates d'arrivée et de départ.\n"
            "4. Vérifiez les détails et confirmez votre réservation.\n"
            "Un compte est nécessaire pour finaliser la réservation.",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "ecotourisme naujan", "tourisme responsable naujan",
            "observation oiseaux naujan", "tour mangrove naujan",
            "tour faune lac naujan", "voyage vert naujan",
            "conservation lac naujan",
        ],
        "responses": [
            "Écotourisme au Lac Naujan :\n"
            "• Tours guidés d'observation des oiseaux (meilleure période : nov–mars)\n"
            "• Excursions en bateau sur le lac et les mangroves\n"
            "• Visites de fermes durables et agriculture biologique\n"
            "• Randonnées sur les sentiers éco du Parc National\n"
            "• Programmes de conservation du Site Ramsar\n"
            "Respectez les principes Leave No Trace et le milieu naturel.",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "transport local a naujan", "comment se deplacer a naujan",
            "jeepney naujan", "tricycle naujan", "comment circuler",
            "mobilite a naujan", "habal habal naujan",
        ],
        "responses": [
            "Comment se déplacer à Naujan :\n"
            "• Tricycle — principal transport local ; ₱10–₱30 trajets courts\n"
            "• Jeepney — trajets plus longs vers les barangays\n"
            "• Habal-habal (moto) — pour les endroits difficiles d'accès\n"
            "• Van/Multicab for hire — pour les groupes\n"
            "La patience est de mise avec les transports locaux.",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "randonnee naujan", "trek naujan", "sentier eco lac naujan",
            "promenade dans la nature", "aventure plein air naujan",
            "camping pres du lac", "excursion nature naujan",
        ],
        "responses": [
            "Activités de plein air à Naujan :\n"
            "• Sentiers éco autour du Parc National Lac Naujan\n"
            "• Randonnées d'observation des oiseaux avec guides locaux\n"
            "• Camping près du lac (permis DENR requis)\n"
            "• Visites aux communautés Mangyan en montagne\n"
            "• Traversée des barangays ruraux\n"
            "Contactez le LGU Naujan ou le DENR pour guides et permis.",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "budget pour naujan", "cout visite naujan", "combien coute aller a naujan",
            "voyage economique naujan", "depenses a naujan", "prix ferry naujan",
            "prix logement naujan",
        ],
        "responses": [
            "Guide de budget pour Naujan :\n"
            "• Ferry (Batangas → Calapan) : ₱150–₱350 (RORO ou FastCraft)\n"
            "• Bus (Manille → Batangas) : ₱150–₱250\n"
            "• Jeepney/Van (Calapan → Naujan) : ₱40–₱60\n"
            "• Hébergement basique : ₱500–₱1 200 par nuit\n"
            "• Repas en carinderia : ₱80–₱150\n"
            "• Tour en bateau sur le lac : ₱300–₱800\n"
            "Budget journalier estimé : ₱800–₱1 500 pour voyageur économique.",
        ]
    },
    "Naujan_Getting_There": None,  # remove
}
FR_TO_REMOVE = {"Naujan_Getting_There"}

# ═══════════════════════════════════════════════════════════════════════════════
# GERMAN (de) – same structure
# ═══════════════════════════════════════════════════════════════════════════════
DE_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "wie kommt man nach naujan", "reise nach naujan", "fahre von manila nach naujan",
            "route nach naujan", "roro faehre naujan", "batangas hafen faehre",
            "von calapan nach naujan", "bus nach batangas", "transport nach oriental mindoro",
            "fastcraft calapan", "wie weit ist naujan von manila",
        ],
        "responses": [
            "So kommt man nach Naujan:\n"
            "1. Ab Manila: Bus von EDSA oder Buendia zum Batangas Terminal (~2 Std.).\n"
            "2. RORO oder FastCraft-Fähre von Batangas Pier nach Calapan Port (~1,5–2 Std.).\n"
            "3. Ab Calapan: Jeepney oder Van nach Süden bis Naujan (~30–45 Min., ~₱40–₱60).\n"
            "Tipp: Früh aufbrechen, um lange Warteschlangen am Hafen zu vermeiden.",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "ueber naujan", "informationen ueber naujan", "was ist naujan",
            "beschreibung von naujan", "naujan oriental mindoro",
            "zusammenfassung von naujan", "erzaehl mir ueber naujan",
            "was bietet naujan", "sehenswuerdigkeiten naujan",
        ],
        "responses": [
            "Naujan ist eine erstklassige Gemeinde in Oriental Mindoro, Philippinen. "
            "Bekannt ist sie für den Naujan-See — den fünftgrößten See der Philippinen und "
            "Ramsar-Feuchtgebiet von internationaler Bedeutung. Die Gemeinde zeichnet sich durch "
            "Landwirtschaft (Reis, Kokos), Mangyan-Erbe und ein reiches Seeökosystem aus. "
            "Ideal für Vogelbeobachtung, Fischen und Ökotourismus.",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "natur in naujan", "sadya fluss", "fluss von naujan",
            "landschaft von naujan", "reisfelder naujan", "mangroven naujan",
            "panoramablick naujan", "naturmerkmale naujan",
            "flora fauna naujan", "nationalpark naujan see",
        ],
        "responses": [
            "Natürliche Merkmale von Naujan:\n"
            "• Naujan-See — 5. größter See der Philippinen, Vogelzuflucht\n"
            "• Sadya-Fluss — ideal zum Schwimmen und Genießen der Natur\n"
            "• Weitläufige Reisfelder — Naujan ist berühmt für seinen Reisanbau\n"
            "• Kokosplantagen — Quelle von Kopra und Kokosprodukten\n"
            "• Küstenmangroven — schützen die Küste und beherbergen Fische",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "aktivitaeten am naujan see", "bootsfahrt naujan see",
            "kajak auf dem see", "angeln am naujan see", "bootstour naujan",
            "schwimmen im naujan see", "was tun am naujan see",
            "ausflug zum see", "vogelbeobachtung naujan see",
        ],
        "responses": [
            "Aktivitäten am Naujan-See:\n"
            "• Vogelbeobachtung — über 100 Arten, darunter die Philippinen-Ente\n"
            "• Bootsfahrt — lokales Boot mieten für Seetouren\n"
            "• Angeln — lokale Fischer bieten geführte Touren an\n"
            "• Kajakfahren — Ufer und Mangroven des Sees erkunden\n"
            "• Wandern auf Ökopfaden des Nationalparks\n"
            "• Picknick und Entspannung am Seeufer",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "wie buche ich ein hotel in naujan", "hotel reservierung lakbay",
            "buchungsvorgang", "check in check out lakbay",
            "wie reserviere ich unterkunft", "hotel verfuegbar naujan",
        ],
        "responses": [
            "So buchen Sie ein Hotel bei LAKBAY:\n"
            "1. Gehen Sie zum Bereich 'Hotels'.\n"
            "2. Durchsuchen Sie verfügbare Hotels in Naujan.\n"
            "3. Wählen Sie Ihre Check-in- und Check-out-Daten.\n"
            "4. Details prüfen und Buchung bestätigen.\n"
            "Ein Konto ist erforderlich, um die Buchung abzuschließen.",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "oekotourismus naujan", "nachhaltiger tourismus naujan",
            "vogelbeobachtung naujan", "mangrovensafari naujan",
            "wildlifetouren naujan see", "gruenes reisen naujan",
            "naturschutz naujan see",
        ],
        "responses": [
            "Ökotourismus am Naujan-See:\n"
            "• Geführte Vogelbeobachtungstouren (beste Zeit: Nov–März)\n"
            "• Bootsausflüge auf dem See und in den Mangroven\n"
            "• Besuche nachhaltiger Farmen und ökologischer Landwirtschaft\n"
            "• Wanderungen auf Ökopfaden des Nationalparks\n"
            "• Naturschutzprogramme des Ramsar-Feuchtgebiets\n"
            "Bitte Leave No Trace-Grundsätze befolgen.",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "lokaler transport in naujan", "wie kommt man in naujan voran",
            "jeepney naujan", "tricycle naujan", "wie sich fortbewegen",
            "mobilitaet in naujan", "habal habal naujan",
        ],
        "responses": [
            "Fortbewegung in Naujan:\n"
            "• Tricycle — Haupttransportmittel; ₱10–₱30 für kurze Strecken\n"
            "• Jeepney — längere Strecken zu den Barangays\n"
            "• Habal-habal (Motorrad) — für schwer zugängliche Orte\n"
            "• Van/Multicab for hire — für Gruppen\n"
            "Geduld ist beim lokalen Transport gefragt.",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "wandern naujan", "trekking naujan", "oekopfad naujan see",
            "naturspaziergang", "outdoor abenteuer naujan",
            "camping nahe dem see", "naturausflug naujan",
        ],
        "responses": [
            "Outdoor-Aktivitäten in Naujan:\n"
            "• Ökopfade rund um den Nationalpark Naujan-See\n"
            "• Vogelbeobachtungswanderungen mit lokalen Guides\n"
            "• Camping nahe dem See (DENR-Genehmigung erforderlich)\n"
            "• Ausflüge zu Mangyan-Gemeinschaften in den Bergen\n"
            "• Touren durch ländliche Barangays\n"
            "Kontaktieren Sie das Naujan LGU oder DENR für Guides und Genehmigungen.",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "budget fuer naujan", "kosten besuch naujan",
            "wie viel kostet naujan", "guenstige reise naujan",
            "ausgaben in naujan", "faehrenpreis naujan",
            "unterkunft preis naujan",
        ],
        "responses": [
            "Budgetführer für Naujan:\n"
            "• Fähre (Batangas → Calapan): ₱150–₱350 (RORO oder FastCraft)\n"
            "• Bus (Manila → Batangas): ₱150–₱250\n"
            "• Jeepney/Van (Calapan → Naujan): ₱40–₱60\n"
            "• Basiserkunft: ₱500–₱1.200 pro Nacht\n"
            "• Mahlzeit in der Carinderia: ₱80–₱150\n"
            "• Bootstour auf dem See: ₱300–₱800\n"
            "Geschätztes Tagesbudget: ₱800–₱1.500 für budgetbewusste Reisende.",
        ]
    },
    "Naujan_Getting_There": None,  # remove
}
DE_TO_REMOVE = {"Naujan_Getting_There"}

# ═══════════════════════════════════════════════════════════════════════════════
# CHINESE (zh) – same tags, Chinese language
# ═══════════════════════════════════════════════════════════════════════════════
ZH_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "如何去瑙汉", "去瑙汉的路线", "从马尼拉到瑙汉",
            "瑙汉轮渡", "巴丹加斯港口", "从卡拉潘到瑙汉",
            "去东方民都洛的路线", "瑙汉交通",
        ],
        "responses": [
            "前往瑙汉的方法：\n"
            "1. 从马尼拉：乘坐公共汽车从EDSA或Buendia前往巴丹加斯总站（约2小时）。\n"
            "2. 从巴丹加斯港乘坐RORO或FastCraft轮船前往卡拉潘港（约1.5–2小时）。\n"
            "3. 从卡拉潘：乘坐吉普尼或货车向南前往瑙汉（约30–45分钟，约₱40–₱60）。\n"
            "建议：早出发以避免港口排队。",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "关于瑙汉", "瑙汉的信息", "什么是瑙汉",
            "瑙汉概述", "介绍瑙汉", "告诉我瑙汉",
            "瑙汉有什么", "瑙汉旅游景点",
        ],
        "responses": [
            "瑙汉是菲律宾东方民都洛的一个一等次级市。以瑙汉湖而闻名——菲律宾第五大湖，也是国际重要的拉姆萨尔湿地。"
            "该市以农业（稻米、椰子）、芒颜文化和丰富的湖泊生态系统著称。"
            "是观鸟、捕鱼和生态旅游的理想目的地。",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "瑙汉的自然景观", "萨迪亚河", "瑙汉河流",
            "瑙汉风景", "瑙汉稻田", "瑙汉红树林",
            "瑙汉自然特征", "国家公园瑙汉湖",
        ],
        "responses": [
            "瑙汉的自然景观：\n"
            "• 瑙汉湖——菲律宾第五大湖，鸟类栖息地\n"
            "• 萨迪亚河——适合游泳和感受自然\n"
            "• 广阔的稻田——瑙汉以稻米生产著名\n"
            "• 椰子园——椰干和椰子产品的来源\n"
            "• 沿海红树林——保护海岸并为鱼类提供栖息地",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "瑙汉湖活动", "瑙汉湖游船", "湖上皮划艇",
            "瑙汉湖钓鱼", "湖上观鸟", "瑙汉湖游览",
        ],
        "responses": [
            "瑙汉湖活动：\n"
            "• 观鸟——超过100种鸟类，包括菲律宾鸭\n"
            "• 游船——租一艘本地小船在湖上漫游\n"
            "• 钓鱼——当地渔民提供导游服务\n"
            "• 皮划艇——探索湖边和红树林\n"
            "• 国家公园生态步道徒步\n"
            "• 在湖边野餐休闲",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "如何在瑙汉预订酒店", "lakbay酒店预订", "预订流程",
            "如何预订住宿", "瑙汉可用酒店",
        ],
        "responses": [
            "如何在LAKBAY预订酒店：\n"
            "1. 前往'酒店'板块。\n"
            "2. 浏览瑙汉的可用酒店。\n"
            "3. 选择入住和退房日期。\n"
            "4. 核实详情并确认预订。\n"
            "完成预订需要账户。",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "瑙汉生态旅游", "可持续旅游瑙汉", "瑙汉观鸟",
            "瑙汉红树林游览", "瑙汉野生动物游览", "绿色旅游瑙汉",
        ],
        "responses": [
            "瑙汉湖生态旅游：\n"
            "• 导游观鸟游（最佳时间：11月–3月）\n"
            "• 湖上和红树林游船游\n"
            "• 参观可持续农场和有机农业\n"
            "• 国家公园生态步道徒步\n"
            "• 拉姆萨尔湿地保护项目\n"
            "请遵守无痕旅游原则，尊重自然栖息地。",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "瑙汉当地交通", "如何在瑙汉出行",
            "瑙汉吉普尼", "瑙汉三轮车", "瑙汉摩托车出租",
        ],
        "responses": [
            "在瑙汉出行方式：\n"
            "• 三轮车——主要本地交通；短途₱10–₱30\n"
            "• 吉普尼——前往各村庄的较长路线\n"
            "• 哈巴哈巴（摩托车）——前往难以到达的地方\n"
            "• 租用货车/多用途车——适合团体",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "瑙汉徒步", "瑙汉湖生态步道", "自然漫步瑙汉",
            "户外探险瑙汉", "湖边露营", "自然游览瑙汉",
        ],
        "responses": [
            "瑙汉户外活动：\n"
            "• 瑙汉湖国家公园周边生态步道\n"
            "• 本地向导带领的观鸟徒步\n"
            "• 湖边露营（需DENR许可）\n"
            "• 前往山区的芒颜社区参观\n"
            "• 农村村庄穿越之旅\n"
            "请联系瑙汉LGU或DENR获取向导和许可。",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "瑙汉旅游预算", "去瑙汉多少钱",
            "瑙汉廉价旅游", "瑙汉渡轮票价",
            "瑙汉住宿价格",
        ],
        "responses": [
            "瑙汉旅游预算指南：\n"
            "• 渡轮（巴丹加斯→卡拉潘）：₱150–₱350（RORO或FastCraft）\n"
            "• 巴士（马尼拉→巴丹加斯）：₱150–₱250\n"
            "• 吉普尼/货车（卡拉潘→瑙汉）：₱40–₱60\n"
            "• 基本住宿：每晚₱500–₱1,200\n"
            "• 小餐馆餐食：₱80–₱150\n"
            "• 湖上游船：₱300–₱800\n"
            "预估每日预算：₱800–₱1,500（经济型旅行者）。",
        ]
    },
    "Naujan_Getting_There": None,
}
ZH_TO_REMOVE = {"Naujan_Getting_There"}

# ═══════════════════════════════════════════════════════════════════════════════
# JAPANESE (ja) – same structure
# ═══════════════════════════════════════════════════════════════════════════════
JA_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "ナウハンへの行き方", "ナウハンへのルート", "マニラからナウハンへ",
            "ナウハンフェリー", "バタンガスポート", "カラパンからナウハンへ",
            "オリエンタルミンドロへの交通", "ナウハン交通手段",
        ],
        "responses": [
            "ナウハンへのアクセス：\n"
            "1. マニラから：EDSAまたはBuendia発のバスでバタンガスターミナルへ（約2時間）。\n"
            "2. バタンガス港からカラパン港へROROまたはファストクラフトで（約1.5〜2時間）。\n"
            "3. カラパンから：南行きのジプニーまたはバンでナウハンへ（約30〜45分、₱40〜₱60）。\n"
            "ヒント：港での行列を避けるため早めに出発してください。",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "ナウハンについて", "ナウハンの情報", "ナウハンとは",
            "ナウハンの概要", "ナウハンを紹介して", "ナウハンの観光",
            "ナウハンの特徴", "オリエンタルミンドロのナウハン",
        ],
        "responses": [
            "ナウハンはフィリピン・オリエンタルミンドロの一級市です。"
            "フィリピン第5位の大きさを誇るナウハン湖（国際重要ラムサール湿地）で知られています。"
            "農業（米・ヤシ）、マンヤン文化、豊かな湖の生態系が特徴です。"
            "バードウォッチング、釣り、エコツーリズムに最適な観光地です。",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "ナウハンの自然", "サディア川", "ナウハンの川",
            "ナウハンの風景", "ナウハンの田んぼ", "ナウハンのマングローブ",
            "国立公園ナウハン湖", "ナウハンの自然の特徴",
        ],
        "responses": [
            "ナウハンの自然的特徴：\n"
            "• ナウハン湖 — フィリピン第5位の大きさの湖、鳥の生息地\n"
            "• サディア川 — 水泳や自然散策に最適\n"
            "• 広大な田んぼ — 稲作で有名なナウハン\n"
            "• ヤシ農園 — コプラとヤシ製品の産地\n"
            "• 沿岸のマングローブ — 海岸を保護し魚の住処を提供",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "ナウハン湖でのアクティビティ", "ナウハン湖のボートツアー",
            "湖でのカヤック", "ナウハン湖での釣り", "バードウォッチング湖",
            "ナウハン湖観光", "湖でのピクニック",
        ],
        "responses": [
            "ナウハン湖でのアクティビティ：\n"
            "• バードウォッチング — フィリピンダックを含む100種以上の鳥\n"
            "• ボートツアー — 地元のボートを借りて湖を巡る\n"
            "• 釣り — 地元の漁師によるガイドツアー\n"
            "• カヤック — 湖岸とマングローブを探索\n"
            "• 国立公園のエコトレイルハイキング\n"
            "• 湖畔でのピクニックと休憩",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "ナウハンのホテルを予約する方法", "lakbayホテル予約",
            "予約プロセス", "ナウハンの利用可能なホテル",
        ],
        "responses": [
            "LAKBAYでのホテル予約方法：\n"
            "1. 「ホテル」セクションへ移動。\n"
            "2. ナウハンの利用可能なホテルを閲覧。\n"
            "3. チェックインとチェックアウトの日程を選択。\n"
            "4. 詳細を確認し予約を確定。\n"
            "予約を完了するにはアカウントが必要です。",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "ナウハンのエコツーリズム", "持続可能な観光ナウハン",
            "ナウハンのバードウォッチング", "マングローブツアーナウハン",
            "湖の野生動物ツアー", "自然保護ナウハン湖",
        ],
        "responses": [
            "ナウハン湖のエコツーリズム：\n"
            "• ガイド付きバードウォッチングツアー（最適時期：11月〜3月）\n"
            "• 湖とマングローブのボートツアー\n"
            "• 持続可能農場と有機農業の見学\n"
            "• 国立公園のエコトレイルハイキング\n"
            "• ラムサール湿地保護プログラム\n"
            "Leave No Traceの原則を守り、自然環境を尊重してください。",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "ナウハンの地元交通", "ナウハン内の移動方法",
            "ジプニーナウハン", "トライシクルナウハン", "ハバルハバルナウハン",
        ],
        "responses": [
            "ナウハン内の移動手段：\n"
            "• トライシクル — 主な地元交通手段、短距離₱10〜₱30\n"
            "• ジプニー — バランガイへの長距離ルート\n"
            "• ハバルハバル（バイク） — アクセスしにくい場所へ\n"
            "• バン/マルチキャブのチャーター — グループ向け",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "ナウハンのハイキング", "ナウハン湖エコトレイル",
            "自然散策ナウハン", "アウトドアアドベンチャーナウハン",
            "湖近くのキャンプ",
        ],
        "responses": [
            "ナウハンのアウトドアアクティビティ：\n"
            "• ナウハン湖国立公園周辺のエコトレイル\n"
            "• 地元ガイドと行くバードウォッチングウォーク\n"
            "• 湖近くのキャンプ（DENR許可必要）\n"
            "• マンヤンコミュニティへの山の訪問\n"
            "• 農村バランガイのトレッキング\n"
            "ガイドと許可についてはナウハンLGUまたはDENRへ連絡。",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "ナウハン旅行の予算", "ナウハン旅行の費用",
            "ナウハン安い旅行", "フェリー料金ナウハン",
            "宿泊料金ナウハン",
        ],
        "responses": [
            "ナウハン旅行の予算ガイド：\n"
            "• フェリー（バタンガス→カラパン）：₱150〜₱350\n"
            "• バス（マニラ→バタンガス）：₱150〜₱250\n"
            "• ジプニー/バン（カラパン→ナウハン）：₱40〜₱60\n"
            "• 基本宿泊：一泊₱500〜₱1,200\n"
            "• カリンデリアでの食事：₱80〜₱150\n"
            "• 湖のボートツアー：₱300〜₱800\n"
            "推定1日予算：₱800〜₱1,500（バジェット旅行者）。",
        ]
    },
    "Naujan_Getting_There": None,
}
JA_TO_REMOVE = {"Naujan_Getting_There"}

# ═══════════════════════════════════════════════════════════════════════════════
# KOREAN (ko) – same structure
# ═══════════════════════════════════════════════════════════════════════════════
KO_REPLACEMENTS = {
    "Transportation_How_To_Get_There": {
        "patterns": [
            "나우한 가는 방법", "나우한 여행 경로", "마닐라에서 나우한",
            "나우한 페리", "바타낙스 항구", "칼라판에서 나우한",
            "오리엔탈 민도로 교통", "나우한 교통수단",
        ],
        "responses": [
            "나우한 가는 방법:\n"
            "1. 마닐라에서: EDSA 또는 부엔디아 터미널에서 바타낙스 터미널까지 버스 (~2시간).\n"
            "2. 바타낙스 항구에서 칼라판 항구까지 RORO 또는 패스트크래프트 페리 (~1.5–2시간).\n"
            "3. 칼라판에서: 남쪽으로 가는 지프니 또는 밴으로 나우한까지 (~30–45분, ~₱40–₱60).\n"
            "팁: 항구에서의 대기줄을 피하려면 일찍 출발하세요.",
        ]
    },
    "Puerto_Galera_Info": {
        "tag": "Naujan_Overview",
        "patterns": [
            "나우한에 대해", "나우한 정보", "나우한이란",
            "나우한 개요", "나우한 소개", "나우한 관광",
            "나우한의 특징", "오리엔탈 민도로 나우한",
        ],
        "responses": [
            "나우한은 필리핀 오리엔탈 민도로의 1급 시입니다. "
            "필리핀 5번째로 큰 호수이자 국제적으로 중요한 람사르 습지인 나우한 호수로 유명합니다. "
            "농업(쌀, 코코넛), 망얀 문화, 풍부한 호수 생태계가 특징입니다. "
            "조류 관찰, 낚시, 생태 관광에 최적의 목적지입니다.",
        ]
    },
    "Beaches_Info": {
        "tag": "Naujan_Natural_Features",
        "patterns": [
            "나우한의 자연", "사디아 강", "나우한 강",
            "나우한 풍경", "나우한 논밭", "나우한 맹그로브",
            "국립공원 나우한 호수", "나우한 자연 특징",
        ],
        "responses": [
            "나우한의 자연 특징:\n"
            "• 나우한 호수 — 필리핀 5번째로 큰 호수, 조류 서식지\n"
            "• 사디아 강 — 수영과 자연 감상에 이상적\n"
            "• 드넓은 논밭 — 벼농사로 유명한 나우한\n"
            "• 코코넛 농장 — 코프라와 코코넛 제품의 산지\n"
            "• 해안 맹그로브 — 해안을 보호하고 물고기 서식지 제공",
        ]
    },
    "Diving_Water_Sports": {
        "tag": "Naujan_Lake_Activities",
        "patterns": [
            "나우한 호수 활동", "나우한 호수 보트 투어",
            "호수 카약", "나우한 호수 낚시", "조류 관찰 나우한 호수",
            "나우한 호수 여행", "호수 피크닉",
        ],
        "responses": [
            "나우한 호수 활동:\n"
            "• 조류 관찰 — 필리핀 오리를 포함한 100종 이상의 조류\n"
            "• 보트 투어 — 현지 보트를 빌려 호수 순항\n"
            "• 낚시 — 현지 어부들의 가이드 투어\n"
            "• 카약 — 호수 해안과 맹그로브 탐험\n"
            "• 국립공원 생태 트레일 하이킹\n"
            "• 호숫가 피크닉과 리락스",
        ]
    },
    "Website_Hotels_Guide": {
        "patterns": [
            "나우한 호텔 예약 방법", "lakbay 호텔 예약",
            "예약 과정", "이용 가능한 나우한 호텔",
        ],
        "responses": [
            "LAKBAY에서 호텔 예약 방법:\n"
            "1. '호텔' 섹션으로 이동.\n"
            "2. 나우한의 이용 가능한 호텔 탐색.\n"
            "3. 체크인 및 체크아웃 날짜 선택.\n"
            "4. 세부 사항 확인 후 예약 확정.\n"
            "예약 완료에는 계정이 필요합니다.",
        ]
    },
    "Website_Attractions_Guide": {
        "tag": "Eco_Tourism",
        "patterns": [
            "나우한 생태 관광", "지속 가능한 관광 나우한",
            "나우한 조류 관찰", "맹그로브 투어 나우한",
            "나우한 호수 야생동물 투어", "친환경 여행 나우한",
        ],
        "responses": [
            "나우한 호수 생태 관광:\n"
            "• 가이드 조류 관찰 투어 (최적 시기: 11월–3월)\n"
            "• 호수와 맹그로브 보트 투어\n"
            "• 지속 가능한 농장 및 유기 농업 방문\n"
            "• 국립공원 생태 트레일 하이킹\n"
            "• 람사르 습지 보전 프로그램\n"
            "Leave No Trace 원칙을 지키고 자연 서식지를 존중하세요.",
        ]
    },
    "Website_Map_Guide": {
        "tag": "Local_Transport",
        "patterns": [
            "나우한 현지 교통", "나우한 이동 방법",
            "지프니 나우한", "삼륜차 나우한", "하발하발 나우한",
        ],
        "responses": [
            "나우한 내 이동 수단:\n"
            "• 삼륜차 — 주요 현지 교통수단, 단거리 ₱10–₱30\n"
            "• 지프니 — 바랑가이까지 더 긴 경로\n"
            "• 하발하발(오토바이) — 접근하기 어려운 곳\n"
            "• 밴/멀티캡 대여 — 그룹용",
        ]
    },
    "Website_Itinerary_Guide": {
        "tag": "Hiking_Trekking",
        "patterns": [
            "나우한 하이킹", "나우한 호수 생태 트레일",
            "자연 산책 나우한", "야외 모험 나우한",
            "호수 근처 캠핑",
        ],
        "responses": [
            "나우한 야외 활동:\n"
            "• 나우한 호수 국립공원 주변 생태 트레일\n"
            "• 현지 가이드와 함께하는 조류 관찰 산책\n"
            "• 호수 근처 캠핑 (DENR 허가 필요)\n"
            "• 산간 망얀 커뮤니티 방문\n"
            "• 농촌 바랑가이 트레킹\n"
            "가이드와 허가에 대해서는 나우한 LGU 또는 DENR에 문의하세요.",
        ]
    },
    "Website_Account_Guide": {
        "tag": "Budget_Travel",
        "patterns": [
            "나우한 여행 예산", "나우한 방문 비용",
            "나우한 저렴한 여행", "페리 요금 나우한",
            "숙박 가격 나우한",
        ],
        "responses": [
            "나우한 여행 예산 가이드:\n"
            "• 페리 (바타낙스→칼라판): ₱150–₱350 (RORO 또는 패스트크래프트)\n"
            "• 버스 (마닐라→바타낙스): ₱150–₱250\n"
            "• 지프니/밴 (칼라판→나우한): ₱40–₱60\n"
            "• 기본 숙박: 1박 ₱500–₱1,200\n"
            "• 카린데리아 식사: ₱80–₱150\n"
            "• 호수 보트 투어: ₱300–₱800\n"
            "예상 일일 예산: ₱800–₱1,500 (저예산 여행자).",
        ]
    },
    "Naujan_Getting_There": None,
}
KO_TO_REMOVE = {"Naujan_Getting_There"}


# ═══════════════════════════════════════════════════════════════════════════════
# Generic new intents to add for ES, FR, DE, ZH, JA, KO
# (Naujan_Lake_Wildlife, Naujan_Lake_Activities, Naujan_Barangays, Naujan_Agriculture)
# ═══════════════════════════════════════════════════════════════════════════════
def get_extra_intents(lang):
    """Return additional Naujan-specific intents for each language."""
    extras = {
        "es": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["aves lago naujan", "fauna naujan", "observacion aves naujan",
                             "pato filipino naujan", "aves migratorias naujan",
                             "cocodrilo naujan", "animales lago naujan"],
                "responses": [
                    "El Lago Naujan alberga más de 100 especies de aves, incluyendo:\n"
                    "• Pato Filipino (Anas luzonica) — especie endémica en peligro de extinción\n"
                    "• Aves acuáticas migratorias de Siberia y Asia Oriental (nov–mar)\n"
                    "• Cocodrilo de agua dulce (Crocodylus mindorensis) — en peligro crítico\n"
                    "La mejor época para observar aves es de noviembre a marzo, temprano en la mañana."
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["barangays de naujan", "cuantos barangays tiene naujan",
                             "lista de barangays naujan", "poblacion naujan",
                             "comunidades de naujan"],
                "responses": [
                    "Naujan tiene 39 barangays repartidos en zonas agrícolas, costeras y montañosas. "
                    "El Poblacion (centro urbano) es el más grande. "
                    "Para la lista completa, contacta la Alcaldía de Naujan: (043) 208-3382."
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["agricultura naujan", "cultivo de arroz naujan",
                             "coco naujan", "copra naujan", "cosecha naujan",
                             "granja naujan", "tour agricola naujan"],
                "responses": [
                    "Naujan es uno de los principales municipios agrícolas de Oriental Mindoro:\n"
                    "• Arroz — cultivo principal, reconocido por sus abundantes cosechas\n"
                    "• Coco/Copra — segundo producto principal\n"
                    "• Pesca en el lago — tilapia, maliputo y otros peces frescos\n"
                    "• Tours agro-eco — visitar granjas locales y presenciar el cultivo de arroz"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["hotel en naujan", "donde alojarse en naujan",
                             "posada naujan", "pension house naujan",
                             "alojamiento naujan", "habitacion naujan",
                             "hospedaje cerca del lago"],
                "responses": [
                    "Opciones de alojamiento en Naujan:\n"
                    "• Pensiones y posadas básicas en el Poblacion (₱500–₱1,200/noche)\n"
                    "• Posadas locales cerca del centro (₱800–₱2,000/noche)\n"
                    "• Eco-lodge cerca del Lago Naujan (disponibilidad limitada)\n"
                    "• Homestays que ofrecen experiencia comunitaria local\n"
                    "Consulta la sección Hoteles de la app LAKBAY para ver disponibilidad y reservar."
                ]
            },
        ],
        "fr": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["oiseaux lac naujan", "faune naujan", "observation oiseaux naujan",
                             "canard philippin naujan", "oiseaux migrateurs naujan",
                             "crocodile naujan", "animaux lac naujan"],
                "responses": [
                    "Le Lac Naujan abrite plus de 100 espèces d'oiseaux, dont :\n"
                    "• Canard des Philippines (Anas luzonica) — espèce endémique menacée\n"
                    "• Oiseaux aquatiques migrateurs de Sibérie et d'Asie orientale (nov–mars)\n"
                    "• Crocodile d'eau douce (Crocodylus mindorensis) — en danger critique\n"
                    "La meilleure période pour observer les oiseaux est de novembre à mars, tôt le matin."
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["barangays de naujan", "combien de barangays a naujan",
                             "liste des barangays naujan", "poblacion naujan",
                             "communautés de naujan"],
                "responses": [
                    "Naujan compte 39 barangays répartis dans des zones agricoles, côtières et montagneuses. "
                    "Le Poblacion (centre-ville) est le plus grand. "
                    "Pour la liste complète, contactez la Mairie de Naujan : (043) 208-3382."
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["agriculture naujan", "rizières naujan",
                             "noix de coco naujan", "copra naujan",
                             "récolte naujan", "ferme naujan", "tour agri naujan"],
                "responses": [
                    "Naujan est l'une des principales communes agricoles d'Oriental Mindoro :\n"
                    "• Riz — culture principale, reconnue pour ses abondantes récoltes\n"
                    "• Noix de coco/Copra — deuxième produit principal\n"
                    "• Pêche dans le lac — tilapia, maliputo et autres poissons frais\n"
                    "• Tours agro-éco — visiter des fermes locales et observer la culture du riz"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["hotel a naujan", "ou sejourner a naujan",
                             "pension naujan", "logement naujan",
                             "chambre naujan", "hebergement naujan",
                             "sejour pres du lac"],
                "responses": [
                    "Options d'hébergement à Naujan :\n"
                    "• Pensions de famille basiques au Poblacion (₱500–₱1 200/nuit)\n"
                    "• Auberges locales près du centre (₱800–₱2 000/nuit)\n"
                    "• Eco-lodge près du Lac Naujan (disponibilité limitée)\n"
                    "• Homestays offrant une expérience communautaire locale\n"
                    "Consultez la section Hôtels de l'app LAKBAY pour voir la disponibilité et réserver."
                ]
            },
        ],
        "de": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["voegel naujan see", "tierwelt naujan", "vogelbeobachtung naujan",
                             "philippinenente naujan", "zugvoegel naujan",
                             "krokodil naujan", "tiere am naujan see"],
                "responses": [
                    "Der Naujan-See beherbergt über 100 Vogelarten, darunter:\n"
                    "• Philippinen-Ente (Anas luzonica) — gefährdete endemische Art\n"
                    "• Zugvögel aus Sibirien und Ostasien (Nov–März)\n"
                    "• Süßwasserkrokodil (Crocodylus mindorensis) — vom Aussterben bedroht\n"
                    "Die beste Zeit zur Vogelbeobachtung ist November bis März, früh morgens."
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["barangays von naujan", "wie viele barangays hat naujan",
                             "liste der barangays naujan", "gemeinden von naujan"],
                "responses": [
                    "Naujan hat 39 Barangays in landwirtschaftlichen, Küsten- und Berggebieten. "
                    "Das Poblacion (Stadtzentrum) ist das größte. "
                    "Für die vollständige Liste kontaktieren Sie das Naujan-Gemeindeamt: (043) 208-3382."
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["landwirtschaft naujan", "reisfelder naujan",
                             "kokosnuss naujan", "kopra naujan",
                             "ernte naujan", "bauernhof naujan"],
                "responses": [
                    "Naujan ist eine der wichtigsten Agrargemeinden in Oriental Mindoro:\n"
                    "• Reis — Hauptanbau, bekannt für reiche Ernten\n"
                    "• Kokos/Kopra — zweitwichtigstes Produkt\n"
                    "• Seen-Fischerei — Tilapia, Maliputo und andere Fische\n"
                    "• Agro-Öko-Touren — lokale Farmen besuchen und Reisanbau erleben"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["hotel in naujan", "wo schlafen in naujan",
                             "pension naujan", "unterkunft naujan",
                             "zimmer naujan", "uebernachten in naujan"],
                "responses": [
                    "Unterkunftsmöglichkeiten in Naujan:\n"
                    "• Einfache Pensionen und Gästehäuser im Poblacion (₱500–₱1.200/Nacht)\n"
                    "• Lokale Herbergen in Stadtnähe (₱800–₱2.000/Nacht)\n"
                    "• Ökolodge nahe dem Naujan-See (begrenzte Verfügbarkeit)\n"
                    "• Homestays mit lokalem Gemeinschaftserlebnis\n"
                    "Schauen Sie im Hotels-Bereich der LAKBAY-App für Verfügbarkeit und Buchung."
                ]
            },
        ],
        "zh": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["瑙汉湖的鸟类", "瑙汉野生动物", "瑙汉观鸟",
                             "菲律宾鸭瑙汉", "迁徙鸟类瑙汉",
                             "瑙汉鳄鱼", "瑙汉湖动物"],
                "responses": [
                    "瑙汉湖栖息着100多种鸟类，包括：\n"
                    "• 菲律宾鸭（Anas luzonica）——濒危特有物种\n"
                    "• 来自西伯利亚和东亚的迁徙水鸟（11月–3月）\n"
                    "• 淡水鳄鱼（Crocodylus mindorensis）——极度濒危\n"
                    "观鸟最佳时间为11月至3月清晨。"
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["瑙汉的村庄", "瑙汉有多少村庄",
                             "瑙汉村庄列表", "瑙汉社区"],
                "responses": [
                    "瑙汉有39个村庄（巴朗盖），分布在农业区、沿海区和山区。"
                    "波布拉西翁（市中心）是最大的村庄。"
                    "完整列表请联系瑙汉市政厅：(043) 208-3382。"
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["瑙汉农业", "瑙汉稻田",
                             "瑙汉椰子", "瑙汉椰干",
                             "瑙汉收获", "瑙汉农场"],
                "responses": [
                    "瑙汉是东方民都洛主要农业市之一：\n"
                    "• 稻米——主要作物，以丰收著称\n"
                    "• 椰子/椰干——第二大产品\n"
                    "• 湖泊捕鱼——罗非鱼、马利普托鱼等淡水鱼\n"
                    "• 农业生态游——参观当地农场，了解稻米种植过程"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["瑙汉的酒店", "在瑙汉住哪里",
                             "瑙汉民宿", "瑙汉住宿",
                             "瑙汉房间", "湖边住宿"],
                "responses": [
                    "瑙汉住宿选择：\n"
                    "• 波布拉西翁基本民宿（₱500–₱1,200/晚）\n"
                    "• 市中心附近当地客栈（₱800–₱2,000/晚）\n"
                    "• 瑙汉湖附近生态小屋（供应有限）\n"
                    "• 家庭寄宿——体验当地社区生活\n"
                    "在LAKBAY应用的酒店板块查看可用住宿并在线预订。"
                ]
            },
        ],
        "ja": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["ナウハン湖の鳥", "ナウハン野生動物", "ナウハンバードウォッチング",
                             "フィリピンダック", "ナウハン渡り鳥",
                             "ナウハンワニ", "ナウハン湖の動物"],
                "responses": [
                    "ナウハン湖には100種以上の鳥が生息しており、以下を含みます：\n"
                    "• フィリピンダック（Anas luzonica）— 絶滅危惧種の固有種\n"
                    "• シベリアや東アジアからの渡り水鳥（11月〜3月）\n"
                    "• 淡水ワニ（Crocodylus mindorensis）— 深刻な絶滅危惧種\n"
                    "バードウォッチングの最適時期は11月〜3月の早朝です。"
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["ナウハンのバランガイ", "ナウハンのバランガイ数",
                             "ナウハンバランガイ一覧", "ナウハンのコミュニティ"],
                "responses": [
                    "ナウハンには農業地帯、沿岸部、山岳地帯に39のバランガイがあります。"
                    "ポブラシオン（市街地中心）が最も大きなバランガイです。"
                    "完全な一覧はナウハン市役所（043-208-3382）へお問い合わせください。"
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["ナウハン農業", "ナウハン田んぼ",
                             "ナウハンヤシ", "ナウハンコプラ",
                             "ナウハン収穫", "ナウハン農場"],
                "responses": [
                    "ナウハンはオリエンタルミンドロの主要農業市のひとつです：\n"
                    "• 米 — 主要作物、豊作で知られる\n"
                    "• ヤシ/コプラ — 第2の主要製品\n"
                    "• 湖での漁業 — ティラピア、マリプトなど\n"
                    "• アグロエコツアー — 地元農場を訪問し米作りを体験"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["ナウハンのホテル", "ナウハンの宿泊先",
                             "ナウハン民宿", "ナウハン宿泊",
                             "ナウハンの部屋", "湖近くの宿"],
                "responses": [
                    "ナウハンの宿泊オプション：\n"
                    "• ポブラシオンの基本的なゲストハウス（₱500〜₱1,200/泊）\n"
                    "• 中心部近くの地元の宿（₱800〜₱2,000/泊）\n"
                    "• ナウハン湖近くのエコロッジ（数限定）\n"
                    "• 地域コミュニティ体験のできるホームステイ\n"
                    "LAKBAYアプリのホテルセクションで空き状況を確認し、オンライン予約。"
                ]
            },
        ],
        "ko": [
            {
                "tag": "Naujan_Lake_Wildlife",
                "patterns": ["나우한 호수 조류", "나우한 야생동물", "나우한 조류 관찰",
                             "필리핀 오리 나우한", "나우한 철새",
                             "나우한 악어", "나우한 호수 동물"],
                "responses": [
                    "나우한 호수에는 100종 이상의 조류가 서식하며, 다음을 포함합니다:\n"
                    "• 필리핀 오리(Anas luzonica) — 멸종위기 고유종\n"
                    "• 시베리아와 동아시아에서 온 철새 (11월–3월)\n"
                    "• 민물 악어(Crocodylus mindorensis) — 극위기종\n"
                    "조류 관찰 최적 시기는 11월부터 3월 이른 아침입니다."
                ]
            },
            {
                "tag": "Naujan_Barangays",
                "patterns": ["나우한의 바랑가이", "나우한 바랑가이 수",
                             "나우한 바랑가이 목록", "나우한 커뮤니티"],
                "responses": [
                    "나우한에는 농업 지역, 해안 지역, 산간 지역에 걸쳐 39개의 바랑가이가 있습니다. "
                    "포블라시온(시내 중심)이 가장 큰 바랑가이입니다. "
                    "전체 목록은 나우한 시청(043-208-3382)에 문의하세요."
                ]
            },
            {
                "tag": "Naujan_Agriculture",
                "patterns": ["나우한 농업", "나우한 논", "나우한 코코넛",
                             "나우한 코프라", "나우한 수확",
                             "나우한 농장", "나우한 농업 관광"],
                "responses": [
                    "나우한은 오리엔탈 민도로의 주요 농업 시입니다:\n"
                    "• 쌀 — 주요 작물, 풍성한 수확으로 유명\n"
                    "• 코코넛/코프라 — 두 번째 주요 제품\n"
                    "• 호수 어업 — 틸라피아, 말리푸토 등 민물고기\n"
                    "• 농업 생태 투어 — 지역 농장 방문 및 벼농사 체험"
                ]
            },
            {
                "tag": "Accommodation_Types",
                "patterns": ["나우한 호텔", "나우한 숙박 장소",
                             "나우한 게스트하우스", "나우한 숙박",
                             "나우한 방", "호수 근처 숙박"],
                "responses": [
                    "나우한 숙박 옵션:\n"
                    "• 포블라시온의 기본 게스트하우스/펜션 (₱500–₱1,200/박)\n"
                    "• 중심부 근처 현지 여관 (₱800–₱2,000/박)\n"
                    "• 나우한 호수 근처 에코 로지 (한정된 이용 가능성)\n"
                    "• 지역 커뮤니티 경험을 제공하는 홈스테이\n"
                    "LAKBAY 앱의 호텔 섹션에서 이용 가능한 숙소를 확인하고 온선 예약하세요."
                ]
            },
        ],
    }
    return extras.get(lang, [])


def rebuild_language_file(lang, replacements, to_remove, new_intents):
    """Rebuild a language intent file with Naujan-focused content."""
    path = os.path.join(INTENTS_DIR, f'intents_{lang}.json')
    backup_path = path + '.bak'

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_count = len(data['intents'])
    new_list = []
    replaced = []
    removed = []
    kept = []

    # Tags already handled by replacements (to avoid duplicates)
    replacement_tags_produced = set()
    for k, v in replacements.items():
        if v is not None:
            out_tag = v.get('tag', k)
            replacement_tags_produced.add(out_tag)

    for intent in data['intents']:
        tag = intent['tag']
        if tag in (to_remove or set()):
            removed.append(tag)
            continue
        if tag in replacements:
            spec = replacements[tag]
            if spec is None:
                removed.append(tag)
                continue
            new_tag = spec.get('tag', tag)
            new_intent = {
                "tag": new_tag,
                "patterns": spec['patterns'],
                "responses": spec['responses']
            }
            new_list.append(new_intent)
            replaced.append(f"{tag} -> {new_tag}")
        else:
            new_list.append(intent)
            kept.append(tag)

    # Append new intents (avoid duplicates)
    existing_tags = {i['tag'] for i in new_list}
    added = []
    for ni in (new_intents or []):
        if ni['tag'] not in existing_tags:
            new_list.append(ni)
            added.append(ni['tag'])

    # Save
    shutil.copy2(path, backup_path)
    data['intents'] = new_list
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== {lang.upper()} ({os.path.basename(path)}) ===")
    print(f"  Original: {original_count} intents  Final: {len(new_list)} intents")
    print(f"  Removed ({len(removed)}): {', '.join(removed) if removed else 'none'}")
    print(f"  Replaced ({len(replaced)}): {', '.join(replaced) if replaced else 'none'}")
    print(f"  Added ({len(added)}): {', '.join(added) if added else 'none'}")
    return len(new_list)


# ─── TL rebuild ───────────────────────────────────────────────────────────────
def rebuild_tl():
    path = os.path.join(INTENTS_DIR, 'intents_tl.json')
    backup_path = path + '.bak'
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    original = {i['tag']: i for i in data['intents']}
    orig_count = len(data['intents'])

    new_list = []
    replaced = []
    removed = []

    for intent in data['intents']:
        tag = intent['tag']
        spec = TL_INTENTS.get(tag)

        if spec is None and tag in TL_INTENTS:
            # Explicitly removed
            removed.append(tag)
            continue
        elif spec is not None:
            new_tag = spec.get('tag', tag)
            new_list.append({
                "tag": new_tag,
                "patterns": spec['patterns'],
                "responses": spec['responses']
            })
            replaced.append(f"{tag} -> {new_tag}")
        else:
            new_list.append(intent)

    existing_tags = {i['tag'] for i in new_list}
    added = []
    for ni in TL_NEW_INTENTS:
        if ni['tag'] not in existing_tags:
            new_list.append(ni)
            added.append(ni['tag'])

    shutil.copy2(path, backup_path)
    data['intents'] = new_list
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n=== TL (intents_tl.json) ===")
    print(f"  Original: {orig_count} intents  Final: {len(new_list)} intents")
    print(f"  Removed ({len(removed)}): {', '.join(removed) if removed else 'none'}")
    print(f"  Replaced ({len(replaced)}): {', '.join(replaced) if replaced else 'none'}")
    print(f"  Added ({len(added)}): {', '.join(added)}")


if __name__ == '__main__':
    print("=" * 60)
    print("REBUILDING ALL LANGUAGE FILES FOR NAUJAN FOCUS")
    print("=" * 60)

    rebuild_tl()

    for lang, replacements, to_remove in [
        ('es', ES_REPLACEMENTS, ES_TO_REMOVE),
        ('fr', FR_REPLACEMENTS, FR_TO_REMOVE),
        ('de', DE_REPLACEMENTS, DE_TO_REMOVE),
        ('zh', ZH_REPLACEMENTS, ZH_TO_REMOVE),
        ('ja', JA_REPLACEMENTS, JA_TO_REMOVE),
        ('ko', KO_REPLACEMENTS, KO_TO_REMOVE),
    ]:
        extra = get_extra_intents(lang)
        rebuild_language_file(lang, replacements, to_remove, extra)

    print("\n" + "=" * 60)
    print("ALL LANGUAGE FILES REBUILT SUCCESSFULLY")
    print("=" * 60)
