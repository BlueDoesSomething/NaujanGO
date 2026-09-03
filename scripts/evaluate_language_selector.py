"""
Evaluation harness for the language selector.

Usage:
  python scripts/evaluate_language_selector.py --input path/to/test.csv --outdir docs/images

Input CSV columns: `text`, `true_lang`, `predicted_lang`
Outputs: accuracy summary, per-language CSV, `accuracy_bar.png`, `confusion_matrix.png` in the output dir.
"""
import argparse
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, confusion_matrix


def load_data(path):
    df = pd.read_csv(path)
    required = {"text", "true_lang", "predicted_lang"}
    if not required.issubset(df.columns):
        raise ValueError(f"Input CSV must contain columns: {required}")
    return df


def per_language_accuracy(df):
    groups = df.groupby('true_lang')
    rows = []
    for lang, g in groups:
        acc = (g['true_lang'] == g['predicted_lang']).mean()
        rows.append({'language': lang, 'accuracy': acc, 'count': len(g)})
    return pd.DataFrame(rows).sort_values('accuracy', ascending=False)


def plot_accuracy_bar(perlang, outpath):
    plt.figure(figsize=(8, max(4, len(perlang) * 0.3)))
    sns.barplot(data=perlang, x='accuracy', y='language', palette='viridis')
    plt.xlim(0, 1)
    plt.xlabel('Accuracy')
    plt.tight_layout()
    plt.savefig(outpath)
    plt.close()


def plot_confusion(df, outpath):
    labels = sorted(list(set(df['true_lang']) | set(df['predicted_lang'])))
    cm = confusion_matrix(df['true_lang'], df['predicted_lang'], labels=labels)
    cm_norm = cm.astype('float') / (cm.sum(axis=1)[:, np.newaxis] + 1e-12)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm_norm, xticklabels=labels, yticklabels=labels, annot=True, fmt='.2f', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('True')
    plt.tight_layout()
    plt.savefig(outpath)
    plt.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--outdir', default='docs/images')
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)
    df = load_data(args.input)

    overall = accuracy_score(df['true_lang'], df['predicted_lang'])
    print(f"Overall accuracy: {overall:.4f}")

    perlang = per_language_accuracy(df)
    perlang.to_csv(os.path.join(args.outdir, 'per_language_accuracy.csv'), index=False)

    plot_accuracy_bar(perlang, os.path.join(args.outdir, 'accuracy_bar.png'))
    plot_confusion(df, os.path.join(args.outdir, 'confusion_matrix.png'))


if __name__ == '__main__':
    main()
