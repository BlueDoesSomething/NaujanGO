from sentence_transformers import SentenceTransformer
import pickle
from pathlib import Path
import numpy as np

# Load the model and encoder
model = SentenceTransformer('distiluse-base-multilingual-cased-v2')
classifier_path = Path('models/intent_classifier_en.pkl')
encoder_path = Path('models/label_encoder_en.pkl')

with open(classifier_path, 'rb') as f:
    classifier = pickle.load(f)
with open(encoder_path, 'rb') as f:
    le = pickle.load(f)

# Test queries
test_queries = [
    'What are the top attractions in Naujan?',
    'Show me the interactive map of Naujan',
    'What is the best time to visit Naujan?',
    'What hotels are available?'
]

for query in test_queries:
    # Encode
    embedding = model.encode(query)
    
    # Predict with probability
    proba = classifier.predict_proba([embedding])[0]
    confidence = np.max(proba)
    tag_index = np.argmax(proba)
    pred_intent = le.inverse_transform([tag_index])[0]
    
    print(f'Query: {query}')
    print(f'  Predicted Intent: {pred_intent}')
    print(f'  Confidence (proba): {confidence:.6f}')
    print(f'  BELOW 0.18 threshold? {confidence < 0.18}')
    print()
