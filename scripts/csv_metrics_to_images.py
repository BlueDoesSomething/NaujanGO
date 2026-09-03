"""Render separate evaluation metric charts for chatbot and multilingual results."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.metrics import classification_report


OUTPUT_DIR = Path("docs/images")


def render_metric(labels, values, filename, title, color):
    figure, axis = plt.subplots(figsize=(8, max(3.2, 0.55 * len(labels) + 1.5)))
    positions = range(len(labels) - 1, -1, -1)
    bars = axis.barh(list(positions), values, color=color, height=0.45)
    axis.set_xlim(0, 1)
    axis.set_yticks(list(positions), labels)
    axis.set_xlabel("Score")
    axis.set_title(title, fontsize=14, fontweight="bold", pad=10)
    axis.grid(axis="x", alpha=0.25)
    axis.set_axisbelow(True)
    for bar, value in zip(bars, values):
        axis.text(value + 0.02, bar.get_y() + bar.get_height() / 2, f"{value:.0%}", va="center")
    figure.tight_layout()
    figure.savefig(OUTPUT_DIR / filename, dpi=180, bbox_inches="tight")
    plt.close(figure)


def create_metric_charts(source, true_column, predicted_column, prefix, category_name, color):
    data = pd.read_csv(source)
    report = classification_report(
        data[true_column], data[predicted_column], output_dict=True, zero_division=0
    )
    labels = [label for label in report if label not in {"accuracy", "macro avg", "weighted avg"}]
    accuracy_values = [
        (group[predicted_column] == group[true_column]).mean()
        for _, group in data.groupby(true_column, sort=False)
    ]
    metrics = {
        "accuracy": accuracy_values,
        "precision": [report[label]["precision"] for label in labels],
        "recall": [report[label]["recall"] for label in labels],
        "f1_score": [report[label]["f1-score"] for label in labels],
    }
    overall_accuracy = (data[true_column] == data[predicted_column]).mean()
    for metric, values in metrics.items():
        render_metric(
            labels,
            values,
            f"{prefix}_{metric}.png",
            f"{category_name} {metric.replace('_', '-').title()} (Overall: {overall_accuracy:.0%})",
            color,
        )


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    create_metric_charts(
        "scripts/sample_intent_test.csv", "true_intent", "pred_intent",
        "chatbot", "Chatbot Intent", "#3566a6"
    )
    create_metric_charts(
        "scripts/sample_test.csv", "true_lang", "predicted_lang",
        "multilingual", "Multilingual Language", "#4c9f70"
    )


if __name__ == "__main__":
    main()
