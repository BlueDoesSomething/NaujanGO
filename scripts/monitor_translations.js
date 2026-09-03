#!/usr/bin/env node

/**
 * Translation System Monitoring & Analytics
 * Tracks translation usage, quality metrics, and provides health status
 */

import { execute } from '../db.js';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, prefix, message) {
  const timestamp = new Date().toISOString();
  console.log(`${COLORS[color]}${prefix}${COLORS.reset} [${timestamp}] ${message}`);
}

async function getOverallStats() {
  const [stats] = await execute(`
    SELECT 
      COUNT(*) as total_translations,
      SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN review_required = 1 THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN review_required = 2 THEN 1 ELSE 0 END) as rejected,
      COUNT(DISTINCT locale) as locales,
      COUNT(DISTINCT entity_type) as entity_types
    FROM translations
  `);
  return stats[0] || {};
}

async function getCoverageByLocale() {
  const [coverage] = await execute(`
    SELECT 
      locale,
      COUNT(*) as total,
      SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved,
      ROUND((SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as approval_rate
    FROM translations
    GROUP BY locale
    ORDER BY approval_rate DESC
  `);
  return coverage || [];
}

async function getEntityStats() {
  const [entities] = await execute(`
    SELECT 
      entity_type,
      COUNT(*) as total,
      COUNT(DISTINCT entity_id) as entity_count,
      COUNT(DISTINCT locale) as locales
    FROM translations
    GROUP BY entity_type
  `);
  return entities || [];
}

async function getMissingTranslations() {
  const [missing] = await execute(`
    SELECT 
      entity_type,
      COUNT(DISTINCT entity_id) as entities_without_translations
    FROM (
      SELECT entity_type, entity_id
      FROM attractions
      UNION
      SELECT entity_type, entity_id
      FROM hotels
    ) all_entities
    LEFT JOIN translations t ON t.entity_type = all_entities.entity_type 
      AND t.entity_id = all_entities.entity_id 
      AND t.locale IN ('es', 'tl')
    WHERE t.id IS NULL
    GROUP BY entity_type
  `);
  return missing || [];
}

async function getRecentActivity() {
  const [recent] = await execute(`
    SELECT 
      DATE(updated_at) as date,
      locale,
      SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) as approved_today
    FROM translations
    WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(updated_at), locale
    ORDER BY date DESC
  `);
  return recent || [];
}

async function healthCheck() {
  const issues = [];
  
  try {
    // Check 1: Low approval rate
    const [coverage] = await execute(`
      SELECT locale, ROUND((SUM(CASE WHEN review_required = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as rate
      FROM translations
      GROUP BY locale
      HAVING rate < 70
    `);
    
    if (coverage.length > 0) {
      issues.push(`⚠️  Low approval rate for: ${coverage.map(c => `${c.locale} (${c.rate}%)`).join(', ')}`);
    }
    
    // Check 2: Pending translations
    const [[pending]] = await execute(`
      SELECT COUNT(*) as count FROM translations WHERE review_required = 1
    `);
    
    if (pending.count > 100) {
      issues.push(`⚠️  ${pending.count} translations pending review`);
    }
    
    // Check 3: Rejected translations
    const [[rejected]] = await execute(`
      SELECT COUNT(*) as count FROM translations WHERE review_required = 2
    `);
    
    if (rejected.count > 0) {
      issues.push(`⚠️  ${rejected.count} translations rejected (need revision)`);
    }
    
    // Check 4: Missing translations for key entities
    const [[missing]] = await execute(`
      SELECT COUNT(DISTINCT id) as count FROM attractions 
      WHERE id NOT IN (SELECT DISTINCT entity_id FROM translations WHERE entity_type = 'attraction')
    `);
    
    if (missing.count > 0) {
      issues.push(`⚠️  ${missing.count} attractions missing base translations`);
    }
    
  } catch (error) {
    issues.push(`❌ Error during health check: ${error.message}`);
  }
  
  return issues;
}

async function generateReport() {
  console.log('\n');
  console.log(`${COLORS.bright}${COLORS.cyan}╔════════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}║     TRANSLATION SYSTEM MONITORING & ANALYTICS REPORT       ║${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}║                Generated ${new Date().toISOString()}          ║${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}╚════════════════════════════════════════════════════════════╝${COLORS.reset}\n`);

  try {
    // Overall Stats
    log('bright', '📊', 'Overall Statistics');
    console.log('');
    const stats = await getOverallStats();
    console.log(`   Total Translations: ${COLORS.bright}${stats.total_translations}${COLORS.reset}`);
    console.log(`   Approved:           ${COLORS.green}${stats.approved}${COLORS.reset}`);
    console.log(`   Pending Review:     ${COLORS.yellow}${stats.pending}${COLORS.reset}`);
    console.log(`   Rejected:           ${COLORS.red}${stats.rejected}${COLORS.reset}`);
    console.log(`   Locales:            ${COLORS.bright}${stats.locales}${COLORS.reset}`);
    console.log(`   Entity Types:       ${COLORS.bright}${stats.entity_types}${COLORS.reset}`);

    // Coverage by Locale
    console.log('\n');
    log('bright', '🌍', 'Coverage by Locale');
    console.log('');
    const coverage = await getCoverageByLocale();
    coverage.forEach(row => {
      const rateColor = row.approval_rate >= 80 ? 'green' : row.approval_rate >= 70 ? 'yellow' : 'red';
      console.log(`   ${row.locale.toUpperCase()}: ${row.approved}/${row.total} approved (${COLORS[rateColor]}${row.approval_rate}%${COLORS.reset})`);
    });

    // Entity Stats
    console.log('\n');
    log('bright', '📦', 'Entity Statistics');
    console.log('');
    const entities = await getEntityStats();
    entities.forEach(entity => {
      console.log(`   ${entity.entity_type}: ${entity.entity_count} entities, ${entity.total} translations across ${entity.locales} locales`);
    });

    // Recent Activity
    console.log('\n');
    log('bright', '📈', 'Recent Activity (Last 7 Days)');
    console.log('');
    const activity = await getRecentActivity();
    if (activity.length > 0) {
      activity.slice(0, 7).forEach(row => {
        console.log(`   ${row.date} [${row.locale}]: ${row.approved_today} approved`);
      });
    } else {
      console.log('   No activity in the last 7 days');
    }

    // Health Check
    console.log('\n');
    log('bright', '🏥', 'System Health Check');
    console.log('');
    const issues = await healthCheck();
    if (issues.length === 0) {
      console.log(`   ${COLORS.green}✅ All systems operational${COLORS.reset}`);
    } else {
      issues.forEach(issue => console.log(`   ${issue}`));
    }

    // Recommendations
    console.log('\n');
    log('bright', '💡', 'Recommendations');
    console.log('');
    if (stats.pending > 50) {
      console.log('   • Prioritize linguistic QA review to reduce pending translations');
    }
    if (stats.rejected > 0) {
      console.log('   • Address rejected translations - assign for revision');
    }
    const esRate = coverage.find(c => c.locale === 'es')?.approval_rate;
    if (esRate && esRate < 80) {
      console.log('   • Spanish coverage is low - consider MT seeding or human translation');
    }
    const tlRate = coverage.find(c => c.locale === 'tl')?.approval_rate;
    if (tlRate && tlRate < 80) {
      console.log('   • Tagalog coverage is low - prioritize human translation');
    }

    // Export Data (optional)
    if (process.argv.includes('--json')) {
      const report = {
        timestamp: new Date().toISOString(),
        stats,
        coverage,
        entities,
        issues,
        activity
      };
      console.log('\n');
      console.log(JSON.stringify(report, null, 2));
    }

  } catch (error) {
    log('red', '❌', `Error generating report: ${error.message}`);
    process.exit(1);
  }

  console.log('\n');
}

// Run report
generateReport().then(() => process.exit(0)).catch(err => {
  log('red', '❌', `Fatal error: ${err.message}`);
  process.exit(1);
});
