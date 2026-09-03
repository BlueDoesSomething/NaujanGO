import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout
from tensorflow.keras.optimizers import SGD
import random
import pickle
import nltk
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.metrics import confusion_matrix, roc_curve, auc
from sklearn.preprocessing import label_binarize
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os


if __name__ == "__main__":
    lemmatizer = WordNetLemmatizer()

    # Load JSON data (use the same intents.json used by embeddings trainer)
    with open('NAUJANDATASETS/intents.json', encoding='utf-8') as f:
        data = json.load(f)

    words = []
    classes = []
    documents = []
    ignore_letters = ["?", "!", ".", ","]

    for intent in data["intents"]:
        for pattern in intent["patterns"]:
            word_list = nltk.word_tokenize(pattern)
            words.extend(word_list)
            documents.append((word_list, intent["tag"]))
            if intent["tag"] not in classes:
                classes.append(intent["tag"])

    words = [lemmatizer.lemmatize(w.lower()) for w in words if w not in ignore_letters]
    words = sorted(list(set(words)))

    classes = sorted(list(set(classes)))

    pickle.dump(words, open("words.pkl", "wb"))
    pickle.dump(classes, open("classes.pkl", "wb"))

    training = []
    output_empty = [0] * len(classes)

    for document in documents:
        bag = []
        pattern_words = [lemmatizer.lemmatize(word.lower()) for word in document[0]]

        for w in words:
            bag.append(1 if w in pattern_words else 0)

        output_row = list(output_empty)
        output_row[classes.index(document[1])] = 1
        training.append(bag + output_row)

    random.shuffle(training)
    training = np.array(training)

    X = training[:, :len(words)]
    y = training[:, len(words):]

    # Split into train/test for evaluation
    train_x, test_x, train_y, test_y = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = Sequential()
    model.add(Dense(128, activation="relu", input_shape=(len(train_x[0]),)))
    model.add(Dropout(0.5))
    model.add(Dense(64, activation="relu"))
    model.add(Dropout(0.5))
    model.add(Dense(len(train_y[0]), activation="softmax"))

    sgd = SGD(learning_rate=0.01, momentum=0.9, nesterov=True)
    model.compile(loss="categorical_crossentropy", optimizer=sgd, metrics=["accuracy"])

    model.fit(np.array(train_x), np.array(train_y), epochs=300, batch_size=5, verbose=1)

    model.save("chatbot_model.h5")

    # Evaluation on test set
    preds = model.predict(np.array(test_x))
    pred_classes = np.argmax(preds, axis=1)
    true_classes = np.argmax(np.array(test_y), axis=1)

    acc = accuracy_score(true_classes, pred_classes)
    print(f"Test Accuracy (NN): {acc:.4f}")

    report = classification_report(true_classes, pred_classes, target_names=classes)
    print("\nClassification Report (NN):\n", report)

    # Create charts directory
    charts_dir = os.path.join('NAUJANDATASETS', 'charts')
    os.makedirs(charts_dir, exist_ok=True)

    # Confusion Matrix
    cm = confusion_matrix(true_classes, pred_classes)
    plt.figure(figsize=(12,10))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.title('Confusion Matrix (NN)')
    plt.tight_layout()
    cm_path = os.path.join(charts_dir, 'confusion_matrix_nn.png')
    plt.savefig(cm_path, dpi=300)
    plt.close()

    # Classification report heatmap
    report_dict = classification_report(true_classes, pred_classes, target_names=classes, output_dict=True)
    df_report = pd.DataFrame(report_dict).iloc[:-1, :].T  # exclude accuracy row
    plt.figure(figsize=(14,6))
    sns.heatmap(df_report, annot=True, cmap='Greens', cbar=True, linewidths=0.5, linecolor='gray')
    plt.title('Classification Report (NN)')
    plt.xticks(rotation=45, ha='right')
    plt.yticks(rotation=0)
    plt.tight_layout()
    report_path = os.path.join(charts_dir, 'classification_report_nn.png')
    plt.savefig(report_path, dpi=300)
    plt.close()

    # ROC Curve (micro-average and per-class)
    y_test_bin = label_binarize(true_classes, classes=range(len(classes)))
    # preds are probabilities already
    y_score = preds

    fpr = dict()
    tpr = dict()
    roc_auc = dict()
    for i in range(len(classes)):
        try:
            fpr[i], tpr[i], _ = roc_curve(y_test_bin[:, i], y_score[:, i])
            roc_auc[i] = auc(fpr[i], tpr[i])
        except Exception:
            fpr[i], tpr[i], roc_auc[i] = [0], [0], 0.0

    # micro-average
    try:
        fpr['micro'], tpr['micro'], _ = roc_curve(y_test_bin.ravel(), y_score.ravel())
        roc_auc['micro'] = auc(fpr['micro'], tpr['micro'])
    except Exception:
        fpr['micro'], tpr['micro'], roc_auc['micro'] = [0], [0], 0.0

    plt.figure(figsize=(10,8))
    if roc_auc.get('micro', 0):
        plt.plot(fpr['micro'], tpr['micro'], label=f"micro-average (area = {roc_auc['micro']:.2f})", color='deeppink', linestyle=':', linewidth=4)

    colors = sns.color_palette('hls', len(classes))
    for i, color in zip(range(len(classes)), colors):
        if len(fpr.get(i, [])) > 1:
            plt.plot(fpr[i], tpr[i], color=color, lw=2, label=f"{classes[i]} (area = {roc_auc[i]:.2f})")

    plt.plot([0,1], [0,1], 'k--', lw=2)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve (NN)')
    plt.legend(loc='lower right')
    roc_path = os.path.join(charts_dir, 'roc_curve_nn.png')
    plt.savefig(roc_path, dpi=300)
    plt.close()

    print("Training complete and model saved to chatbot_model.h5")
