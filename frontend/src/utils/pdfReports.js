import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const FONT_BASE = '/fonts/';
const fontCache = new Map();
const loadFont = name => {
  if (!fontCache.has(name)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    fontCache.set(name, fetch(`${FONT_BASE}${name}`, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('PDF font unavailable');
      return response.arrayBuffer();
    }).then(buffer => {
      const bytes = new Uint8Array(buffer);
      if (!(bytes[0] === 0 && bytes[1] === 1 && bytes[2] === 0 && bytes[3] === 0)
        && new TextDecoder().decode(bytes.slice(0, 4)) !== 'OTTO') throw new Error('Invalid PDF font');
      return bytes;
    }).catch(error => { fontCache.delete(name); throw error; }).finally(() => clearTimeout(timer)));
  }
  return fontCache.get(name);
};
const color = hex => rgb(...hex.match(/\w\w/g).map(pair => parseInt(pair, 16) / 255));
const C = { green: color('166534'), dark: color('172b23'), muted: color('52645b'), pale: color('edf5ef'), line: color('d6e2da'), white: rgb(1, 1, 1) };
const clean = value => String(value ?? '').normalize('NFC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\t/g, '    ');

// This renderer only accepts an allowlisted report model, not API objects/HTML.
// It uses real embedded, selectable text. Oversized rows split across pages,
// with repeated headers; no data is clipped or silently discarded.
export const generateReportPdf = async (report, { generatedAt = new Date(), fontBytes = {} } = {}) => {
  const sections = report.pdfSections || report.sections || [report];
  if (!report.title || !sections.length || sections.some(section => !Array.isArray(section.rows) || !(section.pdfColumns || section.printColumns || section.columns)?.length)) {
    throw new Error('Invalid PDF report');
  }
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(report.title); doc.setAuthor('NaujanGO'); doc.setCreator('NaujanGO custom document export');
  doc.setSubject(report.documentType || 'Selected report'); doc.setCreationDate(generatedAt); doc.setModificationDate(generatedAt);
  const normal = await doc.embedFont(fontBytes.regular || await loadFont('NotoSans-Regular.ttf'), { subset: true });
  const bold = await doc.embedFont(fontBytes.bold || await loadFont('NotoSans-Bold.ttf'), { subset: true });
  const normalSet = new Set(normal.getCharacterSet()), boldSet = new Set(bold.getCharacterSet());
  const allText = [report.title, report.subtitle, report.footer, ...(report.summary || []).flat(), ...sections.flatMap(section =>
    [section.title, section.notes, ...(section.pdfColumns || section.printColumns || section.columns).map(column => column.label),
      ...section.rows.flatMap(row => (section.pdfColumns || section.printColumns || section.columns).map(column => row[column.key]))])].map(clean).join('\n');
  let fallback, fallbackSet;
  if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\uff00-\uffef]/u.test(allText)) {
    fallback = await doc.embedFont(fontBytes.cjk || await loadFont('NotoSansCJKkr-Regular.otf'), { subset: true });
    fallbackSet = new Set(fallback.getCharacterSet());
  }
  let substituted = false;
  const runs = (value, strong = false) => {
    const result = [];
    for (const char of clean(value)) {
      const code = char.codePointAt(0);
      let font = strong ? bold : normal, text = char;
      if (!(strong ? boldSet : normalSet).has(code)) {
        if (fallbackSet?.has(code)) font = fallback;
        else { text = `[U+${code.toString(16).toUpperCase()}]`; substituted = true; }
      }
      if (result.at(-1)?.font === font) result.at(-1).text += text;
      else result.push({ text, font });
    }
    return result;
  };
  const width = (text, size, strong = false) => runs(text, strong).reduce((sum, run) => sum + run.font.widthOfTextAtSize(run.text, size), 0);
  const wrap = (value, maxWidth, size, strong = false) => {
    const lines = [];
    for (const paragraph of clean(value).split('\n')) {
      let line = '';
      // Whitespace-aware word wrapping, with character wrapping for long URLs,
      // identifiers and CJK text. Preserve explicit newlines and empty lines.
      for (const token of paragraph.match(/\s+|\S+/gu) || ['']) {
        if (width(line + token, size, strong) <= maxWidth) { line += token; continue; }
        if (line.trim()) { lines.push(line.trimEnd()); line = ''; }
        if (!token.trim()) continue;
        for (const char of token) {
          if (line && width(line + char, size, strong) > maxWidth) { lines.push(line); line = ''; }
          line += char;
        }
      }
      lines.push(line.trimEnd());
    }
    return lines;
  };
  const landscape = report.pdfLandscape ?? false;
  const [W, H] = landscape ? [841.89, 595.28] : [595.28, 841.89];
  const margin = 40, contentW = W - margin * 2, bottom = H - 48;
  let page, y = 0;
  const draw = (value, x, top, size = 9, strong = false, fill = C.dark) => {
    for (const run of runs(value, strong)) {
      page.drawText(run.text, { x, y: H - top - size, size, font: run.font, color: fill });
      x += run.font.widthOfTextAtSize(run.text, size);
    }
  };
  const rect = (x, top, w, h, fill, border = fill) => page.drawRectangle({ x, y: H - top - h, width: w, height: h,
    color: fill, borderColor: border, borderWidth: 0.5 });
  const newPage = () => {
    page = doc.addPage([W, H]);
    rect(0, 0, W, 7, C.green);
    draw('NaujanGO', margin, 22, 12, true, C.green);
    draw(report.documentType || 'REPORT', W - margin - 155, 26, 8, true, C.muted);
    y = 52;
  };
  const ensure = height => { if (y + height > bottom) newPage(); };
  const paragraph = (value, { size = 9, strong = false, fill = C.muted, gap = 10 } = {}) => {
    for (const line of wrap(value, contentW, size, strong)) { ensure(size * 1.5); draw(line, margin, y, size, strong, fill); y += size * 1.5; }
    y += gap;
  };
  const heading = value => {
    ensure(65); y += 8; paragraph(value, { size: 12, strong: true, fill: C.green, gap: 7 });
  };
  newPage();
  paragraph(report.title, { size: 24, strong: true, fill: C.dark, gap: 8 });
  if (report.subtitle) paragraph(report.subtitle, { size: 10, gap: 14 });
  const summary = report.summary || [];
  const cardColumns = landscape ? 3 : 2, cardGap = 10, cardW = (contentW - cardGap * (cardColumns - 1)) / cardColumns;
  for (let index = 0; index < summary.length; index += cardColumns) {
    const cards = summary.slice(index, index + cardColumns).map(([label, value]) => ({
      label: wrap(label, cardW - 20, 8, true), value: wrap(value, cardW - 20, 12, true)
    }));
    const rowH = Math.max(...cards.map(card => 22 + card.label.length * 11 + card.value.length * 16));
    // Extremely long user values should flow as text instead of an unbreakable card.
    if (rowH > bottom - 60) {
      summary.slice(index, index + cardColumns).forEach(([label, value]) => paragraph(`${label}: ${value}`));
      continue;
    }
    ensure(rowH + cardGap);
    cards.forEach((card, col) => {
      const x = margin + col * (cardW + cardGap); rect(x, y, cardW, rowH, C.pale);
      let top = y + 10;
      card.label.forEach(line => { draw(line, x + 10, top, 8, true, C.muted); top += 11; });
      top += 3; card.value.forEach(line => { draw(line, x + 10, top, 12, true, C.green); top += 16; });
    });
    y += rowH + cardGap;
  }
  const table = section => {
    const columns = section.pdfColumns || section.printColumns || section.columns;
    const specified = columns.every(column => Number(column.width) > 0);
    const total = specified ? columns.reduce((sum, column) => sum + column.width, 0) : columns.length;
    const widths = columns.map(column => contentW * (specified ? column.width : 1) / total);
    const size = columns.length > 7 ? 8 : 9, lineH = size * 1.45, padding = 7;
    const headerLines = columns.map((column, index) => wrap(column.label, widths[index] - padding * 2, size, true));
    const headerH = Math.max(...headerLines.map(lines => lines.length)) * lineH + padding * 2;
    if (headerH > bottom - 80) throw new Error('PDF columns are too narrow');
    const header = () => {
      ensure(headerH + lineH + padding * 2);
      let x = margin;
      columns.forEach((column, index) => {
        rect(x, y, widths[index], headerH, C.green);
        headerLines[index].forEach((line, lineIndex) => draw(line, x + padding, y + padding + lineIndex * lineH, size, true, C.white));
        x += widths[index];
      });
      y += headerH;
    };
    header();
    if (!section.rows.length) { paragraph('No records in this selection.', { gap: 8 }); return; }
    section.rows.forEach((row, rowIndex) => {
      const cells = columns.map((column, index) => wrap(row[column.key], widths[index] - padding * 2, size));
      const lines = Math.max(...cells.map(cell => cell.length));
      let offset = 0;
      // Keep normal rows together, but paginate even a single enormous note.
      const fullHeight = lines * lineH + padding * 2;
      if (fullHeight <= bottom - 52 - headerH && y + fullHeight > bottom) { newPage(); header(); }
      while (offset < lines) {
        let capacity = Math.floor((bottom - y - padding * 2) / lineH);
        if (capacity < 1) { newPage(); header(); capacity = Math.floor((bottom - y - padding * 2) / lineH); }
        const count = Math.min(capacity, lines - offset), rowH = count * lineH + padding * 2;
        let x = margin;
        cells.forEach((cell, index) => {
          rect(x, y, widths[index], rowH, rowIndex % 2 ? C.pale : C.white, C.line);
          cell.slice(offset, offset + count).forEach((line, lineIndex) => draw(line, x + padding, y + padding + lineIndex * lineH, size));
          x += widths[index];
        });
        y += rowH; offset += count;
        if (offset < lines) { newPage(); header(); }
      }
    });
    y += 12;
  };
  for (const section of sections) {
    heading(section.title);
    if (section.notes) paragraph(section.notes, { size: 8, gap: 8 });
    table(section);
  }
  if (report.footer) paragraph(report.footer, { size: 8, gap: 4 });
  if (substituted) paragraph('Symbols unavailable in the document fonts are written as [U+codepoint].', { size: 8, gap: 4 });
  const pages = doc.getPages();
  const generated = generatedAt.toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  pages.forEach((current, index) => {
    page = current;
    rect(margin, H - 34, contentW, 0.5, C.line);
    draw(`Generated ${generated} PHT`, margin, H - 26, 7, false, C.muted);
    draw(`Page ${index + 1} of ${pages.length}`, W - margin - 68, H - 26, 7, false, C.muted);
  });
  return doc.save();
};
