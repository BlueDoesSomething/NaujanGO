# NLP Development Process

Purpose: Document the development lifecycle of the project's chatbot and multilingual NLP model, including how intent classification, language handling, and response generation were designed, trained, evaluated, and improved.

## Project Context
The tourism chatbot in this project is designed for Naujan, Oriental Mindoro and supports multiple languages: English, Spanish, Tagalog, Chinese, Japanese, Korean, French, and German. The model is implemented using multilingual sentence embeddings and language-specific intent classifiers, allowing the system to recognize user intent across both local tourism topics and user queries in different languages.

The major implementation files include:
- `MULTILINGUAL_CHATBOT/enhanced_train_multilingual.py` for training the models
- `MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py` for inference and response generation
- `MULTILINGUAL_CHATBOT/intents/` for language-specific intent datasets
- `DATASETS/` for baseline chatbot data and evaluation scripts

## 1. Problem Definition
The goal was to build a chatbot that could:
- understand tourism-related questions in multiple languages,
- classify user intent correctly,
- handle informal, shortened, or misspelled user messages,
- respond with relevant information based on Naujan tourism context, and
- remain robust when confidence is low by falling back to keyword matching.

This is a multilingual intent-classification problem rather than a generic open-domain chatbot. Because the system is domain-specific, the dataset focuses on tourism categories such as location, attractions, activities, accommodation, transport, weather, food, and services.

## 2. Data Collection and Dataset Design
The chatbot uses structured intent files stored in `MULTILINGUAL_CHATBOT/intents/`. Each language has a separate dataset file such as `intents_en.json`, `intents_es.json`, and `intents_tl.json`.

Each intent contains:
- a tag or intent label,
- training patterns/examples,
- a list of sample responses,
- a language code that indicates the dataset language.

The development process followed these steps:
- collected real-world tourism-related user queries,
- expanded datasets with paraphrased patterns,
- added location-specific phrases relevant to Naujan,
- included multilingual variations for each intent,
- ensured balanced coverage for common tourism intents.

This is important because a multilingual chatbot depends not only on the size of the dataset but also on the quality and diversity of patterns within each language.

## 3. Data Preprocessing
Before training, the text is normalized so the model can handle lexical variations more consistently.

The preprocessing pipeline includes:
- converting text to lowercase,
- standardizing whitespace,
- removing punctuation and noisy characters,
- applying typo correction for common misspellings,
- normalizing region-specific or informal phrases,
- preserving language-specific wording where needed.

In the inference script, the function `normalize_input()` applies these transformations to reduce differences caused by user input variations. This is especially important for tourist chatbot queries, where users often write informal messages such as "wat is the best place" or "where is naujan lake".

## 4. Model Selection
The final model uses a multilingual sentence embedding model combined with a support vector machine (SVM) classifier.

### Model architecture
- Embedding model: `SentenceTransformer('distiluse-base-multilingual-cased-v2')`
- Classifier: `sklearn.svm.SVC` with an RBF kernel
- Label encoder: `LabelEncoder` for mapping intent names to numeric classes

This design was selected because:
- multilingual sentence embeddings can map semantically similar phrases across languages into a shared vector space,
- the SVM classifier is effective for intent classification when there is a moderate-sized, structured labeled dataset,
- language-specific training allows better calibration and more accurate predictions for each target language.

The training script `enhanced_train_multilingual.py` loads each language dataset separately, encodes the patterns, and trains a dedicated classifier for that language.

## 5. Training Process
The model development workflow for this project follows a structured approach:

1. Load language-specific intent files.
2. Extract the example patterns and their corresponding labels.
3. Convert text into multilingual embeddings using the SentenceTransformer model.
4. Encode labels with `LabelEncoder`.
5. Train an SVM classifier for each language.
6. Tune hyperparameters such as `C` and `gamma` based on the performance of each language.
7. Save the trained model, encoder, and intent-response mapping.

The script also logs:
- total number of intents,
- total number of training patterns,
- pattern distribution across intents,
- training accuracy,
- language-specific model performance.

This is a practical and transparent training workflow suitable for an academic project because it is easy to explain and evaluate.

## 6. Multilingual Design Strategy
A key requirement of this project is multilingual support. Instead of using one global classifier for all languages, the system trains separate models per language and stores them individually.

This design provides several benefits:
- better intent separation between languages,
- easier debugging of underperforming languages,
- language-specific hyperparameter tuning,
- cleaner integration with the chatbot API.

At runtime, the chatbot loads the relevant model based on the detected language and the current conversation context. This is implemented in `chatbot_multilingual.py`, which loads the shared multilingual embedder and then selects the relevant trained classifier.

## 7. Confidence Handling and Fallback Logic
The system includes a confidence threshold mechanism to prevent wrong predictions when the model is uncertain.

In the inference script:
- the model predicts intent and probability,
- the probability is compared with a threshold,
- if the confidence is below the threshold, a keyword-based fallback is triggered.

This is important because tourism queries are often short and ambiguous. For example, a message such as "naujan lake" could be interpreted incorrectly without a fallback mechanism. The keyword map ensures that strong phrases still map to the correct intent even when the embedding model is uncertain.

This step improved the real-world reliability of the chatbot significantly.

## 8. Evaluation and Testing
The system was evaluated using both quantitative and qualitative methods.

### Quantitative evaluation
The training script computes:
- overall training accuracy,
- per-intent distribution,
- per-language model quality,
- class-level accuracy.

The academic evaluation process also includes:
- accuracy,
- precision,
- recall,
- F1-score,
- macro averages for intent classification,
- language-wise correctness for multilingual performance.

### Qualitative evaluation
The chatbot was also tested with real conversations and edge cases, including:
- informal phrasing,
- short messages,
- spelling mistakes,
- mixed-language questions,
- low-confidence inputs,
- local tourism topics specifically related to Naujan.

This combination of metrics and manual validation makes the project more credible and suitable for demonstration to a professor or panel.

### Current evaluation results
The repository's labeled sample test files produce the following results:

| Evaluation | Result | Test size |
|---|---:|---:|
| Chatbot intent accuracy | 80% | 10 examples |
| Chatbot weighted F1-score | 79% | 10 examples |
| Multilingual language-selector accuracy | 70% | 10 examples |

The chatbot's per-intent F1-scores are 80% for `BookHotel`, 80% for `CancelBooking`, 86% for `FindAttraction`, and 67% for `GetDirections`. The language-selector results are 100% for English and French, and 50% for Spanish, Portuguese, and Tagalog. The standalone metric PNG charts are `chatbot_accuracy.png`, `chatbot_precision.png`, `chatbot_recall.png`, `chatbot_f1_score.png`, `multilingual_accuracy.png`, `multilingual_precision.png`, `multilingual_recall.png`, and `multilingual_f1_score.png`, all in `docs/images/`. The supporting confusion matrices are [intent_confusion_matrix.png](images/intent_confusion_matrix.png) and [confusion_matrix.png](images/confusion_matrix.png).

The results should be interpreted as an initial evaluation, not as a final production accuracy claim. The sample contains only 10 examples per evaluation task, so a larger unseen test set is required for a stronger academic conclusion. The older 100% result in `DATASETS/EVALUATION_METRICS/evaluation_results.txt` was produced from a different baseline evaluation and should not be combined with these results.

## 9. Iterative Improvement Process
The development process was not one-time training; it was iterative.

The project improved by:
- expanding intent patterns for weak languages,
- adding typo mappings for common user mistakes,
- refining keyword fallback mappings,
- balancing pattern counts across intents,
- tuning SVM parameters for each language,
- checking model outputs against real examples.

This continuous improvement cycle is typical in practical ML/NLP projects: train, test, analyze failure cases, revise the dataset, retrain, and evaluate again.

## 10. Deployment and Integration
After training, the model was integrated into the larger application backend. The chatbot backend loads the trained models, receives user messages from the frontend, normalizes the input, detects or infers the language, predicts the intent, and returns an appropriate response.

This integration ensures that:
- the model is reusable in the application,
- the chatbot can answer in the selected language,
- user interactions can be logged and later improved,
- the system remains scalable for future expansions.

## 11. Summary of the Development Process
The ML/NLP development process for this chatbot can be summarized as follows:

1. Define the tourism chatbot use case and multilingual requirements.
2. Collect and structure intent datasets per language.
3. Clean, normalize, and expand the text data.
4. Train multilingual embeddings with a language-specific SVM classifier.
5. Tune hyperparameters to improve per-language performance.
6. Add confidence thresholds and keyword fallback for robustness.
7. Evaluate model quality with accuracy and real test cases.
8. Improve the dataset and retrain iteratively.
9. Integrate the model into the final application backend.

This project demonstrates a simple but effective multilingual NLP pipeline for a tourism assistant, combining modern sentence embeddings with classical machine learning for accurate intent recognition and practical deployment.

## References
- `MULTILINGUAL_CHATBOT/enhanced_train_multilingual.py`
- `MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py`
- `MULTILINGUAL_CHATBOT/ARCHITECTURE.md`
- `docs/language-selector.md`
- `docs/language-selector-accuracy.md`
- `docs/chatbot-eval-plan.md`
