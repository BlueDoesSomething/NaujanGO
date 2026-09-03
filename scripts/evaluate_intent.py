"""
Evaluate intent classification metrics and save charts.

Usage:
  python scripts/evaluate_intent.py --input scripts/sample_intent_test.csv --outdir docs/images

Input CSV columns: `text`, `true_intent`, `pred_intent`
Outputs: classification report printed, `per_intent.csv`, `intent_confusion_matrix.png` in outdir.
"""
import argparse
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix


def load_data(path):
    df = pd.read_csv(path)
    required = {"text", "true_intent", "pred_intent"}
    if not required.issubset(df.columns):
        raise ValueError(f"Input CSV must contain columns: {required}")
    return df


def save_report(df, outdir):
    y_true = df['true_intent']
    y_pred = df['pred_intent']
    report = classification_report(y_true, y_pred, output_dict=True)
    per_intent = pd.DataFrame(report).transpose()
    per_intent.to_csv(os.path.join(outdir, 'per_intent_metrics.csv'))
    print('Classification report:\n')
    print(classification_report(y_true, y_pred))


def plot_confusion(df, outpath):
    labels = sorted(list(set(df['true_intent']) | set(df['pred_intent'])))
    cm = confusion_matrix(df['true_intent'], df['pred_intent'], labels=labels)
    cm_norm = cm.astype('float') / (cm.sum(axis=1)[:, None] + 1e-12)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_norm, xticklabels=labels, yticklabels=labels, annot=True, fmt='.2f', cmap='Oranges')
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
    save_report(df, args.outdir)
    plot_confusion(df, os.path.join(args.outdir, 'intent_confusion_matrix.png'))


if __name__ == '__main__':
    main()
