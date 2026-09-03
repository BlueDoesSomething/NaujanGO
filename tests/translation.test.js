/**
 * Translation System Tests
 * Tests i18n setup, coverage, and functionality
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Translation System Tests', () => {
  
  describe('Frontend Translations', () => {
    let translations;

    before(() => {
      // Load LanguageContext.jsx and extract translations object
      const filePath = path.join(__dirname, '../frontend/src/context/LanguageContext.jsx');
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Simple extraction of en, es, tl blocks
      const enMatch = content.match(/en:\s*\{([\s\S]*?)\},\s*es:/);
      const esMatch = content.match(/es:\s*\{([\s\S]*?)\},\s*tl:/);
      const tlMatch = content.match(/tl:\s*\{([\s\S]*?)\}\s*\}/);
      
      expect(enMatch).to.exist;
      expect(esMatch).to.exist;
      expect(tlMatch).to.exist;
      
      translations = {
        en: enMatch ? extractKeys(enMatch[1]) : [],
        es: esMatch ? extractKeys(esMatch[1]) : [],
        tl: tlMatch ? extractKeys(tlMatch[1]) : []
      };
    });

    it('should have English as base language', () => {
      expect(translations.en.size).to.be.greaterThan(0);
    });

    it('should have Spanish translations', () => {
      expect(translations.es.size).to.be.greaterThan(0);
    });

    it('should have Tagalog translations', () => {
      expect(translations.tl.size).to.be.greaterThan(0);
    });

    it('Spanish should have >60% key coverage of English', () => {
      const coverage = (translations.es.size / translations.en.size) * 100;
      expect(coverage).to.be.greaterThan(60);
    });

    it('Tagalog should have >60% key coverage of English', () => {
      const coverage = (translations.tl.size / translations.en.size) * 100;
      expect(coverage).to.be.greaterThan(60);
    });
  });

  describe('Backend Services', () => {
    
    it('should export translations service', () => {
      const serviceExists = fs.existsSync(path.join(__dirname, '../backend/services/translations.js'));
      expect(serviceExists).to.be.true;
    });

    it('should export machineTranslate service', () => {
      const serviceExists = fs.existsSync(path.join(__dirname, '../backend/services/machineTranslate.js'));
      expect(serviceExists).to.be.true;
    });

    it('should export serverMessages', () => {
      const serviceExists = fs.existsSync(path.join(__dirname, '../backend/services/serverMessages.js'));
      expect(serviceExists).to.be.true;
    });
  });

  describe('Frontend Utilities', () => {
    
    it('should export i18nFormatting utilities', () => {
      const utilsExist = fs.existsSync(path.join(__dirname, '../frontend/src/services/i18nFormatting.js'));
      expect(utilsExist).to.be.true;
    });
  });

  describe('Database Migrations', () => {
    
    it('should have translations table migration', () => {
      const migrationExists = fs.existsSync(path.join(__dirname, '../migrations/004_add_translations_table.sql'));
      expect(migrationExists).to.be.true;
    });

    it('migration should create translations table with correct schema', () => {
      const migration = fs.readFileSync(path.join(__dirname, '../migrations/004_add_translations_table.sql'), 'utf8');
      expect(migration).to.include('CREATE TABLE');
      expect(migration).to.include('translations');
      expect(migration).to.include('entity_type');
      expect(migration).to.include('entity_id');
      expect(migration).to.include('field_name');
      expect(migration).to.include('locale');
      expect(migration).to.include('text');
      expect(migration).to.include('review_required');
      expect(migration).to.include('UNIQUE');
    });
  });

  describe('Seed Scripts', () => {
    
    it('should have multi-table seeding script', () => {
      const scriptExists = fs.existsSync(path.join(__dirname, '../scripts/seed_translations_multi_table.js'));
      expect(scriptExists).to.be.true;
    });

    it('should have MT seeding script', () => {
      const scriptExists = fs.existsSync(path.join(__dirname, '../scripts/seed_translations_with_mt.js'));
      expect(scriptExists).to.be.true;
    });

    it('should have CI check script', () => {
      const scriptExists = fs.existsSync(path.join(__dirname, '../scripts/ci_translation_check.js'));
      expect(scriptExists).to.be.true;
    });
  });

  describe('Documentation', () => {
    
    it('should have translation setup guide', () => {
      const guideExists = fs.existsSync(path.join(__dirname, '../TRANSLATION_SYSTEM_SETUP.md'));
      expect(guideExists).to.be.true;
    });
  });
});

// Helper to extract keys from a block of text
function extractKeys(block) {
  const keyRe = /^\s*([A-Za-z0-9_]+)\s*:/gm;
  const keys = new Set();
  let m;
  while ((m = keyRe.exec(block))) {
    keys.add(m[1]);
  }
  return keys;
}
