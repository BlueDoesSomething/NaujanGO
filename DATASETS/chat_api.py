import json
import pickle
import random
import numpy as np
import nltk
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.models import load_model
import sys
import os

lemmatizer = WordNetLemmatizer()

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)  # Go up one level to CAPSTONE

# Load model & vectorizer with absolute paths
model_path = os.path.join(project_root, "chatbot_model.h5")
words_path = os.path.join(project_root, "words.pkl")
classes_path = os.path.join(project_root, "classes.pkl")
intents_path = os.path.join(script_dir, "intents.json")

model = load_model(model_path)
words = pickle.load(open(words_path, "rb"))
classes = pickle.load(open(classes_path, "rb"))

with open(intents_path) as f:
    data = json.load(f)

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words, show_details=True):
    sentence_words = clean_up_sentence(sentence)
    bag = [0]*len(words)
    for s in sentence_words:
        for i,w in enumerate(words):
            if w == s:
                bag[i] = 1
    return(np.array(bag))

def predict_class(sentence, model):
    p = bow(sentence, words,show_details=False)
    res = model.predict(np.array([p]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i,r] for i,r in enumerate(res) if r>ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def getResponse(ints, intents_json):
    if not ints:
        return 'Sorry, I didn\'t understand that.'
    tag = ints[0]['intent']
    confidence = float(ints[0]['probability'])
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if(i['tag']== tag):
            result = random.choice(i['responses'])
            break
    # Include prediction details in response
    prediction_info = f"1/1 ==================== 0s {int(confidence*100)}ms/step"
    return f"{result}\n\nPrediction: {tag} ({confidence:.4f})\n{prediction_info}"

def chatbot_reply(message):
    ints = predict_class(message, model)
    res = getResponse(ints, data)
    return res

# Read from stdin
input_data = sys.stdin.read()
try:
    data = json.loads(input_data)
    message = data['message']
    response = chatbot_reply(message)
    print(response)
except Exception as e:
    print("Sorry, I didn't understand that.")
    print(f"Debug: Error - {str(e)}", file=sys.stderr)
    print(f"Debug: Input data - '{input_data}'", file=sys.stderr)
