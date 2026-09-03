#!/usr/bin/env node

/**
 * CI Translation Coverage Check
 * Enforces minimum translation coverage thresholds
 * Exit code: 0 = all checks pass, 1 = coverage below threshold
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIN_COVERAGE_PERCENT = parseInt(process.env.MIN_TRANSLATION_COVERAGE || 70);
const FAIL_ON_MISSING = process.env.FAIL_ON_MISSING === 'true';

console.log(`\n📊 Translation Coverage Report\n`);
console.log(`Minimum coverage threshold: ${MIN_COVERAGE_PERCENT}%`);
console.log(`Fail on missing: ${FAIL_ON_MISSING ? 'YES' : 'NO'}\n`);

try {
  const reportPath = path.join(__dirname, 'i18n_coverage_report.json');
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Report not found. Run `node scripts/i18n_coverage.js` first.');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  let allPass = true;
  let hasIssues = false;

  for (const [locale, data] of Object.entries(report)) {
    const coverage = Math.round((data.total_lang / data.total_en) * 100);
    const missing = data.missing.length;
    const extra = data.extra.length;

    const icon = coverage >= MIN_COVERAGE_PERCENT ? '✓' : '✗';
    const color = coverage >= MIN_COVERAGE_PERCENT ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`${color}${icon} ${locale.toUpperCase()}${reset}`);
    console.log(`   Coverage: ${coverage}% (${data.total_lang}/${data.total_en})`);

    if (missing > 0) {
      console.log(`   Missing keys: ${missing}`);
      if (FAIL_ON_MISSING) {
        hasIssues = true;
        allPass = false;
      }
    }

    if (extra > 0) {
      console.log(`   Extra keys: ${extra} (keys without EN equivalent)`);
    }

    if (coverage < MIN_COVERAGE_PERCENT) {
      allPass = false;
    }

    console.log('');
  }

  if (allPass && !hasIssues) {
    console.log(`\n✅ All translations meet the ${MIN_COVERAGE_PERCENT}% threshold!\n`);
    process.exit(0);
  } else {
    if (!allPass) {
      console.log(`\n⚠️  Some locales are below the ${MIN_COVERAGE_PERCENT}% threshold.\n`);
    }
    if (hasIssues) {
      console.log(`\n⚠️  Missing translations detected.\n`);
    }
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Error reading coverage report:', err.message);
  process.exit(1);
}
