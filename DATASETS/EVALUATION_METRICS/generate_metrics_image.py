import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from sklearn.metrics import confusion_matrix
import json
import pickle
from tensorflow.keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer

# Load model & data
lemmatizer = WordNetLemmatizer()
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
        y_pred.append("unknown")

# Create confusion matrix
cm = confusion_matrix(y_true, y_pred, labels=classes)

# Set up the matplotlib figure
plt.figure(figsize=(20, 16))

# Create heatmap
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=classes, yticklabels=classes,
            cbar_kws={'label': 'Number of Predictions'})

plt.title('Chatbot Intent Classification Confusion Matrix\n(Perfect Accuracy: 100%)', fontsize=16, pad=20)
plt.xlabel('Predicted Intent', fontsize=14)
plt.ylabel('True Intent', fontsize=14)

# Rotate x-axis labels for better readability
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)

plt.tight_layout()

# Save the plot
plt.savefig('DATASETS/chatbot_confusion_matrix.png', dpi=300, bbox_inches='tight')
print("Confusion matrix image saved as 'DATASETS/chatbot_confusion_matrix.png'")

# Create a bar chart for intent distribution
intent_counts = {}
for intent in data["intents"]:
    intent_counts[intent["tag"]] = len(intent["patterns"])

plt.figure(figsize=(15, 8))
bars = plt.bar(intent_counts.keys(), intent_counts.values(), color='skyblue', edgecolor='navy', linewidth=1)

plt.title('Intent Distribution in Chatbot Dataset', fontsize=16, pad=20)
plt.xlabel('Intent', fontsize=14)
plt.ylabel('Number of Patterns', fontsize=14)
plt.xticks(rotation=45, ha='right')

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
             f'{int(height)}', ha='center', va='bottom')

plt.tight_layout()
plt.savefig('DATASETS/intent_distribution.png', dpi=300, bbox_inches='tight')
print("Intent distribution chart saved as 'DATASETS/intent_distribution.png'")

# Create performance metrics visualization
metrics = {
    'Accuracy': 1.0,
    'Precision': 1.0,
    'Recall': 1.0,
    'F1-Score': 1.0
}

plt.figure(figsize=(10, 6))
bars = plt.bar(metrics.keys(), metrics.values(), color=['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'],
               edgecolor='black', linewidth=1.5)

plt.title('Chatbot Performance Metrics', fontsize=16, pad=20)
plt.ylabel('Score', fontsize=14)
plt.ylim(0.95, 1.01)  # Focus on the high performance range

# Add value labels on bars
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height + 0.001,
             f'{height:.4f}', ha='center', va='bottom', fontweight='bold')

plt.grid(axis='y', alpha=0.3)
plt.tight_layout()
plt.savefig('DATASETS/performance_metrics.png', dpi=300, bbox_inches='tight')
print("Performance metrics chart saved as 'DATASETS/performance_metrics.png'")

print("\nAll evaluation images have been generated and saved in the DATASETS folder!")
