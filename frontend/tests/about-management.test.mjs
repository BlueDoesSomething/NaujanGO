import test from 'node:test';
import assert from 'node:assert/strict';
import { ABOUT_NUMBERS, aboutNumber, aboutGrowth, validateAboutSettings, setCurrentLeader } from '../src/utils/aboutContent.js';

test('About figures retain real zero, distinguish missing values, and derive growth without dividing by zero', () => {
  assert.equal(aboutNumber(0), '0'); assert.equal(aboutNumber(null), 'Not available'); assert.equal(aboutNumber(''), 'Not available');
  assert.equal(aboutGrowth(30, 20), '+50.00%'); assert.equal(aboutGrowth(0, 20), '-100.00%'); assert.equal(aboutGrowth(20, 0), 'Not available');
});
test('About validation preserves blank fields instead of converting them to invented zero counts', () => {
  const settings = { overview_text: 'Overview', vision_text: 'Vision', mission_text: { points: ['Mission'] }, ...Object.fromEntries(ABOUT_NUMBERS.map(([key]) => [key, 1])) };
  assert.deepEqual(validateAboutSettings(settings), []);
  assert.ok(validateAboutSettings({ ...settings, num_barangays: '' }).length);
  assert.ok(validateAboutSettings({ ...settings, population: 0 }).length);
  assert.ok(validateAboutSettings({ ...settings, mission_text: { points: [''] } }).length);
});
test('selecting a current mayor never clears the current vice mayor or mutates the original roster', () => {
  const roster = [{ id: 'm1', role: 'mayor', current: true }, { id: 'm2', role: 'mayor', current: false }, { id: 'v', role: 'vice-mayor', current: true }];
  assert.deepEqual(setCurrentLeader(roster, 'm2', true).map(item => item.current), [false, true, true]);
  assert.equal(roster[0].current, true);
});
