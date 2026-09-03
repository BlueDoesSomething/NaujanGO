import json
import pickle
import random
import numpy as np
import nltk
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
from nltk.stem import WordNetLemmatizer
from tensorflow.keras.models import load_model

lemmatizer = WordNetLemmatizer()

script_dir = os.path.dirname(os.path.abspath(__file__))

# Load model & vectorizer
model = load_model(os.path.join(script_dir, "chatbot_model.h5"))
words = pickle.load(open(os.path.join(script_dir, "words.pkl"), "rb"))
classes = pickle.load(open(os.path.join(script_dir, "classes.pkl"), "rb"))

with open(os.path.join(script_dir, "intents.json")) as f:
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
    res = model.predict(np.array([p]), verbose=0)[0]
    ERROR_THRESHOLD = 0.25
    results = [[i,r] for i,r in enumerate(res) if r>ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def getResponse(ints, intents_json):
    tag = ints[0]['intent']
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if(i['tag']== tag):
            result = random.choice(i['responses'])
            break
    return result

def chatbot_reply(message):
    ints = predict_class(message, model)
    res = getResponse(ints, data)
    return res

# Read from stdin for API integration
import sys
import json
input_data = sys.stdin.read().strip()
if input_data:
    try:
        parsed_data = json.loads(input_data)
        message = parsed_data.get('message', '')
        response = chatbot_reply(message)
        print(response)
    except json.JSONDecodeError:
        print("Sorry, I didn't understand that.")
else:
    print("Sorry, I didn't understand that.")
