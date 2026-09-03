"""
Generate a combined evaluation PDF from existing CSVs and images.

Usage:
  python scripts/generate_evaluation_pdf.py --out docs/evaluation_report.pdf

This mirrors the notebook logic but runs headless.
"""
import argparse
import os
import pandas as pd
from PIL import Image as PILImage


def make_pdf(out_pdf='docs/evaluation_report.pdf'):
    base_images = 'docs/images'
    intent_csv = os.path.join(base_images, 'per_intent_metrics.csv')
    lang_csv = os.path.join(base_images, 'per_language_accuracy.csv')
    imgs = [
        os.path.join(base_images, 'accuracy_bar.png'),
        os.path.join(base_images, 'confusion_matrix.png'),
        os.path.join(base_images, 'intent_confusion_matrix.png')
    ]
    pages = []
    os.makedirs(os.path.dirname(out_pdf), exist_ok=True)

    # Title page
    w, h = (800, 200)
    title = PILImage.new('RGB', (w, h), color='white')
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(title)
    try:
        font = ImageFont.truetype('arial.ttf', 24)
    except Exception:
        font = None
    draw.text((20, 40), 'Evaluation Report', fill='black', font=font)
    draw.text((20, 80), 'Section 1: Chatbot NLP  •  Section 2: Multilingual Language Selector', fill='black', font=font)
    pages.append(title)

    def make_caption_page(text, size=(800, 120)):
        img = PILImage.new('RGB', size, color='white')
        draw = ImageDraw.Draw(img)
        try:
            f = ImageFont.truetype('arial.ttf', 20)
        except Exception:
            f = None
        draw.text((20, 20), text, fill='black', font=f)
        return img

    def make_section_page(title_text, subtitle_text=None):
        img = PILImage.new('RGB', (800, 200), color='white')
        draw = ImageDraw.Draw(img)
        try:
            f_title = ImageFont.truetype('arial.ttf', 28)
            f_sub = ImageFont.truetype('arial.ttf', 18)
        except Exception:
            f_title = None
            f_sub = None
        draw.text((20, 30), title_text, fill='black', font=f_title)
        if subtitle_text:
            draw.text((20, 80), subtitle_text, fill='black', font=f_sub)
        return img

    def make_text_page(lines, size=(800, 320)):
        img = PILImage.new('RGB', size, color='white')
        draw = ImageDraw.Draw(img)
        try:
            f_title = ImageFont.truetype('arial.ttf', 24)
            f_body = ImageFont.truetype('arial.ttf', 16)
        except Exception:
            f_title = None
            f_body = None
        draw.text((20, 20), 'Evaluation Metrics Included', fill='black', font=f_title)
        y = 60
        for line in lines:
            draw.text((20, y), line, fill='black', font=f_body)
            y += 28
        return img

    pages.append(make_text_page([
        'Chatbot NLP: support counts, top-2 accuracy, false positive/negative rates, intent confusion, end-to-end success.',
        'Technical Evaluation: Accuracy, Precision, Recall, F1-Score.',
        'System Evaluation: Response Accuracy, Intent Recognition Rate, Multilingual Accuracy.',
        'Multilingual Selector: overall accuracy, per-language accuracy, top-2 accuracy, fallback rate, override rate, calibration.',
        'All supported languages are evaluated and reported in both sections.',
        'Include language coverage, per-language accuracy, and evaluation details for both Chatbot and Multilingual scoring.'
    ]))

    languages = []
    if os.path.exists(lang_csv):
        try:
            df_lang = pd.read_csv(lang_csv)
            if 'language' in df_lang.columns:
                languages = df_lang['language'].astype(str).tolist()
        except Exception:
            languages = []

    pages.append(make_section_page('Section 1: Chatbot NLP', 'Intent classification and chatbot understanding metrics'))
    if languages:
        pages.append(make_text_page([
            'Supported languages:',
            ', '.join(languages),
            'Covered languages for Chatbot NLP and multilingual evaluation.'
        ]))
    else:
        pages.append(make_text_page([
            'Supported languages: not available',
            'Language coverage details are provided in the per-language accuracy table.'
        ]))

    # Add CSV tables as images by rendering via pandas (if matplotlib available), with caption pages
    try:
        import matplotlib.pyplot as plt
        if os.path.exists(intent_csv):
            pages.append(make_caption_page('Table: Per-Intent Metrics'))
            df_int = pd.read_csv(intent_csv)
            fig = plt.figure(figsize=(8, 4))
            plt.axis('off')
            tbl = plt.table(cellText=df_int.round(3).values, colLabels=df_int.columns, loc='center')
            tbl.auto_set_font_size(False)
            tbl.set_fontsize(8)
            fig.tight_layout()
            fig.canvas.draw()
            w2, h2 = fig.canvas.get_width_height()
            arr = PILImage.frombytes('RGBA', (w2, h2), fig.canvas.tostring_argb(), 'raw', 'ARGB')
            pages.append(arr.convert('RGB'))
            plt.close(fig)
        if os.path.exists(lang_csv):
            pages.append(make_caption_page('Table: Per-Language Accuracy'))
            df_lang = pd.read_csv(lang_csv)
            fig = plt.figure(figsize=(8, 4))
            plt.axis('off')
            tbl = plt.table(cellText=df_lang.round(3).values, colLabels=df_lang.columns, loc='center')
            tbl.auto_set_font_size(False)
            tbl.set_fontsize(8)
            fig.tight_layout()
            fig.canvas.draw()
            w2, h2 = fig.canvas.get_width_height()
            arr = PILImage.frombytes('RGBA', (w2, h2), fig.canvas.tostring_argb(), 'raw', 'ARGB')
            pages.append(arr.convert('RGB'))
            plt.close(fig)
    except Exception:
        pass

    # Add image artifacts
    # Add labeled pages for images
    img_labels = {
        imgs[0]: 'Chart: Language Selector — Accuracy Bar',
        imgs[1]: 'Chart: Language Selector — Confusion Matrix',
        imgs[2]: 'Chart: Intent Classifier — Confusion Matrix'
    }
    for ip in imgs:
        if ip == imgs[2] and os.path.exists(ip):
            pages.append(make_caption_page('Chart: Chatbot NLP — Intent Classifier Confusion Matrix'))
            try:
                im = PILImage.open(ip).convert('RGB')
                pages.append(im)
            except Exception:
                pass

    # Start multilingual section
    pages.append(make_section_page('Section 2: Multilingual Language Selector', 'Language identification metrics and confusion analysis'))
    if languages:
        pages.append(make_text_page([
            'Supported languages:',
            ', '.join(languages),
            'Covered languages for Multilingual evaluation and language selector metrics.'
        ]))
    for ip in imgs[:2]:
        if os.path.exists(ip):
            pages.append(make_caption_page(img_labels.get(ip, 'Chart')))
            try:
                im = PILImage.open(ip).convert('RGB')
                pages.append(im)
            except Exception:
                pass

    if pages:
        pages[0].save(out_pdf, save_all=True, append_images=pages[1:])
        print('Saved PDF:', out_pdf)
    else:
        print('No artifacts found. Run evaluation scripts first.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', default='docs/evaluation_report.pdf')
    args = parser.parse_args()
    make_pdf(args.out)


if __name__ == '__main__':
    main()
