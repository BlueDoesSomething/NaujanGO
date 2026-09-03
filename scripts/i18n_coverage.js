const fs = require('fs')
const path = require('path')

const filePath = path.resolve(__dirname, '../frontend/src/context/LanguageContext.jsx')
const content = fs.readFileSync(filePath, 'utf8')

function extractLangBlocks(src) {
  const langRe = /\n\s*([a-z]{2})\s*:\s*\{/g
  const langs = []
  let m
  while ((m = langRe.exec(src))) {
    langs.push({ code: m[1], index: m.index + m[0].length })
  }
  const blocks = {}
  for (let i = 0; i < langs.length; i++) {
    const start = langs[i].index
    const end = i + 1 < langs.length ? langs[i + 1].index : src.lastIndexOf('\n  }')
    const block = src.slice(start, end)
    blocks[langs[i].code] = block
  }
  return blocks
}

function extractKeys(block) {
  const keyRe = /^\s*([A-Za-z0-9_]+)\s*:/gm
  const keys = new Set()
  let m
  while ((m = keyRe.exec(block))) keys.add(m[1])
  return keys
}

const blocks = extractLangBlocks(content)
if (!blocks.en) {
  console.error('Could not find `en` block in LanguageContext.jsx')
  process.exit(1)
}

const enKeys = extractKeys(blocks.en)
const report = {}

for (const [code, block] of Object.entries(blocks)) {
  if (code === 'en') continue
  const keys = extractKeys(block)
  const missing = [...enKeys].filter(k => !keys.has(k)).sort()
  const extra = [...keys].filter(k => !enKeys.has(k)).sort()
  report[code] = { missing, extra, total_en: enKeys.size, total_lang: keys.size }
}

const outPath = path.resolve(__dirname, 'i18n_coverage_report.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
console.log('Coverage report written to', outPath)
console.log(JSON.stringify(report, null, 2))
