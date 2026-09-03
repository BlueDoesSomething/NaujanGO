import { execute } from '../backend/db.js';

const ENABLE_MT = process.env.ENABLE_MT_FALLBACK === 'true';
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

if (!ENABLE_MT || !GOOGLE_API_KEY) {
  console.warn('⚠️  MT seeding disabled. Set ENABLE_MT_FALLBACK=true and GOOGLE_TRANSLATE_API_KEY to use.');
  console.log('To enable, add to .env:');
  console.log('  ENABLE_MT_FALLBACK=true');
  console.log('  GOOGLE_TRANSLATE_API_KEY=<your_key>');
  process.exit(0);
}

const translateWithGoogle = async (text, targetLang) => {
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`;
    const body = { q: text, target: targetLang };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    if (json.data && json.data.translations && json.data.translations[0]) {
      return json.data.translations[0].translatedText;
    }
  } catch (err) {
    console.error(`MT error for ${targetLang}:`, err.message);
  }
  return null;
};

(async () => {
  try {
    console.log('Fetching all EN translations...');
    const [enRows] = await execute('SELECT entity_type, entity_id, field_name, text FROM translations WHERE locale = ? ORDER BY entity_type, entity_id', ['en']);
    console.log(`Found ${enRows.length} EN translations`);

    const targetLocales = ['es', 'tl'];
    let totalSeeded = 0;

    for (const locale of targetLocales) {
      console.log(`\nSeeding ${locale}...`);
      for (const row of enRows) {
        const { entity_type, entity_id, field_name, text } = row;
        
        // Check if already exists
        const [exists] = await execute(
          'SELECT id FROM translations WHERE entity_type = ? AND entity_id = ? AND field_name = ? AND locale = ? LIMIT 1',
          [entity_type, entity_id, field_name, locale]
        );
        
        if (exists && exists.length > 0) continue;
        
        // Translate
        const translated = await translateWithGoogle(text, locale);
        if (!translated) {
          console.warn(`  [SKIP] Could not translate ${entity_type}:${entity_id}.${field_name} to ${locale}`);
          continue;
        }
        
        // Insert with review_required flag
        await execute(
          'INSERT INTO translations (entity_type, entity_id, field_name, locale, text, review_required) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE text = VALUES(text), review_required = VALUES(review_required)',
          [entity_type, entity_id, field_name, locale, translated, 1]
        );
        totalSeeded++;
      }
    }

    console.log(`\n✓ MT seeding complete: ${totalSeeded} translations created (review_required=1)`);
    process.exit(0);
  } catch (err) {
    console.error('MT seeding failed:', err);
    process.exit(1);
  }
})();
