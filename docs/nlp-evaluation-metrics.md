# NLP & Language Selector — Evaluation Metrics

This document lists recommended evaluation metrics, formulas, charts, and monitoring guidance for the chatbot's NLP (intent classification + entity extraction) and the Language Selector.

1) Intent Classification
- Primary metrics:
  - Accuracy: fraction of correct labels. Formula: $\frac{TP+TN}{TP+TN+FP+FN}$ (for multi-class use overall accuracy).
  - Precision / Recall / F1 per class: useful for imbalanced intents. F1 = $2 \cdot \frac{precision \cdot recall}{precision+recall}$.
  - Macro-F1 vs Micro-F1: use macro-F1 to treat all intents equally; micro-F1 to weight by support.
  - Support counts: report the number of examples per intent so low-data classes are visible.
  - Top-2 / Top-3 accuracy: useful for intents that are often ambiguous or where a second candidate can be recovered.
  - Confusion matrix: reveals common confusions between intents.
  - False positive / false negative rate by intent: helps identify when a specific intent is over-predicted or under-detected.
- Recommended charts: per-intent F1 bar chart, confusion matrix heatmap, support-count histogram, confidence distribution histogram by intent.
- Example thresholds (tune to your product): aim for macro-F1 >= 0.85 for high-value intents; accept lower for niche intents.
-
- Technical Evaluation:
  - Accuracy
  - Precision
  - Recall
  - F1-Score
-
- System Evaluation:
  - Response Accuracy
  - Intent Recognition Rate
  - Multilingual Accuracy

2) Entity Extraction (NER / slot filling)
- Evaluation levels:
  - Token-level: precision/recall/F1 computed across labeled tokens.
  - Span-level (exact-match): correct if entire entity span and label match; report precision/recall/F1.
  - relaxed-match: partial credit for overlapping spans (optional).
- Recommended charts: per-entity F1 bar chart, span-length vs F1 scatter, error examples table.

3) End-to-end / Combined
- Exact-match intent+entities: fraction of utterances where both intent and all entities are correct.
- Use as a user-facing proxy metric (how often the system fully understood a message).

4) Language Selector
- Metrics (multi-class identification):
  - Overall accuracy: fraction of messages with correct language.
  - Per-language accuracy: accuracy per `true_lang` bucket.
  - Confusion matrix (normalized per-row): shows common mis-classifications (e.g., `pt` vs `es`).
  - Top-2 accuracy: useful when languages are ambiguous in short inputs.
  - Unknown / fallback rate: percent of messages where the selector could not decide confidently and deferred to a fallback.
  - Override success / user-corrected rate: fraction of system predictions that users corrected to a different language.
- Calibration and confidence:
  - Reliability diagram / calibration curve: compare predicted confidence vs empirical accuracy.
  - Thresholded accuracy: measure accuracy above confidence thresholds to set fallback or manual review rules.
  - Use confidence threshold to fall back to more robust models or user preferences.
- Recommended charts: per-language accuracy bar, confusion matrix heatmap, calibration plot, fallback/override rate chart.

5) Evaluation Process & Data
- Train / Val / Test splits: stratify by `intent` and `language` where possible.
- Minimum support: when computing per-class metrics, only report classes with >= N examples (e.g., N=30) but show counts for transparency.
- Label quality: sample and audit annotations; compute inter-annotator agreement (Cohen's kappa) on a subset.

6) Monitoring & Drift Detection
- Track metrics over time (daily/weekly): overall intent F1, top-10 intent F1s, language selector accuracy for top languages.
- Alerts: drop in overall accuracy > 5% or per-intent F1 drop > 10% vs baseline.
- Data drift signals: change in message length distribution, token / vocabulary shift, per-language traffic changes.

7) Practical computation (quick snippets)
- Intent classification metrics (Python, sklearn):

```python
from sklearn.metrics import classification_report, confusion_matrix
import pandas as pd

df = pd.read_csv('path/to/labeled_predictions.csv')  # columns: text,true_intent,pred_intent
print(classification_report(df['true_intent'], df['pred_intent']))
cm = confusion_matrix(df['true_intent'], df['pred_intent'])
```

- Entity span evaluation: use `seqeval` or `conlleval` for BIO-tagged outputs.

- Language selector: you can reuse `scripts/evaluate_language_selector.py` which computes overall accuracy, per-language CSV, and saves `accuracy_bar.png` and `confusion_matrix.png`.

8) Report & Visualization Recommendations
- Include these charts in release notes or monitoring dashboards:
  - Overall intent F1 trend (time-series)
  - Per-language accuracy bars and confusion matrix snapshots
  - End-to-end success rate (intent+entities)
  - Calibration plot for language selector and intent confidences

9) Next actions
- Run evaluations monthly and after major data or model changes.
- Add the evaluation script to CI or a scheduled job, store artifacts in a versioned `artifacts/` folder.
