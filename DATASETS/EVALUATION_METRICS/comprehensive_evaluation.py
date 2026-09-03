import json
import pickle
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix, roc_auc_score, roc_curve, auc
from sklearn.preprocessing import label_binarize
from tensorflow.keras.models import load_model
import nltk
from nltk.stem import WordNetLemmatizer
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import time

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
prediction_times = []

for pattern, true_label in zip(test_patterns, test_labels):
    y_true.append(true_label)
    start_time = time.time()
    prediction = predict_class(pattern, model)
    end_time = time.time()
    prediction_times.append(end_time - start_time)

    if prediction:
        y_pred.append(prediction[0]['intent'])
    else:
        y_pred.append("unknown")

# Calculate comprehensive metrics
accuracy = accuracy_score(y_true, y_pred)
precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

# Calculate per-class metrics
precision_per_class = precision_score(y_true, y_pred, average=None, zero_division=0)
recall_per_class = recall_score(y_true, y_pred, average=None, zero_division=0)
f1_per_class = f1_score(y_true, y_pred, average=None, zero_division=0)

# Dataset statistics
total_patterns = len(test_patterns)
total_intents = len(set(test_labels))
patterns_per_intent = Counter(test_labels)
avg_patterns_per_intent = total_patterns / total_intents
vocab_size = len(words)

# Performance statistics
avg_prediction_time = np.mean(prediction_times)
min_prediction_time = np.min(prediction_times)
max_prediction_time = np.max(prediction_time)

# Model architecture info
model.summary(print_fn=lambda x: None)  # Capture model summary
model_config = model.get_config()

print("=== COMPREHENSIVE CHATBOT EVALUATION REPORT ===")
print("=" * 60)

print("\n1. OVERALL PERFORMANCE METRICS:")
print("-" * 40)
print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"Precision (weighted): {precision:.4f} ({precision*100:.2f}%)")
print(f"Recall (weighted): {recall:.4f} ({recall*100:.2f}%)")
print(f"F1-Score (weighted): {f1:.4f} ({f1*100:.2f}%)")

print("\n2. DATASET STATISTICS:")
print("-" * 40)
print(f"Total patterns: {total_patterns}")
print(f"Total intents: {total_intents}")
print(f"Average patterns per intent: {avg_patterns_per_intent:.1f}")
print(f"Vocabulary size: {vocab_size} unique words")
print(f"Intent distribution: {dict(patterns_per_intent)}")

print("\n3. PERFORMANCE STATISTICS:")
print("-" * 40)
print(f"Average prediction time: {avg_prediction_time*1000:.2f} ms")
print(f"Min prediction time: {min_prediction_time*1000:.2f} ms")
print(f"Max prediction time: {max_prediction_time*1000:.2f} ms")
print(f"Predictions per second: {1/avg_prediction_time:.2f}")

print("\n4. MODEL ARCHITECTURE:")
print("-" * 40)
print(f"Model type: TensorFlow Sequential Neural Network")
print(f"Input shape: ({len(words)},)")
print(f"Hidden layers: 2 (128 neurons, 64 neurons)")
print(f"Output layer: {len(classes)} neurons (softmax)")
print(f"Optimizer: SGD (lr=0.01, momentum=0.9, nesterov=True)")
print(f"Loss function: categorical_crossentropy")
print(f"Training epochs: 300")
print(f"Batch size: 5")

print("\n5. PER-CLASS PERFORMANCE:")
print("-" * 40)
for i, intent in enumerate(classes):
    if i < len(precision_per_class):
        print(f"{intent}:")
        print(".3f")
        print(".3f")
        print(".3f")
        print()

print("\n6. TRAINING CONFIGURATION:")
print("-" * 40)
print("Preprocessing:")
print("- NLTK tokenization and lemmatization")
print("- Bag-of-words representation")
print("- Error threshold: 0.25")
print("Training:")
print("- 300 epochs")
print("- Batch size: 5")
print("- Dropout: 0.5 (after each hidden layer)")
print("- Early stopping: None")

print("\n7. PREDICTION EXAMPLES:")
print("-" * 40)
test_examples = [
    ("Hello", "greeting"),
    ("What can I do in Puerto Galera?", "puerto_galera"),
    ("I want to book a hotel", "booking"),
    ("Where can I eat?", "dining"),
    ("How do I get to Calapan?", "calapan"),
    ("Tell me about diving", "about"),
    ("Goodbye", "goodbye")
]

for text, expected in test_examples:
    pred = predict_class(text, model)
    if pred:
        predicted_intent = pred[0]['intent']
        confidence = float(pred[0]['probability'])
        status = "✓" if predicted_intent == expected else "✗"
        print(f"{status} '{text}' -> {predicted_intent} ({confidence:.3f}) [Expected: {expected}]")
    else:
        print(f"✗ '{text}' -> No prediction [Expected: {expected}]")

print("\n8. CONFIDENCE ANALYSIS:")
print("-" * 40)
confidences = []
for pattern in test_patterns[:20]:  # Sample first 20
    pred = predict_class(pattern, model)
    if pred:
        confidences.append(float(pred[0]['probability']))

if confidences:
    print(f"Average confidence: {np.mean(confidences):.3f}")
    print(f"Min confidence: {np.min(confidences):.3f}")
    print(f"Max confidence: {np.max(confidences):.3f}")
    print(f"Confidence std: {np.std(confidences):.3f}")

print("\n9. CLASSIFICATION REPORT:")
print("-" * 40)
print(classification_report(y_true, y_pred, zero_division=0))

print("\n10. RECOMMENDATIONS:")
print("-" * 40)
if accuracy == 1.0:
    print("✓ Perfect accuracy achieved!")
    print("✓ Model is well-trained and ready for production")
    print("✓ Consider adding more diverse training data for robustness")
else:
    print("⚠ Consider additional training or data augmentation")
    print("⚠ Review misclassified intents for pattern improvement")

print("\n" + "=" * 60)
print("EVALUATION COMPLETE")
print("=" * 60)

# Save comprehensive report
with open("DATASETS/comprehensive_evaluation_report.txt", "w") as f:
    f.write("=== COMPREHENSIVE CHATBOT EVALUATION REPORT ===\n")
    f.write("=" * 60 + "\n\n")
    f.write("1. OVERALL PERFORMANCE METRICS:\n")
    f.write("-" * 40 + "\n")
    f.write(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)\n")
    f.write(f"Precision (weighted): {precision:.4f} ({precision*100:.2f}%)\n")
    f.write(f"Recall (weighted): {recall:.4f} ({recall*100:.2f}%)\n")
    f.write(f"F1-Score (weighted): {f1:.4f} ({f1*100:.2f}%)\n\n")
    f.write("2. DATASET STATISTICS:\n")
    f.write("-" * 40 + "\n")
    f.write(f"Total patterns: {total_patterns}\n")
    f.write(f"Total intents: {total_intents}\n")
    f.write(f"Average patterns per intent: {avg_patterns_per_intent:.1f}\n")
    f.write(f"Vocabulary size: {vocab_size} unique words\n\n")
    f.write("3. PERFORMANCE STATISTICS:\n")
    f.write("-" * 40 + "\n")
    f.write(f"Average prediction time: {avg_prediction_time*1000:.2f} ms\n")
    f.write(f"Predictions per second: {1/avg_prediction_time:.2f}\n\n")
    f.write("4. MODEL ARCHITECTURE:\n")
    f.write("-" * 40 + "\n")
    f.write("TensorFlow Sequential Neural Network\n")
    f.write(f"Input: ({len(words)},) -> Hidden: 128 -> Hidden: 64 -> Output: {len(classes)}\n")
    f.write("Activation: ReLU (hidden), Softmax (output)\n")
    f.write("Dropout: 0.5 after each hidden layer\n\n")
    f.write("Report generated automatically by comprehensive evaluation script.\n")

print("\nComprehensive evaluation report saved as 'DATASETS/comprehensive_evaluation_report.txt'")
