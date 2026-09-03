import json
import pickle
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
from tensorflow.keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer

lemmatizer = WordNetLemmatizer()

# Load model & data
model = load_model("chatbot_model.h5")
words = pickle.load(open("words.pkl", "rb"))
classes = pickle.load(open("classes.pkl", "rb"))

with open("DATASETS/intents.json") as f:
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

# Prepare test data
test_patterns = []
test_labels = []

for intent in data["intents"]:
    for pattern in intent["patterns"]:
        test_patterns.append(pattern)
        test_labels.append(intent["tag"])

# Make predictions
y_true = []
y_pred = []

for pattern, true_label in zip(test_patterns, test_labels):
    y_true.append(true_label)
    prediction = predict_class(pattern, model)
    if prediction:
        y_pred.append(prediction[0]['intent'])
    else:
        y_pred.append("unknown")  # Handle cases where no intent is predicted

# Calculate metrics
accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

print("=== Chatbot Evaluation Metrics ===")
print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1-Score: {f1:.4f}")
print("\n=== Classification Report ===")
print(classification_report(y_true, y_pred, zero_division=0))

print("\n=== Confusion Matrix ===")
cm = confusion_matrix(y_true, y_pred, labels=classes)
print("Classes:", classes)
print(cm)

# Test with some example conversations
print("\n=== Sample Predictions ===")
test_messages = [
    "Hello there",
    "What can I do in Puerto Galera?",
    "I want to book a hotel",
    "Where can I eat?",
    "How do I get to Calapan?",
    "Tell me about diving",
    "Goodbye"
]

for msg in test_messages:
    pred = predict_class(msg, model)
    if pred:
        print(f"Input: '{msg}' -> Predicted: {pred[0]['intent']} (confidence: {pred[0]['probability']})")
    else:
        print(f"Input: '{msg}' -> No prediction")
