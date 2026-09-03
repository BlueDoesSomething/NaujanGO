# Language Selector — Design & Implementation

Purpose: Describe the language selection component used to detect the language of incoming user messages and route them to language-specific pipelines or translators.

Design Goals
- High precision for common languages used by our users.
- Fast, lightweight inference at request time.
- Configurable thresholding and graceful fallback to user preferences.

Architecture
- Two-stage approach:
  1. Lightweight detector for fast, low-latency inference (`langdetect`, `fasttext` model) used as primary selector.
  2. Confidence-based fallback: if the primary detector confidence < threshold, run a more robust model (multilingual transformer) or a heuristic combining metadata (user profile, Accept-Language header).

Implementation Details
- Input: raw user message text (preprocessed using the pipeline in `docs/nlp-development-process.md`).
- Output: language code (ISO 639-1), confidence score, source (detector name).

Thresholds & Heuristics
- Default confidence threshold: 0.75. Below this, consult the fallback model or user profile.
- Short messages (< 3 tokens) often yield low confidence — use session-level aggregation (last N messages) to improve decision.

Model Options
- Fast options: `langdetect` (pure Python), `fasttext` pretrained language id model.
- Robust options: transformer-based models fine-tuned for language identification.

Evaluation
- Use the evaluation harness (`scripts/evaluate_language_selector.py`) to compute overall accuracy, per-language accuracy, and confusion matrices.
- Track performance over time and update thresholds or models when accuracy drops.

Operational Notes
- Log detected language and confidence for offline analysis (avoid logging raw text in analytics; hash or store only non-sensitive aggregates).
- Provide a user override in the UI: a language selector control so users can force a language when detection is wrong.
