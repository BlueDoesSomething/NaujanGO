import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { getRoomContentItems, prepareRoomGuestContent } from '../src/utils/roomContent.js';

// Compile just these JSX components in memory, using the installed React.
// No browser, running backend, production API, or new dependencies are needed.
const reactUrl = import.meta.resolve('react');
const compiled = await build({
  stdin: {
    contents: `export * from './src/components/RoomGuestContent.jsx';
      export { default as RoomContentEditor } from './src/components/RoomContentEditor.jsx';`,
    resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx'
  },
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'installed-react', setup(builder) {
    builder.onResolve({ filter: /^react$/ }, () => ({ path: reactUrl, external: true }));
  } }]
});
const { RoomPerfectFor, RoomCommonQuestions, RoomContentEditor } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`
);

const category = { label: 'Family stays', detail: 'Space for six guests' };
const faq = { question: 'Is breakfast included?', answer: 'Breakfast costs extra.\nAsk at reception.' };
const render = (component, items) => renderToStaticMarkup(React.createElement(component, { items }));

test('both public sections are completely hidden until configured', () => {
  for (const items of [undefined, null, [], '', '[broken', [null], [{}]]) {
    assert.equal(render(RoomPerfectFor, items), '');
    assert.equal(render(RoomCommonQuestions, items), '');
  }
});

test('public sections show only the selected room content, without old promises', () => {
  const perfect = render(RoomPerfectFor, [category]);
  assert.match(perfect, /Family stays/);
  assert.match(perfect, /Space for six guests/);
  assert.ok(!perfect.includes('3–4 guests with comfort'));
  assert.ok(!perfect.includes('Romantic getaway'));
  const questions = render(RoomCommonQuestions, [faq]);
  assert.match(questions, /Is breakfast included\?/);
  assert.match(questions, /Breakfast costs extra/);
  assert.ok(!questions.includes('complimentary daily breakfast'));
  assert.ok(!questions.includes('free modifications'));
  assert.ok(!questions.includes('Is WiFi available?'));
  assert.equal(render(RoomCommonQuestions, [{ question: 'Missing answer?' }]), '');
});

test('owner text is rendered as escaped text, never executable HTML', () => {
  const html = render(RoomCommonQuestions, [{ question: '<script>alert(1)</script>', answer: '<img src=x onerror=alert(1)>' }]);
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;img/);
  assert.match(render(RoomPerfectFor, [{ label: '<script>bad</script>' }]), /&lt;script&gt;/);
});

test('preparing a save trims text and skips untouched blank drafts', () => {
  assert.deepEqual(prepareRoomGuestContent({}), { perfect_for: [], common_questions: [] });
  assert.deepEqual(prepareRoomGuestContent({
    perfect_for: [{ label: '  ', detail: '' }, { label: ' Family stays ', detail: ' Six guests ' }],
    common_questions: [{ question: '', answer: '  ' }, faq]
  }), { perfect_for: [{ label: 'Family stays', detail: 'Six guests' }], common_questions: [faq] });
  assert.throws(() => prepareRoomGuestContent({ common_questions: [{ question: 'Breakfast?', answer: '' }] }), /answer/);
  assert.throws(() => prepareRoomGuestContent({ perfect_for: [{ label: '', detail: 'Six guests' }] }), /category/);
  assert.throws(() => prepareRoomGuestContent({ perfect_for: Array(5).fill(category) }), /up to 4/);
  assert.throws(() => prepareRoomGuestContent({ common_questions: [{ ...faq, answer: 'x'.repeat(1001) }] }), /1000/);
});

test('reopening a room uses safe saved entries without inventing categories', () => {
  assert.deepEqual(getRoomContentItems(null, 'perfect_for'), []);
  assert.deepEqual(getRoomContentItems([{}, category], 'perfect_for'), [category]);
  assert.deepEqual(getRoomContentItems([faq], 'common_questions'), [faq]);
});

const findElements = (element, predicate) => {
  if (!React.isValidElement(element)) return [];
  return [
    ...(predicate(element) ? [element] : []),
    ...React.Children.toArray(element.props.children).flatMap(child => findElements(child, predicate))
  ];
};

test('owner editor supports adding, editing, and removing both kinds of entry', () => {
  let room = { perfect_for: [], common_questions: [] };
  const editor = () => RoomContentEditor({
    room, onChange: (field, entries) => { room = { ...room, [field]: entries }; }
  });
  const addButtons = () => findElements(editor(), node => node.type === 'button' && node.props.className.includes('rm-content-add'));
  addButtons()[0].props.onClick();
  assert.deepEqual(room.perfect_for, [{ label: '', detail: '' }]);
  let inputs = findElements(editor(), node => node.type === 'input');
  inputs[0].props.onChange({ target: { value: category.label } });
  inputs = findElements(editor(), node => node.type === 'input');
  inputs[1].props.onChange({ target: { value: category.detail } });
  addButtons()[1].props.onClick();
  inputs = findElements(editor(), node => node.type === 'input');
  inputs[2].props.onChange({ target: { value: faq.question } });
  findElements(editor(), node => node.type === 'textarea')[0].props.onChange({ target: { value: faq.answer } });
  assert.deepEqual(prepareRoomGuestContent(room), { perfect_for: [category], common_questions: [faq] });
  findElements(editor(), node => node.props['aria-label'] === 'Remove guest category 1')[0].props.onClick();
  findElements(editor(), node => node.props['aria-label'] === 'Remove question 1')[0].props.onClick();
  assert.deepEqual(prepareRoomGuestContent(room), { perfect_for: [], common_questions: [] });
});

test('editor applies limits and locks controls while saving', () => {
  const room = { perfect_for: Array(4).fill(category), common_questions: Array(10).fill(faq) };
  const tree = RoomContentEditor({ room, onChange: () => {} });
  const addButtons = findElements(tree, node => node.type === 'button' && node.props.className.includes('rm-content-add'));
  assert.ok(addButtons.every(node => node.props.disabled));
  const locked = RoomContentEditor({ room, onChange: () => {}, disabled: true });
  assert.ok(findElements(locked, node => node.type === 'fieldset').every(node => node.props.disabled));
  assert.equal(findElements(tree, node => node.type === 'textarea')[0].props.maxLength, 1000);
  const html = renderToStaticMarkup(React.createElement(RoomContentEditor, { room, onChange: () => {} }));
  assert.match(html, /Perfect For/);
  assert.match(html, /Common Questions/);
  assert.match(html, /Leave empty to hide/);
});
