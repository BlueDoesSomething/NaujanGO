import json

# Final expansion for Waterfalls and Eco Parks
final_expansion = {
    'Naujan_Waterfalls': {
        'zh': [
            "瑙汉瀑布",
            "卡拉查瀑布",
            "巴塔拉瀑布",
            "森林瀑布",
            "瑙汉瀑布旅游",
            "瑙汉瀑布游览",
            "瑙汉最好的瀑布",
            "瑙汉瀑布景观",
            "瑙汉瀑布漂流",
            "瑙汉瀑布游泳",
            "瑙汉瀑布观景",
            "蒙特拉戈瀑布",
            "瑙汉瀑布照相",
            "瑙汉瀑布步道",
            "瑙汉瀑布自然",
            "瑙汉所有瀑布",
            "瑙汉瀑布怎么去",
            "瑙汉瀑布景点",
            "瑙汉瀑布推荐"
        ],
        'ja': [
            "ナウジャン滝",
            "カラチャ滝",
            "バターラ滝",
            "森の滝",
            "ナウジャン滝ツアー",
            "ナウジャン滝観光",
            "ナウジャン最高の滝",
            "ナウジャン滝景観",
            "ナウジャン滝ラフティング",
            "ナウジャン滝水泳",
            "ナウジャン滝眺望",
            "モンテラゴ滝",
            "ナウジャン滝写真撮影",
            "ナウジャン滝トレッキング",
            "ナウジャン滝自然",
            "ナウジャンすべての滝",
            "ナウジャン滝への行き方",
            "ナウジャン滝スポット",
            "ナウジャン滝おすすめ"
        ],
        'ko': [
            "나우한 폭포",
            "카라차 폭포",
            "바탈라 폭포",
            "숲 폭포",
            "나우한 폭포 투어",
            "나우한 폭포 관광",
            "나우한 최고의 폭포",
            "나우한 폭포 경관",
            "나우한 폭포 래프팅",
            "나우한 폭포 수영",
            "나우한 폭포 전망",
            "몬테라고 폭포",
            "나우한 폭포 사진",
            "나우한 폭포 트레킹",
            "나우한 폭포 자연",
            "나우한 모든 폭포",
            "나우한 폭포 가는 방법",
            "나우한 폭포 명소",
            "나우한 폭포 추천"
        ]
    },
    'Naujan_Eco_Parks': {
        'zh': [
            "瑙汉生态公园",
            "瑙汉农场",
            "道水百合",
            "德杰姆副有机疗愈公园",
            "农业园区",
            "瑙汉生态旅游",
            "瑙汉有机农场",
            "瑙汉农业体验",
            "瑙汉生态园",
            "瑙汉农业景点",
            "瑙汉农业旅游",
            "瑙汉水稻田",
            "瑙汉农场参观",
            "瑙汉自然保护区",
            "瑙汉植物园",
            "瑙汉农业教育",
            "瑙汉有机产品",
            "瑙汉农村体验",
            "瑙汉绿色农业"
        ],
        'ja': [
            "ナウジャンエコパーク",
            "ナウジャン農場",
            "ダオ睡蓮",
            "DJMV有機ヒーリングパーク",
            "農業公園",
            "ナウジャンエコツアー",
            "ナウジャン有機農場",
            "ナウジャン農業体験",
            "ナウジャン生態園",
            "ナウジャン農業スポット",
            "ナウジャン農業観光",
            "ナウジャン稲田",
            "ナウジャン農場訪問",
            "ナウジャン自然保護区",
            "ナウジャン植物園",
            "ナウジャン農業教育",
            "ナウジャン有機製品",
            "ナウジャン農村体験",
            "ナウジャン緑の農業"
        ],
        'ko': [
            "나우한 에코파크",
            "나우한 농장",
            "다오 수련",
            "DJMV 유기 힐링 파크",
            "농업 공원",
            "나우한 에코 투어",
            "나우한 유기농 농장",
            "나우한 농업 체험",
            "나우한 생태원",
            "나우한 농업 명소",
            "나우한 농업 관광",
            "나우한 논",
            "나우한 농장 방문",
            "나우한 자연 보호 구역",
            "나우한 식물원",
            "나우한 농업 교육",
            "나우한 유기농 제품",
            "나우한 농촌 체험",
            "나우한 녹색 농업"
        ]
    }
}

# Read all three Asian language files
languages = {
    'zh': 'intents/intents_zh.json',
    'ja': 'intents/intents_ja.json',
    'ko': 'intents/intents_ko.json'
}

total_expansion = 0

for lang_code, file_path in languages.items():
    print(f"Final expansion for {lang_code.upper()}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for intent in data['intents']:
        tag = intent['tag']
        
        if tag in final_expansion and lang_code in final_expansion[tag]:
            new_patterns = final_expansion[tag][lang_code]
            old_count = len(intent['patterns'])
            intent['patterns'] = new_patterns
            new_count = len(intent['patterns'])
            print(f"  {tag}: {old_count} → {new_count} patterns")
            total_expansion += new_count - old_count
    
    # Save the file
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✓ Final expansion: +{total_expansion} patterns across all languages")
print("=" * 70)
print("All Asian languages ready for training!")
print("=" * 70)
